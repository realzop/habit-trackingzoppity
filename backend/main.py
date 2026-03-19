import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from database import init_db
from routes_auth import router as auth_router
from routes_habits import router as habits_router
from routes_settings import router as settings_router


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

# Serve frontend static files
FRONTEND_DIR = os.environ.get("FRONTEND_DIR", "/app/frontend")

app.mount("/css", StaticFiles(directory=f"{FRONTEND_DIR}/css"), name="css")
app.mount("/js", StaticFiles(directory=f"{FRONTEND_DIR}/js"), name="js")


@app.get("/")
@app.get("/dashboard")
@app.get("/history")
@app.get("/ai-review")
@app.get("/settings")
@app.get("/login")
@app.get("/setup")
async def serve_spa():
    return FileResponse(f"{FRONTEND_DIR}/index.html")
