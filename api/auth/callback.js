export default async function handler(req, res) {
  const { code, email, idToken, accessToken } = req.query;

  // 1. Identity Extraction (Simulated for Demo Lifecycle)
  // In a real flow, the 'code' would be exchanged server-side.
  const userEmail = email || idToken || accessToken || 'Not Available';

  // 2. Map identity to role
  const isAdmin = userEmail.toLowerCase() === 'aayushpandey2905@gmail.com';
  const userName = isAdmin ? "Security Admin" : "External Auditor";

  // 3. SECURE BRIDGE: Return a script that hydrates sessionStorage and redirects
  // This achieves "Clean URLs" by never exposing identity tokens in the URL bar.
  res.setHeader('Content-Type', 'text/html');
  res.end(`
    <script>
      // Hydrate Session
      sessionStorage.setItem('loggedInUser', '${userEmail}');
      sessionStorage.setItem('email', '${userEmail}');
      sessionStorage.setItem('name', '${userName}');
      sessionStorage.setItem('isVaultAuthenticated', 'true');
      sessionStorage.setItem('isSSOSession', 'true');
      sessionStorage.setItem('vaultAccountType', 'new');

      // Immediate Redirect to Clean /dashboard URL
      window.location.href = '/dashboard';
    </script>
  `);
}
