function renderSetup() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <h1 class="auth-title">DayCore</h1>
                <p class="auth-subtitle">Set up your password to get started</p>
                <div id="setup-msg"></div>
                <div class="input-group">
                    <label class="input-label">Password</label>
                    <input type="password" id="setup-pw" class="input" placeholder="Choose a password" autofocus>
                </div>
                <div class="input-group">
                    <label class="input-label">Confirm Password</label>
                    <input type="password" id="setup-pw2" class="input" placeholder="Confirm password">
                </div>
                <button id="setup-btn" class="btn btn-primary">Initialize DayCore</button>
            </div>
        </div>
    `;

    const btn = document.getElementById('setup-btn');
    const pw = document.getElementById('setup-pw');
    const pw2 = document.getElementById('setup-pw2');
    const msg = document.getElementById('setup-msg');

    async function doSetup() {
        if (pw.value !== pw2.value) {
            msg.innerHTML = '<div class="msg msg-error">Passwords do not match</div>';
            return;
        }
        if (pw.value.length < 4) {
            msg.innerHTML = '<div class="msg msg-error">Password must be at least 4 characters</div>';
            return;
        }
        btn.disabled = true;
        btn.textContent = 'Setting up...';
        try {
            await API.setup(pw.value);
            document.getElementById('nav').classList.remove('hidden');
            Router.navigate('/dashboard', true);
        } catch (e) {
            msg.innerHTML = `<div class="msg msg-error">${e.message}</div>`;
            btn.disabled = false;
            btn.textContent = 'Initialize DayCore';
        }
    }

    btn.addEventListener('click', doSetup);
    pw2.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSetup(); });
}
