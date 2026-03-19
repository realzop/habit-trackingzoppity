// Register routes
Router.register('/setup', renderSetup);
Router.register('/login', renderLogin);
Router.register('/dashboard', renderDashboard);
Router.register('/history', renderHistory);
Router.register('/notes', renderNotes);
Router.register('/ai-review', renderAiReview);
Router.register('/settings', renderSettings);
Router.register('/', renderDashboard);

// Logout handler
document.getElementById('logout-btn').addEventListener('click', async () => {
    await API.logout();
    document.getElementById('nav').classList.add('hidden');
    Router.navigate('/login', true);
});

// Modal close on escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('modal-overlay').classList.add('hidden');
    }
});

// App init
(async function init() {
    Router.init();

    try {
        const status = await API.authStatus();
        if (!status.setup_done) {
            document.getElementById('nav').classList.add('hidden');
            Router.navigate('/setup', true);
            return;
        }

        // Try to access a protected route to check if logged in
        try {
            await API.getHabitList();
            document.getElementById('nav').classList.remove('hidden');

            // Load theme
            try {
                const settings = await API.getSettings();
                if (settings.theme) applyTheme(settings.theme);
            } catch (e) {}

            await Router.resolve();
        } catch (e) {
            document.getElementById('nav').classList.add('hidden');
            Router.navigate('/login', true);
        }
    } catch (e) {
        document.getElementById('nav').classList.add('hidden');
        Router.navigate('/login', true);
    }
})();
