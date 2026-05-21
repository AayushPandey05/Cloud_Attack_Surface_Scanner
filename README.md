# Cloud Attack Surface Scanner 🛡️⚡

**Developed by:** Aayush Pandey  
**Focus:** Cloud Security • DevSecOps • Identity Threat Detection • Infrastructure as Code  
**🔴 Live Dashboard:** https://vault.heyitsaayush.me/login

---

## 📌 Project Overview

The **Cloud Attack Surface Scanner (CASS)** is an enterprise-grade DevSecOps security tool designed to proactively discover and neutralize cloud misconfigurations before they can be exploited by threat actors.

In the modern threat landscape, identity and infrastructure configurations are the new perimeter. This tool automates the detection of high-risk IAM vulnerabilities, public storage exposure, and shadow admins. It shifts cloud security from reactive logging to proactive threat containment using modern Infrastructure as Code (IaC) and containerized workflows.

---

## 🚀 Core Capabilities & Threat Detection

- **Infrastructure as Code (IaC) Security:** Automated AWS provisioning via Terraform with built-in Principle of Least Privilege (PoLP) validation.
- **Enterprise CI/CD Pipelines:** Features a complete Jenkins pipeline architecture with a mandatory "DevSecOps Gate" to block vulnerable container deployments.
- **High-Availability Scanning Engine:** Dockerized Node.js security scanners orchestrated via Kubernetes (K8s) to ensure zero-downtime threat hunting.
- **Real-Time Observability:** Integrated Prometheus and Grafana stack for live monitoring of the scanner engine's health and target compliance status.
- **Identity Exploitation Prevention:** Enforces strict Role-Based Access Control (RBAC) and mandatory MFA to neutralize credential stuffing and privilege escalation vectors.
- **Automated Threat Hunting:** Continuous monitoring pipelines identify potential vulnerabilities (e.g., over-permissive identities and public S3 buckets) in real-time.

---

## 🏗️ Architecture Overview

Built on a modern DevSecOps stack, maximizing security, scalability, and automation without infrastructure overhead:

- **The Builder (Terraform):** Provisions the target AWS infrastructure (S3 buckets, IAM roles) using immutable infrastructure principles.
- **The Engine (Docker & K8s):** The core scanning engine is fully containerized and orchestrated by Kubernetes for automatic self-healing.
- **The Pipeline (Jenkins & Vercel):** Rapid serverless frontend deployment via Vercel, backed by an enterprise Jenkins pipeline demonstrating automated security scanning stages.
- **The Telemetry (Prometheus & Grafana):** A localized observability stack tracking the metrics, uptime, and operational status of the scanning operations.
- **The Identity Gateway:** A custom B2B-styled SSO frontend interface utilizing robust session management and MFA challenge logic.

---

## 📂 Repository Structure

- `/assets` - Core frontend logic, UI styling, and AWS SDK configurations.
- `/terraform` - Terraform configurations (`main.tf`) for automated AWS infrastructure provisioning.
- `/kubernetes` - K8s deployment and service manifests for container orchestration.
- `/monitoring` - Docker Compose, Prometheus, and Grafana configurations for the observability stack.
- `Jenkinsfile` - Enterprise CI/CD pipeline code featuring a dedicated DevSecOps scanning gate.
- `/attack_path_simulations` - Documentation mapping vulnerabilities to threat vectors and sample threat telemetry.
- `/backend-functions` - Threat-hunting scripts, secret scanners, and automated cloud auditors.
- `/iam-policies` - Hardened JSON policies enforcing the principle of "Least Privilege".

---

## 🎯 Why I Built This

This project demonstrates a deep, practical understanding of **Cloud Security Posture Management (CSPM)**, **DevSecOps pipelines**, and **Infrastructure as Code (IaC)**. By engineering an automated pipeline that builds infrastructure, containerizes the scanning engine, and actively hunts for misconfigurations, this project proves the ability to defend enterprise perimeters and execute secure cloud operations at scale.

---

## 👨‍💻 Author

**Aayush Pandey**
