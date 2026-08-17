"""Prueft die monatlichen Zwischenziele (FR-3.2).

Ein Zwischenziel ist ein kurzfristiges Arbeitspaket innerhalb eines Monats.
Es haengt optional an einem Lernziel und laesst sich abhaken.
"""

MILESTONES_URL = "/api/milestones"


def _payload(**overrides) -> dict:
    payload = {"title": "Kapitel 3 abschliessen", "year": 2026, "month": 8}
    payload.update(overrides)
    return payload


def test_create_returns_201(client, auth_header):
    resp = client.post(MILESTONES_URL, json=_payload(), headers=auth_header)
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["title"] == "Kapitel 3 abschliessen"
    assert body["done"] is False
    assert body["goal_id"] is None


def test_create_with_goal(client, auth_header, goal_id):
    resp = client.post(MILESTONES_URL, json=_payload(goal_id=goal_id), headers=auth_header)
    assert resp.status_code == 201
    assert resp.get_json()["goal_id"] == goal_id


def test_create_with_unknown_goal_returns_404(client, auth_header):
    resp = client.post(MILESTONES_URL, json=_payload(goal_id=999999), headers=auth_header)
    assert resp.status_code == 404


def test_create_without_title_returns_400(client, auth_header):
    resp = client.post(MILESTONES_URL, json={"year": 2026, "month": 8}, headers=auth_header)
    assert resp.status_code == 400
    assert "error" in resp.get_json()


def test_create_rejects_day_outside_the_month(client, auth_header):
    """Der 31. Februar existiert nicht - require_day_of_month kennt die Monatslaenge."""
    resp = client.post(
        MILESTONES_URL, json=_payload(month=2, due_day=31), headers=auth_header
    )
    assert resp.status_code == 400


def test_create_accepts_valid_due_day(client, auth_header):
    resp = client.post(MILESTONES_URL, json=_payload(due_day=15), headers=auth_header)
    assert resp.status_code == 201
    assert resp.get_json()["due_day"] == 15


def test_list_filters_by_month(client, auth_header):
    client.post(MILESTONES_URL, json=_payload(month=8), headers=auth_header)
    client.post(MILESTONES_URL, json=_payload(month=9, title="Anderer Monat"), headers=auth_header)

    resp = client.get(f"{MILESTONES_URL}?year=2026&month=9", headers=auth_header)
    assert resp.status_code == 200
    assert len(resp.get_json()) == 1
    assert resp.get_json()[0]["title"] == "Anderer Monat"


def test_list_rejects_invalid_query_parameter(client, auth_header):
    resp = client.get(f"{MILESTONES_URL}?month=abc", headers=auth_header)
    assert resp.status_code == 400
    assert "error" in resp.get_json()


def test_update_marks_as_done(client, auth_header):
    angelegt = client.post(MILESTONES_URL, json=_payload(), headers=auth_header)
    mid = angelegt.get_json()["id"]

    resp = client.put(f"{MILESTONES_URL}/{mid}", json={"done": True}, headers=auth_header)
    assert resp.status_code == 200
    assert resp.get_json()["done"] is True


def test_update_changes_title(client, auth_header):
    angelegt = client.post(MILESTONES_URL, json=_payload(), headers=auth_header)
    mid = angelegt.get_json()["id"]

    resp = client.put(f"{MILESTONES_URL}/{mid}", json={"title": "Neuer Titel"}, headers=auth_header)
    assert resp.status_code == 200
    assert resp.get_json()["title"] == "Neuer Titel"


def test_delete_removes_the_milestone(client, auth_header):
    angelegt = client.post(MILESTONES_URL, json=_payload(), headers=auth_header)
    mid = angelegt.get_json()["id"]

    resp = client.delete(f"{MILESTONES_URL}/{mid}", headers=auth_header)
    assert resp.status_code == 204
    assert client.get(MILESTONES_URL, headers=auth_header).get_json() == []


def test_foreign_milestone_is_not_reachable(client, auth_header):
    angelegt = client.post(MILESTONES_URL, json=_payload(), headers=auth_header)
    mid = angelegt.get_json()["id"]

    zweiter = client.post(
        "/api/auth/register",
        json={"email": "fremd@example.de", "name": "Fremd", "password": "pass123"},
    )
    fremd_header = {"Authorization": f"Bearer {zweiter.get_json()['access_token']}"}

    assert client.get(MILESTONES_URL, headers=fremd_header).get_json() == []
    assert client.put(f"{MILESTONES_URL}/{mid}", json={"done": True},
                      headers=fremd_header).status_code == 404
    assert client.delete(f"{MILESTONES_URL}/{mid}", headers=fremd_header).status_code == 404


def test_deleting_a_goal_keeps_its_milestones(client, auth_header, goal_id):
    """Ein Zwischenziel ueberlebt das Loeschen seines Lernziels und verwaist nur."""
    client.post(MILESTONES_URL, json=_payload(goal_id=goal_id), headers=auth_header)

    assert client.delete(f"/api/goals/{goal_id}", headers=auth_header).status_code == 204

    verbleibend = client.get(MILESTONES_URL, headers=auth_header).get_json()
    assert len(verbleibend) == 1
    assert verbleibend[0]["goal_id"] is None


def test_requires_authentication(client):
    assert client.get(MILESTONES_URL).status_code == 401
