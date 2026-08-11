from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models.goal import Goal
from ..models.study_session import StudySession

sessions_bp = Blueprint("sessions", __name__)


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _current_user_id() -> int:
    return int(get_jwt_identity())


@sessions_bp.get("/api/sessions/active")
@jwt_required()
def get_active():
    uid = _current_user_id()
    session = StudySession.query.filter(
        StudySession.user_id == uid,
        StudySession.status.in_(["active", "paused"]),
    ).first()
    if not session:
        return "", 204
    data = session.to_dict()
    data["goal_title"] = session.goal.title
    return jsonify(data), 200


@sessions_bp.get("/api/sessions")
@jwt_required()
def list_sessions():
    uid = _current_user_id()
    q = StudySession.query.filter_by(user_id=uid)
    if goal_id := request.args.get("goal_id"):
        q = q.filter_by(goal_id=int(goal_id))
    limit = int(request.args.get("limit") or 50)
    sessions = q.order_by(StudySession.started_at.desc()).limit(limit).all()
    return jsonify([s.to_dict() for s in sessions]), 200


@sessions_bp.post("/api/sessions/start")
@jwt_required()
def start_session():
    uid = _current_user_id()
    data = request.get_json(silent=True) or {}
    goal_id = data.get("goal_id")
    if not goal_id:
        return jsonify({"error": "goal_id ist Pflichtfeld"}), 400

    Goal.query.filter_by(id=int(goal_id), user_id=uid).first_or_404()

    existing = StudySession.query.filter(
        StudySession.user_id == uid,
        StudySession.status.in_(["active", "paused"]),
    ).first()
    if existing:
        body = {"error": "Es läuft bereits eine Session", "session": existing.to_dict()}
        return jsonify(body), 409

    session = StudySession(
        user_id=uid,
        goal_id=int(goal_id),
        started_at=_now(),
        status="active",
    )
    db.session.add(session)
    db.session.commit()
    return jsonify(session.to_dict()), 201


@sessions_bp.post("/api/sessions/<int:session_id>/pause")
@jwt_required()
def pause_session(session_id: int):
    session = StudySession.query.filter_by(
        id=session_id, user_id=_current_user_id()
    ).first_or_404()
    if session.status != "active":
        return jsonify({"error": "Session ist nicht aktiv"}), 409

    session.paused_at = _now()
    session.status = "paused"
    db.session.commit()
    return jsonify(session.to_dict()), 200


@sessions_bp.post("/api/sessions/<int:session_id>/resume")
@jwt_required()
def resume_session(session_id: int):
    session = StudySession.query.filter_by(
        id=session_id, user_id=_current_user_id()
    ).first_or_404()
    if session.status != "paused":
        return jsonify({"error": "Session ist nicht pausiert"}), 409

    now = _now()
    paused_duration = int((now - session.paused_at).total_seconds())
    session.total_paused_seconds = (session.total_paused_seconds or 0) + paused_duration
    session.paused_at = None
    session.status = "active"
    db.session.commit()
    return jsonify(session.to_dict()), 200


@sessions_bp.post("/api/sessions/<int:session_id>/stop")
@jwt_required()
def stop_session(session_id: int):
    session = StudySession.query.filter_by(
        id=session_id, user_id=_current_user_id()
    ).first_or_404()
    if session.status == "completed":
        return jsonify({"error": "Session bereits beendet"}), 409

    data = request.get_json(silent=True) or {}
    now = _now()

    if session.status == "paused" and session.paused_at:
        extra_pause = int((now - session.paused_at).total_seconds())
        session.total_paused_seconds = (session.total_paused_seconds or 0) + extra_pause
        session.paused_at = None

    session.ended_at = now
    total_elapsed = int((now - session.started_at).total_seconds())
    session.duration_seconds = max(0, total_elapsed - (session.total_paused_seconds or 0))
    session.status = "completed"
    if data.get("note"):
        session.note = data["note"]

    db.session.commit()
    return jsonify(session.to_dict()), 200
