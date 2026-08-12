"""Prueft die Erinnerung bei versaeumter Lernzeit (FR-7.1, Plan P3).

Die Testdaten werden direkt in die Datenbank geschrieben, weil sich
Zeitpunkte in der Vergangenheit ueber die Schnittstelle nicht erzeugen
lassen - der Timer kennt nur "jetzt".
"""

from datetime import date, datetime, timedelta, timezone

import pytest

from app.extensions import db
from app.models.plan_slot import PlanSlot
from app.models.study_session import StudySession

REGISTER_URL = "/api/auth/register"
GOALS_URL = "/api/goals"
DASHBOARD_URL = "/api/dashboard"

FUTURE_DATE = (date.today() + timedelta(days=200)).isoformat()


@pytest.fixture
def auth_header(client):
    resp = client.post(
        REGISTER_URL, json={"email": "erinnerung@example.de", "name": "E", "password": "pass123"}
    )
    return {"Authorization": f"Bearer {resp.get_json()['access_token']}"}


@pytest.fixture
def goal_id(client, auth_header):
    resp = client.post(
        GOALS_URL,
        json={"title": "Erinnerungsziel", "module_name": "M", "target_date": FUTURE_DATE},
        headers=auth_header,
    )
    return resp.get_json()["id"]


def _user_id_of(goal_id: int) -> int:
    from app.models.goal import Goal

    return db.session.get(Goal, goal_id).user_id


def _plan(goal_id: int, day: int | None, minutes: int = 60) -> None:
    today = date.today()
    db.session.add(
        PlanSlot(
            user_id=_user_id_of(goal_id),
            goal_id=goal_id,
            year=today.year,
            month=today.month,
            day=day,
            duration_minutes=minutes,
        )
    )
    db.session.commit()


def _completed_session(goal_id: int, days_ago: int) -> None:
    # Die Anwendung speichert Zeitpunkte als UTC ohne Zeitzonen-Angabe
    # (siehe _now in backend/app/routes/sessions.py) - hier genauso.
    jetzt_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    started = jetzt_utc - timedelta(days=days_ago)
    db.session.add(
        StudySession(
            user_id=_user_id_of(goal_id),
            goal_id=goal_id,
            started_at=started,
            ended_at=started + timedelta(minutes=30),
            duration_seconds=1800,
            total_paused_seconds=0,
            status="completed",
        )
    )
    db.session.commit()


def test_no_reminder_without_any_plan(client, auth_header, goal_id):
    resp = client.get(DASHBOARD_URL, headers=auth_header)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["inactivity_warning"] is False
    assert data["reminder_text"] is None


def test_reminder_when_planned_today_and_nothing_done(client, auth_header, goal_id):
    _plan(goal_id, day=date.today().day)
    data = client.get(DASHBOARD_URL, headers=auth_header).get_json()
    assert data["inactivity_warning"] is True
    assert "heute" in data["reminder_text"].lower()


def test_reminder_when_month_planned_without_day_and_nothing_done(client, auth_header, goal_id):
    _plan(goal_id, day=None)
    data = client.get(DASHBOARD_URL, headers=auth_header).get_json()
    assert data["inactivity_warning"] is True
    assert data["reminder_text"] is not None


def test_reminder_after_three_days_without_session(client, auth_header, goal_id):
    _plan(goal_id, day=None)
    _completed_session(goal_id, days_ago=4)
    data = client.get(DASHBOARD_URL, headers=auth_header).get_json()
    assert data["inactivity_warning"] is True
    assert "4 Tagen" in data["reminder_text"]


def test_no_reminder_right_after_learning(client, auth_header, goal_id):
    _plan(goal_id, day=None)
    _completed_session(goal_id, days_ago=0)
    data = client.get(DASHBOARD_URL, headers=auth_header).get_json()
    assert data["inactivity_warning"] is False
    assert data["reminder_text"] is None
