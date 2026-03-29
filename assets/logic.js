// logic.js — Okta 2026 Enterprise Edition
// Handles: Login → Connecting → MFA (Enrollment/Verification) → Dashboard
// Preserves: localStorage enrollment state, TOTP verification via otplib

document.addEventListener("DOMContentLoaded", () => {

  // --------------- DOM Elements ---------------
  const viewAccessDenied  = document.getElementById("view-access-denied");
  const viewConnecting    = document.getElementById("view-connecting");
  const viewMfa           = document.getElementById("view-mfa");
  const viewDecrypting    = document.getElementById("view-decrypting");
  const viewDashboard     = document.getElementById("view-dashboard");

  // Auth form elements
  const authSlider        = document.getElementById("auth-slider");
  const tabLogin          = document.getElementById("tab-login");
  const tabSignup         = document.getElementById("tab-signup");
  const loginForm         = document.getElementById("login-form");
  const signupForm        = document.getElementById("signup-form");
  const googleLoginBtn    = document.getElementById("google-login");

  // FAQ
  const btnNeedHelp       = document.getElementById("btn-need-help");
  const btnCloseFaq       = document.getElementById("btn-close-faq");
  const faqOverlay        = document.getElementById("faq-overlay");

  // Dashboard
  const dashboardDynamicContent = document.getElementById("dashboard-dynamic-content");
  const terminalFeed      = document.getElementById("terminal-feed");
  const kpiDeck           = document.getElementById("kpi-deck");
  const terminalBadges    = document.getElementById("terminal-badges");
  const btnCloud          = document.getElementById("btn-cloud-view");
  const btnSlack          = document.getElementById("btn-slack-view");

  // Profile
  const profileMenuToggle = document.getElementById("profile-menu-toggle");
  const profileDropdown   = document.getElementById("profile-dropdown");
  const btnLogout         = document.getElementById("btn-logout");
  const profileAvatar     = document.getElementById("profile-avatar-fallback");
  const profileName       = document.getElementById("profile-name");
  const profileDropdownName = document.getElementById("profile-dropdown-name");

  // MFA elements
  const mfaForm            = document.getElementById("mfa-form");
  const totpDigits         = document.querySelectorAll(".totp-digit");
  const mfaCardWrapper     = document.getElementById("mfa-card-wrapper");
  const qrcodeContainer    = document.getElementById("qrcode-container");
  const mfaEnrollSection   = document.getElementById("mfa-enrollment-section");
  const mfaVerifySection   = document.getElementById("mfa-verify-section");
  const mfaTitle           = document.getElementById("mfa-title");
  const mfaSubtitle        = document.getElementById("mfa-subtitle");
  const mfaIconSymbol      = document.getElementById("mfa-icon-symbol");
  const btnVerifyLabel     = document.getElementById("btn-verify-label");

  // Toast
  const toastContainer = document.getElementById("toast-container");
  const toastMessage   = toastContainer.querySelector(".toast-message");
  const toastIcon      = toastContainer.querySelector(".toast-icon");

  // --------------- Constants ---------------
  const MFA_SECRET      = "JBSWY3DPEHPK3PXP";
  const LS_ENROLLED_KEY = "user_enrolled";

  let typeWriterTimeout, feedActive = false, isLoggedIn = false, qrGenerated = false;

  // --------------- Enrollment State Helpers ---------------
  const isFirstTimeUser = () => localStorage.getItem(LS_ENROLLED_KEY) !== "true";
  const markEnrolled    = () => localStorage.setItem(LS_ENROLLED_KEY, "true");

  function applyMFAMode() {
    if (isFirstTimeUser()) {
      // --- ENROLLMENT MODE ---
      mfaTitle.textContent    = "Set Up Authenticator";
      mfaSubtitle.textContent = "Scan the QR code to link your Authenticator app, then enter the 6-digit code.";
      mfaIconSymbol.textContent = "qr_code_scanner";
      btnVerifyLabel.textContent = "Complete Enrollment & Enter Vault";
      mfaEnrollSection.classList.remove("collapsed");
      mfaVerifySection.classList.remove("centered");
      setupQRCode();
    } else {
      // --- VERIFICATION MODE ---
      mfaTitle.textContent    = "Security Verification";
      mfaSubtitle.textContent = "Please enter the 6-digit code from your Authenticator app.";
      mfaIconSymbol.textContent = "pin";
      btnVerifyLabel.textContent = "Verify & Enter Vault";
      mfaEnrollSection.classList.add("collapsed");
      mfaVerifySection.classList.add("centered");
    }
    // Reset digit fields and focus
    totpDigits.forEach((d) => { d.value = ""; d.classList.remove("error-border"); });
    mfaCardWrapper.classList.remove("error-shake");
    setTimeout(() => { if (totpDigits[0]) totpDigits[0].focus(); }, 350);
  }

  // --------------- Utilities ---------------
  function switchView(hideView, showView, onShowCallback) {
    if (!hideView || !showView) return;
    hideView.classList.add("fade-out");
    setTimeout(() => {
      hideView.classList.remove("active", "fade-out");
      hideView.classList.add("hidden");
      showView.classList.remove("hidden");
      showView.classList.add("active");
      if (onShowCallback) onShowCallback();
    }, 270);
  }

  function showToast(message, isError = false) {
    toastMessage.textContent = message;
    toastContainer.classList.remove("hidden", "toast-success", "toast-error");
    toastIcon.textContent = isError ? "cancel" : "check_circle";
    toastContainer.classList.add(isError ? "toast-error" : "toast-success");
    toastContainer.classList.add("show");
    setTimeout(() => { toastContainer.classList.remove("show"); }, 3600);
  }

  function showDashboardChrome(name) {
    profileMenuToggle.classList.remove("hidden");
    profileAvatar.textContent = name.charAt(0).toUpperCase();
    profileName.textContent   = name;
    profileDropdownName.textContent = name;
  }

  function hideDashboardChrome() {
    profileMenuToggle.classList.add("hidden");
    profileMenuToggle.classList.remove("open");
    profileDropdown.classList.add("hidden");
  }

  // --------------- Auth Tab Switcher (Sign In / Create Account) ---------------
  let currentAuthPanel = 0;

  function switchAuthTab(panelIndex) {
    currentAuthPanel = panelIndex;
    authSlider.style.transform = `translateX(${panelIndex === 0 ? "0" : "-50%"})`;
    tabLogin.classList.toggle("active",  panelIndex === 0);
    tabSignup.classList.toggle("active", panelIndex === 1);
  }

  if (tabLogin)  tabLogin.addEventListener("click",  () => switchAuthTab(0));
  if (tabSignup) tabSignup.addEventListener("click", () => switchAuthTab(1));

  // --------------- Login Flow ---------------
  function doLoginTransition(name = "Engineer") {
    // Stage name for after MFA
    profileName.textContent = name;
    profileAvatar.textContent = name.charAt(0).toUpperCase();
    profileDropdownName.textContent = name;

    switchView(viewAccessDenied, viewConnecting, () => {
      setTimeout(() => {
        switchView(viewConnecting, viewMfa, () => {
          applyMFAMode();
        });
      }, 2200); // loading bar is 2s
    });
  }

  if (loginForm)     loginForm.addEventListener("submit",  (e) => { e.preventDefault(); doLoginTransition("Engineer"); });
  if (googleLoginBtn) googleLoginBtn.addEventListener("click", (e) => { e.preventDefault(); doLoginTransition("Engineer"); });

  if (signupForm) signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const n = document.getElementById("signup-name").value.trim() || "Aayush Pandey";
    doLoginTransition(n);
  });

  // --------------- FAQ Modal ---------------
  if (btnNeedHelp) btnNeedHelp.addEventListener("click", () => {
    faqOverlay.classList.remove("hidden");
    setTimeout(() => faqOverlay.classList.add("active"), 10);
  });
  if (btnCloseFaq) btnCloseFaq.addEventListener("click", closeFaq);
  if (faqOverlay)  faqOverlay.addEventListener("click",  (e) => { if (e.target === faqOverlay) closeFaq(); });
  function closeFaq() {
    faqOverlay.classList.remove("active");
    setTimeout(() => faqOverlay.classList.add("hidden"), 260);
  }

  // --------------- QR Code ---------------
  function setupQRCode() {
    if (!qrGenerated && typeof QRCode !== "undefined") {
      new QRCode(qrcodeContainer, {
        text: `otpauth://totp/Keygraph:compliance?secret=${MFA_SECRET}&issuer=Keygraph`,
        width: 132, height: 132,
        colorDark: "#000000", colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H,
      });
      qrGenerated = true;
    }
  }

  // --------------- TOTP Digit UX ---------------
  totpDigits.forEach((digit, i) => {
    digit.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, "");
      mfaCardWrapper.classList.remove("error-shake");
      totpDigits.forEach((d) => d.classList.remove("error-border"));
      if (e.target.value.length === 1 && i < totpDigits.length - 1) totpDigits[i + 1].focus();
    });
    digit.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && digit.value === "" && i > 0) {
        totpDigits[i - 1].value = "";
        totpDigits[i - 1].focus();
      }
    });
    digit.addEventListener("paste", (e) => {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "").slice(0, 6);
      paste.split("").forEach((ch, j) => { if (totpDigits[j]) totpDigits[j].value = ch; });
      const next = [...totpDigits].find((d) => !d.value);
      (next || totpDigits[totpDigits.length - 1]).focus();
    });
  });

  // --------------- MFA Submit ---------------
  if (mfaForm) {
    mfaForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const code = Array.from(totpDigits).map((d) => d.value).join("");
      if (code.length !== 6) return showErrorState();

      let valid = false;
      try { valid = window.otplib.authenticator.check(code, MFA_SECRET); }
      catch (err) { console.error("TOTP error:", err); }

      if (valid) {
        const firstTime = isFirstTimeUser();
        if (firstTime) {
          markEnrolled();
          showToast("Enrollment complete — MFA linked to your account ✓");
        } else {
          showToast("Identity verified — Access granted ✓");
        }
        const name = profileName.textContent || "Engineer";
        switchView(viewMfa, viewDecrypting, () => {
          setTimeout(() => {
            isLoggedIn = true;
            switchView(viewDecrypting, viewDashboard, () => {
              showDashboardChrome(name);
              loadDashboardContent("cloud");
            });
          }, 1800);
        });
      } else {
        showErrorState();
      }
    });
  }

  function showErrorState() {
    showToast("Incorrect code — please try the latest 6-digit code from your app.", true);
    totpDigits.forEach((d) => { d.classList.add("error-border"); d.value = ""; });
    mfaCardWrapper.classList.remove("error-shake");
    void mfaCardWrapper.offsetWidth;
    mfaCardWrapper.classList.add("error-shake");
    if (totpDigits[0]) totpDigits[0].focus();
  }

  // --------------- Profile Dropdown & Logout ---------------
  if (profileMenuToggle) {
    profileMenuToggle.addEventListener("click", (e) => {
      if (e.target.closest("#profile-dropdown") && e.target.id !== "btn-logout") return;
      profileDropdown.classList.toggle("hidden");
      profileMenuToggle.classList.toggle("open");
    });
    document.addEventListener("click", (e) => {
      if (!profileMenuToggle.contains(e.target)) {
        profileDropdown.classList.add("hidden");
        profileMenuToggle.classList.remove("open");
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      isLoggedIn = false;
      feedActive = false;
      clearTimeout(typeWriterTimeout);
      switchAuthTab(0);
      hideDashboardChrome();
      switchView(viewDashboard, viewAccessDenied);
    });
  }

  // --------------- KPI Data ---------------
  const kpiData = {
    cloud: [
      { title: "Identity Security",  status: "IAM MFA Enforced",      icon: "badge",    iconClass: "kpi-icon-blue" },
      { title: "Data Protection",    status: "S3 Encryption: Active",  icon: "lock",     iconClass: "kpi-icon-green" },
      { title: "Network Guard",      status: "Public Access Blocked",  icon: "security", iconClass: "kpi-icon-green" },
    ],
    slack: [
      { title: "Workspace Security", status: "0 Public Leaks",         icon: "forum",          iconClass: "kpi-icon-green" },
      { title: "Data Scanning",      status: "File Scan: Active",      icon: "document_scanner", iconClass: "kpi-icon-blue" },
      { title: "Channel Privacy",    status: "Private Channels Only",  icon: "visibility_off", iconClass: "kpi-icon-purple" },
    ],
  };

  const tooltipMap = {
    "IAM MFA Enforced":       "Requires a second form of ID to log in — stops password-only attacks.",
    "S3 Encryption: Active":  "All files are encrypted at rest so only authorized keys can read them.",
    "Public Access Blocked":  "Prevents the internet from accessing your internal infrastructure.",
    "0 Public Leaks":         "No sensitive credentials or files have been exposed publicly.",
    "File Scan: Active":      "Automatically scans all uploaded files for malware and PII.",
    "Private Channels Only":  "Confirms all sensitive conversations happen in private channels.",
  };

  function renderKPIs(view) {
    kpiDeck.innerHTML = kpiData[view].map((k) => `
      <div class="kpi-card">
        <div class="kpi-icon ${k.iconClass}">
          <span class="material-symbols-outlined">${k.icon}</span>
        </div>
        <div class="kpi-info">
          <h3>
            ${k.title}
            <div class="tooltip-wrapper">
              <span class="material-symbols-outlined tooltip-icon">info</span>
              <div class="tooltip-content">${tooltipMap[k.status] || "Verified security control"}</div>
            </div>
          </h3>
          <div class="kpi-value">
            <span class="material-symbols-outlined check-icon">check_circle</span>
            ${k.status}
          </div>
        </div>
      </div>`).join("");
  }

  function renderBadges(view) {
    terminalBadges.innerHTML = view === "cloud"
      ? `<span class="tag tag-aws">AWS</span><span class="tag tag-system">SYSTEM</span>`
      : `<span class="tag tag-slack">SLACK</span>`;
  }

  // --------------- Log Data ---------------
  const masterLogs = [
    { source:"SYSTEM", time:"19:30:01", cls:"info",    text:"[SYSTEM] User session authenticated successfully." },
    { source:"SYSTEM", time:"19:30:02", cls:"info",    text:"[SYSTEM] Initializing audit engine..." },
    { source:"AWS",    time:"19:30:05", cls:"aws",     text:'[AWS] S3 bucket "audit-ready-hub" verified — compliant.' },
    { source:"SLACK",  time:"19:30:08", cls:"slack",   text:"[SLACK] Scanning #general for PII / sensitive data..." },
    { source:"AWS",    time:"19:30:10", cls:"aws",     text:"[AWS] Auditing IAM policies for overly permissive roles..." },
    { source:"SLACK",  time:"19:30:12", cls:"success", text:"[SLACK] 0 public file shares detected — CC6.1 PASS." },
    { source:"AWS",    time:"19:30:15", cls:"success", text:"[AWS] IAM audit OK — principle of least privilege verified." },
    { source:"SYSTEM", time:"19:30:18", cls:"info",    text:"[SYSTEM] Generating unified audit trail..." },
    { source:"SLACK",  time:"19:30:20", cls:"slack",   text:"[SLACK] Admin token scope validated." },
    { source:"SYSTEM", time:"19:30:23", cls:"success", text:"[SYSTEM] All checks complete — SOC 2 Type II ready." },
  ];

  // --------------- Terminal Typewriter ---------------
  function streamLogs(viewType) {
    if (!isLoggedIn) return;
    feedActive = true;
    terminalFeed.innerHTML = '<div class="scan-line"></div>';
    const filtered = masterLogs.filter((l) => {
      if (viewType === "cloud") return l.source === "AWS"   || l.source === "SYSTEM";
      if (viewType === "slack") return l.source === "SLACK" || l.source === "SYSTEM";
      return true;
    });
    let idx = 0;
    function next() {
      if (!feedActive || !isLoggedIn || idx >= filtered.length) return;
      typeLogLine(filtered[idx], () => { idx++; if (feedActive) typeWriterTimeout = setTimeout(next, 360); });
    }
    setTimeout(next, 360);
  }

  function typeLogLine(logObj, onComplete) {
    const row = document.createElement("div");
    row.className = "term-line";
    const ts = document.createElement("span");
    ts.className = "term-time";
    ts.textContent = logObj.time;
    row.appendChild(ts);
    const msg = document.createElement("span");
    msg.className = "term-log " + logObj.cls;
    const blink = document.createElement("span");
    blink.className = "type-cursor";
    blink.textContent = "▌";
    msg.appendChild(blink);
    row.appendChild(msg);
    terminalFeed.appendChild(row);

    let ci = 0;
    const text = logObj.text;
    function tick() {
      if (!feedActive) return;
      if (ci < text.length) {
        msg.textContent = text.slice(0, ci + 1);
        msg.appendChild(blink);
        ci++;
        terminalFeed.scrollTop = terminalFeed.scrollHeight;
        typeWriterTimeout = setTimeout(tick, Math.floor(Math.random() * 16) + 7);
      } else {
        blink.remove();
        if (onComplete) onComplete();
      }
    }
    tick();
  }

  // --------------- Tab Controller ---------------
  let activeView = "cloud";

  function loadDashboardContent(viewType) {
    activeView = viewType;
    feedActive = false;
    clearTimeout(typeWriterTimeout);

    dashboardDynamicContent.classList.remove("fade-in");
    dashboardDynamicContent.classList.add("fade-out-fast");

    setTimeout(() => {
      renderKPIs(viewType);
      renderBadges(viewType);
      dashboardDynamicContent.classList.remove("fade-out-fast");
      dashboardDynamicContent.classList.add("fade-in");
      streamLogs(viewType);
    }, 240);
  }

  if (btnCloud && btnSlack) {
    btnCloud.addEventListener("click", () => {
      btnCloud.classList.add("active");
      btnSlack.classList.remove("active");
      loadDashboardContent("cloud");
    });
    btnSlack.addEventListener("click", () => {
      btnSlack.classList.add("active");
      btnCloud.classList.remove("active");
      loadDashboardContent("slack");
    });
  }

});
