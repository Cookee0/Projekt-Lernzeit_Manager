from pathlib import Path

from flask import Flask, send_from_directory
from flask_cors import CORS

from .config import config_by_name
from .extensions import db, jwt, migrate

_FRONTEND_DIST = (
    Path(__file__).parent.parent.parent / "frontend" / "dist" / "frontend" / "browser"
)


def _register_spa_fallback(app: Flask) -> None:
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_angular(path: str):
        target = _FRONTEND_DIST / path
        if path and target.is_file():
            return send_from_directory(_FRONTEND_DIST, path)
        return send_from_directory(_FRONTEND_DIST, "index.html")


def create_app(config_name: str = "development") -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    CORS(app, origins=app.config.get("CORS_ORIGINS", ["http://localhost:4200"]))

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    from .models import Goal, PlanSlot, StudySession, User  # noqa: F401
    from .routes.auth import auth_bp
    from .routes.dashboard import dashboard_bp
    from .routes.goals import goals_bp
    from .routes.health import health_bp
    from .routes.plans import plans_bp
    from .routes.sessions import sessions_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(goals_bp)
    app.register_blueprint(plans_bp)
    app.register_blueprint(sessions_bp)
    app.register_blueprint(dashboard_bp)

    if config_name == "production":
        _register_spa_fallback(app)

    return app
