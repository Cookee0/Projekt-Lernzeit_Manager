from datetime import date, datetime, timedelta, timezone

from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import func

from ..extensions import db
from ..models.goal import Goal
from ..models.milestone import Milestone
from ..models.plan_slot import PlanSlot
from ..models.study_session import StudySession
from ..time_utils import iso_utc
from ..workload import weekly_budget_minutes

dashboard_bp = Blueprint("dashboard", __name__)

# Ab wie vielen Tagen ohne abgeschlossene Lernsitzung erinnert wird (FR-7.1).
# Ein einzelner freier Tag ist normal; drei Tage Stillstand bei laufender
# Planung sind der Fall, den die Anforderung meint.
INACTIVITY_DAYS = 3

# Warnung bei nahendem Zieltermin ohne Fortschritt (FR-7.3): gewarnt wird,
# wenn das Zieldatum in hoechstens 14 Tagen liegt und weniger als die Haelfte
# des ECTS-Workloads gelernt ist. Beide Schwellen sind bewusst gewaehlte
# Standardwerte - die Anforderung nennt keine Zahlen.
DEADLINE_WARNING_DAYS = 14
DEADLINE_WARNING_PROGRESS = 0.5

# Laenge der Wochenhistorie fuer die Trendauswertung (FR-6.3).
HISTORY_WEEKS = 8


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

    # FR-4.3 (Darstellung): duration_seconds zaehlt Pausen nie mit (siehe
    # stop_session in backend/app/routes/sessions.py). Die Pausenzeit des
    # Monats wird hier als eigene Kennzahl ausgewiesen.
    paused_seconds = (
        db.session.query(func.coalesce(func.sum(StudySession.total_paused_seconds), 0))
        .filter(
            StudySession.user_id == uid,
            StudySession.status == "completed",
            StudySession.started_at >= month_start,
            StudySession.started_at < month_end,
        )
        .scalar()
    )
    paused_minutes = paused_seconds // 60

    goals = Goal.query.filter_by(user_id=uid).order_by(Goal.target_date).all()

    # Zwischenziele des laufenden Monats laden und nach goal_id gruppieren (FR-3.2).
    month_milestones = (
        Milestone.query.filter_by(user_id=uid, year=year, month=month)
        .order_by(Milestone.due_day, Milestone.id)
        .all()
    )
    milestones_by_goal: dict[int, list] = {}
    for m in month_milestones:
        if m.goal_id is not None:
            milestones_by_goal.setdefault(m.goal_id, []).append(m.to_dict())

    goals_data = []
    deadline_warnings = []
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
                "planned_ects_minutes": goal.effective_workload_minutes(),
                "weekly_budget_minutes": weekly_budget_minutes(
                    goal.effective_workload_minutes(),
                    actual_goal_minutes,
                    goal.target_date,
                    today,
                    goal.status,
                ),
                "milestones": milestones_by_goal.get(goal.id, []),
            }
        )

        # FR-7.3: nahender Zieltermin ohne entsprechenden Fortschritt.
        days_left = (goal.target_date - today).days
        workload = goal.effective_workload_minutes()
        progress = actual_goal_minutes / workload if workload > 0 else 1.0
        if (
            goal.status != "achieved"
            and 0 <= days_left <= DEADLINE_WARNING_DAYS
            and progress < DEADLINE_WARNING_PROGRESS
        ):
            deadline_warnings.append(
                {
                    "goal_id": goal.id,
                    "title": goal.title,
                    "target_date": goal.target_date.isoformat(),
                    "days_left": days_left,
                    "progress_pct": round(progress * 100),
                }
            )

    # FR-6.3: Lernzeit je Kalenderwoche der letzten HISTORY_WEEKS Wochen.
    # Sessions werden in naiver UTC gespeichert; der Wochenmontag wird deshalb
    # ebenfalls in UTC bestimmt. Gruppiert wird in Python - die Datenmenge ist
    # klein und der SQL-Dialekt (SQLite im Test, PostgreSQL im Betrieb) bleibt egal.
    utc_today = datetime.now(timezone.utc).date()
    this_monday = utc_today - timedelta(days=utc_today.weekday())
    history_start = this_monday - timedelta(weeks=HISTORY_WEEKS - 1)
    minutes_per_week = {
        this_monday - timedelta(weeks=i): 0 for i in range(HISTORY_WEEKS - 1, -1, -1)
    }
    history_start_at = datetime(history_start.year, history_start.month, history_start.day)
    history_sessions = StudySession.query.filter(
        StudySession.user_id == uid,
        StudySession.status == "completed",
        StudySession.started_at >= history_start_at,
    ).all()
    for session in history_sessions:
        session_day = session.started_at.date()
        monday = session_day - timedelta(days=session_day.weekday())
        if monday in minutes_per_week:
            minutes_per_week[monday] += (session.duration_seconds or 0) // 60
    weekly_history = [
        {"week_start": monday.isoformat(), "minutes": minutes}
        for monday, minutes in minutes_per_week.items()
    ]

    milestones_total = len(month_milestones)
    milestones_done = sum(1 for m in month_milestones if m.done)

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
                "paused_minutes": paused_minutes,
            },
            "goals": goals_data,
            "weekly_history": weekly_history,
            "deadline_warnings": deadline_warnings,
            "milestones": {"done": milestones_done, "total": milestones_total},
            "inactivity_warning": inactivity_warning,
            "reminder_text": reminder_text,
            "active_session": active_data,
        }
    ), 200
