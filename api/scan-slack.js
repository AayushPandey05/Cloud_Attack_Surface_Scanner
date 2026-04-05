// SLACK WORKSPACE TELEMETRY API — SaaS Threat Intelligence Endpoint

const SLACK_API = "https://slack.com/api";

// Credential detection signature: AWS IAM Access Key ID (AKIA*),
// Stripe live secret key (sk_live_*), and Slack Bot Tokens (xoxb-)
const SECRET_REGEX = /AKIA[0-9A-Z]{16}|sk_live_[0-9a-zA-Z]{24}|xoxb-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]+/g;

// AUTHENTICATED SLACK FETCH HELPER
async function slackFetch(endpoint, params = {}) {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token)
    throw new Error("SLACK_BOT_TOKEN environment variable is not set.");

  const qs = new URLSearchParams(params).toString();
  const url = `${SLACK_API}/${endpoint}${qs ? "?" + qs : ""}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} from Slack (${endpoint})`);

  const json = await res.json();
  if (!json.ok)
    throw new Error(`Slack API error on ${endpoint}: ${json.error}`);

  return json;
}

// AUDIT ORCHESTRATOR
async function runScan() {
  // MODULE 1: IDENTITY & ACCESS AUDIT
  // Zero-Trust posture evaluation: every human identity in scope must satisfy
  // both MFA enrollment and profile integrity requirements. Any identity
  // failing either check is classified as non-compliant and emitted as a
  // Weak Identity → Account Takeover risk signal.
  let nonCompliant = 0;
  let totalUsers = 0;
  let humans = [];

  try {
    const { members } = await slackFetch("users.list", { limit: 200 });

    // Scope reduction: service accounts, bots, and deleted identities are
    // outside the human identity audit boundary — exclude from compliance count
    humans = members.filter(
      (u) => !u.is_bot && !u.deleted && u.id !== "USLACKBOT",
    );
    totalUsers = humans.length;

    nonCompliant = humans.filter((u) => {
      const noMfa = u.has_2fa === false;
      const noPhoto =
        !u.profile?.image_24 || u.profile.image_24.includes("gravatar");

      // Emit identity-level compliance event for operator audit trail
      if (noMfa || noPhoto) {
        console.log(
          `[AUDIT] Flagged User: ${u.real_name} | Missing MFA: ${noMfa} | Missing Photo: ${noPhoto}`,
        );
      }

      return noMfa || noPhoto;
    }).length;
  } catch (e) {
    console.error("[scan-slack] users.list failed:", e.message);
    // Non-fatal: identity audit failure degrades gracefully — credential
    // scan proceeds with an empty human roster (anonymous attribution only)
  }

  // MODULE 2: CREDENTIAL EXPOSURE SCAN
  // Message-layer telemetry scan targeting high-value credential patterns.
  // Channel scope is operator-configurable via SLACK_CHANNEL_ID env var;
  // absent that, the 10 most recent public channels are auto-discovered.
  let secrets = 0;
  let detailedAlerts = [];

  try {
    // Operator-specified channel takes precedence over auto-discovery;
    // single-channel mode reduces API surface and token permission scope.
    const channelId = process.env.SLACK_CHANNEL_ID;
    let rawChannels = [];

    if (channelId) {
      // Synthesize a minimal channel descriptor for iteration consistency
      rawChannels = [{ id: channelId, name: "specified-channel" }];
    } else {
      const { channels } = await slackFetch("conversations.list", {
        types: "public_channel",
        exclude_archived: "true",
        limit: "10",
      });
      rawChannels = channels;
    }

    for (const channelObj of rawChannels) {
      const channel = channelObj.id;
      const channelName = channelObj.name || channel;

      try {
        const { messages } = await slackFetch("conversations.history", {
          channel,
          limit: "20",
        });

        for (const msg of messages) {
          const text = msg.text || "";
          const matches = text.match(SECRET_REGEX);

          if (matches) {
            secrets += matches.length;
            const offender = humans.find((u) => u.id === msg.user);
            const userName = offender ? offender.real_name || offender.name : "Unknown Entity";

            // Categorize findings based on pattern match
            matches.forEach(m => {
              let type = "Credential";
              if (m.startsWith("xoxb-")) type = "Slack Bot Token";
              else if (m.startsWith("AKIA")) type = "AWS Access Key";
              else if (m.startsWith("sk_live_")) type = "Stripe Secret Key";
              detailedAlerts.push(`${type} Leaked in #${channelName}! | ↳ Initial Access → Credential Theft → User(${userName})`);
            });
          }
        }
      } catch (chanErr) {
        // Channel access denied: bot lacks membership — skip without failing scan
        console.warn(
          `[scan-slack] Skipping channel ${channel}: ${chanErr.message}`,
        );
      }
    }
  } catch (e) {
    console.error("[scan-slack] conversations scan failed:", e.message);
  }

  return { secrets, nonCompliant, totalUsers, detailedAlerts };
}

// VERCEL SERVERLESS HANDLER — GET /api/scan-slack
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = await runScan();
    return res.status(200).json(data);
  } catch (err) {
    console.error("[scan-slack] Fatal error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
