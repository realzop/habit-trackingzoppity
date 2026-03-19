# DayCore

A self-hosted, futurist-minimal habit tracker that runs as a personal dashboard. Track daily habits, view history on a calendar heatmap, and get AI-powered reviews of your patterns.

## Requirements

- Docker & Docker Compose

## Install

```bash
git clone <your-repo-url> daycore
cd daycore
bash install.sh
```

That's it. One command after clone. Everything is automatic — generates secrets, builds the container, starts the app.

## Access

- **Local:** http://localhost:2026
- **LAN:** http://YOUR_IP:2026
- **Tailscale:** http://YOUR_TAILSCALE_IP:2026 (install Tailscale on the host, the app is accessible on port 2026)

## First Launch

1. Set your password on the setup screen
2. Go to **Settings → Habit Manager** to rename and configure your habits
3. Start tracking

## Update

```bash
git pull
bash install.sh
```

The install script handles rebuilding automatically. Your data persists in a Docker volume.

## Stack

- Backend: Python FastAPI + SQLite
- Frontend: Vanilla HTML/CSS/JS
- Deployment: Docker
