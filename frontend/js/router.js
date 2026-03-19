const Router = {
    routes: {},
    currentRoute: null,

    register(path, handler) {
        this.routes[path] = handler;
    },

    async navigate(path, replace = false) {
        if (replace) {
            history.replaceState(null, '', path);
        } else {
            history.pushState(null, '', path);
        }
        await this.resolve();
    },

    async resolve() {
        const path = window.location.pathname || '/';
        this.currentRoute = path;

        // Update nav active state
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.route === path);
        });

        const handler = this.routes[path];
        if (handler) {
            await handler();
        } else {
            await this.routes['/dashboard']?.();
        }
    },

    init() {
        // Handle browser back/forward
        window.addEventListener('popstate', () => this.resolve());

        // Intercept nav link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-route]');
            if (link) {
                e.preventDefault();
                this.navigate(link.dataset.route);
            }
        });
    }
};
