const API = {
    async fetch(url, options = {}) {
        const res = await fetch(url, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options
        });
        if (res.status === 401) {
            window.location.hash = '#/login';
            throw new Error('Not authenticated');
        }
        return res;
    },

    async get(url) {
        const res = await this.fetch(url);
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.detail || 'Request failed');
        }
        return res.json();
    },

    async post(url, body) {
        const res = await this.fetch(url, {
            method: 'POST',
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.detail || 'Request failed');
        }
        return res.json();
    },

    async authStatus() {
        return this.get('/api/auth/status');
    },

    async setup(password) {
        return this.post('/api/auth/setup', { password });
    },

    async login(password) {
        return this.post('/api/auth/login', { password });
    },

    async logout() {
        return this.post('/api/auth/logout', {});
    },

    async getHabitsToday() {
        return this.get('/api/habits/today');
    },

    async saveHabitsToday(entries) {
        return this.post('/api/habits/today', entries);
    },

    async getHistory(month) {
        return this.get(`/api/habits/history?month=${month}`);
    },

    async getRange(days = 30) {
        return this.get(`/api/habits/range?days=${days}`);
    },

    async getHabitList() {
        return this.get('/api/habits/list');
    },

    async updateHabitList(habits) {
        return this.post('/api/habits/list', habits);
    },

    async getSettings() {
        return this.get('/api/settings');
    },

    async updateSettings(updates) {
        return this.post('/api/settings', updates);
    },

    async changePassword(current, newPw) {
        return this.post('/api/settings/password', {
            current_password: current,
            new_password: newPw
        });
    },

    async getAiReview() {
        return this.post('/api/settings/ai-review', {});
    },

    async deleteHabit(habitKey) {
        const res = await this.fetch(`/api/habits/${habitKey}`, { method: 'DELETE' });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.detail || 'Request failed');
        }
        return res.json();
    },

    async getTodayNote() {
        return this.get('/api/notes/today');
    },

    async saveNote(entry) {
        return this.post('/api/notes', entry);
    },

    async getNotes() {
        return this.get('/api/notes');
    },

    async exportNotes(tag = 'all', format = 'csv') {
        const res = await this.fetch(`/api/notes/export?tag=${encodeURIComponent(tag)}&format=${format}`);
        if (!res.ok) throw new Error('Export failed');
        return res;
    },

    async backupData() {
        const res = await this.fetch('/api/settings/backup');
        if (!res.ok) throw new Error('Backup failed');
        return res;
    },

    async importData(data) {
        return this.post('/api/settings/import', data);
    }
};
