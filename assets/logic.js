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

  // Header & Profile Dropdown
  const avatarBtn = document.getElementById("avatar-btn");
  const profileDropdown = document.getElementById("profile-dropdown");
  const logoutBtn = document.getElementById("logout-btn");

  // Terminal
  const terminalFeed = document.getElementById("terminal-feed");
  let terminalInterval = null;
  let currentView = "cloud";
  const kpiContainer = document.getElementById("kpi-container");
  const viewBtns = document.querySelectorAll(".view-btn");

  // ---------------------------------------------------------------------- //
  //                               NAVIGATION                               //
  // ---------------------------------------------------------------------- //
  window.showPage = function (pageName, pushHistory = true) {
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

    // HISTORY API FIX: Tell the browser URL what page we are on
    if (pushHistory) {
      history.pushState({ view: pageName }, "", `#${pageName}`);
    }

    // Manage Terminal Lifecycle
    if (pageName === "dashboard") {
      switchView("cloud");
      startTerminal();
    } else {
      stopTerminal();
    }
  };

  // HISTORY API FIX: Listen for the Browser Back Button
  window.addEventListener("popstate", (event) => {
    if (event.state && event.state.view) {
      showPage(event.state.view, false); // false = don't push state again
    } else {
      showPage("login", false); // Default back to login
    }
  });

  window.triggerLoaderAndNavigate = function (targetPage) {
    identityLoader.classList.remove("hidden");
    setTimeout(() => {
      identityLoader.classList.add("hidden");
      showPage(targetPage);
    }, 2000);
  };

  // ---------------------------------------------------------------------- //
  //                              EVENT BINDINGS                            //
  // ---------------------------------------------------------------------- //

  // -- Phone Extension Custom Dropdown --
  const extBtn = document.getElementById("reg-phone-ext-btn");
  const extMenu = document.getElementById("reg-phone-ext-menu");
  const extInput = document.getElementById("reg-phone-ext");
  const extImg = document.getElementById("reg-phone-ext-img");
  const extCodeSpan = document.getElementById("reg-phone-ext-code");

  if (extBtn && extMenu) {
    extBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      extMenu.classList.toggle("hidden");
    });

    document.addEventListener("click", () => {
      extMenu.classList.add("hidden");
    });

    extMenu.querySelectorAll(".phone-ext-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const code = item.getAttribute("data-code");
        const flag = item.getAttribute("data-flag");

        extInput.value = code;
        extImg.src = `https://flagcdn.com/w20/${flag}.png`;
        extImg.alt = flag.toUpperCase();
        extCodeSpan.innerText = code;

        extMenu.classList.add("hidden");
      });
    });
  }

  // -- Slider Toggles --
  // Guard: go-to-signup / go-to-login IDs may not exist in all page versions
  if (goToSignup) {
    goToSignup.addEventListener("click", (e) => {
      e.preventDefault();
      authSlider.classList.add("show-signup");
    });
  }

  if (goToLogin) {
    goToLogin.addEventListener("click", (e) => {
      e.preventDefault();
      authSlider.classList.remove("show-signup");
    });
  }

  // ---------------------------------------------------------------------- //
  //                       EMAIL OTP MFA GATEWAY                            //
  // ---------------------------------------------------------------------- //
  let currentEmail = "";
  let currentSessionOtp = "";

  window.triggerEmailOtpFlow = function (userEmail) {
    currentEmail = userEmail;

    // Generate the random 6-digit code
    currentSessionOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Parameters mapping to your EmailJS template variables
    const templateParams = {
      user_email: userEmail,
      otp_code: currentSessionOtp,
    };

    console.log("Initiating secure OTP dispatch to EmailJS...");

    // Trigger loader and show MFA UI
    triggerLoaderAndNavigate("mfa");

    const emailDisplay = document.getElementById("display-user-email");
    if (emailDisplay) emailDisplay.innerText = userEmail;

    // FIRE THE EMAILJS ENGINE
    emailjs.send("service_mngqn1v", "template_9cva2to", templateParams).then(
      function (response) {
        console.log("SUCCESS! OTP Sent.", response.status, response.text);
      },
      function (error) {
        console.error("FAILED to send OTP...", error);
        alert(
          "❌ Network Error: Failed to send security code. Please check your console.",
        );
      },
    );
  };

  window.verifyEmailOtp = function () {
    const enteredCode = document.getElementById("email-otp-input").value;

    if (enteredCode === currentSessionOtp) {
      // Success!
      triggerLoaderAndNavigate("dashboard");
      currentSessionOtp = "";
      document.getElementById("email-otp-input").value = "";
    } else {
      alert("❌ Invalid code. Please try again.");
    }
  };

  window.cancelMfa = function () {
    currentSessionOtp = "";
    document.getElementById("email-otp-input").value = "";
    showPage("login");
  };

  // ---------------------------------------------------------------------- //
  //                              AUTH FORMS                                //
  // ---------------------------------------------------------------------- //
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    if (email) triggerEmailOtpFlow(email);
  });

  googleLoginBtn.addEventListener("click", () => {
    triggerEmailOtpFlow("google-user@demo.com");
  });

  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("reg-email").value;
    if (email) triggerEmailOtpFlow(email);
  });

  googleSignupBtn.addEventListener("click", () => {
    triggerEmailOtpFlow("google-user@demo.com");
  });

  // -- Profile Dropdown & Logout --
  avatarBtn.addEventListener("click", () => {
    profileDropdown.classList.toggle("hidden");
  });

  document.addEventListener("click", (e) => {
    if (!avatarBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
      profileDropdown.classList.add("hidden");
    }
  });

  logoutBtn.addEventListener("click", () => {
    profileDropdown.classList.add("hidden");
    loginForm.reset();
    signupForm.reset();

    const otpInput = document.getElementById("email-otp-input");
    if (otpInput) otpInput.value = "";

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
  //                               VIEW SWITCHER                            //
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
