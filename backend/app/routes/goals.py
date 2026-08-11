from datetime import date

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models.goal import VALID_STATUSES, Goal

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
    title = (data.get("title") or "").strip()
    module_name = (data.get("module_name") or "").strip()
    target_date_str = data.get("target_date") or ""
    ects = int(data.get("ects") or 5)
    status = data.get("status") or "open"

    if not title or not module_name or not target_date_str:
        return jsonify({"error": "title, module_name und target_date sind Pflichtfelder"}), 400
    if status not in VALID_STATUSES:
        return jsonify({"error": f"status muss einer von {VALID_STATUSES} sein"}), 400

    try:
        target_date = date.fromisoformat(target_date_str)
    except ValueError:
        return jsonify({"error": "target_date muss ISO-Format YYYY-MM-DD haben"}), 400

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
        goal.title = (data["title"] or "").strip() or goal.title
    if "module_name" in data:
        goal.module_name = (data["module_name"] or "").strip() or goal.module_name
    if "target_date" in data:
        try:
            goal.target_date = date.fromisoformat(data["target_date"])
        except ValueError:
            return jsonify({"error": "target_date muss ISO-Format YYYY-MM-DD haben"}), 400
    if "ects" in data:
        goal.ects = int(data["ects"])
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
