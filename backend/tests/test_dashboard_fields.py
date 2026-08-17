"""Prueft die Dashboard-Felder aus Plan P7: Pausenzeit (FR-4.3),
Wochenhistorie (FR-6.3) und Terminwarnungen (FR-7.3).

Vergangenheits-Zeitpunkte lassen sich ueber die Schnittstelle nicht erzeugen,
deshalb schreiben die Tests Sessions direkt in die Datenbank (Muster wie in
backend/tests/test_reminders.py).
"""

from datetime import date, datetime, timedelta, timezone

from app.extensions import db
from app.models.goal import Goal
from app.models.study_session import StudySession
from app.workload import MINUTES_PER_ECTS

DASHBOARD_URL = "/api/dashboard"


def _user_id_of(goal_id: int) -> int:
    return db.session.get(Goal, goal_id).user_id


def _completed_session(
    goal_id: int, days_ago: int, minutes: int = 30, paused_seconds: int = 0
) -> None:
    jetzt_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    started = jetzt_utc - timedelta(days=days_ago)
    db.session.add(
        StudySession(
            user_id=_user_id_of(goal_id),
            goal_id=goal_id,
            started_at=started,
            ended_at=started + timedelta(minutes=minutes),
            duration_seconds=minutes * 60,
            total_paused_seconds=paused_seconds,
            status="completed",
        )
    )
    db.session.commit()


def test_paused_minutes_of_current_month(client, auth_header, goal_id):
    _completed_session(goal_id, days_ago=0, paused_seconds=600)
    data = client.get(DASHBOARD_URL, headers=auth_header).get_json()
    assert data["current_month"]["paused_minutes"] == 10


def test_weekly_history_has_eight_weeks_and_buckets_sessions(client, auth_header, goal_id):
    _completed_session(goal_id, days_ago=0, minutes=45)
    _completed_session(goal_id, days_ago=14, minutes=30)
    data = client.get(DASHBOARD_URL, headers=auth_header).get_json()
    history = data["weekly_history"]
    assert len(history) == 8
    # Aelteste Woche zuerst, aktuelle Woche zuletzt.
    assert history[0]["week_start"] < history[-1]["week_start"]
    assert history[-1]["minutes"] == 45
    # Eine Session vor 14 Tagen liegt genau zwei Wochenmontage zurueck.
    assert history[-3]["minutes"] == 30
    total = sum(week["minutes"] for week in history)
    assert total == 75


def test_deadline_warning_for_near_goal_without_progress(client, auth_header):
    resp = client.post(
        "/api/goals",
        json={
            "title": "Klausur bald",
            "module_name": "NAH01",
            "target_date": (date.today() + timedelta(days=5)).isoformat(),
        },
        headers=auth_header,
    )
    assert resp.status_code == 201
    data = client.get(DASHBOARD_URL, headers=auth_header).get_json()
    warnings = data["deadline_warnings"]
    assert len(warnings) == 1
    assert warnings[0]["title"] == "Klausur bald"
    assert warnings[0]["days_left"] == 5
    assert warnings[0]["progress_pct"] == 0


def test_no_deadline_warning_with_enough_progress(client, auth_header):
    resp = client.post(
        "/api/goals",
        json={
            "title": "Fast fertig",
            "module_name": "GUT01",
            "target_date": (date.today() + timedelta(days=5)).isoformat(),
        },
        headers=auth_header,
    )
    goal_id = resp.get_json()["id"]
    # Mehr als die Haelfte des Workloads (5 ECTS Default) ist gelernt.
    _completed_session(goal_id, days_ago=0, minutes=3 * MINUTES_PER_ECTS)
    data = client.get(DASHBOARD_URL, headers=auth_header).get_json()
    assert data["deadline_warnings"] == []


def test_no_deadline_warning_for_achieved_or_distant_goal(client, auth_header, goal_id):
    # goal_id-Fixture: Zieldatum in 200 Tagen -> keine Warnung.
    data = client.get(DASHBOARD_URL, headers=auth_header).get_json()
    assert data["deadline_warnings"] == []

    goal = db.session.get(Goal, goal_id)
    goal.target_date = date.today() + timedelta(days=3)
    goal.status = "achieved"
    db.session.commit()
    data = client.get(DASHBOARD_URL, headers=auth_header).get_json()
    assert data["deadline_warnings"] == []
