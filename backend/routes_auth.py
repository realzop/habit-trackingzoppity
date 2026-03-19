from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlmodel import Session, select
from pydantic import BaseModel
from database import get_session
from models import AppPassword
from auth import (
    hash_password, verify_password, create_session,
    is_setup_done, SESSION_COOKIE, SESSION_EXPIRY_DAYS
)

router = APIRouter()


class PasswordBody(BaseModel):
    password: str


class ChangePasswordBody(BaseModel):
    current_password: str
    new_password: str


@router.get("/status")
def auth_status(session: Session = Depends(get_session)):
    return {"setup_done": is_setup_done(session)}


@router.post("/setup")
def setup(body: PasswordBody, session: Session = Depends(get_session)):
    if is_setup_done(session):
        raise HTTPException(status_code=400, detail="Already set up")
    if len(body.password) < 4:
        raise HTTPException(status_code=400, detail="Password too short")
    pw = AppPassword(password_hash=hash_password(body.password))
    session.add(pw)
    session.commit()
    token = create_session(session)
    resp = JSONResponse({"ok": True})
    resp.set_cookie(
        SESSION_COOKIE, token,
        max_age=SESSION_EXPIRY_DAYS * 86400,
        httponly=True, samesite="lax"
    )
    return resp


@router.post("/login")
def login(body: PasswordBody, session: Session = Depends(get_session)):
    pw = session.exec(select(AppPassword)).first()
    if not pw or not verify_password(body.password, pw.password_hash):
        raise HTTPException(status_code=401, detail="Wrong password")
    token = create_session(session)
    resp = JSONResponse({"ok": True})
    resp.set_cookie(
        SESSION_COOKIE, token,
        max_age=SESSION_EXPIRY_DAYS * 86400,
        httponly=True, samesite="lax"
    )
    return resp


@router.post("/logout")
def logout():
    resp = JSONResponse({"ok": True})
    resp.delete_cookie(SESSION_COOKIE)
    return resp
