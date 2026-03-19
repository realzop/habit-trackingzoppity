from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional
from datetime import date
from database import get_session
from models import DailyNote
from auth import get_current_session
import csv
import io

router = APIRouter()


class NoteEntry(BaseModel):
    log_date: Optional[str] = None
    tag: Optional[str] = None
    note: str


@router.post("")
def save_note(entry: NoteEntry, session: Session = Depends(get_session), _=Depends(get_current_session)):
    log_date = entry.log_date or date.today().isoformat()
    # Update existing note for this date or create new
    existing = session.exec(
        select(DailyNote).where(DailyNote.log_date == log_date)
    ).first()
    if existing:
        existing.note = entry.note
        existing.tag = entry.tag
    else:
        session.add(DailyNote(log_date=log_date, tag=entry.tag, note=entry.note))
    session.commit()
    return {"ok": True}


@router.get("")
def get_notes(session: Session = Depends(get_session), _=Depends(get_current_session)):
    notes = session.exec(select(DailyNote).order_by(DailyNote.log_date.desc())).all()
    return [{"id": n.id, "log_date": n.log_date, "tag": n.tag, "note": n.note} for n in notes]


@router.get("/today")
def get_today_note(session: Session = Depends(get_session), _=Depends(get_current_session)):
    today = date.today().isoformat()
    note = session.exec(select(DailyNote).where(DailyNote.log_date == today)).first()
    if note:
        return {"log_date": note.log_date, "tag": note.tag, "note": note.note}
    return {"log_date": today, "tag": None, "note": ""}


@router.get("/export")
def export_notes(tag: str = "all", format: str = "csv", session: Session = Depends(get_session), _=Depends(get_current_session)):
    query = select(DailyNote).order_by(DailyNote.log_date.desc())
    if tag and tag != "all":
        query = query.where(DailyNote.tag == tag)
    notes = session.exec(query).all()

    if format == "txt":
        lines = []
        for n in notes:
            lines.append(f"[{n.log_date}] [{n.tag or 'Untagged'}]")
            lines.append(n.note)
            lines.append("")
        content = "\n".join(lines)
        return StreamingResponse(
            io.BytesIO(content.encode()),
            media_type="text/plain",
            headers={"Content-Disposition": "attachment; filename=daycore_notes.txt"}
        )
    else:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Date", "Tag", "Note"])
        for n in notes:
            writer.writerow([n.log_date, n.tag or "", n.note])
        content = output.getvalue()
        return StreamingResponse(
            io.BytesIO(content.encode()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=daycore_notes.csv"}
        )
