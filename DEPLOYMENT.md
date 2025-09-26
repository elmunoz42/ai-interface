# AWS 2-AZ Three-Tier Web Architecture Deployment

## Overview
This production-ready three-tier architecture is designed for **high availability**, **scalability**, and **resilience**.  
It spans **two Availability Zones (AZs)** within a single AWS Region and builds on the initial proof-of-concept (POC) by adding redundancy, load balancing, auto scaling, and monitoring.

---

## Architecture Diagram (Conceptual)

<img width="843" height="465" alt="image" src="https://github.com/user-attachments/assets/cb11dd53-28ce-463b-93e3-6d8a900a60c4" />

---

## Architecture Components

### 1. Networking
- **VPC**: All resources are deployed inside a single Virtual Private Cloud.
- **Subnets**: 
  - **Public Subnets** in both AZs for web servers and NAT Gateways.
  - **Private Application Subnets** in both AZs for app servers.
  - **Private Database Subnets** in both AZs for Amazon RDS.

- **Internet Gateway (IGW)**: Provides inbound and outbound connectivity for public resources.
- **NAT Gateways**: Enable private instances (app servers, RDS) to securely access the internet for updates and patches.

---

### 2. Web Tier
- **External Application Load Balancer (ALB)**:
  - Routes inbound HTTP(S) traffic from users.
  - Distributes requests across multiple EC2 web servers deployed across two AZs.
- **Auto Scaling Group (ASG)**:
  - Ensures EC2 web servers scale in/out based on traffic and CPU usage.
  - Provides fault tolerance in case an AZ fails.

---

### 3. Application Tier
- **Internal Application Load Balancer**:
  - Handles east-west traffic between the web tier and the app tier.
  - Balances traffic across app servers in multiple AZs.
- **Auto Scaling Group (ASG)**:
  - EC2 app servers automatically scale based on demand.
  - Provides resilience and ensures optimal resource utilization.

---

### 4. Database Tier
- **Amazon RDS (Relational Database Service)**:
  - **Primary RDS Instance**: Hosted in one private DB subnet.
  - **Read Replica**: Hosted in another AZ for redundancy and disaster recovery.
  - Multi-AZ design improves fault tolerance and ensures database availability.

---

### 5. Monitoring & Observability
- **Amazon CloudWatch**:
  - Dashboards and alarms monitor application performance, infrastructure health, and resource usage.
  - Enables proactive scaling and rapid incident response.

---

## High Availability and Resilience Features
- **Multi-AZ Deployment**: Prevents single AZ failures from bringing down the application.
- **Load Balancers**: Provide traffic distribution and eliminate single points of failure.
- **Auto Scaling**: Optimizes cost and performance by automatically adjusting instance count.
- **RDS Read Replica**: Ensures database resilience and disaster recovery readiness.
- **CloudWatch Alarms**: Provide real-time monitoring and alerting.



