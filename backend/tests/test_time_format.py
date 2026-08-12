"""Stellt sicher, dass Zeitpunkte als UTC gekennzeichnet ausgeliefert werden (Plan P2).

Ohne die Kennzeichnung deutet der Browser die Werte als Ortszeit; der Timer
zeigte dadurch beim Start sofort zwei Stunden an.
"""

from datetime import datetime, timezone

import pytest

REGISTER_URL = "/api/auth/register"
GOALS_URL = "/api/goals"
SESSIONS_URL = "/api/sessions"


@pytest.fixture
def auth_header(client):
    resp = client.post(
        REGISTER_URL, json={"email": "zeit@example.de", "name": "Z", "password": "pass123"}
    )
    return {"Authorization": f"Bearer {resp.get_json()['access_token']}"}


@pytest.fixture
def goal_id(client, auth_header):
    resp = client.post(
        GOALS_URL,
        json={"title": "Zeitziel", "module_name": "M", "target_date": "2027-06-01"},
        headers=auth_header,
    )
    return resp.get_json()["id"]


def test_started_at_is_marked_as_utc(client, auth_header, goal_id):
    resp = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
    assert resp.status_code == 201
    started_at = resp.get_json()["started_at"]
    assert started_at.endswith("Z"), f"Zeitstempel ohne UTC-Kennzeichnung: {started_at}"


def test_started_at_matches_current_utc_time(client, auth_header, goal_id):
    """Der ausgelieferte Startzeitpunkt darf hoechstens Sekunden von 'jetzt in UTC' abweichen."""
    resp = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
    started_at = resp.get_json()["started_at"]
    parsed = datetime.fromisoformat(started_at.replace("Z", "+00:00"))
    abweichung = abs((datetime.now(timezone.utc) - parsed).total_seconds())
    assert abweichung < 60, f"Abweichung von {abweichung} Sekunden deutet auf Zeitzonenfehler hin"


def test_goal_created_at_is_marked_as_utc(client, auth_header, goal_id):
    resp = client.get(f"{GOALS_URL}/{goal_id}", headers=auth_header)
    assert resp.get_json()["created_at"].endswith("Z")


def test_dashboard_active_session_is_marked_as_utc(client, auth_header, goal_id):
    client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
    resp = client.get("/api/dashboard", headers=auth_header)
    assert resp.status_code == 200
    assert resp.get_json()["active_session"]["started_at"].endswith("Z")
