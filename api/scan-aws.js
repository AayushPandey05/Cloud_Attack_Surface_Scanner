// AWS LIVE IDENTITY AUDIT — Real-Time IAM Posture Engine
import { IAMClient, ListUsersCommand } from "@aws-sdk/client-iam";

// Get current timestamp in local 24-hour format
const getTimestamp = () => new Date().toLocaleTimeString('en-GB', { hour12: false });

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  // Terminal log storage for front-end dashboard
  const terminalLogs = [];

  try {
    terminalLogs.push(`[${getTimestamp()}] [AWS] SYSTEM: Identity Audit initiated.`);

    // Initialize IAM client with account-level vault credentials
    const iamClient = new IAMClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    // Execute User enumeration command across the global IAM control plane
    const { Users } = await iamClient.send(new ListUsersCommand({}));
    terminalLogs.push(`[AWS] SYSTEM: Found [${Users.length}] IAM Users in account.`);

    // Map identities to telemetry strings for forensic visualization
    Users.forEach(user => {
      const created = new Date(user.CreateDate).toLocaleDateString();
      terminalLogs.push(`[AWS] INFO: User [${user.UserName}] detected (Created: [${created}]).`);
    });

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
