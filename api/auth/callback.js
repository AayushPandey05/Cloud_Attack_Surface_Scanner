export default async function handler(req, res) {
  const { code, email, name } = req.query;

  // 1. If Okta didn't provide a code, reject unauthorized attempt.
  if (!code) return res.status(400).send("No authorization code provided by Okta.");

  // 2. Map identity to redirect parameters. Use real user email if provided in callback context (e.g. via OIDC claim or param).
  const userEmail = email || 'guest-auditor@security-vault.demo';
  const redirectParams = new URLSearchParams({
    sso: "success",
    accountType: "new",
    email: userEmail
  });

  // Dynamically set name based on established admin identity
  const isAdmin = userEmail.toLowerCase() === 'aayushpandey2905@gmail.com';
  redirectParams.append("name", isAdmin ? "Security Admin" : "External Auditor");

  // Perform redirect with the dynamic identity context
  res.writeHead(302, { Location: "/#dashboard?" + redirectParams.toString() });
  res.end();
}
