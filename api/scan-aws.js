// AWS LIVE IDENTITY AUDIT — Real-Time IAM Posture Engine
import {
  IAMClient,
  ListMFADevicesCommand,
  ListUsersCommand,
} from "@aws-sdk/client-iam";
import {
  GetObjectCommand,
  GetPublicAccessBlockCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  S3Client,
  GetBucketLocationCommand,
} from "@aws-sdk/client-s3";

// Get current timestamp in local 24-hour format
const getTimestamp = () =>
  new Date().toLocaleTimeString("en-GB", { hour12: false });

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  // Terminal log storage for front-end dashboard
  const terminalLogs = [];
  let exposedSecrets = 0;
  let totalUsers = 0;
  let mfaEnabledUsers = 0;
  let publicBuckets = 0;
  let totalVulnerabilities = 0;

  try {
    terminalLogs.push(
      `[${getTimestamp()}] [AWS] SYSTEM: Identity Audit initiated.`,
    );

    const region = process.env.AWS_REGION || "ap-south-1";
    const credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };

    // Initialize IAM client
    const iamClient = new IAMClient({ region, credentials });

    // Execute User enumeration
    const { Users } = await iamClient.send(new ListUsersCommand({}));
    terminalLogs.push(
      `[AWS] SYSTEM: Found [${Users.length}] IAM Users in account.`,
    );

    // ── MFA AUDIT LAYER ────────────────────────────────────────────────
    for (const user of Users) {
      totalUsers++;
      const created = new Date(user.CreateDate).toLocaleDateString();
      terminalLogs.push(
        `[AWS] INFO: User [${user.UserName}] detected (Created: [${created}]).`,
      );

      try {
        const mfaRes = await iamClient.send(
          new ListMFADevicesCommand({ UserName: user.UserName }),
        );
        if (mfaRes.MFADevices && mfaRes.MFADevices.length > 0) {
          mfaEnabledUsers++;
          terminalLogs.push(
            `[AWS] INFO: User [${user.UserName}] MFA compliance check passed.`,
          );
        } else {
          totalVulnerabilities++;
          terminalLogs.push(
            `[AWS] WARN: User [${user.UserName}] missing MFA device.`,
          );
        }
      } catch (mfaErr) {
        console.error("MFA Check failed for user", user.UserName);
      }
    }

    const finalMfaPercentage = totalUsers > 0 ? Math.round((mfaEnabledUsers / totalUsers) * 100) : 0;
    terminalLogs.push(
      `[AWS] Audit: Final MFA Compliance: ${finalMfaPercentage}% across ${totalUsers} identities.`
    );

    // ── MODULE 3: S3 STORAGE AUDIT & CONTENT INSPECTION ────────────────
    const s3Client = new S3Client({ region, credentials, useAccelerateEndpoint: false });
    terminalLogs.push(
      `[${getTimestamp()}] [AWS] SYSTEM: S3 Storage Audit initiated.`,
    );

    try {
      const { Buckets } = await s3Client.send(new ListBucketsCommand({}));
      terminalLogs.push(
        `[AWS] Audit: ${Buckets.length} Global S3 Buckets identified across multiple regions.`,
      );

      for (const bucket of Buckets) {
        try {
          const locRes = await s3Client.send(new GetBucketLocationCommand({ Bucket: bucket.Name }));
          let bucketRegion = locRes.LocationConstraint;
          if (!bucketRegion) bucketRegion = region;
          if (bucketRegion === "EU") bucketRegion = "eu-west-1";
          
          const regionalS3Client = new S3Client({ region: bucketRegion, credentials, useAccelerateEndpoint: false });

          const { PublicAccessBlockConfiguration } = await regionalS3Client.send(
            new GetPublicAccessBlockCommand({ Bucket: bucket.Name }),
          );

          if (
            PublicAccessBlockConfiguration &&
            PublicAccessBlockConfiguration.BlockPublicAcls === true
          ) {
            terminalLogs.push(
              `[AWS] INFO: S3 Bucket [${bucket.Name}] is secure.`,
            );
          } else {
            publicBuckets++;
            totalVulnerabilities++;
            terminalLogs.push(
              `[AWS] Audit: CRITICAL: Public Bucket detected [+1].`,
            );
          }

          // ── S3 CONTENT INSPECTION (DEEP SCAN) ────────────────────────
          const { Contents } = await regionalS3Client.send(
            new ListObjectsV2Command({ Bucket: bucket.Name, MaxKeys: 5 }),
          );
          if (Contents && Contents.length > 0) {
            for (const obj of Contents) {
              try {
                const getObjRes = await regionalS3Client.send(
                  new GetObjectCommand({ Bucket: bucket.Name, Key: obj.Key }),
                );
                const body = await getObjRes.Body.transformToString();
                const regex =
                  /(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g;

                let fileHasLeakedKey = false;
                const lines = body.split("\n");

                for (let i = 0; i < lines.length; i++) {
                  if (lines[i].match(regex)) {
                    fileHasLeakedKey = true;
                    terminalLogs.push(
                      `[AWS] Audit: CRITICAL: Leaked Key in [${obj.Key}] (Line ${i + 1}).`,
                    );
                  }
                }

                if (fileHasLeakedKey) {
                  exposedSecrets++;
                  totalVulnerabilities++;
                }
              } catch (objErr) {
                /* Skip private/unreadable */
              }
            }
          }
        } catch (s3Err) {
          if (s3Err.name === "NoSuchPublicAccessBlockConfiguration") {
            publicBuckets++;
            totalVulnerabilities++;
            terminalLogs.push(
              `[AWS] Audit: CRITICAL: Public Bucket detected [+1].`,
            );
          }
        }
      }
    } catch (listErr) {
      terminalLogs.push(
        `[AWS] WARN: S3 Surface Discovery Failed — ${listErr.message}`,
      );
    }

    // ── COMPLIANCE SCOREBOARD CALCULATION ──────────────────────────────
    let controlsPassing = 0;
    if (publicBuckets === 0) controlsPassing++; // Check 1: Bucket Security
    if (exposedSecrets === 0) controlsPassing++; // Check 2: Secret Cleanliness
    if (mfaEnabledUsers > 0 && mfaEnabledUsers === totalUsers) controlsPassing++; // Check 3: Identity MFA

    // Return unified compliance telemetry payload
    return res.status(200).json({
      summary: Users.length,
      totalUsers: totalUsers,
      mfaEnabledUsers: mfaEnabledUsers,
      exposedSecrets: exposedSecrets,
      controlsPassing: controlsPassing,
      terminalLogs: terminalLogs,
      totalVulnerabilities: totalVulnerabilities,
    });
  } catch (err) {
    terminalLogs.push(
      `[${getTimestamp()}] [AWS] CRITICAL: Audit Failed — ${err.message}`,
    );
    return res.status(200).json({
      summary: 0,
      totalUsers: 0,
      mfaEnabledUsers: 0,
      exposedSecrets: 0,
      controlsPassing: 0,
      terminalLogs: terminalLogs,
      totalVulnerabilities: 0,
    });
  }
}
