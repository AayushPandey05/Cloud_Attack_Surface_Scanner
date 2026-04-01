// -------------------------------------------------------------------------- //
//                                 STATE & DOM                                //
// -------------------------------------------------------------------------- //
document.addEventListener("DOMContentLoaded", () => {
  // Pages
  const pages = {
    login: document.getElementById("login-page"),
    mfa: document.getElementById("mfa-page"),
    dashboard: document.getElementById("dashboard-page"),
  };

  // UI Elements
  const authSlider = document.getElementById("auth-slider");
  const goToSignup = document.getElementById("go-to-signup");
  const goToLogin = document.getElementById("go-to-login");
  const identityLoader = document.getElementById("identity-loader");

  // Forms & Buttons
  const loginForm = document.getElementById("login-form");
  const googleLoginBtn = document.getElementById("google-login-btn");
  const signupForm = document.getElementById("signup-form");
  const googleSignupBtn = document.getElementById("google-signup-btn");

  const mfaForm = document.getElementById("mfa-form");
  const backToLoginFromMfa = document.getElementById("back-to-login-from-mfa");

  // Header & Profile Dropdown
  const avatarBtn = document.getElementById("avatar-btn");
  const profileDropdown = document.getElementById("profile-dropdown");
  const logoutBtn = document.getElementById("logout-btn"); // Found inside the dropdown

  // Terminal
  const terminalFeed = document.getElementById("terminal-feed");
  let terminalInterval = null;
  let currentView = "cloud";
  const kpiContainer = document.getElementById("kpi-container");
  const viewBtns = document.querySelectorAll(".view-btn");

  // ---------------------------------------------------------------------- //
  //                                NAVIGATION                              //
  // ---------------------------------------------------------------------- //
  function showPage(pageName) {
    // Hide all
    Object.values(pages).forEach((page) => {
      page.classList.remove("active");
      setTimeout(() => {
        if (!page.classList.contains("active")) {
          page.classList.add("hidden");
        }
      }, 500);
    });

    // Show target
    const targetPage = pages[pageName];
    targetPage.classList.remove("hidden");
    setTimeout(() => {
      targetPage.classList.add("active");
    }, 50);

    // Manage Terminal Lifecycle
    if (pageName === "dashboard") {
      switchView("cloud"); // Ensure cloud is default
      startTerminal();
    } else {
      stopTerminal();
    }
  }

  function triggerLoaderAndNavigate(targetPage) {
    identityLoader.classList.remove("hidden");
    setTimeout(() => {
      identityLoader.classList.add("hidden");
      showPage(targetPage);
      if (targetPage === "mfa") {
        setTimeout(() => document.getElementById("totp").focus(), 600);
      }
    }, 2000);
  }

  // ---------------------------------------------------------------------- //
  //                              EVENT BINDINGS                            //
  // ---------------------------------------------------------------------- //

  // -- Slider Toggles --
  goToSignup.addEventListener("click", (e) => {
    e.preventDefault();
    authSlider.classList.add("show-signup");
  });

  goToLogin.addEventListener("click", (e) => {
    e.preventDefault();
    authSlider.classList.remove("show-signup");
  });

  // -- Auth Forms --
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    if (email && password) {
      showPage("mfa");
      setTimeout(() => document.getElementById("totp").focus(), 600);
    }
  });

  googleLoginBtn.addEventListener("click", () => {
    showPage("mfa");
    setTimeout(() => document.getElementById("totp").focus(), 600);
  });

  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    triggerLoaderAndNavigate("mfa");
  });

  googleSignupBtn.addEventListener("click", () => {
    triggerLoaderAndNavigate("mfa");
  });

  backToLoginFromMfa.addEventListener("click", () => {
    showPage("login");
  });

  mfaForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const totp = document.getElementById("totp").value;
    if (totp.length === 6) {
      showPage("dashboard");
    }
  });

  // -- Profile Dropdown & Logout --
  avatarBtn.addEventListener("click", () => {
    profileDropdown.classList.toggle("hidden");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!avatarBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
      profileDropdown.classList.add("hidden");
    }
  });

  logoutBtn.addEventListener("click", () => {
    profileDropdown.classList.add("hidden");
    loginForm.reset();
    signupForm.reset();
    mfaForm.reset();
    authSlider.classList.remove("show-signup");
    showPage("login");
  });

  // -- View Switcher --
  viewBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const requestedView = e.target.dataset.view;
      if (currentView === requestedView) return;

      viewBtns.forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      switchView(requestedView);
    });
  });

  // ---------------------------------------------------------------------- //
  //                                VIEW SWITCHER                           //
  // ---------------------------------------------------------------------- //
  function switchView(view) {
    currentView = view;

    kpiContainer.classList.add("fade-out");
    terminalFeed.style.opacity = "0";
    terminalFeed.style.transition = "opacity 0.3s";

    setTimeout(() => {
      if (view === "cloud") {
        document.getElementById("kpi-title-1").innerText = "S3 Encryption";
        document
          .getElementById("kpi-icon-1")
          .setAttribute("data-lucide", "lock");
        document.getElementById("kpi-val-1").innerText = "100%";

        document.getElementById("kpi-title-2").innerText = "IAM MFA";
        document
          .getElementById("kpi-icon-2")
          .setAttribute("data-lucide", "shield-alert");
        document.getElementById("kpi-val-2").innerText = "94%";

        document.getElementById("kpi-title-3").innerText = "CloudTrail";
        document
          .getElementById("kpi-icon-3")
          .setAttribute("data-lucide", "activity");

        document.getElementById("kpi-title-4").innerText = "Network Guard";
        document
          .getElementById("kpi-icon-4")
          .setAttribute("data-lucide", "network");
      } else if (view === "slack") {
        document.getElementById("kpi-title-1").innerText = "Channel Privacy";
        document
          .getElementById("kpi-icon-1")
          .setAttribute("data-lucide", "eye-off");
        document.getElementById("kpi-val-1").innerText = "Healthy";

        document.getElementById("kpi-title-2").innerText = "File Scan Status";
        document
          .getElementById("kpi-icon-2")
          .setAttribute("data-lucide", "file-search");
        document.getElementById("kpi-val-2").innerText = "Active";

        document.getElementById("kpi-title-3").innerText = "External Guests";
        document
          .getElementById("kpi-icon-3")
          .setAttribute("data-lucide", "users");
        document.getElementById("kpi-val-3").innerText = "14";

        document.getElementById("kpi-title-4").innerText = "DLP Alerts";
        document
          .getElementById("kpi-icon-4")
          .setAttribute("data-lucide", "alert-octagon");
        document.getElementById("kpi-val-4").innerText = "0 Critical";
      }

      lucide.createIcons();

      terminalFeed.innerHTML = "";
      addTerminalLog(
        "SYSTEM",
        `Switched context to ${view.toUpperCase()} View. Establishing secure pipe...`,
      );

      kpiContainer.classList.remove("fade-out");
      terminalFeed.style.opacity = "1";
    }, 300);
  }

  // ---------------------------------------------------------------------- //
  //                                TERMINAL FX                             //
  // ---------------------------------------------------------------------- //
  const mockDb = {
    cloud: [
      { source: "AWS", msg: "IAM Role anomaly detected: admin-assumed-role" },
      {
        source: "AWS",
        msg: 'S3 Bucket "corp-financial-data" is securely encrypted.',
      },
      {
        source: "AWS",
        msg: "CloudTrail log validation successful in us-east-1",
      },
      {
        source: "AWS",
        msg: "Security Group sg-0abcdef permits explicit root access",
      },
      {
        source: "SYSTEM",
        msg: "Routine compliance scan initiated. Phase 1/4...",
      },
    ],
    slack: [
      {
        source: "SLACK",
        msg: "Guest invited to #security-alerts by @john.doe",
      },
      { source: "SLACK", msg: "API Token generated (Scope: channels:history)" },
      {
        source: "SLACK",
        msg: "Unauthorized file downloaded in #financial-data",
      },
      { source: "SLACK", msg: "Webhook established from external IP" },
      { source: "SYSTEM", msg: "Compiling real-time DLP workspace checks..." },
    ],
  };

  function startTerminal() {
    if (terminalInterval) return;
    terminalFeed.innerHTML = "";
    addTerminalLog("SYSTEM", "Initializing Unified Evidence Engine...");

    terminalInterval = setInterval(() => {
      const logs = mockDb[currentView];
      const log = logs[Math.floor(Math.random() * logs.length)];
      addTerminalLog(log.source, log.msg);
    }, 3500);
  }

  function stopTerminal() {
    if (terminalInterval) {
      clearInterval(terminalInterval);
      terminalInterval = null;
    }
  }

  function addTerminalLog(source, msg) {
    const entry = document.createElement("div");
    entry.className = "log-entry";

    const time = new Date().toISOString().split("T")[1].slice(0, 8);
    const sourceClass = source.toLowerCase();

    entry.innerHTML = `
            <span class="log-time">[${time}]</span>
            <span class="log-source ${sourceClass}">[${source}]</span>
            <span class="log-message"></span><span class="typewriter-cursor"></span>
        `;

    terminalFeed.appendChild(entry);
    const msgSpan = entry.querySelector(".log-message");
    const cursor = entry.querySelector(".typewriter-cursor");

    let i = 0;
    const speed = 30;

    function typeWriter() {
      if (i < msg.length) {
        msgSpan.innerHTML += msg.charAt(i);
        i++;
        terminalFeed.scrollTop = terminalFeed.scrollHeight;
        setTimeout(typeWriter, speed);
      } else {
        cursor.style.display = "none";
      }
    }

    typeWriter();

    if (terminalFeed.childElementCount > 25) {
      terminalFeed.removeChild(terminalFeed.firstChild);
    }
  }
});
