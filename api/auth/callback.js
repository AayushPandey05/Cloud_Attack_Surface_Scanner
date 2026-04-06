export default async function handler(req, res) {
  // 1. Okta sends a 'code' in the URL
  const { code } = req.query;

  if (!code) {
    console.error("No code received from Okta");
    return res.redirect("/#login?error=no_code");
  }

  // 2. Teleport the user to the dashboard
  // We use 302 to force a redirect to the authenticated view
  res.writeHead(302, { Location: "/?sso=success#dashboard" });
  res.end();
}
