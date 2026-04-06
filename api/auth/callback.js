export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).send("No code from Okta");

  // Teleport back to your vault dashboard
  res.writeHead(302, { Location: "/#dashboard?sso=success" });
  res.end();
}
