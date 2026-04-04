// window.processAuthSuccess  — GLOBAL ENTRY POINT

window.processAuthSuccess = function (email) {
  console.warn(
    "[processAuthSuccess] Pre-boot stub called. This means the inline script " +
      "DOMContentLoaded has not fired yet. Queuing for next frame...",
  );
  requestAnimationFrame(function () {
    if (typeof window.triggerEmailOtpFlow === "function") {
      var stateLoading = document.getElementById("state-loading");
      var stateLogin = document.getElementById("state-login");

      if (stateLoading) stateLoading.classList.remove("hidden");

      setTimeout(function () {
        if (stateLoading) stateLoading.classList.add("hidden");
        if (stateLogin) stateLogin.classList.remove("hidden");
        window.triggerEmailOtpFlow(email || "user@company.com");
      }, 950);
    } else {
      console.error(
        "[processAuthSuccess] triggerEmailOtpFlow is also missing. " +
          "The inline <script> in index.html may have a parse error.",
      );
      alert(
        "Auth system failed to initialize. Please hard-refresh (Ctrl+Shift+R) " +
          "and check the browser console for errors.",
      );
    }
  });
};

// window.sendOtpEmail  — EMAILJS WRAPPER (Failsafe)
window.sendOtpEmail = function (userEmail, otpCode) {
  if (typeof emailjs === "undefined") {
    console.error(
      "[sendOtpEmail] EmailJS SDK not loaded. Ensure the CDN script tag is present in index.html.",
    );
    alert(
      "Email service not available. Please check your internet connection and refresh.",
    );
    return;
  }

  if (!userEmail || !otpCode) {
    console.error("[sendOtpEmail] Missing required parameters.", {
      userEmail: userEmail,
      otpCode: otpCode,
    });
    return;
  }

  var templateParams = {
    user_email: userEmail,
    otp_code: otpCode,
  };

  console.log("[sendOtpEmail] Dispatching OTP to EmailJS for:", userEmail);

  emailjs
    .send("service_mngqn1v", "template_9cva2to", templateParams)
    .then(function (response) {
      console.log(
        "[sendOtpEmail] SUCCESS — OTP sent.",
        response.status,
        response.text,
      );
    })
    .catch(function (error) {
      console.error("[sendOtpEmail] FAILED to send OTP:", error);
      // Do NOT alert here — the UI is already on the MFA screen.
      // A failed email send should not block the verification flow for demos.
    });
};

// --------------------------------------------------------------------------
// window.handleCredentialResponse  — GOOGLE ONE TAP JWT HANDLER

window.handleCredentialResponse = function (response) {
  try {
    if (!response || !response.credential) {
      throw new Error("No credential in GSI response.");
    }

    // Decode the JWT payload (Base64url middle segment)
    var parts = response.credential.split(".");
    var payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    );

    if (!payload.email) {
      throw new Error("Email field missing from JWT payload.");
    }

    console.log(
      "[GSI] handleCredentialResponse — Email:",
      payload.email,
      "| Name:",
      payload.name,
    );
    window.processAuthSuccess(payload.email);
  } catch (err) {
    console.error("[GSI] JWT decode or processAuthSuccess failed:", err);
    alert(
      "Google Sign-In encountered an error. Please try again or use email/password.",
    );
  }
};

// --------------------------------------------------------------------------
// window.handleGoogleLogin  — GOOGLE OAUTH2 TOKEN FLOW (Popup)
window.handleGoogleLogin = function (e) {
  if (e && typeof e.preventDefault === "function") e.preventDefault();
  console.log("[GSI] handleGoogleLogin triggered.");

  if (
    typeof google === "undefined" ||
    !google.accounts ||
    !window._gsiTokenClient
  ) {
    console.warn("[GSI] OAuth2 client not initialized — using demo fallback.");
    window.processAuthSuccess("demo@google.com");
    return;
  }

  window._gsiTokenClient.requestAccessToken({ prompt: "select_account" });
};

console.log(
  "[logic.js v3.0] Auth pipeline companion module loaded. Deadlock patch applied.",
);

// ==========================================================================
// window.fetchLiveSlackData — SLACK TELEMETRY ENGINE v1.2
window.fetchLiveSlackData = async function () {
  // ── 1. Loading state ──────────────────────────────────────────────────────
  var setKpi = function (id, val, sub, color) {
    var valEl = document.getElementById("kpi-" + id + "-val");
    var subEl = document.getElementById("kpi-" + id + "-sub");
    if (valEl) {
      valEl.innerText = val;
      if (color) valEl.style.color = color;
    }
    if (subEl) subEl.innerText = sub;
  };
  var setTitle = function (id, text) {
    var el = document.getElementById("kpi-" + id + "-title");
    if (el) el.innerText = text;
  };

  setTitle(2, "Exposed Secrets");
  setTitle(3, "MFA Enforced");
  setTitle(4, "Non-Compliant Users");
  setTitle(5, "Total Users");

  // ── Clear stale terminal logs immediately ─────────────────────────────────
  var terminalEl = document.getElementById("terminal-feed");
  if (terminalEl) terminalEl.innerHTML = "";

  setKpi(1, "—", "Scanning workspace…", "var(--gray)");
  setKpi(2, "—", "Scanning messages…", "var(--gray)");
  setKpi(3, "—", "Checking users…", "var(--gray)");
  setKpi(4, "—", "MFA & profile audit", "var(--gray)");
  setKpi(5, "—", "Querying API…", "var(--gray)");


  // Log initiation in terminal (calls addLog defined in the inline script)
  if (typeof window._slackAddLog === "function") {
    window._slackAddLog(
      "SLACK",
      "Initiating live workspace scan via /api/scan-slack…",
      "SYSTEM",
    );
  }

  // ── 2. Fetch ──────────────────────────────────────────────────────────────
  try {
    var res = await fetch("/api/scan-slack");

    if (!res.ok) {
      var errBody = await res.json().catch(function () {
        return { error: "HTTP " + res.status };
      });
      throw new Error(errBody.error || "API returned " + res.status);
    }

    var data = await res.json();

    // ── 3. Apply results ──────────────────────────────────────────────────
    var secrets = typeof data.secrets === "number" ? data.secrets : 0;
    var nonCompliant =
      typeof data.nonCompliant === "number" ? data.nonCompliant : 0;
    var totalUsers = typeof data.totalUsers === "number" ? data.totalUsers : 0;

    // MFA % = (compliant / total) * 100  — clamp between 0 and 100
    var mfaPct =
      totalUsers > 0
        ? Math.round(((totalUsers - nonCompliant) / totalUsers) * 100)
        : 100;

    // KPI 1 — attack surface (secrets = entry points)
    setKpi(
      1,
      String(secrets),
      secrets > 0 ? "↑ " + secrets + " secret(s) found" : "No secrets found ✓",
      secrets > 0 ? "var(--red)" : "var(--green)",
    );

    // KPI 2 — Exposed Secrets count
    setKpi(
      2,
      String(secrets),
      secrets > 0 ? "Critical severity" : "Clean ✓",
      secrets > 0 ? "var(--red)" : "var(--green)",
    );

    // KPI 3 — MFA Enforced %
    setKpi(
      3,
      mfaPct + "%",
      nonCompliant > 0
        ? nonCompliant + " user(s) non-compliant"
        : "All users compliant ✓",
      mfaPct >= 90 ? "var(--green)" : "var(--red)",
    );

    // KPI 4 — Non-compliant count
    setKpi(
      4,
      String(nonCompliant),
      nonCompliant > 0 ? "MFA / profile gaps" : "No violations ✓",
      nonCompliant > 0 ? "var(--red)" : "var(--green)",
    );

    // KPI 5 — Total users audited
    setKpi(5, String(totalUsers), "Users audited", "#3B82F6");

    // ── Persist scan results globally for CSV/JSON export ─────────────────
    window.latestSlackData = {
      scannedAt:      new Date().toISOString(),
      secrets:        secrets,
      nonCompliant:   nonCompliant,
      totalUsers:     totalUsers,
      mfaPct:         mfaPct,
      detailedAlerts: Array.isArray(data.detailedAlerts) ? data.detailedAlerts : [],
      raw:            data,   // full API payload — used by JSON export
    };


    // ── Terminal log real findings ────────────────────────────────────────
    if (typeof window._slackAddLog === "function") {
      window._slackAddLog(
        "SLACK",
        "Scan complete — " +
          totalUsers +
          " users, " +
          secrets +
          " secret(s) detected.",
        "SYSTEM",
      );

      // ── Secrets / detailedAlerts ──────────────────────────────────────────
      var alerts = Array.isArray(data.detailedAlerts) ? data.detailedAlerts : [];

      if (alerts.length > 0) {
        // Print one CRITICAL entry per identity-aware attack path
        alerts.forEach(function (alertPath) {
          window._slackAddLog(
            "SLACK",
            "Credential pattern matched — " + alertPath,
            "CRITICAL",
            "Initial Access",
            "Credential Theft",
          );
        });
      } else if (secrets > 0) {
        // Older API response without detailedAlerts — fallback to count
        window._slackAddLog(
          "SLACK",
          secrets + " credential pattern(s) matched (AKIA/sk_live) in channel history.",
          "CRITICAL",
          "Initial Access",
          "Credential Theft",
        );
      } else {
        window._slackAddLog(
          "SLACK",
          "No AWS keys or Stripe secrets found in scanned messages.",
          "SYSTEM",
        );
      }


      if (nonCompliant > 0) {
        window._slackAddLog(
          "SLACK",
          nonCompliant + " user(s) missing MFA or profile photo.",
          "WARN",
          "Weak Identity",
          "Account Takeover",
        );
      } else {
        window._slackAddLog(
          "SLACK",
          "All users pass MFA and profile compliance checks.",
          "SYSTEM",
        );
      }
    }
  } catch (err) {
    // ── 4. Graceful degradation ───────────────────────────────────────────
    console.error("[fetchLiveSlackData] API call failed:", err.message);

    var isOffline =
      err.message.includes("Failed to fetch") ||
      err.message.includes("NetworkError") ||
      err.message.includes("Load failed");

    var hint = isOffline ? "Run: vercel dev" : err.message.slice(0, 45);

    setKpi(1, "?", "API unreachable", "var(--gray)");
    setKpi(2, "?", hint, "var(--gray)");
    setKpi(3, "?", "API unavailable", "var(--gray)");
    setKpi(4, "?", "API unavailable", "var(--gray)");
    setKpi(5, "?", "API unavailable", "var(--gray)");

    if (typeof window._slackAddLog === "function") {
      window._slackAddLog(
        "SLACK",
        "⚠ Scan API unreachable: " + err.message,
        "ALERT",
      );
      if (isOffline) {
        window._slackAddLog(
          "SLACK",
          "Start the dev server with: vercel dev",
          "SYSTEM",
        );
        window._slackAddLog(
          "SLACK",
          "Add SLACK_BOT_TOKEN to .env before running.",
          "SYSTEM",
        );
      }
    }
  }
};

console.log(
  "[logic.js v3.1] Slack Telemetry Engine loaded — fetchLiveSlackData ready.",
);
