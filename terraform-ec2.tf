# Terraform configuration for deploying the AI Interface app to AWS EC2 (Free Tier)

provider "aws" {
  region = "us-east-1"
}

resource "aws_key_pair" "deployer" {
  key_name   = "ai-interface-key"
  public_key = file("~/.ssh/id_rsa.pub")
}

resource "aws_security_group" "ai_interface_sg" {
  name        = "ai-interface-sg"
  description = "Allow SSH, HTTP, and HTTPS"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "ai_interface" {
  ami           = "ami-0c02fb55956c7d316" # Ubuntu Server 22.04 LTS (HVM), SSD Volume Type, Free Tier eligible in us-east-1
  instance_type = "t2.micro" # Free tier eligible
  key_name      = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [aws_security_group.ai_interface_sg.id]

  tags = {
    Name = "ai-interface-ec2"
  }

  provisioner "remote-exec" {
    inline = [
      "sudo apt-get update -y",
      "sudo apt-get install -y git python3-pip python3-venv nginx docker.io",
      "git clone https://github.com/elmunoz42/ai-interface.git || true",
      "cd ai-interface && make setup || true"
    ]

    connection {
      type        = "ssh"
      user        = "ubuntu"
      private_key = file("~/.ssh/id_rsa")
      host        = self.public_ip
    }
  }
}

output "ec2_public_ip" {
  value = aws_instance.ai_interface.public_ip
  description = "Public IP of the EC2 instance."
}
