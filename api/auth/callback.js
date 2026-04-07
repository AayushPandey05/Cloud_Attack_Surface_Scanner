export default async function handler(req, res) {
  const { code, name, email } = req.query;

  // 1. If Okta didn't send a code, stop.
  if (!code) return res.status(400).send("No code from Okta");

  // 2. In a real app, we'd exchange 'code' for a 'token' with the user's email.
  // For your demo, we'll pass along identity info to the frontend via URL parameters.
  const redirectParams = new URLSearchParams({
    sso: "success",
    accountType: "new"
  });
  
  if (name) redirectParams.append("name", name);
  if (email) redirectParams.append("email", email);

  res.writeHead(302, { Location: "/#dashboard?" + redirectParams.toString() });
  res.end();
}
