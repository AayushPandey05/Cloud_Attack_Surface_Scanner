# Cloud Attack Surface Scanner 🛡️⚡

**Developed by:** Aayush Pandey  
**Focus:** Cloud Security, Attack Surface Management, and Identity Threat Detection  
**🔴 Live Dashboard:** [Click here to view the live project]([https://vault.heyitsaayush.me/#login])

---

## 📌 Project Overview

The **Cloud Attack Surface Scanner** is an enterprise-grade, serverless security tool designed to proactively discover and neutralize cloud misconfigurations before they can be exploited by threat actors.

In the modern threat landscape, identity is the new perimeter. This tool automates the detection of high-risk IAM vulnerabilities, shadow admins, and exposed infrastructure, shifting cloud security from reactive logging to proactive threat containment.

## 🚀 Core Capabilities & Threat Detection

- **Identity Exploitation Prevention:** Enforces strict Role-Based Access Control (RBAC) and mandatory MFA to neutralize credential stuffing and privilege escalation vectors.
- **Automated Threat Hunting:** Continuous monitoring pipelines identify potential vulnerabilities (like over-permissive identities and public S3 buckets) in real-time.
- **Immutable Telemetry:** AWS CloudTrail + S3 establishes tamper-proof logs for incident response, preventing attackers from executing defense evasion techniques.
- **Automated Threat Containment:** Event-driven architecture (AWS Lambda + SNS Alerts) triggers real-time notifications to disrupt attack chains instantly.

---

## 🏗️ System Architecture

Built entirely on a **zero-dollar, serverless AWS architecture**, maximizing security without infrastructure overhead:

- **The Identity Gateway:** A custom B2B-styled SSO frontend interface utilizing robust session management and MFA challenge logic.
- **The Detection Engine:** Python/Node.js based automation that actively scans the cloud environment for critical access violations and public storage exposure.
- **The Telemetry Vault:** S3 buckets configured for immutable log storage to ensure complete visibility during security incidents.
- **The Response Matrix:** Cloud infrastructure ready to execute automated containment workflows and alert security teams.

---

## 📂 Repository Structure

- `/assets` - Core frontend logic, UI styling, and AWS SDK configurations.
- `/attack_path_simulations` - Documentation mapping vulnerabilities to threat vectors (`vulnerability_vectors.md`) and sample threat telemetry.
- `/backend-functions` - Threat-hunting scripts, secret scanners, and automated cloud auditors.
- `/iam-policies` - Hardened JSON policies enforcing the principle of "Least Privilege".
- `/infrastructure` - Setup files and YAML templates for rapid, secure deployment.

---

## 🎯 Why I Built This

This project demonstrates a deep, practical understanding of **Cloud Security Posture Management (CSPM)** and **AppSec engineering**. By building the tools to automatically detect and contain cloud attack paths, this project proves the ability to defend enterprise perimeters and reduce blast radius at scale.
