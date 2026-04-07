export default async function handler(req, res) {
  const { code, email, name, idToken, accessToken } = req.query;

  // 1. If Okta didn't provide a code, reject unauthorized attempt.
  if (!code) return res.status(400).send("No authorization code provided by Okta.");

  // 2. Identity Extraction (Simulated for Demo Lifecycle)
  // In production, we'd exchange 'code' for a token and verify claims.
  const userEmail = email || idToken || accessToken || 'Not Available';

  // 3. Map identity to redirect parameters.
  const redirectParams = new URLSearchParams({
    sso: "success",
    accountType: "new",
    email: userEmail
  });

  // Dynamically set name based on established admin identity
  const isAdmin = userEmail.toLowerCase() === 'aayushpandey2905@gmail.com';
  redirectParams.append("name", isAdmin ? "Security Admin" : "External Auditor");

  // Perform redirect with explicitly encoded identity context for SSO resolution
  const redirectUrl = `/#dashboard?sso=success&email=${encodeURIComponent(userEmail)}&name=${encodeURIComponent(isAdmin ? "Security Admin" : "External Auditor")}`;
  res.writeHead(302, { Location: redirectUrl });
  res.end();
}
