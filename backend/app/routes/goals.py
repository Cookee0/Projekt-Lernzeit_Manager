from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models.goal import VALID_STATUSES, Goal
from ..validation import require_future_date, require_int_in_range, require_text

goals_bp = Blueprint("goals", __name__)


def _current_user_id() -> int:
    return int(get_jwt_identity())


@goals_bp.get("/api/goals")
@jwt_required()
def list_goals():
    goals = Goal.query.filter_by(user_id=_current_user_id()).order_by(Goal.target_date).all()
    return jsonify([g.to_dict() for g in goals]), 200


@goals_bp.post("/api/goals")
@jwt_required()
def create_goal():
    data = request.get_json(silent=True) or {}
    title = require_text(data.get("title"), "Titel", 255)
    module_name = require_text(data.get("module_name"), "Modul/Kurs", 255)
    target_date = require_future_date(data.get("target_date"), "Zieldatum")
    ects = require_int_in_range(data.get("ects"), "ECTS-Punkte", 1, 30, default=5)
    status = data.get("status") or "open"

    if status not in VALID_STATUSES:
        return jsonify({"error": f"status muss einer von {VALID_STATUSES} sein"}), 400

    goal = Goal(
        user_id=_current_user_id(),
        title=title,
        module_name=module_name,
        target_date=target_date,
        ects=ects,
        status=status,
    )
    db.session.add(goal)
    db.session.commit()
    return jsonify(goal.to_dict()), 201


@goals_bp.get("/api/goals/<int:goal_id>")
@jwt_required()
def get_goal(goal_id: int):
    goal = Goal.query.filter_by(id=goal_id, user_id=_current_user_id()).first_or_404()
    return jsonify(goal.to_dict()), 200


@goals_bp.put("/api/goals/<int:goal_id>")
@jwt_required()
def update_goal(goal_id: int):
    goal = Goal.query.filter_by(id=goal_id, user_id=_current_user_id()).first_or_404()
    data = request.get_json(silent=True) or {}

    if "title" in data:
        goal.title = require_text(data["title"], "Titel", 255)
    if "module_name" in data:
        goal.module_name = require_text(data["module_name"], "Modul/Kurs", 255)
    if "target_date" in data:
        goal.target_date = require_future_date(data["target_date"], "Zieldatum")
    if "ects" in data:
        goal.ects = require_int_in_range(data["ects"], "ECTS-Punkte", 1, 30)
    if "status" in data:
        if data["status"] not in VALID_STATUSES:
            return jsonify({"error": f"status muss einer von {VALID_STATUSES} sein"}), 400
        goal.status = data["status"]

    db.session.commit()
    return jsonify(goal.to_dict()), 200


@goals_bp.delete("/api/goals/<int:goal_id>")
@jwt_required()
def delete_goal(goal_id: int):
    goal = Goal.query.filter_by(id=goal_id, user_id=_current_user_id()).first_or_404()
    db.session.delete(goal)
    db.session.commit()
    return "", 204
