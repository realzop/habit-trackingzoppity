from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import get_session
from models import AppSetting, AppPassword, HabitConfig, HabitLog, DailyNote
from auth import get_current_session, hash_password, verify_password

router = APIRouter()


class SettingUpdate(BaseModel):
    key: str
    value: str


class ChangePasswordBody(BaseModel):
    current_password: str
    new_password: str


@router.get("")
def get_settings(session: Session = Depends(get_session), _=Depends(get_current_session)):
    settings = session.exec(select(AppSetting)).all()
    result = {}
    for s in settings:
        if s.key == "openai_api_key":
            result[s.key] = s.value[:8] + "..." if len(s.value) > 8 else "***"
        else:
            result[s.key] = s.value
    return result


@router.get("/raw")
def get_settings_raw(session: Session = Depends(get_session), _=Depends(get_current_session)):
    settings = session.exec(select(AppSetting)).all()
    return {s.key: s.value for s in settings}


@router.post("")
def update_settings(updates: list[SettingUpdate], session: Session = Depends(get_session), _=Depends(get_current_session)):
    for u in updates:
        existing = session.exec(
            select(AppSetting).where(AppSetting.key == u.key)
        ).first()
        if existing:
            existing.value = u.value
        else:
            session.add(AppSetting(key=u.key, value=u.value))
    session.commit()
    return {"ok": True}


@router.post("/password")
def change_password(body: ChangePasswordBody, session: Session = Depends(get_session), _=Depends(get_current_session)):
    pw = session.exec(select(AppPassword)).first()
    if not pw or not verify_password(body.current_password, pw.password_hash):
        raise HTTPException(status_code=401, detail="Current password is wrong")
    if len(body.new_password) < 4:
        raise HTTPException(status_code=400, detail="Password too short")
    pw.password_hash = hash_password(body.new_password)
    session.commit()
    return {"ok": True}


@router.post("/ai-review")
def ai_review(session: Session = Depends(get_session), _=Depends(get_current_session)):
    api_key_setting = session.exec(
        select(AppSetting).where(AppSetting.key == "openai_api_key")
    ).first()
    if not api_key_setting or not api_key_setting.value:
        raise HTTPException(status_code=400, detail="OpenAI API key not configured. Go to Settings to add it.")

    from models import HabitLog, HabitConfig
    from datetime import date, timedelta

    start = (date.today() - timedelta(days=30)).isoformat()
    logs = session.exec(select(HabitLog).where(HabitLog.log_date >= start)).all()
    habits = session.exec(select(HabitConfig).where(HabitConfig.active == True)).all()

    habit_map = {h.key: h.name for h in habits}
    data_by_date = {}
    for log in logs:
        if log.log_date not in data_by_date:
            data_by_date[log.log_date] = {}
        name = habit_map.get(log.habit_key, log.habit_key)
        data_by_date[log.log_date][name] = log.value

    if not data_by_date:
        raise HTTPException(status_code=400, detail="No habit data in the last 30 days to review.")

    formatted = ""
    for d in sorted(data_by_date.keys()):
        entries = ", ".join(f"{k}: {v}" for k, v in data_by_date[d].items())
        formatted += f"{d}: {entries}\n"

    prompt = f"""You are a supportive but honest personal habit coach. Analyze the following 30-day habit tracking data and provide:

1. **Patterns** — What patterns do you notice? What's consistent, what's inconsistent?
2. **Wins** — What's going well? Celebrate small victories.
3. **Concerns** — Any worrying trends? Be direct but kind.
4. **Suggestions** — 3-5 specific, actionable things to try in the next week.

Keep it concise, personal, and real. No corporate wellness speak.

Data:
{formatted}"""

    import openai
    client = openai.OpenAI(api_key=api_key_setting.value)
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000,
            temperature=0.7
        )
        return {"review": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")


@router.get("/backup")
def backup_data(session: Session = Depends(get_session), _=Depends(get_current_session)):
    """Export all user data as a JSON backup."""
    habits = session.exec(select(HabitConfig)).all()
    logs = session.exec(select(HabitLog)).all()
    notes = session.exec(select(DailyNote)).all()
    settings = session.exec(select(AppSetting)).all()

    backup = {
        "version": "daycore_backup_v1",
        "exported_at": datetime.utcnow().isoformat(),
        "habits": [h.model_dump() for h in habits],
        "logs": [{"log_date": l.log_date, "habit_key": l.habit_key, "value": l.value} for l in logs],
        "notes": [{"log_date": n.log_date, "tag": n.tag, "note": n.note} for n in notes],
        "settings": [{
            "key": s.key,
            "value": s.value if s.key != "openai_api_key" else ""
        } for s in settings],
    }
    return JSONResponse(
        content=backup,
        headers={"Content-Disposition": "attachment; filename=daycore_backup.json"}
    )


class ImportData(BaseModel):
    version: str
    habits: list = []
    logs: list = []
    notes: list = []
    settings: list = []


@router.post("/import")
def import_data(data: ImportData, session: Session = Depends(get_session), _=Depends(get_current_session)):
    """Import data from a JSON backup. Merges with existing data."""
    if not data.version.startswith("daycore_backup"):
        raise HTTPException(status_code=400, detail="Invalid backup file format")

    imported = {"habits": 0, "logs": 0, "notes": 0, "settings": 0}

    # Import habits (skip if key already exists)
    for h in data.habits:
        existing = session.exec(select(HabitConfig).where(HabitConfig.key == h.get("key"))).first()
        if not existing:
            session.add(HabitConfig(
                key=h["key"], name=h["name"], habit_type=h.get("habit_type", "boolean"),
                goal=h.get("goal"), emoji=h.get("emoji", ""),
                sort_order=h.get("sort_order", 0), active=h.get("active", True),
                archived=h.get("archived", False), version=h.get("version", "v1")
            ))
            imported["habits"] += 1

    # Import logs (skip duplicates by date+key)
    for l in data.logs:
        existing = session.exec(
            select(HabitLog).where(HabitLog.log_date == l["log_date"], HabitLog.habit_key == l["habit_key"])
        ).first()
        if not existing:
            session.add(HabitLog(log_date=l["log_date"], habit_key=l["habit_key"], value=l["value"]))
            imported["logs"] += 1

    # Import notes (skip duplicates by date)
    for n in data.notes:
        existing = session.exec(select(DailyNote).where(DailyNote.log_date == n["log_date"])).first()
        if not existing:
            session.add(DailyNote(log_date=n["log_date"], tag=n.get("tag"), note=n["note"]))
            imported["notes"] += 1

    # Import settings (skip if key already exists, skip empty API keys)
    for s in data.settings:
        if s["key"] == "openai_api_key" and not s.get("value"):
            continue
        existing = session.exec(select(AppSetting).where(AppSetting.key == s["key"])).first()
        if not existing:
            session.add(AppSetting(key=s["key"], value=s["value"]))
            imported["settings"] += 1

    session.commit()
    return {"ok": True, "imported": imported}
