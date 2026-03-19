#!/usr/bin/env bash
set -e

echo ""
echo "  ╔══════════════════════════════════╗"
echo "  ║      DayCore Install / Update    ║"
echo "  ╚══════════════════════════════════╝"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "[!] Docker is not installed. Install it first: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "[!] Docker Compose is not available. Install it first."
    exit 1
fi

# Determine compose command
if docker compose version &> /dev/null; then
    COMPOSE="docker compose"
else
    COMPOSE="docker-compose"
fi

# Generate .env if it doesn't exist
if [ ! -f .env ]; then
    SECRET=$(openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || head -c 32 /dev/urandom | xxd -p | tr -d '\n')
    echo "SECRET_KEY=${SECRET}" > .env
    echo "[+] Generated .env with random SECRET_KEY"
else
    echo "[=] .env already exists, keeping it"
fi

# Check if this is an update (containers already running)
RUNNING=$($COMPOSE ps -q 2>/dev/null || true)

if [ -n "$RUNNING" ]; then
    echo "[~] Existing DayCore detected — updating..."
    echo "[~] Your data (habits, logs, notes, password) is safe in the Docker volume."
    echo ""
    echo "[+] Stopping old containers..."
    $COMPOSE down
    echo "[+] Rebuilding with latest code (no cache)..."
    $COMPOSE build --no-cache
    echo "[+] Starting updated DayCore..."
    $COMPOSE up -d
else
    echo "[+] Fresh install — building and starting DayCore..."
    $COMPOSE up -d --build
fi

echo ""
echo "  ✓ DayCore is running!"
echo ""
echo "  Local:   http://localhost:2026"
echo "  Network: http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo '<your-ip>'):2026"
echo ""

if [ -z "$RUNNING" ]; then
    echo "  First visit will ask you to set a password."
    echo ""
    echo "  ┌─────────────────────────────────────────────┐"
    echo "  │  After setting your password, go to          │"
    echo "  │  Settings → Habit Manager to rename and      │"
    echo "  │  configure your habits.                      │"
    echo "  └─────────────────────────────────────────────┘"
else
    echo "  ┌─────────────────────────────────────────────┐"
    echo "  │  Update complete! Your data has been kept.   │"
    echo "  │  Refresh your browser to see new features.   │"
    echo "  └─────────────────────────────────────────────┘"
fi
echo ""
