import pytest
from flask.testing import FlaskClient

from app import create_app
from app.extensions import db


@pytest.fixture
def app():
    """Eine Flask-App mit frischer, leerer Datenbank je Test."""
    app = create_app("testing")
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app) -> FlaskClient:
    return app.test_client()
