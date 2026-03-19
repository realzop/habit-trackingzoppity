import os
import sqlite3
from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///data/daycore.db")

engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})


def _get_sqlite_path():
    url = DATABASE_URL.replace("sqlite:///", "")
    return url


def _migrate():
    """Add new columns to existing tables if missing."""
    db_path = _get_sqlite_path()
    if not os.path.exists(db_path):
        return
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    # Add archived column to habitconfig if missing
    try:
        cursor.execute("SELECT archived FROM habitconfig LIMIT 1")
    except sqlite3.OperationalError:
        try:
            cursor.execute("ALTER TABLE habitconfig ADD COLUMN archived BOOLEAN DEFAULT 0")
            conn.commit()
        except sqlite3.OperationalError:
            pass  # Table doesn't exist yet, create_all() will handle it
    conn.close()


def init_db():
    _migrate()
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
