function renderLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <h1 class="auth-title">DayCore</h1>
                <p class="auth-subtitle">Enter your password</p>
                <div id="login-msg"></div>
                <div class="input-group">
                    <input type="password" id="login-pw" class="input" placeholder="Password" autofocus>
                </div>
                <button id="login-btn" class="btn btn-primary">Enter</button>
            </div>
        </div>
    `;

    const btn = document.getElementById('login-btn');
    const pw = document.getElementById('login-pw');
    const msg = document.getElementById('login-msg');

    async function doLogin() {
        btn.disabled = true;
        btn.textContent = 'Logging in...';
        try {
            await API.login(pw.value);
            document.getElementById('nav').classList.remove('hidden');
            Router.navigate('/dashboard', true);
        } catch (e) {
            msg.innerHTML = `<div class="msg msg-error">${e.message}</div>`;
            btn.disabled = false;
            btn.textContent = 'Enter';
        }
    }

    btn.addEventListener('click', doLogin);
    pw.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
}
