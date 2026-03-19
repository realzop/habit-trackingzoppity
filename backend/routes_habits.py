from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional
from datetime import date, timedelta
from database import get_session
from models import HabitLog, HabitConfig
from auth import get_current_session

router = APIRouter()


class HabitEntry(BaseModel):
    habit_key: str
    value: str


class HabitConfigUpdate(BaseModel):
    key: str
    name: str
    habit_type: str = "boolean"
    goal: Optional[str] = None
    emoji: Optional[str] = None
    sort_order: int = 0
    active: bool = True
    archived: bool = False
    version: str = "v1"


@router.get("/today")
def get_today(session: Session = Depends(get_session), _=Depends(get_current_session)):
    today = date.today().isoformat()
    logs = session.exec(select(HabitLog).where(HabitLog.log_date == today)).all()
    return {log.habit_key: log.value for log in logs}


@router.post("/today")
def save_today(entries: list[HabitEntry], session: Session = Depends(get_session), _=Depends(get_current_session)):
    today = date.today().isoformat()
    for entry in entries:
        existing = session.exec(
            select(HabitLog).where(
                HabitLog.log_date == today,
                HabitLog.habit_key == entry.habit_key
            )
        ).first()
        if existing:
            existing.value = entry.value
        else:
            session.add(HabitLog(log_date=today, habit_key=entry.habit_key, value=entry.value))
    session.commit()
    return {"ok": True}


@router.get("/history")
def get_history(month: str, session: Session = Depends(get_session), _=Depends(get_current_session)):
    # month format: YYYY-MM
    logs = session.exec(
        select(HabitLog).where(HabitLog.log_date.startswith(month))
    ).all()
    result = {}
    for log in logs:
        if log.log_date not in result:
            result[log.log_date] = {}
        result[log.log_date][log.habit_key] = log.value
    return result


@router.get("/range")
def get_range(days: int = 30, session: Session = Depends(get_session), _=Depends(get_current_session)):
    start = (date.today() - timedelta(days=days)).isoformat()
    logs = session.exec(
        select(HabitLog).where(HabitLog.log_date >= start)
    ).all()
    result = {}
    for log in logs:
        if log.log_date not in result:
            result[log.log_date] = {}
        result[log.log_date][log.habit_key] = log.value
    return result


@router.get("/list")
def get_habits(session: Session = Depends(get_session), _=Depends(get_current_session)):
    habits = session.exec(
        select(HabitConfig).where(HabitConfig.archived == False).order_by(HabitConfig.sort_order)
    ).all()
    return [h.model_dump() for h in habits]


@router.post("/list")
def update_habits(habits: list[HabitConfigUpdate], session: Session = Depends(get_session), _=Depends(get_current_session)):
    # Remove only non-archived configs and replace
    existing = session.exec(select(HabitConfig).where(HabitConfig.archived == False)).all()
    for h in existing:
        session.delete(h)
    session.commit()
    for h in habits:
        session.add(HabitConfig(**h.model_dump()))
    session.commit()
    return {"ok": True}


@router.delete("/{habit_key}")
def archive_habit(habit_key: str, session: Session = Depends(get_session), _=Depends(get_current_session)):
    habit = session.exec(select(HabitConfig).where(HabitConfig.key == habit_key)).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    habit.archived = True
    habit.active = False
    session.commit()
    return {"ok": True}
