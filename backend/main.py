import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from database import init_db
from routes_auth import router as auth_router
from routes_habits import router as habits_router
from routes_settings import router as settings_router
from routes_notes import router as notes_router

# Build version for cache busting — changes every server restart
BUILD_VERSION = str(int(time.time()))


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs("data", exist_ok=True)
    init_db()
    from seed import seed_defaults
    seed_defaults()
    yield


app = FastAPI(title="DayCore", lifespan=lifespan)

app.include_router(auth_router, prefix="/api/auth")
app.include_router(habits_router, prefix="/api/habits")
app.include_router(settings_router, prefix="/api/settings")
app.include_router(notes_router, prefix="/api/notes")

# Serve frontend static files
FRONTEND_DIR = os.environ.get("FRONTEND_DIR", "/app/frontend")

app.mount("/css", StaticFiles(directory=f"{FRONTEND_DIR}/css"), name="css")
app.mount("/js", StaticFiles(directory=f"{FRONTEND_DIR}/js"), name="js")


def _get_spa_html():
    """Read index.html and inject cache-busting version into static asset URLs."""
    with open(f"{FRONTEND_DIR}/index.html") as f:
        html = f.read()
    html = html.replace('.js"', f'.js?v={BUILD_VERSION}"')
    html = html.replace('.css"', f'.css?v={BUILD_VERSION}"')
    return html


@app.get("/")
@app.get("/dashboard")
@app.get("/history")
@app.get("/notes")
@app.get("/ai-review")
@app.get("/settings")
@app.get("/login")
@app.get("/setup")
async def serve_spa():
    html = _get_spa_html()
    return HTMLResponse(html, headers={
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
    })
