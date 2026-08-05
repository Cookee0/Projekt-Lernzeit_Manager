from datetime import date

from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models import Goal

goals_bp = Blueprint("goals", __name__)

MAX_TITLE_LENGTH = 200
MAX_MODULE_LENGTH = 100
GOAL_STATUSES = ("offen", "in_arbeit", "erreicht")
GOAL_PRIORITIES = ("hoch", "mittel", "niedrig")


def validate_goal_payload(payload: object) -> tuple[dict, dict]:
    """Prüft die Eingabedaten für ein Lernziel.

    Gibt ein Tupel (werte, fehler) zurück. Ist `fehler` leer, sind `werte`
    gültig und können direkt an das Modell übergeben werden. Ist `fehler`
    nicht leer, ordnet es jedem fehlerhaften Feldnamen eine deutsche
    Fehlermeldung zu.
    """
    if not isinstance(payload, dict):
        return {}, {"body": "Es wird ein JSON-Objekt erwartet."}

    values: dict = {}
    errors: dict = {}

    title = payload.get("title")
    if not isinstance(title, str) or not title.strip():
        errors["title"] = "Titel ist erforderlich."
    elif len(title.strip()) > MAX_TITLE_LENGTH:
        errors["title"] = f"Titel darf höchstens {MAX_TITLE_LENGTH} Zeichen lang sein."
    else:
        values["title"] = title.strip()

    module = payload.get("module")
    if not isinstance(module, str) or not module.strip():
        errors["module"] = "Modul/Kurs ist erforderlich."
    elif len(module.strip()) > MAX_MODULE_LENGTH:
        errors["module"] = (
            f"Modul/Kurs darf höchstens {MAX_MODULE_LENGTH} Zeichen lang sein."
        )
    else:
        values["module"] = module.strip()

    target_date = payload.get("target_date")
    if not isinstance(target_date, str) or not target_date:
        errors["target_date"] = "Zieldatum ist erforderlich."
    else:
        try:
            values["target_date"] = date.fromisoformat(target_date)
        except ValueError:
            errors["target_date"] = "Zieldatum muss im Format JJJJ-MM-TT vorliegen."

    status = payload.get("status", "offen")
    if status not in GOAL_STATUSES:
        erlaubte = ", ".join(GOAL_STATUSES)
        errors["status"] = f"Status muss einer der folgenden Werte sein: {erlaubte}."
    else:
        values["status"] = status

    priority = payload.get("priority")
    if priority is None or priority == "":
        # Prioritaet ist optional. Fehlend, null und "" bedeuten alle: keine.
        values["priority"] = None
    elif priority in GOAL_PRIORITIES:
        values["priority"] = priority
    else:
        erlaubte = ", ".join(GOAL_PRIORITIES)
        errors["priority"] = (
            f"Priorität muss leer sein oder einer der folgenden Werte: {erlaubte}."
        )

    return values, errors


@goals_bp.get("/api/goals")
def list_goals():
    """Gibt alle Lernziele zurück, sortiert nach Zieldatum aufsteigend."""
    goals = (
        db.session.execute(db.select(Goal).order_by(Goal.target_date, Goal.id))
        .scalars()
        .all()
    )
    return jsonify([goal.to_dict() for goal in goals]), 200


@goals_bp.post("/api/goals")
def create_goal():
    """Legt ein neues Lernziel an."""
    values, errors = validate_goal_payload(request.get_json(silent=True))
    if errors:
        return jsonify({"errors": errors}), 400

    goal = Goal(
        title=values["title"],
        module=values["module"],
        target_date=values["target_date"],
        status=values["status"],
        priority=values["priority"],
    )
    db.session.add(goal)
    db.session.commit()
    return jsonify(goal.to_dict()), 201


@goals_bp.get("/api/goals/<int:goal_id>")
def get_goal(goal_id: int):
    """Gibt ein einzelnes Lernziel zurück."""
    goal = db.session.get(Goal, goal_id)
    if goal is None:
        return jsonify({"errors": {"id": "Lernziel nicht gefunden."}}), 404

    return jsonify(goal.to_dict()), 200


@goals_bp.put("/api/goals/<int:goal_id>")
def update_goal(goal_id: int):
    """Ersetzt alle Felder eines Lernziels. Ändert auch das Zieldatum (FR-1.3)."""
    goal = db.session.get(Goal, goal_id)
    if goal is None:
        return jsonify({"errors": {"id": "Lernziel nicht gefunden."}}), 404

    values, errors = validate_goal_payload(request.get_json(silent=True))
    if errors:
        return jsonify({"errors": errors}), 400

    goal.title = values["title"]
    goal.module = values["module"]
    goal.target_date = values["target_date"]
    goal.status = values["status"]
    goal.priority = values["priority"]
    db.session.commit()

    return jsonify(goal.to_dict()), 200


@goals_bp.delete("/api/goals/<int:goal_id>")
def delete_goal(goal_id: int):
    """Löscht ein Lernziel endgültig."""
    goal = db.session.get(Goal, goal_id)
    if goal is None:
        return jsonify({"errors": {"id": "Lernziel nicht gefunden."}}), 404

    db.session.delete(goal)
    db.session.commit()

    return "", 204
