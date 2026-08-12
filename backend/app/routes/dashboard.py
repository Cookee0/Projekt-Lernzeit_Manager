from datetime import date, datetime

from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import func

from ..extensions import db
from ..models.goal import Goal
from ..models.plan_slot import PlanSlot
from ..models.study_session import StudySession
from ..time_utils import iso_utc

dashboard_bp = Blueprint("dashboard", __name__)

MINUTES_PER_ECTS = 30 * 60  # 30 hours per ECTS credit, expressed in minutes


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
        goals_data.append(
            {
                **goal.to_dict(),
                "total_actual_minutes": total_sec // 60,
                "planned_ects_minutes": goal.ects * MINUTES_PER_ECTS,
            }
        )

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
    inactivity_warning = today_slots > 0 and today_sessions == 0

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
            "inactivity_warning": inactivity_warning,
            "active_session": active_data,
        }
    ), 200
