from flask import Flask
from flask_cors import CORS

from .config import config_by_name
from .extensions import db, migrate


def create_app(config_name: str = "development") -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    CORS(app, origins=app.config.get("CORS_ORIGINS", ["http://localhost:4200"]))

    db.init_app(app)
    migrate.init_app(app, db)

    from .models import Goal  # noqa: F401  – Import nötig, damit Alembic die Tabelle sieht
    from .routes.health import health_bp

    app.register_blueprint(health_bp)

    return app
