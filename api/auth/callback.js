export default async function handler(req, res) {
  // 1. Get the 'code' Okta sent back in the URL
  const { code } = req.query;

  if (!code) {
    return res
      .status(400)
      .send("SSO Error: No authorization code received from Okta.");
  }

  console.log("[OKTA CALLBACK] Code received successfully:", code);

  // 2. Redirect the user to your dashboard with a 'success' flag
  // This triggers the "Enterprise SSO Session Established" log we wrote in logic.js
  res.setHeader("Location", "/#dashboard?sso=success");
  return res.status(302).end();
}
