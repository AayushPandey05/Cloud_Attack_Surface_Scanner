export default async function handler(req, res) {
  const { code } = req.query;

  // 1. If Okta didn't send a code, stop.
  if (!code) return res.status(400).send("No code from Okta");

  // 2. In a real app, we'd exchange 'code' for a 'token' with the user's email.
  // For your demo, let's just pass a flag that this is a 'New User'
  res.writeHead(302, { Location: "/#dashboard?sso=success&accountType=new" });
  res.end();
}
