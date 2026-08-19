"""Prueft die geplanten Lernzeiten (FR-2.1, FR-3.1).

Ein Planungseintrag ohne Tag ist eine Monatsplanung (Grobplanung), einer mit
Tag eine konkrete Detailplanung. Beides teilt sich dieselbe Tabelle.
"""

from datetime import date

PLANS_URL = "/api/plans"

HEUTE = date.today()


def _slot(goal_id: int, **overrides) -> dict:
    payload = {
        "goal_id": goal_id,
        "year": HEUTE.year,
        "month": HEUTE.month,
        "day": 15,
        "duration_minutes": 90,
    }
    payload.update(overrides)
    return payload


def test_create_and_list(client, auth_header, goal_id):
    resp = client.post(PLANS_URL, json=_slot(goal_id), headers=auth_header)
    assert resp.status_code == 201
    assert resp.get_json()["duration_minutes"] == 90

    liste = client.get(PLANS_URL, headers=auth_header)
    assert liste.status_code == 200
    assert len(liste.get_json()) == 1


def test_create_without_day_is_a_month_plan(client, auth_header, goal_id):
    """Grobplanung: ein Eintrag fuer den ganzen Monat, ohne festen Tag."""
    resp = client.post(PLANS_URL, json=_slot(goal_id, day=None), headers=auth_header)
    assert resp.status_code == 201
    assert resp.get_json()["day"] is None


def test_create_with_unknown_goal_returns_404(client, auth_header):
    resp = client.post(PLANS_URL, json=_slot(999999), headers=auth_header)
    assert resp.status_code == 404


def test_filter_by_month(client, auth_header, goal_id):
    client.post(PLANS_URL, json=_slot(goal_id, year=2026, month=8), headers=auth_header)
    client.post(PLANS_URL, json=_slot(goal_id, year=2026, month=9), headers=auth_header)

    resp = client.get(f"{PLANS_URL}?year=2026&month=9", headers=auth_header)
    assert resp.status_code == 200
    assert len(resp.get_json()) == 1
    assert resp.get_json()[0]["month"] == 9


def test_filter_by_goal(client, auth_header, goal_id):
    client.post(PLANS_URL, json=_slot(goal_id), headers=auth_header)

    resp = client.get(f"{PLANS_URL}?goal_id={goal_id}", headers=auth_header)
    assert len(resp.get_json()) == 1

    leer = client.get(f"{PLANS_URL}?goal_id={goal_id + 999}", headers=auth_header)
    assert leer.get_json() == []


def test_invalid_query_parameter_returns_400(client, auth_header):
    """Frueher HTTP 500 - siehe Meilenstein M1 dieses Plans."""
    for adresse in (f"{PLANS_URL}?year=abc", f"{PLANS_URL}?month=13", f"{PLANS_URL}?goal_id=x"):
        resp = client.get(adresse, headers=auth_header)
        assert resp.status_code == 400, adresse
        assert "error" in resp.get_json()


def test_update_changes_duration_and_note(client, auth_header, goal_id):
    angelegt = client.post(PLANS_URL, json=_slot(goal_id), headers=auth_header)
    sid = angelegt.get_json()["id"]

    resp = client.put(
        f"{PLANS_URL}/{sid}",
        json={"duration_minutes": 120, "note": "Kapitel 3 lesen"},
        headers=auth_header,
    )
    assert resp.status_code == 200
    assert resp.get_json()["duration_minutes"] == 120
    assert resp.get_json()["note"] == "Kapitel 3 lesen"


def test_delete_removes_the_slot(client, auth_header, goal_id):
    angelegt = client.post(PLANS_URL, json=_slot(goal_id), headers=auth_header)
    sid = angelegt.get_json()["id"]

    resp = client.delete(f"{PLANS_URL}/{sid}", headers=auth_header)
    assert resp.status_code == 204
    assert client.get(PLANS_URL, headers=auth_header).get_json() == []


def test_foreign_slot_is_not_reachable(client, auth_header, goal_id):
    """Fremde Datensaetze liefern 404, nicht 403 - die Existenz wird nicht verraten."""
    angelegt = client.post(PLANS_URL, json=_slot(goal_id), headers=auth_header)
    sid = angelegt.get_json()["id"]

    zweiter = client.post(
        "/api/auth/register",
        json={"email": "fremd@example.de", "name": "Fremd", "password": "pass123"},
    )
    fremd_header = {"Authorization": f"Bearer {zweiter.get_json()['access_token']}"}

    assert client.put(f"{PLANS_URL}/{sid}", json={"duration_minutes": 60},
                      headers=fremd_header).status_code == 404
    assert client.delete(f"{PLANS_URL}/{sid}", headers=fremd_header).status_code == 404


# Tests für Serientermine (FR-3.3, P9 M1)
def test_series_creates_multiple_slots(client, auth_header, goal_id):
    """(a) Gültige Serie: mehrere Slots an verschiedenen Tagen in einem Monat."""
    resp = client.post(
        f"{PLANS_URL}/series",
        json={
            "goal_id": goal_id,
            "year": HEUTE.year,
            "month": HEUTE.month,
            "days": [3, 10, 17],
            "planned_time": "14:00",
            "duration_minutes": 90,
            "note": "Mathe üben",
        },
        headers=auth_header,
    )
    assert resp.status_code == 201
    slots = resp.get_json()
    assert len(slots) == 3
    assert slots[0]["day"] == 3
    assert slots[1]["day"] == 10
    assert slots[2]["day"] == 17
    assert all(s["goal_id"] == goal_id for s in slots)
    assert all(s["planned_time"] == "14:00" for s in slots)
    assert all(s["duration_minutes"] == 90 for s in slots)
    assert all(s["note"] == "Mathe üben" for s in slots)

    # Anschließendes GET zeigt alle drei Slots
    liste = client.get(
        f"{PLANS_URL}?year={HEUTE.year}&month={HEUTE.month}",
        headers=auth_header,
    )
    assert len(liste.get_json()) == 3


def test_series_empty_days_returns_400(client, auth_header, goal_id):
    """(b) Leere Tage-Liste ist ungültig."""
    resp = client.post(
        f"{PLANS_URL}/series",
        json={
            "goal_id": goal_id,
            "year": HEUTE.year,
            "month": HEUTE.month,
            "days": [],
            "duration_minutes": 90,
        },
        headers=auth_header,
    )
    assert resp.status_code == 400
    assert "error" in resp.get_json()


def test_series_duplicate_days_returns_400(client, auth_header, goal_id):
    """(c) Duplikate in Tagen sind ungültig."""
    resp = client.post(
        f"{PLANS_URL}/series",
        json={
            "goal_id": goal_id,
            "year": HEUTE.year,
            "month": HEUTE.month,
            "days": [5, 5],
            "duration_minutes": 90,
        },
        headers=auth_header,
    )
    assert resp.status_code == 400
    assert "error" in resp.get_json()


def test_series_invalid_day_for_month_returns_400(client, auth_header, goal_id):
    """(d) Tag, der nicht im Monat existiert (z. B. 31. April)."""
    resp = client.post(
        f"{PLANS_URL}/series",
        json={
            "goal_id": goal_id,
            "year": 2026,
            "month": 4,
            "days": [31],
            "duration_minutes": 90,
        },
        headers=auth_header,
    )
    assert resp.status_code == 400
    assert "error" in resp.get_json()


def test_series_unknown_goal_returns_404_and_creates_no_slots(client, auth_header):
    """(e) Unbekanntes goal_id gibt 404 und erstellt keine Slots."""
    resp = client.post(
        f"{PLANS_URL}/series",
        json={
            "goal_id": 999999,
            "year": HEUTE.year,
            "month": HEUTE.month,
            "days": [5, 12, 19],
            "duration_minutes": 90,
        },
        headers=auth_header,
    )
    assert resp.status_code == 404

    # Prüfe, dass keine Slots erstellt wurden
    liste = client.get(PLANS_URL, headers=auth_header)
    assert len(liste.get_json()) == 0


def test_series_non_list_days_returns_400(client, auth_header, goal_id):
    """Test für nicht-Liste days (z. B. String statt List)."""
    resp = client.post(
        f"{PLANS_URL}/series",
        json={
            "goal_id": goal_id,
            "year": HEUTE.year,
            "month": HEUTE.month,
            "days": "5",  # String statt Liste
            "duration_minutes": 90,
        },
        headers=auth_header,
    )
    assert resp.status_code == 400
    assert "error" in resp.get_json()


def test_series_empty_string_in_days_returns_400(client, auth_header, goal_id):
    """Test für leerer String in der days-Liste."""
    resp = client.post(
        f"{PLANS_URL}/series",
        json={
            "goal_id": goal_id,
            "year": HEUTE.year,
            "month": HEUTE.month,
            "days": [5, ""],  # Leerer String in der Liste
            "duration_minutes": 90,
        },
        headers=auth_header,
    )
    assert resp.status_code == 400
    assert "error" in resp.get_json()


def test_series_none_in_days_returns_400(client, auth_header, goal_id):
    """Test für explizites None in der days-Liste."""
    resp = client.post(
        f"{PLANS_URL}/series",
        json={
            "goal_id": goal_id,
            "year": HEUTE.year,
            "month": HEUTE.month,
            "days": [5, None],  # None in der Liste
            "duration_minutes": 90,
        },
        headers=auth_header,
    )
    assert resp.status_code == 400
    assert "error" in resp.get_json()
