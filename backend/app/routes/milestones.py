"""Monatliche Zwischenziele (FR-3.2).

Aufbau und Zuschnitt folgen backend/app/routes/plans.py: Jede Abfrage
filtert auf den angemeldeten Benutzer, jeder Einzelzugriff endet auf
first_or_404(). Ein fremder Datensatz liefert deshalb HTTP 404 und nicht
403 - die Existenz fremder Daten wird nicht verraten.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models.goal import Goal
from ..models.milestone import Milestone
from ..validation import (
    optional_int_arg,
    require_day_of_month,
    require_int_in_range,
    require_text,
)

milestones_bp = Blueprint("milestones", __name__)

MAX_ID = 2_147_483_647


def _current_user_id() -> int:
    return int(get_jwt_identity())


@milestones_bp.get("/api/milestones")
@jwt_required()
def list_milestones():
    uid = _current_user_id()
    goal_id = optional_int_arg(request.args.get("goal_id"), "Lernziel", 1, MAX_ID)
    year = optional_int_arg(request.args.get("year"), "Jahr", 2020, 2100)
    month = optional_int_arg(request.args.get("month"), "Monat", 1, 12)

    q = Milestone.query.filter_by(user_id=uid)
    if goal_id is not None:
        q = q.filter_by(goal_id=goal_id)
    if year is not None:
        q = q.filter_by(year=year)
    if month is not None:
        q = q.filter_by(month=month)
    items = q.order_by(Milestone.year, Milestone.month, Milestone.due_day, Milestone.id).all()
    return jsonify([m.to_dict() for m in items]), 200


@milestones_bp.post("/api/milestones")
@jwt_required()
def create_milestone():
    uid = _current_user_id()
    data = request.get_json(silent=True) or {}

    title = require_text(data.get("title"), "Titel", 200)
    year = require_int_in_range(data.get("year"), "Jahr", 2020, 2100)
    month = require_int_in_range(data.get("month"), "Monat", 1, 12)
    due_day = require_day_of_month(data.get("due_day"), year, month)

    goal_id = data.get("goal_id")
    if goal_id in (None, "", 0, "0"):
        goal_id = None
    else:
        goal_id = require_int_in_range(goal_id, "Lernziel", 1, MAX_ID)
        Goal.query.filter_by(id=goal_id, user_id=uid).first_or_404()

    milestone = Milestone(
        user_id=uid,
        goal_id=goal_id,
        title=title,
        year=year,
        month=month,
        due_day=due_day,
        done=bool(data.get("done", False)),
    )
    db.session.add(milestone)
    db.session.commit()
    return jsonify(milestone.to_dict()), 201


@milestones_bp.put("/api/milestones/<int:milestone_id>")
@jwt_required()
def update_milestone(milestone_id: int):
    milestone = Milestone.query.filter_by(
        id=milestone_id, user_id=_current_user_id()
    ).first_or_404()
    data = request.get_json(silent=True) or {}

    if "title" in data:
        milestone.title = require_text(data["title"], "Titel", 200)
    if "due_day" in data:
        milestone.due_day = require_day_of_month(
            data["due_day"], milestone.year, milestone.month
        )
    if "done" in data:
        milestone.done = bool(data["done"])

    db.session.commit()
    return jsonify(milestone.to_dict()), 200


@milestones_bp.delete("/api/milestones/<int:milestone_id>")
@jwt_required()
def delete_milestone(milestone_id: int):
    milestone = Milestone.query.filter_by(
        id=milestone_id, user_id=_current_user_id()
    ).first_or_404()
    db.session.delete(milestone)
    db.session.commit()
    return "", 204
