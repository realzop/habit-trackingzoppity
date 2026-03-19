import os
import secrets
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, Depends
from sqlmodel import Session, select
from models import AppPassword, SessionToken
from database import get_session
import bcrypt

SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-production")
SESSION_COOKIE = "daycore_session"
SESSION_EXPIRY_DAYS = 30


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_session(session: Session) -> str:
    token = secrets.token_urlsafe(48)
    expires = (datetime.utcnow() + timedelta(days=SESSION_EXPIRY_DAYS)).isoformat()
    db_session = SessionToken(token=token, expires_at=expires)
    session.add(db_session)
    session.commit()
    return token


def get_current_session(request: Request, session: Session = Depends(get_session)):
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    stmt = select(SessionToken).where(SessionToken.token == token)
    db_session = session.exec(stmt).first()
    if not db_session:
        raise HTTPException(status_code=401, detail="Invalid session")
    if datetime.fromisoformat(db_session.expires_at) < datetime.utcnow():
        session.delete(db_session)
        session.commit()
        raise HTTPException(status_code=401, detail="Session expired")
    return db_session


def is_setup_done(session: Session) -> bool:
    stmt = select(AppPassword)
    return session.exec(stmt).first() is not None
