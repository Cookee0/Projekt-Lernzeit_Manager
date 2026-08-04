from datetime import date, timedelta

IN_SIEBEN_MONATEN = (date.today() + timedelta(days=210)).isoformat()


def test_liste_ist_anfangs_leer(client):
    response = client.get("/api/goals")

    assert response.status_code == 200
    assert response.get_json() == []


def test_lernziel_anlegen_liefert_201_und_das_angelegte_ziel(client):
    response = client.post(
        "/api/goals",
        json={"title": "Modul ISEF01 abschließen", "target_date": IN_SIEBEN_MONATEN},
    )

    assert response.status_code == 201
    body = response.get_json()
    assert body["id"] > 0
    assert body["title"] == "Modul ISEF01 abschließen"
    assert body["target_date"] == IN_SIEBEN_MONATEN
    assert body["created_at"] is not None


def test_angelegtes_lernziel_erscheint_in_der_liste(client):
    client.post(
        "/api/goals",
        json={"title": "Klausur Mathematik", "target_date": IN_SIEBEN_MONATEN},
    )

    response = client.get("/api/goals")

    assert response.status_code == 200
    body = response.get_json()
    assert len(body) == 1
    assert body[0]["title"] == "Klausur Mathematik"
    assert body[0]["target_date"] == IN_SIEBEN_MONATEN


def test_lernziele_sind_nach_zieldatum_sortiert(client):
    spaet = (date.today() + timedelta(days=300)).isoformat()
    frueh = (date.today() + timedelta(days=10)).isoformat()
    client.post("/api/goals", json={"title": "spaeter", "target_date": spaet})
    client.post("/api/goals", json={"title": "frueher", "target_date": frueh})

    body = client.get("/api/goals").get_json()

    assert [goal["title"] for goal in body] == ["frueher", "spaeter"]


def test_fehlender_titel_wird_abgelehnt(client):
    response = client.post("/api/goals", json={"target_date": IN_SIEBEN_MONATEN})

    assert response.status_code == 400
    assert "title" in response.get_json()["errors"]


def test_titel_aus_leerzeichen_wird_abgelehnt(client):
    response = client.post(
        "/api/goals",
        json={"title": "   ", "target_date": IN_SIEBEN_MONATEN},
    )

    assert response.status_code == 400
    assert "title" in response.get_json()["errors"]


def test_ungueltiges_datumsformat_wird_abgelehnt(client):
    response = client.post(
        "/api/goals",
        json={"title": "Irgendein Ziel", "target_date": "28.02.2027"},
    )

    assert response.status_code == 400
    assert "target_date" in response.get_json()["errors"]


def test_nach_abgelehnter_eingabe_ist_nichts_gespeichert(client):
    client.post("/api/goals", json={"title": "", "target_date": "kein Datum"})

    assert client.get("/api/goals").get_json() == []


def test_titel_wird_von_umgebenden_leerzeichen_befreit(client):
    response = client.post(
        "/api/goals",
        json={"title": "  Projektbericht abgeben  ", "target_date": IN_SIEBEN_MONATEN},
    )

    assert response.get_json()["title"] == "Projektbericht abgeben"
