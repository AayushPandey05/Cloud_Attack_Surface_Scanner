// ==========================================================================
// logic.js — Cloud Attack Surface Scanner  |  Auth Pipeline Repair v3.0
// ==========================================================================
// ROOT CAUSE FIXED:
//   The previous version of this file registered its own DOMContentLoaded
//   listener and queried stale IDs from an older DOM layout
//   (login-page, mfa-page, dashboard-page, identity-loader, avatar-btn, etc.)
//   that no longer exist in index.html.
//
//   That caused a silent null-reference crash on every page load, which
//   prevented both the manual login form and the Google SSO button from
//   ever reaching processAuthSuccess() — creating an infinite loading deadlock.
//
//   The canonical auth logic now lives in the inline <script> inside index.html.
//   This file is its safe companion — it only exposes top-level globals that
//   the inline script may hand off to or that are needed for external callers.
// ==========================================================================

// --------------------------------------------------------------------------
// GUARD: Do NOT re-register DOMContentLoaded here. The inline <script> block
// in index.html is already the single source of truth for all DOM wiring.
// Adding another listener here was the original bug.
// --------------------------------------------------------------------------

// --------------------------------------------------------------------------
// window.processAuthSuccess  — GLOBAL ENTRY POINT
// --------------------------------------------------------------------------
// Defined here as a global so ANY auth path (manual form, Google SSI,
// Corp SSO, signup) can call it safely even before the inline DOMContentLoaded
// has run. The inline script's local processAuthSuccess() calls
// window.processAuthSuccess, so this global acts as a pre-boot stub that
// is immediately overwritten by the real implementation once the DOM is ready.
// --------------------------------------------------------------------------
window.processAuthSuccess = function (email) {
  // Pre-boot stub — the real implementation is registered by the inline
  // <script> block in index.html on DOMContentLoaded.
  // If this stub is somehow reached after the DOM is ready, delegate safely.
  console.warn(
    '[processAuthSuccess] Pre-boot stub called. This means the inline script ' +
    'DOMContentLoaded has not fired yet. Queuing for next frame...'
  );
  requestAnimationFrame(function () {
    if (typeof window.triggerEmailOtpFlow === 'function') {
      var stateLoading = document.getElementById('state-loading');
      var stateLogin   = document.getElementById('state-login');

      if (stateLoading) stateLoading.classList.remove('hidden');

      setTimeout(function () {
        if (stateLoading) stateLoading.classList.add('hidden');
        if (stateLogin)   stateLogin.classList.remove('hidden');
        window.triggerEmailOtpFlow(email || 'user@company.com');
      }, 950);
    } else {
      console.error(
        '[processAuthSuccess] triggerEmailOtpFlow is also missing. ' +
        'The inline <script> in index.html may have a parse error.'
      );
      alert(
        'Auth system failed to initialize. Please hard-refresh (Ctrl+Shift+R) ' +
        'and check the browser console for errors.'
      );
    }
  });
};

// --------------------------------------------------------------------------
// window.sendOtpEmail  — EMAILJS WRAPPER (Failsafe)
// --------------------------------------------------------------------------
// Verifies that the EmailJS engine is available and sends the OTP.
// The inline script calls emailjs.send() directly, but this global wrapper
// is available as a fallback for any external caller or future refactor.
// --------------------------------------------------------------------------
window.sendOtpEmail = function (userEmail, otpCode) {
  if (typeof emailjs === 'undefined') {
    console.error('[sendOtpEmail] EmailJS SDK not loaded. Ensure the CDN script tag is present in index.html.');
    alert('Email service not available. Please check your internet connection and refresh.');
    return;
  }

  if (!userEmail || !otpCode) {
    console.error('[sendOtpEmail] Missing required parameters.', { userEmail: userEmail, otpCode: otpCode });
    return;
  }

  var templateParams = {
    user_email: userEmail,
    otp_code: otpCode
  };

  console.log('[sendOtpEmail] Dispatching OTP to EmailJS for:', userEmail);

  emailjs
    .send('service_mngqn1v', 'template_9cva2to', templateParams)
    .then(function (response) {
      console.log('[sendOtpEmail] SUCCESS — OTP sent.', response.status, response.text);
    })
    .catch(function (error) {
      console.error('[sendOtpEmail] FAILED to send OTP:', error);
      // Do NOT alert here — the UI is already on the MFA screen.
      // A failed email send should not block the verification flow for demos.
    });
};

// --------------------------------------------------------------------------
// window.handleCredentialResponse  — GOOGLE ONE TAP JWT HANDLER
// --------------------------------------------------------------------------
// Handles the credential response from Google Identity Services (One Tap / GSI).
// Decodes the JWT payload and extracts the email, then immediately calls
// processAuthSuccess(). Wrapped in try/catch to prevent any silent crash.
// --------------------------------------------------------------------------
window.handleCredentialResponse = function (response) {
  try {
    if (!response || !response.credential) {
      throw new Error('No credential in GSI response.');
    }

    // Decode the JWT payload (Base64url middle segment)
    var parts   = response.credential.split('.');
    var payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

    if (!payload.email) {
      throw new Error('Email field missing from JWT payload.');
    }

    console.log('[GSI] handleCredentialResponse — Email:', payload.email, '| Name:', payload.name);
    window.processAuthSuccess(payload.email);

  } catch (err) {
    console.error('[GSI] JWT decode or processAuthSuccess failed:', err);
    alert('Google Sign-In encountered an error. Please try again or use email/password.');
  }
};

// --------------------------------------------------------------------------
// window.handleGoogleLogin  — GOOGLE OAUTH2 TOKEN FLOW (Popup)
// --------------------------------------------------------------------------
// Called from onclick="handleGoogleLogin(event)" on the "Continue with Google"
// button. Uses the OAuth2 Token Client (popup flow) to get a real user email.
// Falls back to demo mode if the GSI library is not loaded.
// --------------------------------------------------------------------------
window.handleGoogleLogin = function (e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  console.log('[GSI] handleGoogleLogin triggered.');

  if (typeof google === 'undefined' || !google.accounts || !window._gsiTokenClient) {
    console.warn('[GSI] OAuth2 client not initialized — using demo fallback.');
    window.processAuthSuccess('demo@google.com');
    return;
  }

  window._gsiTokenClient.requestAccessToken({ prompt: 'select_account' });
};

console.log('[logic.js v3.0] Auth pipeline companion module loaded. Deadlock patch applied.');

// ==========================================================================
// window.fetchLiveSlackData — SLACK TELEMETRY ENGINE v1.2
// ==========================================================================
// Called by the inline dashboard script in index.html whenever the user
// switches to the "Slack Workspace" segment view.
//
// Flow:
//   1. Immediately show loading placeholders in KPI cards.
//   2. Fetch GET /api/scan-slack (Vercel serverless — token never leaves server).
//   3. Apply real data to the DOM; log findings in the terminal feed.
//   4. If the API is unavailable, degrade gracefully — UI stays stable.
// ==========================================================================

window.fetchLiveSlackData = async function () {
  // ── 1. Loading state ──────────────────────────────────────────────────────
  var setKpi = function (id, val, sub, color) {
    var valEl = document.getElementById('kpi-' + id + '-val');
    var subEl = document.getElementById('kpi-' + id + '-sub');
    if (valEl) { valEl.innerText = val; if (color) valEl.style.color = color; }
    if (subEl) subEl.innerText = sub;
  };
  var setTitle = function (id, text) {
    var el = document.getElementById('kpi-' + id + '-title');
    if (el) el.innerText = text;
  };

  setTitle(2, 'Exposed Secrets');
  setTitle(3, 'MFA Enforced');
  setTitle(4, 'Non-Compliant Users');
  setTitle(5, 'Total Users');

  setKpi(1, '—', 'Scanning workspace…', 'var(--gray)');
  setKpi(2, '—', 'Scanning messages…',  'var(--gray)');
  setKpi(3, '—', 'Checking users…',     'var(--gray)');
  setKpi(4, '—', 'MFA & profile audit', 'var(--gray)');
  setKpi(5, '—', 'Querying API…',       'var(--gray)');

  // Log initiation in terminal (calls addLog defined in the inline script)
  if (typeof window._slackAddLog === 'function') {
    window._slackAddLog('SLACK', 'Initiating live workspace scan via /api/scan-slack…', 'SYSTEM');
  }

  // ── 2. Fetch ──────────────────────────────────────────────────────────────
  try {
    var res = await fetch('/api/scan-slack');

    if (!res.ok) {
      var errBody = await res.json().catch(function () { return { error: 'HTTP ' + res.status }; });
      throw new Error(errBody.error || 'API returned ' + res.status);
    }

    var data = await res.json();

    // ── 3. Apply results ──────────────────────────────────────────────────
    var secrets      = typeof data.secrets     === 'number' ? data.secrets     : 0;
    var nonCompliant = typeof data.nonCompliant === 'number' ? data.nonCompliant : 0;
    var totalUsers   = typeof data.totalUsers  === 'number' ? data.totalUsers  : 0;

    // MFA % = (compliant / total) * 100  — clamp between 0 and 100
    var mfaPct = totalUsers > 0
      ? Math.round(((totalUsers - nonCompliant) / totalUsers) * 100)
      : 100;

    // KPI 1 — attack surface (secrets = entry points)
    setKpi(1,
      String(secrets),
      secrets > 0 ? '↑ ' + secrets + ' secret(s) found' : 'No secrets found ✓',
      secrets > 0 ? 'var(--red)' : 'var(--green)'
    );

    // KPI 2 — Exposed Secrets count
    setKpi(2,
      String(secrets),
      secrets > 0 ? 'Critical severity' : 'Clean ✓',
      secrets > 0 ? 'var(--red)' : 'var(--green)'
    );

    // KPI 3 — MFA Enforced %
    setKpi(3,
      mfaPct + '%',
      nonCompliant > 0 ? nonCompliant + ' user(s) non-compliant' : 'All users compliant ✓',
      mfaPct >= 90 ? 'var(--green)' : 'var(--red)'
    );

    // KPI 4 — Non-compliant count
    setKpi(4,
      String(nonCompliant),
      nonCompliant > 0 ? 'MFA / profile gaps' : 'No violations ✓',
      nonCompliant > 0 ? 'var(--red)' : 'var(--green)'
    );

    // KPI 5 — Total users audited
    setKpi(5,
      String(totalUsers),
      'Users audited',
      '#3B82F6'
    );

    // ── Terminal log real findings ────────────────────────────────────────
    if (typeof window._slackAddLog === 'function') {
      window._slackAddLog('SLACK',
        'Scan complete — ' + totalUsers + ' users, ' + secrets + ' secret(s) detected.',
        'SYSTEM'
      );

      if (secrets > 0) {
        window._slackAddLog('SLACK',
          secrets + ' credential pattern(s) matched (AKIA/sk_live) in channel history.',
          'CRITICAL', 'Initial Access', 'Credential Theft'
        );
      } else {
        window._slackAddLog('SLACK', 'No AWS keys or Stripe secrets found in scanned messages.', 'SYSTEM');
      }

      if (nonCompliant > 0) {
        window._slackAddLog('SLACK',
          nonCompliant + ' user(s) missing MFA or profile photo.',
          'WARN', 'Weak Identity', 'Account Takeover'
        );
      } else {
        window._slackAddLog('SLACK', 'All users pass MFA and profile compliance checks.', 'SYSTEM');
      }
    }

  } catch (err) {
    // ── 4. Graceful degradation ───────────────────────────────────────────
    console.error('[fetchLiveSlackData] API call failed:', err.message);

    var isOffline = err.message.includes('Failed to fetch') ||
                    err.message.includes('NetworkError') ||
                    err.message.includes('Load failed');

    var hint = isOffline ? 'Run: vercel dev' : err.message.slice(0, 45);

    setKpi(1, '?', 'API unreachable', 'var(--gray)');
    setKpi(2, '?', hint,              'var(--gray)');
    setKpi(3, '?', 'API unavailable', 'var(--gray)');
    setKpi(4, '?', 'API unavailable', 'var(--gray)');
    setKpi(5, '?', 'API unavailable', 'var(--gray)');

    if (typeof window._slackAddLog === 'function') {
      window._slackAddLog('SLACK', '⚠ Scan API unreachable: ' + err.message, 'ALERT');
      if (isOffline) {
        window._slackAddLog('SLACK', 'Start the dev server with: vercel dev', 'SYSTEM');
        window._slackAddLog('SLACK', 'Add SLACK_BOT_TOKEN to .env before running.', 'SYSTEM');
      }
    }
  }
};

console.log('[logic.js v3.1] Slack Telemetry Engine loaded — fetchLiveSlackData ready.');

