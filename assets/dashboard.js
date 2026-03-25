document.addEventListener('DOMContentLoaded', () => {

    // 1. Terminal Feed Simulation
    const terminal = document.getElementById('terminal-feed');
    const initTimeElem = document.getElementById('init-time');
    
    // Set initial time
    if(initTimeElem) {
        initTimeElem.innerText = `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}]`;
    }

    const events = [
        { type: 'success', text: 'Console Login Success for user: auditor@company.com' },
        { type: 'info', text: 'IAM Policy Verified: ReadOnlyAccess attached.' },
        { type: 'success', text: 'S3 Bucket "audit-vault-26" encryption check: PASSED (AES-256)' },
        { type: 'info', text: 'API Gateway log export initiated...' },
        { type: 'success', text: 'VPC Security Group rules validated. Public access blocked.' },
        { type: 'info', text: 'Assuming role: arn:aws:iam::123:role/CrossAccountAuditor' },
        { type: 'info', text: 'Control Matrix syncing with external CMDB...' },
        { type: 'success', text: 'Auto-remediation script executing for IAM unrotated keys.' },
        { type: 'success', text: 'SOC 2 continuous compliance snapshot generated.' }
    ];
    
    let index = 0;
    
    function addLog() {
        if (!terminal) return;
        
        let eventIndex = index % events.length; // continually cycle through logs
        const event = events[eventIndex];
        index++;
        
        const line = document.createElement('div');
        line.className = 'term-line';
        
        const now = new Date();
        const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);
        
        line.innerHTML = `<span class="term-time">[${timeStr}]</span> <span class="term-log ${event.type}">${event.text}</span>`;
        terminal.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight; // Auto-scroll
        
        // Random timeout between 1s and 3.5s
        const nextTime = Math.random() * 2500 + 1000;
        setTimeout(addLog, nextTime);
    }
    
    // Start terminal logs after 1.5 seconds
    setTimeout(addLog, 1500);

    // 2. High Contrast Vault Button interaction (mock)
    const vaultBtn = document.querySelector('.btn-vault');
    if(vaultBtn) {
        vaultBtn.addEventListener('click', () => {
            vaultBtn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">refresh</span> Processing MFA...`;
            setTimeout(() => {
                vaultBtn.innerHTML = `<span class="material-symbols-outlined">vpn_key</span> Access Secured Vault (MFA Required)`;
                alert("MFA Prompt Triggered: Please check your Authenticator App.");
            }, 1500);
        });
    }

});

// Add spinner animation rule to document
const style = document.createElement('style');
style.innerHTML = `
@keyframes spin { 
    100% { transform: rotate(360deg); } 
}
`;
document.head.appendChild(style);
