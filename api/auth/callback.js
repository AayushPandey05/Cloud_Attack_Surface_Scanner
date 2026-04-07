export default async function handler(req, res) {
  const { code, email, name } = req.query;

  // 1. If Okta didn't provide a code, reject unauthorized attempt.
  if (!code) return res.status(400).send("No authorization code provided by Okta.");

  // 2. Map identity to redirect parameters. For the demo, we prioritize the email context.
  const redirectParams = new URLSearchParams({
    sso: "success",
    accountType: "new"
  });

  if (email) redirectParams.append("email", email);
  if (name) redirectParams.append("name", name || "Security Admin");

  // Perform redirect with the dynamic identity context
  res.writeHead(302, { Location: "/#dashboard?" + redirectParams.toString() });
  res.end();
}
