async function renderSettings() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="spinner" style="margin:40px auto;display:block"></div>';

    try {
        const [settings, habits] = await Promise.all([
            API.getSettings(),
            API.getHabitList()
        ]);

        const theme = settings.theme || 'dark';

        app.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Settings</h1>
            </div>

            <div class="settings-section">
                <h3>Theme</h3>
                <div class="theme-grid">
                    <button class="theme-option ${theme === 'dark' ? 'selected' : ''}" data-theme="dark">DayCore Dark</button>
                    <button class="theme-option ${theme === 'purple' ? 'selected' : ''}" data-theme="purple">Midnight Purple</button>
                    <button class="theme-option ${theme === 'green' ? 'selected' : ''}" data-theme="green">Terminal Green</button>
                </div>
            </div>

            <div class="settings-section">
                <h3>Change Password</h3>
                <div class="card">
                    <div id="pw-msg"></div>
                    <div class="input-group">
                        <label class="input-label">Current Password</label>
                        <input type="password" id="pw-current" class="input" placeholder="Current password">
                    </div>
                    <div class="input-group">
                        <label class="input-label">New Password</label>
                        <input type="password" id="pw-new" class="input" placeholder="New password">
                    </div>
                    <button id="pw-btn" class="btn btn-secondary">Update Password</button>
                </div>
            </div>

            <div class="settings-section">
                <h3>OpenAI API Key</h3>
                <div class="card">
                    <div id="api-msg"></div>
                    <div class="input-group">
                        <label class="input-label">API Key (for AI Review)</label>
                        <input type="password" id="api-key" class="input" placeholder="sk-..." value="${settings.openai_api_key || ''}">
                    </div>
                    <button id="api-btn" class="btn btn-secondary">Save API Key</button>
                </div>
            </div>

            <div class="settings-section">
                <h3>Habit Manager</h3>
                <div id="habit-manager"></div>
                <div style="margin-top:12px">
                    <h3 style="margin-bottom:8px;font-size:0.8rem;color:var(--text-dim)">Add New Habit</h3>
                    <div class="add-habit-form">
                        <input type="text" id="new-habit-name" class="input" placeholder="Habit name">
                        <select id="new-habit-type" class="select">
                            <option value="boolean">Toggle</option>
                            <option value="number">Number</option>
                        </select>
                        <button id="add-habit-btn" class="btn btn-secondary" style="width:auto;padding:10px 16px">Add</button>
                    </div>
                </div>
            </div>
        `;

        // Theme switching
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', async () => {
                const t = btn.dataset.theme;
                document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                applyTheme(t);
                await API.updateSettings([{ key: 'theme', value: t }]);
            });
        });

        // Password change
        document.getElementById('pw-btn').addEventListener('click', async () => {
            const msg = document.getElementById('pw-msg');
            try {
                await API.changePassword(
                    document.getElementById('pw-current').value,
                    document.getElementById('pw-new').value
                );
                msg.innerHTML = '<div class="msg msg-success">Password updated</div>';
                document.getElementById('pw-current').value = '';
                document.getElementById('pw-new').value = '';
            } catch (e) {
                msg.innerHTML = `<div class="msg msg-error">${e.message}</div>`;
            }
        });

        // API key
        document.getElementById('api-btn').addEventListener('click', async () => {
            const msg = document.getElementById('api-msg');
            const key = document.getElementById('api-key').value;
            try {
                await API.updateSettings([{ key: 'openai_api_key', value: key }]);
                msg.innerHTML = '<div class="msg msg-success">API key saved</div>';
            } catch (e) {
                msg.innerHTML = `<div class="msg msg-error">${e.message}</div>`;
            }
        });

        // Habit manager
        renderHabitManager(habits);

        // Add habit
        document.getElementById('add-habit-btn').addEventListener('click', async () => {
            const name = document.getElementById('new-habit-name').value.trim();
            const type = document.getElementById('new-habit-type').value;
            if (!name) return;
            const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
            habits.push({
                key, name, habit_type: type, emoji: '', goal: null,
                sort_order: habits.length, active: true, version: 'custom'
            });
            await API.updateHabitList(habits);
            document.getElementById('new-habit-name').value = '';
            renderHabitManager(habits);
        });

    } catch (e) {
        if (e.message !== 'Not authenticated') {
            app.innerHTML = `<div class="msg msg-error">${e.message}</div>`;
        }
    }
}

function renderHabitManager(habits) {
    const container = document.getElementById('habit-manager');
    container.innerHTML = habits.map((h, i) => `
        <div class="habit-manager-item" data-index="${i}">
            <span class="handle">&#9776;</span>
            <span class="habit-manager-name">${h.emoji || ''} ${h.name}</span>
            <span class="habit-manager-type">${h.habit_type}</span>
            <span class="habit-manager-type">${h.version}</span>
            <button class="habit-manager-toggle ${h.active ? 'on' : ''}" data-index="${i}"></button>
        </div>
    `).join('');

    container.querySelectorAll('.habit-manager-toggle').forEach(btn => {
        btn.addEventListener('click', async () => {
            const idx = parseInt(btn.dataset.index);
            habits[idx].active = !habits[idx].active;
            btn.classList.toggle('on', habits[idx].active);
            await API.updateHabitList(habits);
        });
    });
}

function applyTheme(theme) {
    document.body.className = '';
    if (theme && theme !== 'dark') {
        document.body.classList.add(`theme-${theme}`);
    }
}
