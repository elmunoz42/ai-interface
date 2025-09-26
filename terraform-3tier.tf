############################################
# Provider & Basic Variables
############################################

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }
}

provider "aws" {
  region = var.region
}

variable "region" {
  type        = string
  description = "AWS region"
  default     = "us-east-1"
}

variable "project_name" {
  type        = string
  default     = "ai-chat-3tier"
}

variable "vpc_cidr" {
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_key_name" {
  type        = string
  description = "Existing EC2 key pair name for SSH"
  default     = null
}

variable "ssh_ingress_cidr" {
  type        = string
  description = "CIDR allowed to SSH to bastion/NAT (optional)"
  default     = "0.0.0.0/0"
}

# Free-Tier friendly instance types
variable "web_instance_type" {
  type        = string
  default     = "t3.micro"
}

variable "app_instance_type" {
  type        = string
  default     = "t3.micro"
}

variable "nat_instance_type" {
  type        = string
  default     = "t3.micro"
}

# AMIs (Amazon Linux 2023) - override as needed
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["137112412989"] # Amazon
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

locals {
  tags = {
    Project = var.project_name
    Stack   = "prod"
  }
}

############################################
# Networking: VPC, Subnets, Routing
############################################

resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = merge(local.tags, { Name = "${var.project_name}-vpc" })
}

data "aws_availability_zones" "available" {
  state = "available"
}

# Two AZs
locals {
  az1 = data.aws_availability_zones.available.names[0]
  az2 = data.aws_availability_zones.available.names[1]
}

# Public subnets (for ALB, NAT instances, optionally web if you prefer)
resource "aws_subnet" "public_az1" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = "10.0.0.0/24"
  availability_zone       = local.az1
  map_public_ip_on_launch = true
  tags                    = merge(local.tags, { Name = "${var.project_name}-public-${local.az1}" })
}

resource "aws_subnet" "public_az2" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = local.az2
  map_public_ip_on_launch = true
  tags                    = merge(local.tags, { Name = "${var.project_name}-public-${local.az2}" })
}

# Private App subnets (Django + FAISS, Internal ALB)
resource "aws_subnet" "app_az1" {
  vpc_id            = aws_vpc.this.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = local.az1
  tags              = merge(local.tags, { Name = "${var.project_name}-app-${local.az1}" })
}

resource "aws_subnet" "app_az2" {
  vpc_id            = aws_vpc.this.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = local.az2
  tags              = merge(local.tags, { Name = "${var.project_name}-app-${local.az2}" })
}

# Private DB subnets (RDS)
resource "aws_subnet" "db_az1" {
  vpc_id            = aws_vpc.this.id
  cidr_block        = "10.0.20.0/24"
  availability_zone = local.az1
  tags              = merge(local.tags, { Name = "${var.project_name}-db-${local.az1}" })
}

resource "aws_subnet" "db_az2" {
  vpc_id            = aws_vpc.this.id
  cidr_block        = "10.0.21.0/24"
  availability_zone = local.az2
  tags              = merge(local.tags, { Name = "${var.project_name}-db-${local.az2}" })
}

# IGW & Public route table
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.this.id
  tags   = merge(local.tags, { Name = "${var.project_name}-igw" })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
  tags   = merge(local.tags, { Name = "${var.project_name}-public-rt" })
}

resource "aws_route" "public_inet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route_table_association" "public_az1" {
  route_table_id = aws_route_table.public.id
  subnet_id      = aws_subnet.public_az1.id
}

resource "aws_route_table_association" "public_az2" {
  route_table_id = aws_route_table.public.id
  subnet_id      = aws_subnet.public_az2.id
}

############################################
# NAT Instances (cost-saving alternative to NAT Gateways)
############################################

# Security group for NAT instances
resource "aws_security_group" "nat_sg" {
  name        = "${var.project_name}-nat-sg"
  description = "NAT instance SG"
  vpc_id      = aws_vpc.this.id

  # Allow SSH (optional, tighten in real usage)
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_ingress_cidr]
  }

  # Allow forwarding: any from private subnets
  ingress {
    description = "Allow from app subnets for egress"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [aws_subnet.app_az1.cidr_block, aws_subnet.app_az2.cidr_block, aws_subnet.db_az1.cidr_block, aws_subnet.db_az2.cidr_block]
  }

  egress {
    description = "All egress"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, { Name = "${var.project_name}-nat-sg" })
}

# NAT user data to enable IP forwarding + masquerade
locals {
  nat_user_data = <<-EOF
    #!/bin/bash
    set -eux
    sysctl -w net.ipv4.ip_forward=1
    echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
    # Enable simple NAT via iptables
    iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
    # Persist iptables across reboots (AL2023 uses nftables/iptables-legacy compatibility)
    yum -y install iptables-services || true
    service iptables save || true
  EOF
}

resource "aws_instance" "nat_az1" {
  ami                         = data.aws_ami.al2023.id
  instance_type               = var.nat_instance_type
  subnet_id                   = aws_subnet.public_az1.id
  vpc_security_group_ids      = [aws_security_group.nat_sg.id]
  associate_public_ip_address = true
  key_name                    = var.public_key_name
  user_data                   = local.nat_user_data

  # NAT instances must have source/dest check disabled
  source_dest_check = false

  tags = merge(local.tags, { Name = "${var.project_name}-nat-${local.az1}" })
}

resource "aws_instance" "nat_az2" {
  ami                         = data.aws_ami.al2023.id
  instance_type               = var.nat_instance_type
  subnet_id                   = aws_subnet.public_az2.id
  vpc_security_group_ids      = [aws_security_group.nat_sg.id]
  associate_public_ip_address = true
  key_name                    = var.public_key_name
  user_data                   = local.nat_user_data
  source_dest_check           = false

  tags = merge(local.tags, { Name = "${var.project_name}-nat-${local.az2}" })
}

# Private route tables route 0.0.0.0/0 to NAT instances in the same AZ
resource "aws_route_table" "private_app_az1" {
  vpc_id = aws_vpc.this.id
  tags   = merge(local.tags, { Name = "${var.project_name}-app-rt-${local.az1}" })
}

resource "aws_route" "app_az1_default" {
  route_table_id         = aws_route_table.private_app_az1.id
  destination_cidr_block = "0.0.0.0/0"
  instance_id            = aws_instance.nat_az1.id
}

resource "aws_route_table_association" "app_az1" {
  route_table_id = aws_route_table.private_app_az1.id
  subnet_id      = aws_subnet.app_az1.id
}

resource "aws_route_table" "private_app_az2" {
  vpc_id = aws_vpc.this.id
  tags   = merge(local.tags, { Name = "${var.project_name}-app-rt-${local.az2}" })
}

resource "aws_route" "app_az2_default" {
  route_table_id         = aws_route_table.private_app_az2.id
  destination_cidr_block = "0.0.0.0/0"
  instance_id            = aws_instance.nat_az2.id
}

resource "aws_route_table_association" "app_az2" {
  route_table_id = aws_route_table.private_app_az2.id
  subnet_id      = aws_subnet.app_az2.id
}

# DB subnets can also use NAT if you need outbound package updates (optional)
resource "aws_route_table" "private_db_az1" {
  vpc_id = aws_vpc.this.id
  tags   = merge(local.tags, { Name = "${var.project_name}-db-rt-${local.az1}" })
}

resource "aws_route" "db_az1_default" {
  route_table_id         = aws_route_table.private_db_az1.id
  destination_cidr_block = "0.0.0.0/0"
  instance_id            = aws_instance.nat_az1.id
}

resource "aws_route_table_association" "db_az1" {
  route_table_id = aws_route_table.private_db_az1.id
  subnet_id      = aws_subnet.db_az1.id
}

resource "aws_route_table" "private_db_az2" {
  vpc_id = aws_vpc.this.id
  tags   = merge(local.tags, { Name = "${var.project_name}-db-rt-${local.az2}" })
}

resource "aws_route" "db_az2_default" {
  route_table_id         = aws_route_table.private_db_az2.id
  destination_cidr_block = "0.0.0.0/0"
  instance_id            = aws_instance.nat_az2.id
}

resource "aws_route_table_association" "db_az2" {
  route_table_id = aws_route_table.private_db_az2.id
  subnet_id      = aws_subnet.db_az2.id
}

############################################
# Security Groups
############################################

# External ALB (internet-facing)
resource "aws_security_group" "alb_external_sg" {
  name        = "${var.project_name}-alb-external-sg"
  description = "External ALB SG"
  vpc_id      = aws_vpc.this.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # (Optional) HTTPS listener to be added by you with ACM cert
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, { Name = "${var.project_name}-alb-external-sg" })
}

# Web SG (Next.js) - only from external ALB
resource "aws_security_group" "web_sg" {
  name        = "${var.project_name}-web-sg"
  description = "Web tier SG"
  vpc_id      = aws_vpc.this.id

  ingress {
    description     = "HTTP from External ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_external_sg.id]
  }

  # Allow health checks (HTTP 3000) from ALB
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, { Name = "${var.project_name}-web-sg" })
}

# Internal ALB (private)
resource "aws_security_group" "alb_internal_sg" {
  name        = "${var.project_name}-alb-internal-sg"
  description = "Internal ALB SG"
  vpc_id      = aws_vpc.this.id

  # Only web tier to internal ALB
  ingress {
    description     = "HTTP from Web SG"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.web_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, { Name = "${var.project_name}-alb-internal-sg" })
}

# App SG (Django + FAISS) - only from internal ALB
resource "aws_security_group" "app_sg" {
  name        = "${var.project_name}-app-sg"
  description = "App tier (Django + FAISS)"
  vpc_id      = aws_vpc.this.id

  ingress {
    description     = "Django HTTP from Internal ALB"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_internal_sg.id]
  }

  # Allow outbound to DB on 5432
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, { Name = "${var.project_name}-app-sg" })
}

# DB SG - only from App SG
resource "aws_security_group" "db_sg" {
  name        = "${var.project_name}-db-sg"
  description = "DB tier SG"
  vpc_id      = aws_vpc.this.id

  ingress {
    description     = "Postgres from App SG"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, { Name = "${var.project_name}-db-sg" })
}

############################################
# External ALB -> Web ASG (Next.js)
############################################

resource "aws_lb" "external" {
  name               = "${var.project_name}-ext-alb"
  load_balancer_type = "application"
  internal           = false
  security_groups    = [aws_security_group.alb_external_sg.id]
  subnets            = [aws_subnet.public_az1.id, aws_subnet.public_az2.id]
  tags               = local.tags
}

resource "aws_lb_target_group" "web_tg" {
  name        = "${var.project_name}-web-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.this.id
  target_type = "instance"

  health_check {
    path                = "/"
    port                = "3000"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 15
  }

  tags = local.tags
}

resource "aws_lb_listener" "external_http" {
  load_balancer_arn = aws_lb.external.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web_tg.arn
  }
}

# Web Launch Template (Next.js placeholder)
data "aws_iam_policy_document" "web_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "web_role" {
  name               = "${var.project_name}-web-role"
  assume_role_policy = data.aws_iam_policy_document.web_assume.json
  tags               = local.tags
}

resource "aws_iam_instance_profile" "web_profile" {
  name = "${var.project_name}-web-profile"
  role = aws_iam_role.web_role.name
}

locals {
  web_user_data = <<-EOF
    #!/bin/bash
    set -eux
    dnf -y update
    dnf -y install nodejs git
    # Placeholder Next.js app serving on :3000
    useradd -m web || true
    su - web -c "mkdir -p app && cd app && npx create-next-app@latest --ts --eslint --no-tailwind --use-npm myapp <<EOF2
    y
    EOF2"
    # Serve minimal page
    su - web -c "cd app/myapp && npm install && npm run build"
    cat >/etc/systemd/system/next.service <<SVC
    [Unit]
    Description=NextJS
    After=network.target

    [Service]
    User=web
    WorkingDirectory=/home/web/app/myapp
    ExecStart=/usr/bin/npm start -- -p 3000
    Restart=always

    [Install]
    WantedBy=multi-user.target
    SVC
    systemctl daemon-reload
    systemctl enable --now next.service
  EOF
}

resource "aws_launch_template" "web_lt" {
  name_prefix   = "${var.project_name}-web-"
  image_id      = data.aws_ami.al2023.id
  instance_type = var.web_instance_type
  key_name      = var.public_key_name

  iam_instance_profile {
    name = aws_iam_instance_profile.web_profile.name
  }

  vpc_security_group_ids = [aws_security_group.web_sg.id]

  user_data = base64encode(local.web_user_data)

  tag_specifications {
    resource_type = "instance"
    tags          = merge(local.tags, { Role = "web" })
  }
}

resource "aws_autoscaling_group" "web_asg" {
  name                      = "${var.project_name}-web-asg"
  desired_capacity          = 2
  min_size                  = 2
  max_size                  = 4
  vpc_zone_identifier       = [aws_subnet.public_az1.id, aws_subnet.public_az2.id]
  health_check_type         = "ELB"
  health_check_grace_period = 60

  launch_template {
    id      = aws_launch_template.web_lt.id
    version = "$Latest"
  }

  target_group_arns = [aws_lb_target_group.web_tg.arn]

  tag {
    key                 = "Name"
    value               = "${var.project_name}-web"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

############################################
# Internal ALB -> App ASG (Django + FAISS)
############################################

resource "aws_lb" "internal" {
  name               = "${var.project_name}-int-alb"
  load_balancer_type = "application"
  internal           = true
  security_groups    = [aws_security_group.alb_internal_sg.id]
  subnets            = [aws_subnet.app_az1.id, aws_subnet.app_az2.id]
  tags               = local.tags
}

resource "aws_lb_target_group" "app_tg" {
  name        = "${var.project_name}-app-tg"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.this.id
  target_type = "instance"

  health_check {
    path                = "/api/health"
    port                = "8000"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 15
  }

  tags = local.tags
}

resource "aws_lb_listener" "internal_http" {
  load_balancer_arn = aws_lb.internal.arn
  port              = 8000
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_tg.arn
  }
}

# IAM for app instances (S3 for document storage optional)
data "aws_iam_policy_document" "app_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}
resource "aws_iam_role" "app_role" {
  name               = "${var.project_name}-app-role"
  assume_role_policy = data.aws_iam_policy_document.app_assume.json
  tags               = local.tags
}
resource "aws_iam_instance_profile" "app_profile" {
  name = "${var.project_name}-app-profile"
  role = aws_iam_role.app_role.name
}

# Django + FAISS bootstrap (placeholder)
locals {
  app_user_data = <<-EOF
    #!/bin/bash
    set -eux
    dnf -y update
    dnf -y install python3-pip git
    # Minimal Django + RAG deps
    pip3 install --upgrade pip
    pip3 install django djangorestframework faiss-cpu sentence-transformers langchain openai psycopg2-binary gunicorn
    useradd -m app || true
    su - app -c "mkdir -p /home/app/app && cd /home/app/app && django-admin startproject ai_chat_backend ."
    # Simple Django run on :8000 behind internal ALB
    cat >/etc/systemd/system/django.service <<SVC
    [Unit]
    Description=Django with FAISS
    After=network.target

    [Service]
    User=app
    WorkingDirectory=/home/app/app
    Environment=OPENAI_API_KEY=${OPENAI_API_KEY}
    ExecStart=/usr/bin/python3 manage.py runserver 0.0.0.0:8000
    Restart=always

    [Install]
    WantedBy=multi-user.target
    SVC
    systemctl daemon-reload
    systemctl enable --now django.service

    # NOTE: In your real stack, start your actual Django project which hosts:
    # - REST endpoints (/api/rag/*)
    # - FAISS vector store built at startup and/or on document upload
  EOF
}

# OpenAI key can be injected if you want (optional)
variable "openai_api_key" {
  type      = string
  default   = ""
  sensitive = true
}

# Provide it to user_data via instance metadata
locals {
  OPENAI_API_KEY = var.openai_api_key
}

resource "aws_launch_template" "app_lt" {
  name_prefix   = "${var.project_name}-app-"
  image_id      = data.aws_ami.al2023.id
  instance_type = var.app_instance_type
  key_name      = var.public_key_name

  iam_instance_profile {
    name = aws_iam_instance_profile.app_profile.name
  }

  vpc_security_group_ids = [aws_security_group.app_sg.id]

  user_data = base64encode(replace(local.app_user_data, "${OPENAI_API_KEY}", local.OPENAI_API_KEY))

  tag_specifications {
    resource_type = "instance"
    tags          = merge(local.tags, { Role = "app" })
  }
}

resource "aws_autoscaling_group" "app_asg" {
  name                = "${var.project_name}-app-asg"
  desired_capacity    = 2
  min_size            = 2
  max_size            = 4
  vpc_zone_identifier = [aws_subnet.app_az1.id, aws_subnet.app_az2.id]

  launch_template {
    id      = aws_launch_template.app_lt.id
    version = "$Latest"
  }

  target_group_arns = [aws_lb_target_group.app_tg.arn]

  tag {
    key                 = "Name"
    value               = "${var.project_name}-app"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

############################################
# RDS PostgreSQL (Single-AZ to align with Free Tier)
############################################

resource "aws_db_subnet_group" "this" {
  name       = "${var.project_name}-db-subnets"
  subnet_ids = [aws_subnet.db_az1.id, aws_subnet.db_az2.id]
  tags       = merge(local.tags, { Name = "${var.project_name}-db-subnets" })
}

variable "db_username" {
  type        = string
  default     = "chatadmin"
}

variable "db_password" {
  type        = string
  default     = "ChangeMe12345!"
  sensitive   = true
}

resource "aws_db_instance" "postgres" {
  identifier                 = "${var.project_name}-postgres"
  engine                     = "postgres"
  engine_version             = "15.5"
  instance_class             = "db.t3.micro" # Free Tier–eligible
  allocated_storage          = 20
  max_allocated_storage      = 100
  storage_type               = "gp2"
  db_subnet_group_name       = aws_db_subnet_group.this.name
  vpc_security_group_ids     = [aws_security_group.db_sg.id]
  username                   = var.db_username
  password                   = var.db_password
  publicly_accessible        = false
  multi_az                   = false  # Free Tier friendly
  delete_automated_backups   = false
  backup_retention_period    = 7
  skip_final_snapshot        = true

  # RDS prefers AZ from subnet group; leave single-AZ for cost
  tags = merge(local.tags, { Name = "${var.project_name}-postgres" })
}

############################################
# Outputs
############################################

output "external_alb_dns" {
  value       = aws_lb.external.dns_name
  description = "Public URL for the Next.js frontend"
}

output "internal_alb_dns" {
  value       = aws_lb.internal.dns_name
  description = "Private DNS for Django + FAISS"
}

output "rds_endpoint" {
  value       = aws_db_instance.postgres.address
  description = "PostgreSQL endpoint (use from App tier)"
}

output "vpc_id" {
  value = aws_vpc.this.id
}
