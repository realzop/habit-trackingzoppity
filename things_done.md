# DayCore — Things Done

## v1.0 — Initial Build (2026-03-19)

### Backend
- [x] FastAPI app with lifespan startup
- [x] SQLite database via SQLModel (auto-created on first launch)
- [x] Password-only auth with bcrypt hashing
- [x] Session cookies (30-day expiry, httponly)
- [x] Auth routes: `/api/auth/setup`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/status`
- [x] Habit log routes: `/api/habits/today` (GET/POST), `/api/habits/history`, `/api/habits/range`
- [x] Habit config routes: `/api/habits/list` (GET/POST)
- [x] Settings routes: `/api/settings` (GET/POST), `/api/settings/password`, `/api/settings/ai-review`
- [x] AI review endpoint calling OpenAI gpt-4o-mini with 30-day habit data
- [x] Database seeding with generic placeholder habits on first launch

### Frontend
- [x] SPA router (vanilla JS, no framework)
- [x] Setup page — first-launch password creation
- [x] Login page — password entry
- [x] Dashboard — today's date, habit cards (toggle/number/mood), progress bar
- [x] History — monthly calendar heatmap (red→green by completion %), day click modal
- [x] AI Review — sends last 30 days to OpenAI, renders markdown response
- [x] Settings — theme switcher, password change, OpenAI API key, habit manager (add/toggle active/reorder)
- [x] Futurist dark theme with grid overlay, neon cyan/violet accents
- [x] 3 themes: DayCore Dark, Midnight Purple, Terminal Green
- [x] Mobile-first responsive layout

### Infrastructure
- [x] Dockerfile (Python 3.12 slim)
- [x] docker-compose.yml with named volume for SQLite persistence
- [x] install.sh — checks Docker, generates SECRET_KEY, builds & starts, prints URLs
- [x] .env.example
- [x] .gitignore (`.env`, `*.db`, `__pycache__`, `.DS_Store`)

### Habits (v1 seed)
- Habit 1 through Habit 5 (boolean toggles) — user renames in Settings
- Daily Count (number input) — user configures goal in Settings
- Mood (1-5 scale) — user can rename in Settings

---

## Tracking by Version

| Version | Habits Seeded | Notes |
|---------|--------------|-------|
| v1 | Habit 1-5 (boolean), Daily Count (number), Mood (1-5) | Generic placeholders, user configures on first launch |
