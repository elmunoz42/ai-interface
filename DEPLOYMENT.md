# AWS 2-AZ Three-Tier Web Architecture Deployment (BETA)

## Overview
This production-ready three-tier architecture is designed for **high availability**, **scalability**, and **resilience**.  
It spans **two Availability Zones (AZs)** within a single AWS Region and builds on the initial proof-of-concept (POC) by adding redundancy, load balancing, auto scaling, and monitoring.

The application stack itself is composed of:
- **Frontend:** Next.js React application, served by the web tier.
- **Backend API:** Django REST framework providing business logic and chat/RAG endpoints.
- **Databases:**
  - **Postgres (RDS):** Transactional database for Django models, users, and chat history.
  - **FAISS Vector Store:** In-memory semantic search index (for RAG), running **inside the Django application servers**.  
    This is separate from Postgres and optimized for vector similarity search.
- **LLM Endpoint:** Cloudflare worker hosting Llama 3 8billion parameter model

---

## Architecture Diagram (Conceptual)

<img width="843" height="465" alt="image" src="https://github.com/user-attachments/assets/cb11dd53-28ce-463b-93e3-6d8a900a60c4" />

---

## Architecture Components

### 1. Networking
- **VPC**: All resources are deployed inside a single Virtual Private Cloud.
- **Subnets**: 
  - **Public Subnets** in both AZs for web servers and NAT Gateways.
  - **Private Application Subnets** in both AZs for Django + FAISS app servers.
  - **Private Database Subnets** in both AZs for Amazon RDS (Postgres).

- **Internet Gateway (IGW)**: Provides inbound and outbound connectivity for public resources.
- **NAT Gateways**: Enable private instances (app servers, RDS) to securely access the internet for updates and patches.

---

### 2. Web Tier (Next.js Frontend)
- **External Application Load Balancer (ALB)**:
  - Routes inbound HTTP(S) traffic from users.
  - Distributes requests across multiple EC2 instances hosting the **Next.js frontend** in both AZs.
- **Auto Scaling Group (ASG)**:
  - Ensures web servers scale in/out based on traffic and CPU usage.
  - Provides fault tolerance if an AZ fails.

---

### 3. Application Tier (Django + FAISS)
- **Internal Application Load Balancer**:
  - Handles traffic from the Next.js web servers to the Django app servers.
  - Balances requests across app servers in both AZs.

- **Auto Scaling Group (ASG)**:
  - EC2 instances running **Django backend services**.
  - Each app server includes:
    - **Django REST API** (chat endpoints, document upload, RAG pipeline orchestration).
    - **FAISS Vector Store** for semantic search and Retrieval-Augmented Generation (RAG).  
      - Stores embeddings generated from uploaded documents.
      - Optimized for fast similarity search.
      - Lives in the **application tier** (not in RDS).

---

### 4. Database Tier
- **Amazon RDS for PostgreSQL**:
  - **Primary RDS Instance**: Hosted in one private DB subnet.
  - **Read Replica**: Hosted in another AZ for redundancy and disaster recovery.
  - Used by Django for transactional data (users, sessions, chat history, document metadata).

⚠️ **Important Distinction**:  
- **Postgres (RDS)** handles structured relational data.  
- **FAISS (in-app memory)** handles vector embeddings for semantic search.  
Both are required for the full chat + RAG functionality.

---

### 5. Monitoring & Observability
- **Amazon CloudWatch**:
  - Dashboards and alarms monitor:
    - Application performance
    - Infrastructure health
    - Resource usage metrics (CPU, memory, scaling activity)
  - Enables proactive scaling and rapid incident response.

---

## High Availability and Resilience Features
- **Multi-AZ Deployment**: Prevents single AZ failures from bringing down the application.
- **Load Balancers**: Provide traffic distribution and eliminate single points of failure.
- **Auto Scaling**: Optimizes cost and performance by automatically adjusting instance count.
- **RDS Read Replica**: Ensures database resilience and disaster recovery readiness.
- **FAISS Locality**: Vector store runs in each app server, meaning RAG queries remain fast and scale horizontally with app tier.
- **CloudWatch Alarms**: Provide real-time monitoring and alerting.

