from sqlmodel import Session, select
from database import engine
from models import HabitConfig, AppSetting, DEFAULT_HABITS


def seed_defaults():
    with Session(engine) as session:
        existing = session.exec(select(HabitConfig)).first()
        if not existing:
            for h in DEFAULT_HABITS:
                session.add(HabitConfig(**h))
            session.commit()

        theme = session.exec(
            select(AppSetting).where(AppSetting.key == "theme")
        ).first()
        if not theme:
            session.add(AppSetting(key="theme", value="dark"))
            session.commit()
