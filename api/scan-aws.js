// AWS LIVE IDENTITY AUDIT — Real-Time IAM Posture Engine
import { IAMClient, ListUsersCommand } from "@aws-sdk/client-iam";
import { S3Client, ListBucketsCommand, GetPublicAccessBlockCommand } from "@aws-sdk/client-s3";

// Get current timestamp in local 24-hour format
const getTimestamp = () => new Date().toLocaleTimeString('en-GB', { hour12: false });

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  // Terminal log storage for front-end dashboard
  const terminalLogs = [];

  try {
    terminalLogs.push(`[${getTimestamp()}] [AWS] SYSTEM: Identity Audit initiated.`);

    const region = process.env.AWS_REGION || "ap-south-1";
    const credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };

    // Initialize IAM client with account-level vault credentials
    const iamClient = new IAMClient({ region, credentials });

    // Execute User enumeration command across the global IAM control plane
    const { Users } = await iamClient.send(new ListUsersCommand({}));
    terminalLogs.push(`[AWS] SYSTEM: Found [${Users.length}] IAM Users in account.`);

    // Map identities to telemetry strings for forensic visualization
    Users.forEach(user => {
      const created = new Date(user.CreateDate).toLocaleDateString();
      terminalLogs.push(`[AWS] INFO: User [${user.UserName}] detected (Created: [${created}]).`);
    });

    // ── MODULE 3: S3 STORAGE AUDIT ─────────────────────────────────────
    const s3Client = new S3Client({ region, credentials });
    terminalLogs.push(`[${getTimestamp()}] [AWS] SYSTEM: S3 Storage Audit initiated.`);

    try {
      const { Buckets } = await s3Client.send(new ListBucketsCommand({}));
      terminalLogs.push(`[AWS] SYSTEM: Found [${Buckets.length}] S3 Buckets in ${region}.`);

      for (const bucket of Buckets) {
        try {
          const { PublicAccessBlockConfiguration } = await s3Client.send(
            new GetPublicAccessBlockCommand({ Bucket: bucket.Name })
          );

          if (PublicAccessBlockConfiguration && PublicAccessBlockConfiguration.BlockPublicAcls === true) {
            terminalLogs.push(`[AWS] INFO: S3 Bucket [${bucket.Name}] is secure.`);
          } else {
            terminalLogs.push(`[AWS] CRITICAL: S3 Bucket [${bucket.Name}] has PUBLIC ACCESS ENABLED!`);
          }
        } catch (s3Err) {
          // Detection: NoSuchPublicAccessBlockConfiguration implies public access may be allowed
          if (s3Err.name === "NoSuchPublicAccessBlockConfiguration") {
            terminalLogs.push(`[AWS] CRITICAL: S3 Bucket [${bucket.Name}] has PUBLIC ACCESS ENABLED!`);
          } else {
            // Handle permission/access denied errors gracefully for terminal logging
            terminalLogs.push(`[AWS] WARN: S3 Permission Error on [${bucket.Name}] — ${s3Err.message}`);
          }
        }
      }
    } catch (listErr) {
      terminalLogs.push(`[AWS] WARN: S3 Surface Discovery Failed — ${listErr.message}`);
    }

    // Return unified compliance telemetry payload
    return res.status(200).json({
      summary: Users.length,
      terminalLogs: terminalLogs
    });
  } catch (err) {
    // Audit failure capture — propagate detailed telemetry to dashboard terminal
    terminalLogs.push(`[${getTimestamp()}] [AWS] CRITICAL: Audit Failed — ${err.message}`);
    return res.status(200).json({ 
      summary: "AUDIT_FAILURE", 
      terminalLogs: terminalLogs 
    });
  }
}
