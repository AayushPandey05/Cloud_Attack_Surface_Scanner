# AWS Audit-Ready SOC 2 Hub 🛡️☁️

**Developed by:** Aayush Pandey  
**Focus:** Cloud Security, IAM Automation, and GRC

---

## 📌 Project Overview

The **AWS Audit-Ready SOC 2 Hub** is a specialized cloud infrastructure project designed to bridge the gap between being **compliant** and being **secure**.

[cite_start]In the modern B2B SaaS landscape, manual compliance is slow and prone to human error[cite: 23, 25]. This hub automates the collection of **Real-Time Evidence** required for **SOC 2 and ISO 27001** audits.

## 🚀 Key Features & SOC 2 Mapping

- **Secure Authentication:** Amazon Cognito + MFA prevents unauthorized access.
- **Identity Federation:** OIDC Integration regulates access through a unified framework.
- [cite_start]**Role-Based Access (RBAC):** AWS IAM Groups/Policies ensures "Least Privilege"[cite: 31, 63].
- [cite_start]**Continuous Monitoring:** AWS Config identifies potential vulnerabilities in real-time[cite: 38, 40].
- [cite_start]**Automated Evidence:** CloudTrail + S3 maintains thorough audit trails[cite: 43, 51].
- [cite_start]**Incident Response:** Lambda + SNS Alerts demonstrates response capabilities[cite: 69, 70].

---

## 🏗️ System Architecture

The hub operates on a **0-budget, Serverless Architecture**:

- **The Gate:** Users authenticate via Cognito with mandatory MFA.
- [cite_start]**The Watchman:** AWS Config monitors for risks like public S3 buckets[cite: 52, 54].
- [cite_start]**The Automator:** AWS Lambda triggers "Leaver Workflows" to revoke access instantly[cite: 24, 93].
- **The Evidence Locker:** Logs are streamed to an encrypted S3 bucket for audits.

---

## 📂 Folder Structure

- `/identity-auth`: Cognito & OIDC configuration.
- `/access-control`: JSON IAM policies enforcing granular RBAC.
- `/auto-remediation`: Lambda scripts for automated risk mitigation.
- `/audit-evidence`: S3 & CloudTrail setups for "Audit Readiness".
- `/compliance-dashboard`: A serverless S3-hosted UI for visibility.

---

## 🎯 Why This Project?

This project demonstrates a deep understanding of **B2B Identity-Aware** infrastructure. [cite_start]By automating the "scrambling for evidence" during audits, this hub builds stakeholder trust and increases organizational credibility[cite: 73, 102].
