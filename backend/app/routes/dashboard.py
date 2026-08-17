from datetime import date, datetime, timezone

from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import func

from ..extensions import db
from ..models.goal import Goal
from ..models.milestone import Milestone
from ..models.plan_slot import PlanSlot
from ..models.study_session import StudySession
from ..time_utils import iso_utc
from ..workload import MINUTES_PER_ECTS, weekly_budget_minutes

dashboard_bp = Blueprint("dashboard", __name__)

# Ab wie vielen Tagen ohne abgeschlossene Lernsitzung erinnert wird (FR-7.1).
# Ein einzelner freier Tag ist normal; drei Tage Stillstand bei laufender
# Planung sind der Fall, den die Anforderung meint.
INACTIVITY_DAYS = 3


def _current_user_id() -> int:
    return int(get_jwt_identity())


@dashboard_bp.get("/api/dashboard")
@jwt_required()
def dashboard():
    uid = _current_user_id()
    today = date.today()
    year, month = today.year, today.month

    planned_minutes = (
        db.session.query(func.coalesce(func.sum(PlanSlot.duration_minutes), 0))
        .filter_by(user_id=uid, year=year, month=month)
        .scalar()
    )

    month_start = datetime(year, month, 1)
    if month == 12:
        month_end = datetime(year + 1, 1, 1)
    else:
        month_end = datetime(year, month + 1, 1)

    actual_seconds = (
        db.session.query(func.coalesce(func.sum(StudySession.duration_seconds), 0))
        .filter(
            StudySession.user_id == uid,
            StudySession.status == "completed",
            StudySession.started_at >= month_start,
            StudySession.started_at < month_end,
        )
        .scalar()
    )
    actual_minutes = actual_seconds // 60

    goals = Goal.query.filter_by(user_id=uid).order_by(Goal.target_date).all()
    goals_data = []
    for goal in goals:
        total_sec = (
            db.session.query(func.coalesce(func.sum(StudySession.duration_seconds), 0))
            .filter_by(user_id=uid, goal_id=goal.id, status="completed")
            .scalar()
        )
        actual_goal_minutes = total_sec // 60
        goals_data.append(
            {
                **goal.to_dict(),
                "total_actual_minutes": actual_goal_minutes,
                "planned_ects_minutes": goal.ects * MINUTES_PER_ECTS,
                "weekly_budget_minutes": weekly_budget_minutes(
                    goal.ects, actual_goal_minutes, goal.target_date, today, goal.status
                ),
            }
        )

    milestones_total = Milestone.query.filter_by(user_id=uid, year=year, month=month).count()
    milestones_done = Milestone.query.filter_by(
        user_id=uid, year=year, month=month, done=True
    ).count()

    today_slots = (
        PlanSlot.query.filter_by(user_id=uid, year=year, month=month, day=today.day).count()
    )
    today_start = datetime(year, month, today.day)
    today_end = datetime(year, month, today.day, 23, 59, 59)
    today_sessions = StudySession.query.filter(
        StudySession.user_id == uid,
        StudySession.started_at >= today_start,
        StudySession.started_at <= today_end,
    ).count()

    last_session_start = (
        db.session.query(func.max(StudySession.started_at))
        .filter(StudySession.user_id == uid, StudySession.status == "completed")
        .scalar()
    )
    days_since_last_session = None
    if last_session_start is not None:
        # StudySession.started_at ist naiv-UTC (siehe _now in
        # backend/app/routes/sessions.py). Ein Vergleich gegen date.today()
        # (lokale Zeit) wuerde nahe Mitternacht je nach Zeitzone einen Tag
        # daneben liegen; deshalb wird konsequent in UTC gerechnet.
        now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        days_since_last_session = (now_utc - last_session_start).days

    reminder_text = None
    if today_slots > 0 and today_sessions == 0:
        reminder_text = (
            "Du hast heute Lernzeit geplant, aber noch keine Session gestartet. Jetzt loslegen?"
        )
    elif planned_minutes > 0:
        if days_since_last_session is None:
            reminder_text = (
                "Für diesen Monat ist Lernzeit geplant, aber du hast noch keine Session "
                "aufgezeichnet. Starte den Timer, damit dein Fortschritt sichtbar wird."
            )
        elif days_since_last_session >= INACTIVITY_DAYS:
            reminder_text = (
                f"Seit {days_since_last_session} Tagen hast du keine Lernzeit erfasst, "
                "obwohl für diesen Monat Lernzeit geplant ist."
            )

    inactivity_warning = reminder_text is not None

    active = StudySession.query.filter(
        StudySession.user_id == uid,
        StudySession.status.in_(["active", "paused"]),
    ).first()
    active_data = None
    if active:
        active_data = {
            "id": active.id,
            "goal_id": active.goal_id,
            "goal_title": active.goal.title,
            "started_at": iso_utc(active.started_at),
            "status": active.status,
        }

    return jsonify(
        {
            "current_month": {
                "year": year,
                "month": month,
                "planned_minutes": planned_minutes,
                "actual_minutes": actual_minutes,
            },
            "goals": goals_data,
            "milestones": {"done": milestones_done, "total": milestones_total},
            "inactivity_warning": inactivity_warning,
            "reminder_text": reminder_text,
            "active_session": active_data,
        }
    ), 200
