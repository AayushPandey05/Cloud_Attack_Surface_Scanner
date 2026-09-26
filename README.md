# Cloud Attack Surface Scanner 🛡️⚡

**Developed by:** Aayush Pandey
**Focus:** Cloud Security • DevSecOps • Identity Threat Detection • Infrastructure as Code
**🔴 Live Dashboard:** [vault.heyitsaayush.me/login](https://vault.heyitsaayush.me/login)

---

## 📌 Project Overview

The **Cloud Attack Surface Scanner (CASS)** is an enterprise-grade DevSecOps security tool designed to proactively discover and neutralize cloud misconfigurations before they can be exploited by threat actors.

In the modern threat landscape, identity and infrastructure configurations are the new perimeter. This tool automates the detection of high-risk IAM vulnerabilities, public storage exposure, and shadow admins. It shifts cloud security from reactive logging to proactive threat containment using modern Infrastructure as Code (IaC) and containerized workflows.

---

## 🚀 Core Capabilities & Threat Detection

- **Microservices Architecture** — Backend modules (`api-gateway`, `aws-audit`, `slack-bot`) are completely decoupled and containerized as independent Docker images for isolated scaling and deployment.
- **Kubernetes Orchestration & HPA** — The core scanning engine is orchestrated via Kubernetes (K8s) featuring a Horizontal Pod Autoscaler (HPA) that dynamically scales replicas based on live traffic and CPU thresholds.
- **Infrastructure as Code (IaC) Security** — Automated AWS provisioning (EC2, S3) via Terraform with built-in Principle of Least Privilege (PoLP) validation.
- **Live Observability** — Integrated Prometheus and Grafana stack for real-time monitoring of the scanning engine's CPU usage, memory heaps, and event loop health.
- **Identity Exploitation Prevention** — Enforces strict Role-Based Access Control (RBAC) and mandatory MFA via Okta SSO to neutralize credential stuffing and privilege escalation vectors.
- **Enterprise CI/CD Pipelines** — Rapid automated deployments triggered via GitHub Webhooks to Vercel, demonstrating modern, real-time CI/CD integration.

---

## 🏗️ Architecture Overview

Built on a modern DevSecOps stack, maximizing security, scalability, and automation without infrastructure overhead:

- **The Builder (Terraform)** — Provisions the target AWS infrastructure (S3 buckets, IAM roles) using immutable infrastructure principles.
- **The Engine (Docker & K8s)** — Independent microservices running on isolated ports, orchestrated by Kubernetes for automatic horizontal scaling and self-healing.
- **The Pipeline (GitHub & Vercel)** — Serverless frontend deployment seamlessly integrated with GitHub Webhooks for continuous, live delivery.
- **The Telemetry (Prometheus & Grafana)** — A localized observability stack tracking the metrics, uptime, and operational status of the microservices.
- **The Identity Gateway** — A custom B2B-styled SSO frontend interface utilizing robust session management and MFA challenge logic.

---

## 📂 Repository Structure

```
/assets                    Core frontend logic, UI styling, AWS SDK configurations
/terraform                 Terraform configs (main.tf) for automated AWS infra provisioning
/kubernetes                K8s deployment manifests, incl. HorizontalPodAutoscaler & services
/monitoring                Docker Compose, Prometheus (prometheus.yml), Grafana configs
/backend-functions         Threat-hunting scripts, microservice logic (api-gateway, aws-audit, slack-bot)
/iam-policies               Hardened JSON policies enforcing "Least Privilege"
/attack_path_simulations   Docs mapping vulnerabilities to threat vectors + sample telemetry
```

---

## ⚙️ How to Run Locally (Evaluation Guide)

### 1. Start Docker Microservices & Monitoring

```bash
docker compose up --build -d
docker compose ps
```

| Service               | URL                   |
| --------------------- | --------------------- |
| API Gateway / Metrics | http://localhost:5000 |
| Prometheus            | http://localhost:9090 |
| Grafana               | http://localhost:3005 |

### 2. Deploy to Kubernetes & Test Autoscaling

```bash
kubectl apply -f kubernetes/deployment.yaml
kubectl get hpa -w
```

### 3. Provision AWS Infrastructure

```bash
cd terraform
terraform init
terraform plan
```

---

## 🎯 Why I Built This

This project demonstrates a deep, practical understanding of Cloud Security Posture Management (CSPM), DevSecOps pipelines, and Infrastructure as Code (IaC). By engineering an automated pipeline that builds infrastructure, containerizes the scanning engine into microservices, and actively hunts for misconfigurations, this project proves the ability to defend enterprise perimeters and execute secure cloud operations at scale.

---

## 👨‍💻 Author

**Aayush Pandey**
