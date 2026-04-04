const SLACK_API = "https://slack.com/api";

// ── Regex for secret detection ────────────────────────────────────────────────
const SECRET_REGEX = /AKIA[0-9A-Z]{16}|sk_live_[0-9a-zA-Z]{24}/g;

// ── Generic Slack fetch helper ────────────────────────────────────────────────
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

// ── Scanner ───────────────────────────────────────────────────────────────────
async function runScan() {
  // ── 1. USERS AUDIT ────────────────────────────────────────────────────────
  let nonCompliant = 0;
  let totalUsers = 0;

  try {
    const { members } = await slackFetch("users.list", { limit: 200 });

    // Exclude bots, deleted accounts, and Slackbot itself
    const humans = members.filter(
      (u) => !u.is_bot && !u.deleted && u.id !== "USLACKBOT",
    );
    totalUsers = humans.length;

    nonCompliant = humans.filter((u) => {
      const noMfa = u.has_2fa === false;
      const noPhoto =
        !u.profile?.image_24 || u.profile.image_24.includes("gravatar");

      // Add this debug log!
      if (noMfa || noPhoto) {
        console.log(
          `[AUDIT] Flagged User: ${u.real_name} | Missing MFA: ${noMfa} | Missing Photo: ${noPhoto}`,
        );
      }

      return noMfa || noPhoto;
    }).length;
  } catch (e) {
    console.error("[scan-slack] users.list failed:", e.message);
    // Non-fatal — continue to message scan
  }

  // ── 2. MESSAGE SCAN ───────────────────────────────────────────────────────
  let secrets = 0;

  try {
    // Use SLACK_CHANNEL_ID env var if set; otherwise scan first 10 public channels
    const channelId = process.env.SLACK_CHANNEL_ID;
    let channelsToScan = [];

    if (channelId) {
      channelsToScan = [channelId];
    } else {
      const { channels } = await slackFetch("conversations.list", {
        types: "public_channel",
        exclude_archived: "true",
        limit: "10",
      });
      channelsToScan = channels.map((c) => c.id);
    }

    for (const channel of channelsToScan) {
      try {
        const { messages } = await slackFetch("conversations.history", {
          channel,
          limit: "20",
        });

        for (const msg of messages) {
          const text = msg.text || "";
          const matches = text.match(SECRET_REGEX);
          if (matches) secrets += matches.length;
        }
      } catch (chanErr) {
        // Bot not in channel — skip silently
        console.warn(
          `[scan-slack] Skipping channel ${channel}: ${chanErr.message}`,
        );
      }
    }
  } catch (e) {
    console.error("[scan-slack] conversations scan failed:", e.message);
  }

  return { secrets, nonCompliant, totalUsers };
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Only allow GET
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
