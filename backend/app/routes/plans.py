from datetime import date

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import func

from ..extensions import db
from ..models.goal import Goal
from ..models.plan_slot import PlanSlot
from ..models.study_session import StudySession
from ..validation import (
    ValidationError,
    optional_clock_time,
    optional_int_arg,
    optional_text,
    require_day_of_month,
    require_int_in_range,
)
from ..workload import months_until, remaining_minutes, weekly_budget_minutes

plans_bp = Blueprint("plans", __name__)


def _current_user_id() -> int:
    return int(get_jwt_identity())


@plans_bp.get("/api/plans")
@jwt_required()
def list_plans():
    uid = _current_user_id()
    goal_id = optional_int_arg(request.args.get("goal_id"), "Lernziel", 1, 2_147_483_647)
    year = optional_int_arg(request.args.get("year"), "Jahr", 2020, 2100)
    month = optional_int_arg(request.args.get("month"), "Monat", 1, 12)

    q = PlanSlot.query.filter_by(user_id=uid)
    if goal_id is not None:
        q = q.filter_by(goal_id=goal_id)
    if year is not None:
        q = q.filter_by(year=year)
    if month is not None:
        q = q.filter_by(month=month)
    slots = q.order_by(PlanSlot.year, PlanSlot.month, PlanSlot.day).all()
    return jsonify([s.to_dict() for s in slots]), 200


@plans_bp.get("/api/plans/proposal")
@jwt_required()
def plan_proposal():
    """Grobplanung (FR-2.1, FR-2.2, FR-3.3): Wochenbudget je Modul, Monatsvorschlag
    und Abweichung zur bereits geplanten Zeit im angefragten Monat.

    Der Vorschlag verteilt den Restaufwand (ECTS-Workload minus gelernte Zeit)
    gleichmaessig auf die Kalendermonate bis zum Zieldatum. Slots legt er
    bewusst nicht an - die Nutzerin plant selbst (manuell anpassbar).
    """
    uid = _current_user_id()
    year = optional_int_arg(request.args.get("year"), "Jahr", 2020, 2100)
    month = optional_int_arg(request.args.get("month"), "Monat", 1, 12)
    if (year is None) != (month is None):
        raise ValidationError("Jahr und Monat gehören zusammen")
    if year is None:
        today = date.today()
        year, month = today.year, today.month
    else:
        today = date.today()
    month_first = date(year, month, 1)

    goals = (
        Goal.query.filter(
            Goal.user_id == uid,
            Goal.status != "achieved",
            Goal.target_date >= month_first,
        )
        .order_by(Goal.target_date)
        .all()
    )

    result = []
    for goal in goals:
        actual_sec = (
            db.session.query(func.coalesce(func.sum(StudySession.duration_seconds), 0))
            .filter_by(user_id=uid, goal_id=goal.id, status="completed")
            .scalar()
        )
        actual_minutes = actual_sec // 60
        rest = remaining_minutes(goal.ects, actual_minutes)
        suggested = round(rest / months_until(goal.target_date, year, month))
        planned = (
            db.session.query(func.coalesce(func.sum(PlanSlot.duration_minutes), 0))
            .filter_by(user_id=uid, goal_id=goal.id, year=year, month=month)
            .scalar()
        )
        result.append(
            {
                "goal_id": goal.id,
                "title": goal.title,
                "module_name": goal.module_name,
                "weekly_budget_minutes": weekly_budget_minutes(
                    goal.ects, actual_minutes, goal.target_date, today, goal.status
                ),
                "suggested_month_minutes": suggested,
                "planned_minutes": planned,
                "deviation_minutes": planned - suggested,
            }
        )

    return jsonify({"year": year, "month": month, "goals": result}), 200


@plans_bp.post("/api/plans")
@jwt_required()
def create_plan():
    uid = _current_user_id()
    data = request.get_json(silent=True) or {}

    goal_id = require_int_in_range(data.get("goal_id"), "Lernziel", 1, 2_147_483_647)
    year = require_int_in_range(data.get("year"), "Jahr", 2020, 2100)
    month = require_int_in_range(data.get("month"), "Monat", 1, 12)
    day = require_day_of_month(data.get("day"), year, month)
    duration_minutes = require_int_in_range(
        data.get("duration_minutes"), "Dauer in Minuten", 5, 480, default=60
    )
    planned_time = optional_clock_time(data.get("planned_time"))
    note = optional_text(data.get("note"), "Notiz", 500)

    Goal.query.filter_by(id=goal_id, user_id=uid).first_or_404()

    slot = PlanSlot(
        user_id=uid,
        goal_id=goal_id,
        year=year,
        month=month,
        day=day,
        planned_time=planned_time,
        duration_minutes=duration_minutes,
        note=note,
    )
    db.session.add(slot)
    db.session.commit()
    return jsonify(slot.to_dict()), 201


@plans_bp.put("/api/plans/<int:slot_id>")
@jwt_required()
def update_plan(slot_id: int):
    slot = PlanSlot.query.filter_by(id=slot_id, user_id=_current_user_id()).first_or_404()
    data = request.get_json(silent=True) or {}

    if "day" in data:
        slot.day = require_day_of_month(data["day"], slot.year, slot.month)
    if "planned_time" in data:
        slot.planned_time = optional_clock_time(data["planned_time"])
    if "duration_minutes" in data:
        slot.duration_minutes = require_int_in_range(
            data["duration_minutes"], "Dauer in Minuten", 5, 480
        )
    if "note" in data:
        slot.note = optional_text(data["note"], "Notiz", 500)

    db.session.commit()
    return jsonify(slot.to_dict()), 200


@plans_bp.delete("/api/plans/<int:slot_id>")
@jwt_required()
def delete_plan(slot_id: int):
    slot = PlanSlot.query.filter_by(id=slot_id, user_id=_current_user_id()).first_or_404()
    db.session.delete(slot)
    db.session.commit()
    return "", 204


@plans_bp.post("/api/plans/series")
@jwt_required()
def create_plan_series():
    """Legt mehrere Lernzeit-Slots in einer Transaktion an (FR-3.3).

    Serientermine wie „jeden Mittwoch im September 90 Minuten Mathe".
    """
    uid = _current_user_id()
    data = request.get_json(silent=True) or {}

    goal_id = require_int_in_range(data.get("goal_id"), "Lernziel", 1, 2_147_483_647)
    year = require_int_in_range(data.get("year"), "Jahr", 2020, 2100)
    month = require_int_in_range(data.get("month"), "Monat", 1, 12)

    days = data.get("days")
    if not isinstance(days, list) or not 1 <= len(days) <= 31:
        raise ValidationError("Tage müssen eine Liste mit 1 bis 31 Einträgen sein")
    # Prüfe auf fehlende Einträge: None oder leere Strings (wie _is_missing in validation.py)
    for d in days:
        if d is None or (isinstance(d, str) and d.strip() == ""):
            raise ValidationError("Tage müssen eine Liste mit 1 bis 31 Einträgen sein")

    checked = [require_day_of_month(d, year, month) for d in days]
    if len(set(checked)) != len(checked):
        raise ValidationError("Tage dürfen sich nicht wiederholen")

    duration_minutes = require_int_in_range(
        data.get("duration_minutes"), "Dauer in Minuten", 5, 480, default=60
    )
    planned_time = optional_clock_time(data.get("planned_time"))
    note = optional_text(data.get("note"), "Notiz", 500)

    # Ziel laden und prüfen, dass es dem aktuellen User gehört
    Goal.query.filter_by(id=goal_id, user_id=uid).first_or_404()

    # Slots anlegen: für jeden Tag ein PlanSlot-Objekt
    slots = []
    for day in sorted(checked):
        slot = PlanSlot(
            user_id=uid,
            goal_id=goal_id,
            year=year,
            month=month,
            day=day,
            planned_time=planned_time,
            duration_minutes=duration_minutes,
            note=note,
        )
        slots.append(slot)
        db.session.add(slot)

    db.session.commit()
    return jsonify([s.to_dict() for s in slots]), 201
