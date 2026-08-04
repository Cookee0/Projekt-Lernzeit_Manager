from datetime import date

from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models import Goal

goals_bp = Blueprint("goals", __name__)

MAX_TITLE_LENGTH = 200


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

    target_date = payload.get("target_date")
    if not isinstance(target_date, str) or not target_date:
        errors["target_date"] = "Zieldatum ist erforderlich."
    else:
        try:
            values["target_date"] = date.fromisoformat(target_date)
        except ValueError:
            errors["target_date"] = "Zieldatum muss im Format JJJJ-MM-TT vorliegen."

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

    goal = Goal(title=values["title"], target_date=values["target_date"])
    db.session.add(goal)
    db.session.commit()
    return jsonify(goal.to_dict()), 201
