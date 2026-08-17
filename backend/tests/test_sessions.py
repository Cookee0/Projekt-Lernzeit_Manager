"""Prueft die Stoppuhr: Start, Pause, Fortsetzen, Stopp (FR-4.1 bis FR-4.3).

Der Kern ist die Pausenrechnung: Nur ungestoerte Lernzeit soll zaehlen.
Weil sich Zeitpunkte in der Vergangenheit ueber die Schnittstelle nicht
erzeugen lassen - der Timer kennt nur "jetzt" - schreiben die Tests, die
eine Dauer brauchen, direkt in die Datenbank. Dasselbe Verfahren benutzt
bereits backend/tests/test_reminders.py.
"""

from datetime import datetime, timedelta, timezone

from app.extensions import db
from app.models.study_session import StudySession

SESSIONS_URL = "/api/sessions"


def _now_utc() -> datetime:
    """Naives UTC - genau das Format, in dem die Anwendung speichert."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def test_start_returns_201_and_active_status(client, auth_header, goal_id):
    resp = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
    assert resp.status_code == 201
    assert resp.get_json()["status"] == "active"


def test_start_twice_returns_409(client, auth_header, goal_id):
    client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
    resp = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
    assert resp.status_code == 409
    assert "session" in resp.get_json()


def test_start_with_unknown_goal_returns_404(client, auth_header):
    resp = client.post(f"{SESSIONS_URL}/start", json={"goal_id": 999999}, headers=auth_header)
    assert resp.status_code == 404


def test_start_without_goal_returns_400(client, auth_header):
    resp = client.post(f"{SESSIONS_URL}/start", json={}, headers=auth_header)
    assert resp.status_code == 400


def test_pause_sets_status_and_resume_clears_it(client, auth_header, goal_id):
    start = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
    sid = start.get_json()["id"]

    pause = client.post(f"{SESSIONS_URL}/{sid}/pause", headers=auth_header)
    assert pause.status_code == 200
    assert pause.get_json()["status"] == "paused"
    assert pause.get_json()["paused_at"] is not None

    resume = client.post(f"{SESSIONS_URL}/{sid}/resume", headers=auth_header)
    assert resume.status_code == 200
    assert resume.get_json()["status"] == "active"
    assert resume.get_json()["paused_at"] is None


def test_pause_of_paused_session_returns_409(client, auth_header, goal_id):
    start = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
    sid = start.get_json()["id"]
    client.post(f"{SESSIONS_URL}/{sid}/pause", headers=auth_header)

    resp = client.post(f"{SESSIONS_URL}/{sid}/pause", headers=auth_header)
    assert resp.status_code == 409


def test_resume_of_running_session_returns_409(client, auth_header, goal_id):
    start = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
    sid = start.get_json()["id"]

    resp = client.post(f"{SESSIONS_URL}/{sid}/resume", headers=auth_header)
    assert resp.status_code == 409


def test_resume_adds_paused_time(client, auth_header, goal_id):
    """Die Pausendauer wird beim Fortsetzen aufaddiert (FR-4.3)."""
    start = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
    sid = start.get_json()["id"]
    client.post(f"{SESSIONS_URL}/{sid}/pause", headers=auth_header)

    # Die Pause 120 Sekunden zurueckdatieren, statt zwei Minuten zu warten.
    session = db.session.get(StudySession, sid)
    session.paused_at = _now_utc() - timedelta(seconds=120)
    db.session.commit()

    resp = client.post(f"{SESSIONS_URL}/{sid}/resume", headers=auth_header)
    assert resp.status_code == 200
    assert resp.get_json()["total_paused_seconds"] >= 120


def test_stop_subtracts_paused_time_from_duration(client, auth_header, goal_id):
    """Der Kern von FR-4.3: Nur ungestoerte Zeit zaehlt als Lernzeit."""
    start = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
    sid = start.get_json()["id"]

    # Start 10 Minuten zurueckdatieren, davon 4 Minuten Pause.
    session = db.session.get(StudySession, sid)
    session.started_at = _now_utc() - timedelta(minutes=10)
    session.total_paused_seconds = 240
    db.session.commit()

    resp = client.post(f"{SESSIONS_URL}/{sid}/stop", headers=auth_header)
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["status"] == "completed"
    # 600 Sekunden brutto minus 240 Sekunden Pause = 360 Sekunden netto.
    assert 355 <= body["duration_seconds"] <= 365


def test_stop_while_paused_counts_the_open_pause(client, auth_header, goal_id):
    """Wird waehrend einer Pause gestoppt, zaehlt auch diese Pause nicht mit."""
    start = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
    sid = start.get_json()["id"]
    client.post(f"{SESSIONS_URL}/{sid}/pause", headers=auth_header)

    session = db.session.get(StudySession, sid)
    session.started_at = _now_utc() - timedelta(minutes=10)
    session.paused_at = _now_utc() - timedelta(minutes=4)
    db.session.commit()

    resp = client.post(f"{SESSIONS_URL}/{sid}/stop", headers=auth_header)
    assert resp.status_code == 200
    assert 355 <= resp.get_json()["duration_seconds"] <= 365


def test_stop_twice_returns_409(client, auth_header, goal_id):
    start = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
    sid = start.get_json()["id"]
    client.post(f"{SESSIONS_URL}/{sid}/stop", headers=auth_header)

    resp = client.post(f"{SESSIONS_URL}/{sid}/stop", headers=auth_header)
    assert resp.status_code == 409


def test_stop_stores_note(client, auth_header, goal_id):
    start = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
    sid = start.get_json()["id"]

    resp = client.post(
        f"{SESSIONS_URL}/{sid}/stop", json={"note": "Kapitel 3 wiederholt"}, headers=auth_header
    )
    assert resp.status_code == 200
    assert resp.get_json()["note"] == "Kapitel 3 wiederholt"


def test_stop_rejects_overlong_note(client, auth_header, goal_id):
    start = client.post(f"{SESSIONS_URL}/start", json={"goal_id": goal_id}, headers=auth_header)
    sid = start.get_json()["id"]

    resp = client.post(
        f"{SESSIONS_URL}/{sid}/stop", json={"note": "x" * 501}, headers=auth_header
    )
    assert resp.status_code == 400


def test_active_returns_204_when_nothing_runs(client, auth_header):
    resp = client.get(f"{SESSIONS_URL}/active", headers=auth_header)
    assert resp.status_code == 204


def test_list_rejects_invalid_limit(client, auth_header):
    """Ein unsinniger Abfrageparameter darf keinen Serverfehler ausloesen (M1)."""
    resp = client.get(f"{SESSIONS_URL}?limit=abc", headers=auth_header)
    assert resp.status_code == 400
    assert "error" in resp.get_json()
