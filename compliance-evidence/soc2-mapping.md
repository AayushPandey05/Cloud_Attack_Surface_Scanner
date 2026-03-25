# SOC 2 & ISO 27001 Compliance Mapping 📋

This document maps the technical AWS controls in this repository to specific auditor requirements.

## 1. Access Control (CC6.1)

- [cite_start]**Requirement**: Ensure only authorized users have access to sensitive data[cite: 19, 88].
- [cite_start]**Technical Implementation**: `iam-policies/IAM.JSON` enforces **MFA** for all users and implements **RBAC**[cite: 31, 34].

## 2. Monitoring & Risk Assessment (CC7.2)

- [cite_start]**Requirement**: Identify potential vulnerabilities and risks related to unauthorized access[cite: 40, 54].
- [cite_start]**Technical Implementation**: `backend-functions/mfa_auditor.py` automatically scans for users without MFA and flags them as a "Compliance Violation"[cite: 32, 55].

## 3. Audit Trails & Accountability (CC2.1)

- [cite_start]**Requirement**: Maintain thorough audit trails that document all user actions[cite: 43, 66].
- [cite_start]**Technical Implementation**: **AWS CloudTrail** (configured in `/infrastructure`) logs every API call to a secure **S3 bucket** for "unambiguous proof of compliance"[cite: 42, 51].

## 4. Incident Response (CC7.3)

- [cite_start]**Requirement**: Demonstrate the organization's response capabilities for security incidents[cite: 69, 70].
- [cite_start]**Technical Implementation**: **SNS Alerts** triggered by **AWS Config** and **Lambda** provide real-time notification of security gaps[cite: 35, 41].
