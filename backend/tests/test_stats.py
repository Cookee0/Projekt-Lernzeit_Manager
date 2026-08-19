"""Prueft den Auswertungs-Endpunkt GET /api/stats (FR-6.4, Plan P11 Task 1).

Zeitpunkte in der Vergangenheit bzw. mit fester Uhrzeit lassen sich ueber die
Schnittstelle nicht erzeugen, deshalb schreiben die Tests Sessions direkt in
die Datenbank (Muster wie in backend/tests/test_dashboard_fields.py).
"""

from datetime import date, datetime, timedelta

from app.extensions import db
from app.models.goal import Goal
from app.models.plan_slot import PlanSlot
from app.models.study_session import StudySession

STATS_URL = "/api/stats"

FUTURE_DATE = (date.today() + timedelta(days=200)).isoformat()


def _create_goal(client, auth_header, ects: int = 1, status: str = "open", **extra) -> int:
    payload = {
        "title": "Statistik-Ziel",
        "module_name": "STAT01",
        "target_date": FUTURE_DATE,
        "ects": ects,
        "status": status,
        **extra,
    }
    resp = client.post("/api/goals", json=payload, headers=auth_header)
    assert resp.status_code == 201, resp.get_json()
    return resp.get_json()["id"]


def _user_id_of(goal_id: int) -> int:
    return db.session.get(Goal, goal_id).user_id


def _completed_session(goal_id: int, hour: int, minutes: int = 30) -> None:
    """Legt eine abgeschlossene Session heute um `hour` Uhr (naiv-UTC) an."""
    today = date.today()
    started = datetime(today.year, today.month, today.day, hour, 0, 0)
    db.session.add(
        StudySession(
            user_id=_user_id_of(goal_id),
            goal_id=goal_id,
            started_at=started,
            ended_at=started + timedelta(minutes=minutes),
            duration_seconds=minutes * 60,
            total_paused_seconds=0,
            status="completed",
        )
    )
    db.session.commit()


def _plan_slot(goal_id: int, minutes: int = 60) -> None:
    today = date.today()
    db.session.add(
        PlanSlot(
            user_id=_user_id_of(goal_id),
            goal_id=goal_id,
            year=today.year,
            month=today.month,
            day=None,
            duration_minutes=minutes,
        )
    )
    db.session.commit()


def test_stats_for_empty_user(client, auth_header):
    resp = client.get(STATS_URL, headers=auth_header)
    assert resp.status_code == 200
    data = resp.get_json()

    assert data["per_goal"] == []

    assert len(data["per_month"]) == 6
    for entry in data["per_month"]:
        assert entry["planned_minutes"] == 0
        assert entry["actual_minutes"] == 0

    assert data["by_daytime"] == {
        "morning_minutes": 0,
        "afternoon_minutes": 0,
        "evening_minutes": 0,
        "night_minutes": 0,
    }

    assert data["achieved_goals"] == []


def test_stats_with_goal_session_and_slot(client, auth_header):
    goal_id = _create_goal(client, auth_header, ects=1)  # 1800 Minuten Workload
    _completed_session(goal_id, hour=9, minutes=900)  # Vormittag, 50 % Fortschritt
    _plan_slot(goal_id, minutes=120)

    today = date.today()
    resp = client.get(STATS_URL, headers=auth_header)
    assert resp.status_code == 200
    data = resp.get_json()

    assert len(data["per_goal"]) == 1
    entry = data["per_goal"][0]
    assert entry["goal_id"] == goal_id
    assert entry["title"] == "Statistik-Ziel"
    assert entry["module_name"] == "STAT01"
    assert entry["planned_ects_minutes"] == 1800
    assert entry["total_actual_minutes"] == 900
    assert entry["progress_pct"] == 50
    assert entry["ampel"] == "gelb"

    current_month = next(
        m for m in data["per_month"] if m["year"] == today.year and m["month"] == today.month
    )
    assert current_month["planned_minutes"] == 120
    assert current_month["actual_minutes"] == 900
    assert data["per_month"][-1] == current_month  # laufender Monat ist der letzte Eintrag

    assert data["by_daytime"]["morning_minutes"] == 900
    assert data["by_daytime"]["afternoon_minutes"] == 0
    assert data["by_daytime"]["evening_minutes"] == 0
    assert data["by_daytime"]["night_minutes"] == 0


def test_stats_lists_achieved_goals(client, auth_header):
    goal_id = _create_goal(
        client, auth_header, status="achieved", ects=3
    )
    goal = db.session.get(Goal, goal_id)
    goal.grade = "1.3"
    goal.result_note = "Klausur bestanden"
    db.session.commit()

    resp = client.get(STATS_URL, headers=auth_header)
    assert resp.status_code == 200
    data = resp.get_json()

    assert len(data["achieved_goals"]) == 1
    entry = data["achieved_goals"][0]
    assert entry["goal_id"] == goal_id
    assert entry["title"] == "Statistik-Ziel"
    assert entry["module_name"] == "STAT01"
    assert entry["grade"] == "1.3"
    assert entry["result_note"] == "Klausur bestanden"
    assert entry["target_date"] == FUTURE_DATE


def test_stats_requires_auth(client):
    resp = client.get(STATS_URL)
    assert resp.status_code == 401
