from datetime import date, timedelta

import pytest
from flask.testing import FlaskClient

from app import create_app
from app.extensions import db as _db

FUTURE_DATE = (date.today() + timedelta(days=200)).isoformat()


@pytest.fixture
def app():
    application = create_app("testing")
    with application.app_context():
        _db.create_all()
        yield application
        _db.session.remove()
        _db.drop_all()


@pytest.fixture
def client(app) -> FlaskClient:
    return app.test_client()


@pytest.fixture
def auth_header(client):
    """Meldet einen frischen Benutzer an und liefert die Authorization-Kopfzeile.

    Jeder Test bekommt eine eigene Datenbank (siehe app-Fixture), deshalb
    genuegt eine feste E-Mail-Adresse.
    """
    resp = client.post(
        "/api/auth/register",
        json={"email": "test@example.de", "name": "Testperson", "password": "pass123"},
    )
    assert resp.status_code == 201, resp.get_json()
    return {"Authorization": f"Bearer {resp.get_json()['access_token']}"}


@pytest.fixture
def goal_id(client, auth_header):
    """Legt ein Lernziel an und liefert dessen id."""
    resp = client.post(
        "/api/goals",
        json={"title": "Testziel", "module_name": "TEST01", "target_date": FUTURE_DATE},
        headers=auth_header,
    )
    assert resp.status_code == 201, resp.get_json()
    return resp.get_json()["id"]
