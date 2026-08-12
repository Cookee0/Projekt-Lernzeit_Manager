"""Prueft die Wertebereiche der Schnittstelle (Plan P1)."""

from datetime import date, timedelta

import pytest

REGISTER_URL = "/api/auth/register"
LOGIN_URL = "/api/auth/login"
GOALS_URL = "/api/goals"
PLANS_URL = "/api/plans"

FUTURE_DATE = (date.today() + timedelta(days=200)).isoformat()
PAST_DATE = (date.today() - timedelta(days=1)).isoformat()


@pytest.fixture
def auth_header(client):
    payload = {"email": "val@example.com", "name": "Val", "password": "pass123"}
    client.post(REGISTER_URL, json=payload)
    resp = client.post(LOGIN_URL, json={"email": "val@example.com", "password": "pass123"})
    return {"Authorization": f"Bearer {resp.get_json()['access_token']}"}


@pytest.fixture
def goal_id(client, auth_header):
    resp = client.post(
        GOALS_URL,
        json={"title": "Basis", "module_name": "M", "target_date": FUTURE_DATE},
        headers=auth_header,
    )
    return resp.get_json()["id"]


# --- Registrierung -------------------------------------------------------

@pytest.mark.parametrize("email", ["test", "@@@", "ohne-at.de", "a@b", "a b@c.de"])
def test_register_rejects_invalid_email(client, email):
    resp = client.post(REGISTER_URL, json={"email": email, "name": "N", "password": "pass123"})
    assert resp.status_code == 400
    assert "E-Mail" in resp.get_json()["error"]


def test_register_accepts_valid_email(client):
    resp = client.post(
        REGISTER_URL, json={"email": "gut@example.de", "name": "N", "password": "pass123"}
    )
    assert resp.status_code == 201


def test_register_rejects_empty_name(client):
    resp = client.post(
        REGISTER_URL, json={"email": "a@b.de", "name": "   ", "password": "pass123"}
    )
    assert resp.status_code == 400


# --- Lernziele -----------------------------------------------------------

@pytest.mark.parametrize("ects", [-5, 0, 31, "abc"])
def test_create_goal_rejects_invalid_ects(client, auth_header, ects):
    resp = client.post(
        GOALS_URL,
        json={"title": "T", "module_name": "M", "target_date": FUTURE_DATE, "ects": ects},
        headers=auth_header,
    )
    assert resp.status_code == 400


def test_create_goal_uses_default_ects_when_absent(client, auth_header):
    resp = client.post(
        GOALS_URL,
        json={"title": "T", "module_name": "M", "target_date": FUTURE_DATE},
        headers=auth_header,
    )
    assert resp.status_code == 201
    assert resp.get_json()["ects"] == 5


def test_create_goal_rejects_past_target_date(client, auth_header):
    resp = client.post(
        GOALS_URL,
        json={"title": "T", "module_name": "M", "target_date": PAST_DATE},
        headers=auth_header,
    )
    assert resp.status_code == 400
    assert "Vergangenheit" in resp.get_json()["error"]


def test_create_goal_rejects_too_long_title(client, auth_header):
    resp = client.post(
        GOALS_URL,
        json={"title": "a" * 256, "module_name": "M", "target_date": FUTURE_DATE},
        headers=auth_header,
    )
    assert resp.status_code == 400


def test_update_goal_rejects_empty_title(client, auth_header, goal_id):
    resp = client.put(f"{GOALS_URL}/{goal_id}", json={"title": "  "}, headers=auth_header)
    assert resp.status_code == 400


def test_update_goal_status_without_date_still_works(client, auth_header, goal_id):
    resp = client.put(f"{GOALS_URL}/{goal_id}", json={"status": "achieved"}, headers=auth_header)
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "achieved"


# --- Planung -------------------------------------------------------------

@pytest.mark.parametrize("month", [-3, 0, 13, 99])
def test_create_plan_rejects_invalid_month(client, auth_header, goal_id, month):
    resp = client.post(
        PLANS_URL, json={"goal_id": goal_id, "year": 2026, "month": month}, headers=auth_header
    )
    assert resp.status_code == 400


@pytest.mark.parametrize("day", [-10, 0, 32, 45])
def test_create_plan_rejects_invalid_day(client, auth_header, goal_id, day):
    resp = client.post(
        PLANS_URL,
        json={"goal_id": goal_id, "year": 2026, "month": 8, "day": day},
        headers=auth_header,
    )
    assert resp.status_code == 400


def test_create_plan_rejects_31_february(client, auth_header, goal_id):
    resp = client.post(
        PLANS_URL,
        json={"goal_id": goal_id, "year": 2026, "month": 2, "day": 31},
        headers=auth_header,
    )
    assert resp.status_code == 400


@pytest.mark.parametrize("duration", [-120, 0, 4, 481])
def test_create_plan_rejects_invalid_duration(client, auth_header, goal_id, duration):
    resp = client.post(
        PLANS_URL,
        json={
            "goal_id": goal_id,
            "year": 2026,
            "month": 8,
            "duration_minutes": duration,
        },
        headers=auth_header,
    )
    assert resp.status_code == 400


@pytest.mark.parametrize("clock", ["abc", "25:00", "12:60", "1230", "12:3"])
def test_create_plan_rejects_invalid_time(client, auth_header, goal_id, clock):
    resp = client.post(
        PLANS_URL,
        json={"goal_id": goal_id, "year": 2026, "month": 8, "planned_time": clock},
        headers=auth_header,
    )
    assert resp.status_code == 400


def test_create_plan_accepts_valid_values(client, auth_header, goal_id):
    resp = client.post(
        PLANS_URL,
        json={
            "goal_id": goal_id,
            "year": 2026,
            "month": 8,
            "day": 15,
            "planned_time": "14:30",
            "duration_minutes": 90,
            "note": "Kapitel 3",
        },
        headers=auth_header,
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["planned_time"] == "14:30"
    assert data["duration_minutes"] == 90
