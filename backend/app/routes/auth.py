from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from ..extensions import db
from ..models.user import User
from ..validation import require_email, require_password, require_text

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/api/auth/register")
def register():
    data = request.get_json(silent=True) or {}
    email = require_email(data.get("email"))
    name = require_text(data.get("name"), "Name", 255)
    password = require_password(data.get("password"))

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "E-Mail bereits registriert"}), 409

    user = User(email=email, name=name)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token, "user": user.to_dict()}), 201


@auth_bp.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Ungültige Anmeldedaten"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token, "user": user.to_dict()}), 200


@auth_bp.get("/api/auth/me")
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "Benutzer nicht gefunden"}), 404
    return jsonify(user.to_dict()), 200
