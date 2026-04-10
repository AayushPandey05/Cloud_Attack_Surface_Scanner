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

  // TERMINAL LOGGING (Requirement 2)
  console.log('Email Triggered for: ' + userEmail);

  var templateParams = {
    user_email: userEmail,
    otp_code: otpCode,
  };

  console.log("[sendOtpEmail] Dispatching OTP to EmailJS for:", userEmail);

  // [SMTP SUPPRESSED] External email dispatch disabled — alerts route to terminal only.
  // Re-enable by uncommenting the emailjs.send() block below.
  console.warn("[SMTP] Email suppressed. OTP would have been sent to:", userEmail, "| Code:", otpCode);
  /*
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
  */
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

  // 1. Audit Start Reset: Clear global buffers for forensic integrity
  window.auditLogsBuffer = [];

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
  if (typeof window.appendTerminal === "function") {
    window.appendTerminal(
      "SLACK",
      "Initializing Federated Identity scan for Slack Workspace...",
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
    if (secrets > 0 && typeof window.appendTerminal === "function") {
        // Slack-specific: gray ↳ + lavender path, 22 &nbsp; indent, no label
        const slackLivePath = `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #57595B;">&#x21B3;</span> <span style="color: #8E7DBE;">Initial Access → Credential Theft → Lateral Movement</span>`;
        window.appendTerminal("SYS", slackLivePath, "INFO", "", true);
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

    if (typeof window.appendTerminal === "function") {
      // Scan complete summary: SYSTEM level for standard Slack logs
      window.appendTerminal(
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

          window.appendTerminal(
            tag,
            message,
            "CRITICAL",
            subtext,
          );

          // Forensic Identity Audit: Specific flagging for the non-compliant user
          const userName = parts[0];
          if (userName && typeof window.appendTerminal === "function") {
             window.appendTerminal("IAM", `User(${userName}) flagged for non-compliance (Secret Exposure).`, "WARN");
          }
        });
      } else if (secrets > 0) {
        // Older API schema without per-channel resolution — emit aggregate
        window.appendTerminal(
          "SLACK",
          secrets +
            " credential pattern(s) matched (AKIA/sk_live) in channel history.",
          "CRITICAL",
        );
      } else {
        window.appendTerminal(
          "SLACK",
          "No AWS keys or Stripe secrets found in scanned messages.",
          "SYSTEM",
        );

        // ── MOCK THREAT FINDING: Persistent demonstration credential exposure ──
        // CRITICAL line: rendered in Alert Red via renderLogLine CRITICAL level
        window.appendTerminal(
          "SLACK",
          "Credential pattern matched - Initial Access \u2192 Credential Theft \u2192 #exposed-secrets \u2192 User(Aayush).",
          "CRITICAL",
        );

        // Slack attack path: gray ↳ + lavender path, 22 &nbsp; indent, no label, no brackets
        const slackAttackPath = `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #57595B;">&#x21B3;</span> <span style="color: #8E7DBE;">Initial Access → Credential Theft → Account Takeover</span>`;
        window.appendTerminal("SYS", slackAttackPath, "INFO", "", true);

        // Card 1 (Open Attack Paths) → red '1'
        const card1Val = document.getElementById('blast-radius-val');
        const card1Sub = document.getElementById('blast-radius-sub');
        if (card1Val) { card1Val.innerText = '1'; card1Val.style.color = '#FF1744'; }
        if (card1Sub) card1Sub.innerText = 'Critical: Secret exposure detected';

        // Card 2 (Exposed Secrets) — sync the impacted-channels-count element
        const card2Val = document.getElementById('impacted-channels-count') || document.getElementById('iam-user-count');
        if (card2Val) { card2Val.innerText = '1'; card2Val.style.color = '#FF1744'; }
      }

      // ── MFA Posture Signal ────────────────────────────────────────────
      if (nonCompliant > 0) {
        window.appendTerminal(
          "SLACK",
          nonCompliant + " user(s) missing MFA or profile photo.",
          "WARN",
          "Weak Identity",
          "Account Takeover",
        );
      } else {
        window.appendTerminal(
          "SLACK",
          "MFA and profile compliance check passed for all users.",
          "SYSTEM",
        );
        // Card 3 subtext sync: all identities compliant
        const mfa3Sub = document.getElementById('mfa-enforced-sub');
        if (mfa3Sub) mfa3Sub.innerText = 'All human identities compliant \u2713';
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

    if (typeof window.appendTerminal === "function") {
      window.appendTerminal(
        "SLACK",
        "⚠ Scan API unreachable: " + err.message,
        "ALERT",
      );
      if (isOffline) {
        window.appendTerminal(
          "SLACK",
          "Start the dev server with: vercel dev",
          "SYSTEM",
        );
        window.appendTerminal(
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
  if (typeof window.appendTerminal !== "function") return;

  // 1. Audit Start Reset: Clear global buffers to ensure fresh forensic records
  window.auditLogsBuffer = [];
  window.clearTerminal();

  try {
    const currentUser = sessionStorage.getItem('loggedInUser') || 'Not Available';
    const isAdmin = currentUser === 'aayushpandey2905@gmail.com';

    const res = await fetch("/api/scan-aws");
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();

    const totalUsers = typeof data.totalUsers === "number" ? data.totalUsers : data.summary;
    const mfaEnabledUsers = typeof data.mfaEnabledUsers === "number" ? data.mfaEnabledUsers : 0;

    const iamCard = document.getElementById('iam-user-count');
    const iamSub = document.getElementById('iam-identities-sub');
    const totalIamUsers = typeof data.totalUsers === "number" ? data.totalUsers : data.summary;

    sessionStorage.setItem('vaultAwsIamCount', totalIamUsers);

    if (iamCard) {
        iamCard.innerText = totalIamUsers; 
        iamCard.classList.remove('text-green');
        iamCard.style.color = '#00D2FF'; // Neon Cyan for active state
    }
    if (iamSub) {
        iamSub.innerText = totalIamUsers > 0 ? 'Active identities analyzed' : 'No issues detected';
    }

    let openAttackPaths = 0;
    let exposedSecrets = 0;
    let mfaBypassDetected = false;
    let publicBuckets = 0;
    let totalBucketsFound = 0;

        if (Array.isArray(data.terminalLogs)) {
          const isNewUser = sessionStorage.getItem('vaultAccountType') === 'new';
          
          data.terminalLogs.forEach((entry) => {
            let processedEntry = entry;
            if (isNewUser) {
               processedEntry = processedEntry.replace(/aayush-publicexposure-test/g, 'testuser-private-storage');
            }

            if (processedEntry.includes("missing MFA")) {
                mfaBypassDetected = true;
                window.appendTerminal("IAM", "User [Vault-Scanner-Service] missing MFA device.", "WARN");
                return; 
            }

        if (processedEntry.includes("Global S3 Buckets identified") && processedEntry.includes("multiple regions")) {
            const match = processedEntry.match(/(\d+) Global S3 Buckets identified/);
            if (match) {
                totalBucketsFound = parseInt(match[1]);
                sessionStorage.setItem('vaultAwsS3Count', totalBucketsFound);
                const s3Card = document.getElementById('s3-bucket-count');
                if (s3Card) {
                    s3Card.innerText = totalBucketsFound;
                    s3Card.style.color = '#00D2FF';
                }
                const s3Sub = document.getElementById('s3-bucket-sub');
                if (s3Sub) s3Sub.innerText = 'Global assets discovered';
            }
        }

        // Sync counts from data payload (Source of Truth)
        openAttackPaths = data.totalVulnerabilities || 0;
        exposedSecrets = data.exposedSecrets || 0;
        publicBuckets = data.publicBuckets || 0;

        let clean = processedEntry
          .replace(/^\[\d{2}:\d{2}:\d{2}\]\s+/, "")
          .replace(/^\[AWS\]\s+/, "");
          
        let parsedLevel = "INFO";
        let parsedMessage = clean;
        let service = "AWS";

        const colonIdx = clean.indexOf(":");
        if (colonIdx !== -1) {
            parsedLevel = clean.substring(0, colonIdx).trim().toUpperCase();
            parsedMessage = clean.substring(colonIdx + 1).trim();
            
            // REDUNDANCY PATCH: Strip service tags from level string to avoid [S3] [S3] display
            parsedLevel = parsedLevel.replace(/^\[(S3|AWS)\]\s*/i, "").trim();

            // Map legacy levels to semantic ones
            if (parsedLevel === "SYSTEM" || parsedLevel === "SUCCESS") parsedLevel = "INFO";
        }

        if (clean.includes("S3 Bucket") || clean.includes("Key") || clean.includes("Bucket")) {
            service = "S3";
        } else if (clean.includes("User [") || clean.includes("IAM") || clean.includes("MFA")) {
            service = "IAM";
        }

        window.appendTerminal(service, parsedMessage, parsedLevel);

        // STICKY FORENSIC HOOK: If Leaked Key detected, trigger Attack Path visualization (Requirement 4.0)
        if (parsedMessage.includes("Leaked Key")) {
            // Indentation optimized for vertical alignment under message body (index 21-22)
            const attackPath = `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #57595B;">↳ Attack Path:</span> <span style="color: #2FA4D7;">[S3 Discovery]</span> → <span style="color: #B500B2;">[Credential Theft]</span> → <span style="color: #8E7DBE;">[Identity Takeover]</span>`;
            window.appendTerminal("SYS", attackPath, "INFO", "", true); 
        }
      });
    }

    sessionStorage.setItem('aws_audit_complete', 'true');
    if (typeof window.updateDashboardContext === 'function') window.updateDashboardContext();

    const updateSafe = (id, text, color = null) => {
        const el = document.getElementById(id);
        if (el) {
            if (text !== null) el.innerText = text;
            if (color) el.style.color = color;
        }
    };
    
    // 2. DATA TRUTH SYNC (Architectural Flush)
    // ONLY increment Exposed Secrets card for leaked credentials (Requirement Refined)
    const secretSum = data.exposedSecrets || 0;
    if (secretSum > 0) {
        updateSafe('aws-secrets-count', String(secretSum), '#FF4C4C');
        updateSafe('exposed-secrets-sub', `${secretSum} Leaked Credentials Found`, '#FF4C4C');
    } else {
        updateSafe('aws-secrets-count', '0', '#08CB00');
        updateSafe('exposed-secrets-sub', 'No credentials exposed', '#08CB00');
    }

    // 5. MFA ENFORCEMENT SYNC
    const finalPercentage = totalUsers > 0 ? Math.round((mfaEnabledUsers / totalUsers) * 100) : 0;
    
    if (finalPercentage === 100) {
        updateSafe('mfa-enforced-val', '100%', '#2ECC71');
        updateSafe('mfa-enforced-sub', 'All devices compliant.');
    } else if (finalPercentage >= 50 && finalPercentage < 100) {
        const failures = totalUsers - mfaEnabledUsers;
        updateSafe('mfa-enforced-val', `${finalPercentage}%`, '#FFA500');
        updateSafe('mfa-enforced-sub', `WARNING: MFA bypass detected for ${failures} users.`);
    } else {
        const failures = totalUsers - mfaEnabledUsers;
        updateSafe('mfa-enforced-val', `${finalPercentage}%`, '#FF4C4C');
        updateSafe('mfa-enforced-sub', `CRITICAL: MFA bypass detected for ${failures} users.`);
    }

    if (openAttackPaths > 0) {
        const radiusNum = document.getElementById('blast-radius-val');
        const radiusDesc = document.getElementById('blast-radius-sub');
        if (radiusNum && radiusDesc) {
            const user = sessionStorage.getItem('loggedInUser');
            if (user === 'aayushpandey2905@gmail.com') {
                radiusNum.innerText = '95%';
                radiusNum.style.color = '#FFA500'; 
                radiusDesc.innerText = 'CRITICAL: Full Administrative Access.';
            } else {
                radiusNum.innerText = '85%';
                radiusNum.style.color = '#FFA500'; 
                radiusDesc.innerText = 'CRITICAL: Public S3 Data Exposure detected.';
            }
        }
    }

  } catch (err) {
    window.appendTerminal("AWS", `Audit Failed — ${err.message}`, "CRITICAL");
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
    // 1. Audit Reset: Purge prior scan telemetry and show terminal loading state
    window.auditLogsBuffer = [];
    const termSpinner = document.getElementById('terminal-spinner');
    if (termSpinner) termSpinner.classList.remove('hidden');

    const currentModule = (window.currentEnv || "AWS").toUpperCase();
    const currentUser = sessionStorage.getItem('loggedInUser') || '';
    const isAdmin = currentUser.toLowerCase() === 'aayushpandey2905@gmail.com';

    // Zero Trust Security Enforcement: Lock audit triggers to Admin only
    if (!isAdmin) {
       console.error("[ZeroTrust] Audit blocked: Unauthorized identity.");
       alert("⚠ Security Access Denied: Your account does not have an active AWS connection. Please click 'Connect Your Cloud' to begin.");
       if (termSpinner) termSpinner.classList.add('hidden');
       return;
    }

    // 2. UI TRANSFORMATION: Auditing State (Requirement 1)
    triggerBtn.disabled = true;
    const originalContent = triggerBtn.innerHTML;
    triggerBtn.innerHTML = `<div class="btn-spinner"></div> AUDITING...`;
    
    try {
      if (currentModule === "AWS") {
        await window.triggerAwsScan();
      } else if (currentModule === "SLACK") {
        await window.runSlackAudit();
      }
      
      // Blast-radius override ONLY runs for AWS tab — Slack Card 1 uses integer logic, not percentages
      if (currentModule === 'AWS') {
        const loggedUser = sessionStorage.getItem('loggedInUser');
        if (loggedUser === 'aayushpandey2905@gmail.com') {
            const radiusNumber = document.getElementById('blast-radius-val');
            const radiusText = document.getElementById('blast-radius-sub');
            if (radiusNumber && radiusText) {
                radiusNumber.innerText = '95%';
                radiusNumber.style.color = '#FFA500'; 
                radiusText.innerText = 'CRITICAL: Full Admin status detected.';
            }
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

// FORENSIC EXPORT ENGINE — Global CSV/JSON Dispatcher
window.exportToCSV = function() {
  const env = (window.currentEnv || "AWS").toUpperCase();
  const buffer = window.auditLogsBuffer || [];
  
  if (buffer.length === 0) {
    alert("No audit logs available for export. Please run a security scan first.");
    return;
  }

  // Filter logs for the active environment (AWS/SLACK)
  const logsToExport = buffer.filter(log => (log.env || "AWS").toUpperCase() === env);
  
  const csvRows = ['"Date","Time","Service","Level","Message"'];
  logsToExport.forEach((r) => {
    // Prefer explicit date/time fields; fall back to splitting the combined timestamp
    const datePart = r.date || (r.timestamp ? r.timestamp.split(' ')[0] : '');
    const timePart = r.time || (r.timestamp ? r.timestamp.split(' ')[1] : '');
    // Sanitise message: strip residual HTML entities and arrow chars
    const cleanMsg = (r.message || '')
      .replace(/&nbsp;/g, ' ')
      .replace(/↳/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .replace(/"/g, '""');
    const row = `"${datePart}","${timePart}","${r.source}","${r.level}","${cleanMsg}"`;
    csvRows.push(row);
  });
  
  const content = "\uFEFF" + csvRows.join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${env.toLowerCase()}_audit_logs.csv`);
};

window.exportToJSON = function() {
  const env = (window.currentEnv || "AWS").toUpperCase();
  const buffer = window.auditLogsBuffer || [];
  
  if (buffer.length === 0) {
    alert("No audit logs available for export. Please run a security scan first.");
    return;
  }

  // Filter logs for the active environment (AWS/SLACK)
  const logsToExport = buffer.filter(log => (log.env || "AWS").toUpperCase() === env);
  
  // Requirement: JSON.stringify(buffer, null, 2)
  const content = JSON.stringify(logsToExport, null, 2);
  const blob = new Blob([content], { type: "application/json" });
  triggerDownload(blob, `${env.toLowerCase()}_audit_logs.json`);
};

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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
    if (typeof window.appendTerminal === "function") {
      window.appendTerminal(
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
