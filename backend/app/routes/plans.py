from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models.goal import Goal
from ..models.plan_slot import PlanSlot

plans_bp = Blueprint("plans", __name__)


def _current_user_id() -> int:
    return int(get_jwt_identity())


@plans_bp.get("/api/plans")
@jwt_required()
def list_plans():
    uid = _current_user_id()
    q = PlanSlot.query.filter_by(user_id=uid)
    if goal_id := request.args.get("goal_id"):
        q = q.filter_by(goal_id=int(goal_id))
    if year := request.args.get("year"):
        q = q.filter_by(year=int(year))
    if month := request.args.get("month"):
        q = q.filter_by(month=int(month))
    slots = q.order_by(PlanSlot.year, PlanSlot.month, PlanSlot.day).all()
    return jsonify([s.to_dict() for s in slots]), 200


@plans_bp.post("/api/plans")
@jwt_required()
def create_plan():
    uid = _current_user_id()
    data = request.get_json(silent=True) or {}

    goal_id = data.get("goal_id")
    year = data.get("year")
    month = data.get("month")
    duration_minutes = int(data.get("duration_minutes") or 60)

    if not goal_id or not year or not month:
        return jsonify({"error": "goal_id, year und month sind Pflichtfelder"}), 400

    Goal.query.filter_by(id=int(goal_id), user_id=uid).first_or_404()

    slot = PlanSlot(
        user_id=uid,
        goal_id=int(goal_id),
        year=int(year),
        month=int(month),
        day=int(data["day"]) if data.get("day") else None,
        planned_time=data.get("planned_time"),
        duration_minutes=duration_minutes,
        note=data.get("note"),
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
        slot.day = int(data["day"]) if data["day"] else None
    if "planned_time" in data:
        slot.planned_time = data["planned_time"]
    if "duration_minutes" in data:
        slot.duration_minutes = int(data["duration_minutes"])
    if "note" in data:
        slot.note = data["note"]

    db.session.commit()
    return jsonify(slot.to_dict()), 200


@plans_bp.delete("/api/plans/<int:slot_id>")
@jwt_required()
def delete_plan(slot_id: int):
    slot = PlanSlot.query.filter_by(id=slot_id, user_id=_current_user_id()).first_or_404()
    db.session.delete(slot)
    db.session.commit()
    return "", 204
