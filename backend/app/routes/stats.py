"""Auswertungs-Endpunkt GET /api/stats (FR-6.4, Plan P11).

Liefert Kennzahlen fuer den Auswertungs-Tab: Fortschritt je Lernziel,
geplante/tatsaechliche Lernzeit der letzten sechs Kalendermonate, die
Verteilung der Lernzeit nach Tageszeit sowie die Liste erreichter Lernziele.
"""

from datetime import date

from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import func

from ..extensions import db
from ..models.goal import Goal
from ..models.plan_slot import PlanSlot
from ..models.study_session import StudySession
from ..workload import MINUTES_PER_ECTS

stats_bp = Blueprint("stats", __name__)

# Anzahl Kalendermonate in per_month, einschliesslich des laufenden Monats.
PER_MONTH_COUNT = 6

# Schwellen fuer die Ampel je Lernziel - dieselben wie progressClass im
# Dashboard-Frontend (frontend/src/app/features/dashboard/dashboard.ts).
AMPEL_GRUEN_AB = 100
AMPEL_GELB_AB = 50


def _current_user_id() -> int:
    return int(get_jwt_identity())


def _ampel(progress_pct: int) -> str:
    if progress_pct >= AMPEL_GRUEN_AB:
        return "gruen"
    if progress_pct >= AMPEL_GELB_AB:
        return "gelb"
    return "rot"


def _last_n_months(year: int, month: int, n: int) -> list[tuple[int, int]]:
    """n Kalendermonate bis einschliesslich (year, month), aelteste zuerst."""
    months = []
    y, m = year, month
    for _ in range(n):
        months.append((y, m))
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    return list(reversed(months))


@stats_bp.get("/api/stats")
@jwt_required()
def stats():
    uid = _current_user_id()
    today = date.today()

    # per_goal: Fortschritt je Lernziel, unabhaengig vom Status.
    goals = Goal.query.filter_by(user_id=uid).all()
    per_goal = []
    for goal in goals:
        total_sec = (
            db.session.query(func.coalesce(func.sum(StudySession.duration_seconds), 0))
            .filter_by(user_id=uid, goal_id=goal.id, status="completed")
            .scalar()
        )
        total_actual_minutes = total_sec // 60
        planned_ects_minutes = goal.ects * MINUTES_PER_ECTS
        progress_pct = (
            round(total_actual_minutes / planned_ects_minutes * 100)
            if planned_ects_minutes > 0
            else 0
        )
        per_goal.append(
            {
                "goal_id": goal.id,
                "title": goal.title,
                "module_name": goal.module_name,
                "planned_ects_minutes": planned_ects_minutes,
                "total_actual_minutes": total_actual_minutes,
                "progress_pct": progress_pct,
                "ampel": _ampel(progress_pct),
            }
        )

    # per_month: letzte PER_MONTH_COUNT Kalendermonate inkl. laufendem Monat,
    # aelteste zuerst. Gruppierung in Python (nicht per SQL GROUP BY auf
    # Datumsfunktionen), damit SQLite (Tests) und PostgreSQL (Betrieb) gleich
    # behandelt werden - wie bereits die Wochenhistorie in dashboard.py.
    months = _last_n_months(today.year, today.month, PER_MONTH_COUNT)
    planned_by_month = {key: 0 for key in months}
    actual_by_month = {key: 0 for key in months}

    slots = PlanSlot.query.filter_by(user_id=uid).all()
    for slot in slots:
        key = (slot.year, slot.month)
        if key in planned_by_month:
            planned_by_month[key] += slot.duration_minutes

    # by_daytime: Minuten aller abgeschlossenen Sessions, gebuckelt nach der
    # Stunde von started_at (naiv-UTC, keine Konvertierung). In derselben
    # Schleife wird auch actual_by_month befuellt (eine Session traegt zu
    # hoechstens einem Monat und einer Tageszeit bei).
    by_daytime = {
        "morning_minutes": 0,
        "afternoon_minutes": 0,
        "evening_minutes": 0,
        "night_minutes": 0,
    }
    completed_sessions = StudySession.query.filter_by(user_id=uid, status="completed").all()
    for session in completed_sessions:
        minutes = (session.duration_seconds or 0) // 60

        key = (session.started_at.year, session.started_at.month)
        if key in actual_by_month:
            actual_by_month[key] += minutes

        hour = session.started_at.hour
        if 5 <= hour <= 11:
            by_daytime["morning_minutes"] += minutes
        elif 12 <= hour <= 17:
            by_daytime["afternoon_minutes"] += minutes
        elif 18 <= hour <= 23:
            by_daytime["evening_minutes"] += minutes
        else:
            by_daytime["night_minutes"] += minutes

    per_month = [
        {
            "year": y,
            "month": m,
            "planned_minutes": planned_by_month[(y, m)],
            "actual_minutes": actual_by_month[(y, m)],
        }
        for y, m in months
    ]

    # achieved_goals: erreichte Lernziele, neuestes Zieldatum zuerst.
    achieved = (
        Goal.query.filter_by(user_id=uid, status="achieved")
        .order_by(Goal.target_date.desc())
        .all()
    )
    achieved_goals = [
        {
            "goal_id": goal.id,
            "title": goal.title,
            "module_name": goal.module_name,
            "grade": goal.grade,
            "result_note": goal.result_note,
            "target_date": goal.target_date.isoformat(),
        }
        for goal in achieved
    ]

    return jsonify(
        {
            "per_goal": per_goal,
            "per_month": per_month,
            "by_daytime": by_daytime,
            "achieved_goals": achieved_goals,
        }
    ), 200
