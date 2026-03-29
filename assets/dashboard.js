// dashboard.js - UI Logic and Transitions

document.addEventListener('DOMContentLoaded', () => {

  const viewLogin = document.getElementById('view-login');
  const viewMfa = document.getElementById('view-mfa');
  const viewDashboard = document.getElementById('view-dashboard');

  const loginForm = document.getElementById('login-form');
  const googleBtn = document.getElementById('google-login');
  const mfaForm = document.getElementById('mfa-form');
  const totpInput = document.getElementById('totp-code');

  const terminalFeed = document.getElementById('terminal-feed');

  // Navigation logic
  function switchView(hideView, showView, onShowCallback) {
    if(!hideView || !showView) return;
    
    // Start fade out
    hideView.classList.add('fade-out');
    
    setTimeout(() => {
      // Hide old view, clean animation classes
      hideView.classList.remove('active', 'fade-out');
      hideView.classList.add('hidden');
      
      // Show new view
      showView.classList.remove('hidden');
      showView.classList.add('active');

      if (onShowCallback) onShowCallback();
      
    }, 400); // 400ms match css animation duration
  }

  // --- LOGIN PAGE LOGIC ---
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      switchView(viewLogin, viewMfa, () => {
        // Auto-focus MFA input on load
        if(totpInput) totpInput.focus();
      });
    });
  }

  if (googleBtn) {
    googleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(viewLogin, viewMfa, () => {
        if(totpInput) totpInput.focus();
      });
    });
  }

  // --- MFA PAGE LOGIC ---
  if (mfaForm) {
    mfaForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = totpInput.value;
      if (code && code.length === 6) {
        switchView(viewMfa, viewDashboard, () => {
          startTerminalFeed();
        });
      }
    });

    // Auto focus format
    totpInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '');
    });
  }

  // --- DASHBOARD TERMINAL LOGIC ---
  const logs = [
    { time: '19:30:01', html: '<span class="term-log info">[SYSTEM] Initializing Cross-Platform Audit...</span>' },
    { time: '19:30:05', html: '<span class="term-log aws">[AWS] S3 Evidence Bucket "audit-ready-hub-mumbai" verified.</span>' },
    { time: '19:30:08', html: '<span class="term-log slack">[SLACK] Scanning #general for PII/Sensitive Data...</span>' },
    { time: '19:30:12', html: '<span class="term-log success">[SLACK] 0 Public file shares detected. SOC 2 Rule CC6.1 Pass.</span>' },
    { time: '19:30:18', html: '<span class="term-log aws">[AWS] Checking IAM Policies for overly permissive roles...</span>' },
    { time: '19:30:22', html: '<span class="term-log success">[AWS] IAM Audit OK. Principle of Least Privilege verified.</span>' },
    { time: '19:30:27', html: '<span class="term-log info">[SYSTEM] Generating Unified Audit Trail...</span>' }
  ];

  function appendLog(logObj) {
    const div = document.createElement('div');
    div.className = 'term-line';
    div.innerHTML = `<span class="term-time">${logObj.time}</span> ${logObj.html}`;
    terminalFeed.appendChild(div);
    // Scroll to bottom
    terminalFeed.scrollTop = terminalFeed.scrollHeight;
  }

  let feedStarted = false;
  function startTerminalFeed() {
    if (feedStarted) return;
    feedStarted = true;
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < logs.length) {
        appendLog(logs[index]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 1200);
  }

  // --- VIEW TOGGLES (Cloud vs Slack) ---
  const btnCloud = document.getElementById('btn-cloud-view');
  const btnSlack = document.getElementById('btn-slack-view');
  
  if (btnCloud && btnSlack) {
    btnCloud.addEventListener('click', () => {
      btnCloud.classList.add('active');
      btnSlack.classList.remove('active');
      // Simulated filter logic (not fully implemented in HTML but visual change shown)
    });

    btnSlack.addEventListener('click', () => {
      btnSlack.classList.add('active');
      btnCloud.classList.remove('active');
    });
  }
});
