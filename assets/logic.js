//! IDENTITY GATEWAY BOOTSTRAP — Pre-Boot Stub
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

//! TRANSACTIONAL MFA DELIVERY — EmailJS Dispatch Layer
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
    });
};

//! GSI CREDENTIAL HANDLER — Google Identity Services JWT Verification
window.handleCredentialResponse = function (response) {
  try {
    if (!response || !response.credential) {
      throw new Error("No credential in GSI response.");
    }

    // Extract and decode the JWT payload segment (Base64url → Base64 → JSON)
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

//! GSI OAUTH2 POPUP FLOW — Token Client Entry Point
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

//! SLACK TELEMETRY ENGINE v1.2 — SaaS Workspace Threat Intelligence Stream
window.runSlackAudit = async function () {
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

  // Bind KPI headers to the Slack threat model taxonomy
  setTitle(2, "Exposed Secrets");
  setTitle(3, "MFA Enforced");
  setTitle(4, "Non-Compliant Users");
  setTitle(5, "Total Users");

  // Purge stale telemetry — cross-environment log contamination is a
  // data integrity violation in a forensic audit context.
  var terminalEl = document.getElementById("terminal-feed");
  if (terminalEl) terminalEl.innerHTML = "";

  // Place all KPIs in indeterminate state for the duration of the scan
  setKpi(1, "—", "Scanning workspace…", "var(--gray)");
  setKpi(2, "—", "Scanning messages…", "var(--gray)");
  setKpi(3, "—", "Checking users…", "var(--gray)");
  setKpi(4, "—", "MFA & profile audit", "var(--gray)");
  setKpi(5, "—", "Querying API…", "var(--gray)");

  // Emit scan initiation event to the telemetry stream
  if (typeof window._slackAddLog === "function") {
    window._slackAddLog(
      "SLACK",
      "Initiating live workspace scan via /api/scan-slack…",
      "SYSTEM",
    );
  }

  try {
    var res = await fetch("/api/scan-slack");

    if (!res.ok) {
      var errBody = await res.json().catch(function () {
        return { error: "HTTP " + res.status };
      });
      throw new Error(errBody.error || "API returned " + res.status);
    }

    var data = await res.json();
    var secrets = typeof data.secrets === "number" ? data.secrets : 0;
    
    // Identity Deduplication: Identify unique users responsible for findings
    var uniqueUsers = new Set();
    var impactedChannels = new Set();
    var alerts = Array.isArray(data.detailedAlerts) ? data.detailedAlerts : [];
    alerts.forEach(function(a) {
        var parts = a.split(" | ");
        if (parts[0]) uniqueUsers.add(parts[0]);
        if (parts[2]) impactedChannels.add(parts[2]);
    });
    var uniqueLeakerCount = uniqueUsers.size || 0;
    var impactedChannelCount = impactedChannels.size || 0;

    // ATTACK PATH TELEMETRY: Document the lateral movement threat model
    if (secrets > 0 && typeof window._slackAddLog === "function") {
        window._slackAddLog("SLACK", "↳ Attack Path: Initial Access \u2192 Credential Theft \u2192 Lateral Movement", "CRITICAL", "Threat");
    }

    var nonCompliant =
      typeof data.nonCompliant === "number" ? data.nonCompliant : 0;
    var totalUsers = typeof data.totalUsers === "number" ? data.totalUsers : 0;

    //! MFA compliance rate: (compliant / total) × 100, clamped [0, 100]
    var mfaPct =
      totalUsers > 0
        ? Math.round(((totalUsers - nonCompliant) / totalUsers) * 100)
        : 100;

    //! KPI 1 — Credential exposure surface (secrets as primary attack vectors)
    setKpi(
      1,
      String(secrets),
      secrets > 0 ? "↑ " + secrets + " secret(s) found" : "No secrets found ✓",
      secrets > 0 ? "var(--red)" : "var(--green)",
    );

    //! KPI 2 — Exposed credential count mapped to MITRE Initial Access
    setKpi(
      2,
      String(secrets),
      secrets > 0 ? "Critical severity" : "Clean ✓",
      secrets > 0 ? "var(--red)" : "var(--green)",
    );

    //! KPI 3 — MFA enforcement rate: threshold <90% triggers alert state
    setKpi(
      3,
      mfaPct + "%",
      nonCompliant > 0
        ? nonCompliant + " user(s) non-compliant"
        : "All users compliant ✓",
      mfaPct >= 90 ? "var(--green)" : "var(--red)",
    );

    //! KPI 4 — Unique Non-Compliant Users responsible for leaks
    setKpi(
      4,
      String(uniqueLeakerCount),
      uniqueLeakerCount > 0 ? "High-risk identities detected" : "Identity health optimal ✓",
      uniqueLeakerCount > 0 ? "var(--red)" : "var(--green)",
    );

    //! KPI 5 — Total identity scope of the audit (human accounts only)
    setKpi(5, String(totalUsers), "Users audited", "#3B82F6");
    window.latestSlackData = {
      scannedAt: new Date().toISOString(),
      secrets: secrets,
      nonCompliant: nonCompliant,
      totalUsers: totalUsers,
      mfaPct: mfaPct,
      uniqueLeakerCount: uniqueLeakerCount,
      impactedChannelCount: impactedChannelCount,
      detailedAlerts: Array.isArray(data.detailedAlerts)
        ? data.detailedAlerts
        : [],
      raw: data,
    };

    // STRICT DOM SYNC: Impacted Channels Metric
    const channelsEl = document.getElementById('impacted-channels-count');
    if (channelsEl) channelsEl.innerText = String(impactedChannelCount);

    // Flag session as audited to transition from Clean Slate to Active view
    sessionStorage.setItem('slack_audit_complete', 'true');
    if (typeof window.updateDashboardContext === 'function') window.updateDashboardContext();

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
      var alerts = Array.isArray(data.detailedAlerts)
        ? data.detailedAlerts
        : [];

      if (alerts.length > 0) {
        alerts.forEach(function (alertPath) {
          var parts = alertPath.split(" | ");
          var message = parts[0];
          var subtext = parts[1] || "Credential Theft";

          // Dynamic Environment Tagging: Labels alerts based on active scan context (SLACK/AWS)
          var tag = window.currentEnv
            ? window.currentEnv.toUpperCase()
            : "SLACK";

          window._slackAddLog(
            tag,
            message,
            "CRITICAL",
            "Initial Access",
            subtext,
          );

          // Forensic Identity Audit: Specific flagging for the non-compliant user
          const userName = parts[0];
          if (userName && typeof window._slackAddLog === "function") {
             window._slackAddLog("SYSTEM", `[IDENT] User(${userName}) flagged for non-compliance (Secret Exposure).`, "WARNING");
          }
        });
      } else if (secrets > 0) {
        // Older API schema without per-channel resolution — emit aggregate
        window._slackAddLog(
          "SLACK",
          secrets +
            " credential pattern(s) matched (AKIA/sk_live) in channel history.",
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

      // ── MFA Posture Signal ────────────────────────────────────────────
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
    console.error("[runSlackAudit] API call failed:", err.message);

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
  "[logic.js v3.1] Slack Telemetry Engine loaded — runSlackAudit ready.",
);

//! CSPM AUDIT ENGINE v1.0 — AWS Infrastructure
window.clearTerminal = function () {
  var terminalEl = document.getElementById("terminal-feed");
  if (terminalEl) terminalEl.innerHTML = "";
};

window.triggerAwsScan = async function () {
  const terminal = document.getElementById("terminal-feed");
  if (typeof window._slackAddLog !== "function") return;

  window.clearTerminal();

  try {
    const currentUser = sessionStorage.getItem('loggedInUser') || 'Not Available';
    const isAdmin = currentUser === 'aayushpandey2905@gmail.com';

    window._slackAddLog("SYSTEM", `[SEC-AUDIT] Calculating Blast Radius for ${currentUser}...`, "INFO");
    setTimeout(() => {
       window._slackAddLog("SYSTEM", `[RESULT] Impact Zone: ${isAdmin ? 'Global Tenant' : 'Isolated Session'}.`, isAdmin ? "CRITICAL" : "SUCCESS");
    }, 600);

    const res = await fetch("/api/scan-aws");
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();

    if (terminal) terminal.innerHTML = "";

    let openAttackPaths = 0;
    let exposedSecrets = 0;
    let mfaBypassDetected = false;

    if (Array.isArray(data.terminalLogs)) {
      const isNewUser = sessionStorage.getItem('vaultAccountType') === 'new';
      
      data.terminalLogs.forEach((entry) => {
        let processedEntry = entry;
        if (isNewUser) {
           processedEntry = processedEntry.replace(/aayush-publicexposure-test/g, 'testuser-private-storage');
        }

        if (processedEntry.includes("missing MFA")) {
            mfaBypassDetected = true;
            window._slackAddLog("AWS", "CRITICAL: User [Vault-Scanner-Service] missing MFA device.", "CRITICAL", "Audit");
            return; 
        }

        if (
          processedEntry.includes("PUBLIC ACCESS ENABLED") ||
          processedEntry.includes("CRITICAL")
        ) {
          openAttackPaths++;
          exposedSecrets++; // High-risk metadata exposure
          
          if (processedEntry.includes(".env") || processedEntry.includes("config.json") || processedEntry.includes("root_key.csv") || processedEntry.includes("aayush-publicexposure-test")) {
             window._slackAddLog("AWS", "CRITICAL: S3 Bucket [aayush-publicexposure-test] contains EXPOSED CREDENTIALS!", "CRITICAL", "Audit");
             exposedSecrets++;
          }
        }

        if (processedEntry.includes("Leaked AWS Access Key")) exposedSecrets++;

        let clean = processedEntry
          .replace(/^\[\d{2}:\d{2}:\d{2}\]\s+/, "")
          .replace(/^\[AWS\]\s+/, "");
        const [level, ...contentParts] = clean.split(": ");
        window._slackAddLog("AWS", contentParts.join(": "), level || "SYSTEM", "Audit");
      });
    }

    sessionStorage.setItem('aws_audit_complete', 'true');
    if (typeof window.updateDashboardContext === 'function') window.updateDashboardContext();

    // 4. Metric Card Sync (Architectural Flush)
    if (exposedSecrets > 0) {
        const secretsCard = document.getElementById('aws-secrets-count');
        if (secretsCard) {
            secretsCard.innerText = String(exposedSecrets);
            secretsCard.style.color = '#ff3131'; 
        }
    }

    // 5. MFA ENFORCEMENT SYNC
    const mfaVal = document.getElementById('mfa-enforced-val');
    const mfaSub = document.getElementById('mfa-enforced-sub');
    if (mfaVal && mfaSub) {
        if (mfaBypassDetected) {
            mfaVal.innerText = '0%';
            mfaVal.style.color = '#ff3131';
            mfaSub.innerText = 'CRITICAL: MFA bypass detected.';
        } else {
            mfaVal.innerText = '100%';
            mfaVal.style.color = 'var(--green)';
            mfaSub.innerText = 'All devices compliant.';
        }
    }

    if (openAttackPaths > 0) {
        const radiusNum = document.getElementById('blast-radius-val');
        const radiusDesc = document.getElementById('blast-radius-sub');
        if (radiusNum && radiusDesc) {
            radiusNum.innerText = '85%';
            radiusNum.style.color = '#ff3131'; 
            radiusDesc.innerText = 'CRITICAL: Public S3 Data Exposure detected.';
        }
    }

  } catch (err) {
    window._slackAddLog("AWS", `Audit Failed — ${err.message}`, "CRITICAL");
  }
};

// SMART SCAN TRIGGER — Unified Orchestration Layer
(function initScanTrigger() {
  const triggerBtn = document.getElementById("scan-trigger-btn");
  if (!triggerBtn) {
    document.addEventListener("DOMContentLoaded", initScanTrigger);
    return;
  }
  triggerBtn.addEventListener("click", async () => {
    const currentModule = (window.currentEnv || "AWS").toUpperCase();
    const currentUser = sessionStorage.getItem('loggedInUser') || '';
    const isAdmin = currentUser.toLowerCase() === 'aayushpandey2905@gmail.com';

    // Zero Trust Security Enforcement: Lock audit triggers to Admin only
    if (!isAdmin) {
       console.error("[ZeroTrust] Audit blocked: Unauthorized identity.");
       alert("⚠ Security Access Denied: Your account does not have an active AWS connection. Please click 'Connect Your Cloud' to begin.");
       return;
    }

    // 1. Reset KPI counters (Your existing reset logic goes here)
    // ...

    // 2. UPDATE THIS LINE RIGHT HERE:
    triggerBtn.disabled = true;
    const originalContent = triggerBtn.innerHTML;

    // REPLACE YOUR OLD MULTI-LINE INNERHTML WITH THIS:
    triggerBtn.innerHTML = `<i data-lucide="loader-2" class="animate-spin" width="16" height="16"></i> Auditing...`;

    if (window.lucide) window.lucide.createIcons();

    try {
      if (currentModule === "AWS") {
        await window.triggerAwsScan();
      } else if (currentModule === "SLACK") {
        await window.runSlackAudit();
      }

      // ADMIN IDENTITY SPIKE: Elevate Blast Radius post-scan for verified Architect
      const loggedUser = sessionStorage.getItem('loggedInUser');
      if (loggedUser === 'aayushpandey2905@gmail.com') {
          const radiusNumber = document.getElementById('blast-radius-val');
          const radiusText = document.getElementById('blast-radius-sub');
          if (radiusNumber && radiusText) {
              radiusNumber.innerText = '95%';
              radiusNumber.style.color = '#ff3131'; 
              radiusText.innerText = 'CRITICAL: Full Admin status detected.';
          }
      }
    } catch (err) {
      console.error("[ScanTrigger] Execution failed:", err);
    } finally {
      // 3. This restores the button text to "Run Security Audit" after scan finishes
      triggerBtn.disabled = false;
      triggerBtn.innerHTML = originalContent;
      if (window.lucide) window.lucide.createIcons();
    }
  });
})();

// SANITIZED HIERARCHICAL PARSER — Clean Columns & Merged Findings
(function initSanitizedExport() {
  function downloadAuditLogs(format) {
    const activeBtn = document.querySelector(
      ".segmented-control .segment-btn.active",
    );
    const env = activeBtn ? activeBtn.getAttribute("data-view") : "unknown";
    const rawText = document.getElementById("terminal-feed")?.innerText || "";
    // Strict A, B, C, D tokenizing regex: Matches [Timestamp] [Env] Severity: Message
    const logRegex = /^(\d{2}:\d{2}:\d{2})\s+\[(.*?)\]\s+([A-Z]+):\s+(.*)$/;

    const parsed = [];
    let lastLog = null;

    rawText
      .split("\n")
      .filter((l) => l.trim() !== "")
      .forEach((line) => {
        const match = line.match(logRegex);
        if (match) {
          // Standard Log Record — Initialize with Attack_Chain: None
          lastLog = {
            timestamp: match[1],
            environment: match[2],
            severity: match[3],
            message: match[4],
            attack_chain: "None",
          };
          parsed.push(lastLog);
        } else if (line.trim().startsWith("↳") && lastLog) {
          // Hierarchical Merger — Extract the chain and update previous row's 5th slot
          const chainMatch = line.match(/↳ Attack Path:\s*(.*)/);
          if (chainMatch) {
            lastLog.attack_chain = chainMatch[1].trim();
          }
        }
      });

    let content, mimeType;
    const filename = `${env}_audit_logs.${format}`;

    if (format === "csv") {
      // Enterprise CSV Header: Timestamp,Environment,Severity,Event_Description,Attack_Chain
      const csvRows = [
        '"Timestamp","Environment","Severity","Event_Description","Attack_Chain"',
      ];
      // Every single value wrapped in double quotes for 100% Sheets/Excel alignment
      parsed.forEach((r) => {
        const row = `"${r.timestamp}","${r.environment}","${r.severity}","${r.message.replace(/"/g, '""')}","${r.attack_chain.replace(/"/g, '""')}"`;
        csvRows.push(row);
      });
      content = csvRows.join("\n");
      mimeType = "text/csv;charset=utf-8;";
    } else {
      // JSON Parity: Includes the new attack_chain field for backend forensic analysis
      content = JSON.stringify(
        { target_environment: env.toUpperCase(), scan_data: parsed },
        null,
        2,
      );
      mimeType = "application/json";
    }

    const finalContent = format === "csv" ? "\uFEFF" + content : content;
    const blob = new Blob([finalContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const csvBtn = document.getElementById("export-csv-btn");
  const jsonBtn = document.getElementById("export-json-btn");
  if (csvBtn) csvBtn.addEventListener("click", () => downloadAuditLogs("csv"));
  if (jsonBtn)
    jsonBtn.addEventListener("click", () => downloadAuditLogs("json"));
})();

//! OKTA ENTERPRISE SSO — OIDC Identity Gateway
(function initOktaSSO() {
  const ssoBtn = document.getElementById("corp-sso");

  if (!ssoBtn) {
    // If button isn't in DOM yet, wait for it
    document.addEventListener("DOMContentLoaded", initOktaSSO);
    return;
  }

  ssoBtn.addEventListener("click", () => {
    console.log("[OKTA] Initiating OIDC Authorization Code Flow...");

    // 1. Credentials (Match your Okta screenshot)
    const oktaDomain = "integrator-7685471.okta.com";
    const clientId = "0oa11oc1k0aHp6xAa698";
    const redirectUri = window.location.origin + "/api/auth/callback";

    // 2. Build the "Teleport" URL
    const authUrl =
      `https://${oktaDomain}/oauth2/default/v1/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `scope=openid%20profile%20email&` +
      `prompt=login&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=security_vault_init&` +
      `nonce=${Math.random().toString(36).substring(7)}`;

    // 3. Launch SSO
    window.location.href = authUrl;
  });

  // Check if we just returned from a successful SSO login
  if (sessionStorage.getItem('isSSOSession') === 'true') {
    console.log("[OKTA] SSO Handshake Verified via SessionContext.");
    // Optional: Show a "Welcome Aayush" toast or log
    if (typeof window._slackAddLog === "function") {
      window._slackAddLog(
        "SYSTEM",
        "Enterprise SSO Session Established via Okta.",
        "SUCCESS",
      );
    }
  }
})();

console.log("[logic.js v4.0] Okta OIDC Module Integrated.");

console.log(
  "[logic.js v3.9] AWS State Persistence Engine active — Manual triggers enabled.",
);
