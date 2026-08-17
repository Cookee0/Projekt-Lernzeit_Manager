from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models.goal import Goal
from ..models.plan_slot import PlanSlot
from ..validation import (
    optional_clock_time,
    optional_int_arg,
    optional_text,
    require_day_of_month,
    require_int_in_range,
)

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
