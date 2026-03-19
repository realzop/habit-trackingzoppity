from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date, datetime
import json


class AppPassword(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    password_hash: str


class SessionToken(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    token: str = Field(index=True, unique=True)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    expires_at: str


class HabitConfig(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    key: str = Field(index=True, unique=True)
    name: str
    habit_type: str = "boolean"  # "boolean" or "number"
    goal: Optional[str] = None  # e.g. "<=5" for cigarettes
    emoji: Optional[str] = None
    sort_order: int = 0
    active: bool = True
    archived: bool = False
    version: str = "v1"


class HabitLog(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    log_date: str = Field(index=True)  # YYYY-MM-DD
    habit_key: str
    value: str  # stored as string, parsed by type


class DailyNote(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    log_date: str = Field(index=True)  # YYYY-MM-DD
    tag: Optional[str] = None
    note: str


class AppSetting(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    key: str = Field(index=True, unique=True)
    value: str


DEFAULT_HABITS = [
    {"key": "habit_1", "name": "Habit 1", "habit_type": "boolean", "emoji": "", "sort_order": 0, "version": "v1"},
    {"key": "habit_2", "name": "Habit 2", "habit_type": "boolean", "emoji": "", "sort_order": 1, "version": "v1"},
    {"key": "habit_3", "name": "Habit 3", "habit_type": "boolean", "emoji": "", "sort_order": 2, "version": "v1"},
    {"key": "habit_4", "name": "Habit 4", "habit_type": "boolean", "emoji": "", "sort_order": 3, "version": "v1"},
    {"key": "habit_5", "name": "Habit 5", "habit_type": "boolean", "emoji": "", "sort_order": 4, "version": "v1"},
    {"key": "daily_count", "name": "Daily Count", "habit_type": "number", "goal": None, "emoji": "", "sort_order": 5, "version": "v1"},
    {"key": "mood", "name": "Mood", "habit_type": "number", "goal": "1-5", "emoji": "", "sort_order": 6, "version": "v1"},
]
