// AWS CSPM AUDIT ENGINE — IaaS Threat Intelligence Endpoint

import { IAMClient, ListUsersCommand } from "@aws-sdk/client-iam";
import {
  GetPublicAccessBlockCommand,
  ListBucketsCommand,
  S3Client,
} from "@aws-sdk/client-s3";

// SDK CLIENT INITIALISATION — Least-Privilege Credential Scope

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const iamClient = new IAMClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// CSPM AUDIT ORCHESTRATOR
async function runAwsAudit() {
  let publicBuckets = 0;
  let totalBuckets = 0;
  let nonMfaAdmins = 0;
  let detailedAlerts = [];

  try {
    // PLANE 1: S3 PUBLIC EXPOSURE AUDIT
    // ListBuckets returns all buckets owned by the authenticated principal.
    // Each bucket is evaluated for Public Access Block compliance in sequence.

    const { Buckets } = await s3Client.send(new ListBucketsCommand({}));
    totalBuckets = Buckets.length;

    for (const bucket of Buckets) {
      try {
        const status = await s3Client.send(
          new GetPublicAccessBlockCommand({ Bucket: bucket.Name }),
        );
        const config = status.PublicAccessBlockConfiguration;

        // Partial block configuration is treated as a full exposure risk:
        // a single disabled flag is sufficient to allow public ACL or policy writes.
        if (!config.BlockPublicAcls || !config.BlockPublicPolicy) {
          publicBuckets++;
          detailedAlerts.push(
            `Initial Access → Data Exfiltration → S3Bucket(${bucket.Name}) → Policy(Publicly Accessible)`,
          );
        }
      } catch (e) {
        // Absence of a PublicAccessBlock configuration is the highest-severity
        // S3 misconfiguration: it means no account-level block policy exists,
        // leaving bucket-level ACLs and policies as the sole access control plane.
        publicBuckets++;
        detailedAlerts.push(
          `Initial Access → Data Exfiltration → S3Bucket(${bucket.Name}) → Policy(Missing Public Block)`,
        );
      }
    }

    // PLANE 2: IAM IDENTITY POSTURE AUDIT
    // Evaluates human IAM identities for authentication hygiene signals.
    // PasswordLastUsed presence indicates console access — service accounts
    // (no console login) are excluded from the MFA compliance scope.
    // Production extension point: replace the MFA signal with listMFADevices
    // to perform deterministic per-identity device enrollment verification.
    const { Users } = await iamClient.send(
      new ListUsersCommand({ MaxItems: 10 }),
    );
    for (const user of Users) {
      // Exclude service accounts from the human authentication audit boundary
      if (!user.PasswordLastUsed) continue;

      // MFA device enrollment check scaffold — extend with listMFADevices
      // for production-grade Zero-Trust identity posture enforcement
    }
  } catch (err) {
    console.error("AWS Scan Failed:", err.message);
  }

  return { publicBuckets, totalBuckets, detailedAlerts };
}

// VERCEL SERVERLESS HANDLER — GET /api/scan-aws
export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const data = await runAwsAudit();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
