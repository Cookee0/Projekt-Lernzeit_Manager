from datetime import date, timedelta

IN_SIEBEN_MONATEN = (date.today() + timedelta(days=210)).isoformat()
MODUL = "Projekt Software Engineering (ISEF01)"


def gueltiges_lernziel(**overrides) -> dict:
    """Baut gueltige Eingabedaten und erlaubt gezieltes Ueberschreiben."""
    payload = {
        "title": "Modul ISEF01 abschließen",
        "module": MODUL,
        "target_date": IN_SIEBEN_MONATEN,
    }
    payload.update(overrides)
    return payload


def test_liste_ist_anfangs_leer(client):
    response = client.get("/api/goals")

    assert response.status_code == 200
    assert response.get_json() == []


def test_lernziel_anlegen_liefert_201_und_das_angelegte_ziel(client):
    response = client.post("/api/goals", json=gueltiges_lernziel())

    assert response.status_code == 201
    body = response.get_json()
    assert body["id"] > 0
    assert body["title"] == "Modul ISEF01 abschließen"
    assert body["module"] == MODUL
    assert body["target_date"] == IN_SIEBEN_MONATEN
    assert body["created_at"] is not None


def test_angelegtes_lernziel_erscheint_in_der_liste(client):
    client.post("/api/goals", json=gueltiges_lernziel(title="Klausur Mathematik"))

    response = client.get("/api/goals")

    assert response.status_code == 200
    body = response.get_json()
    assert len(body) == 1
    assert body[0]["title"] == "Klausur Mathematik"
    assert body[0]["module"] == MODUL
    assert body[0]["status"] == "offen"


def test_lernziele_sind_nach_zieldatum_sortiert(client):
    spaet = (date.today() + timedelta(days=300)).isoformat()
    frueh = (date.today() + timedelta(days=10)).isoformat()
    client.post("/api/goals", json=gueltiges_lernziel(title="spaeter", target_date=spaet))
    client.post("/api/goals", json=gueltiges_lernziel(title="frueher", target_date=frueh))

    body = client.get("/api/goals").get_json()

    assert [goal["title"] for goal in body] == ["frueher", "spaeter"]


def test_fehlender_titel_wird_abgelehnt(client):
    payload = gueltiges_lernziel()
    del payload["title"]

    response = client.post("/api/goals", json=payload)

    assert response.status_code == 400
    assert "title" in response.get_json()["errors"]


def test_titel_aus_leerzeichen_wird_abgelehnt(client):
    response = client.post("/api/goals", json=gueltiges_lernziel(title="   "))

    assert response.status_code == 400
    assert "title" in response.get_json()["errors"]


def test_ungueltiges_datumsformat_wird_abgelehnt(client):
    response = client.post("/api/goals", json=gueltiges_lernziel(target_date="28.02.2027"))

    assert response.status_code == 400
    assert "target_date" in response.get_json()["errors"]


def test_nach_abgelehnter_eingabe_ist_nichts_gespeichert(client):
    client.post("/api/goals", json={"title": "", "target_date": "kein Datum"})

    assert client.get("/api/goals").get_json() == []


def test_titel_wird_von_umgebenden_leerzeichen_befreit(client):
    response = client.post(
        "/api/goals",
        json=gueltiges_lernziel(title="  Projektbericht abgeben  "),
    )

    assert response.get_json()["title"] == "Projektbericht abgeben"


def test_fehlendes_modul_wird_abgelehnt(client):
    payload = gueltiges_lernziel()
    del payload["module"]

    response = client.post("/api/goals", json=payload)

    assert response.status_code == 400
    assert "module" in response.get_json()["errors"]


def test_modul_aus_leerzeichen_wird_abgelehnt(client):
    response = client.post("/api/goals", json=gueltiges_lernziel(module="  "))

    assert response.status_code == 400
    assert "module" in response.get_json()["errors"]


def test_modul_wird_von_umgebenden_leerzeichen_befreit(client):
    response = client.post("/api/goals", json=gueltiges_lernziel(module="  ISEF01  "))

    assert response.get_json()["module"] == "ISEF01"


def test_status_ist_ohne_angabe_offen(client):
    response = client.post("/api/goals", json=gueltiges_lernziel())

    assert response.get_json()["status"] == "offen"


def test_angegebener_status_wird_uebernommen(client):
    response = client.post("/api/goals", json=gueltiges_lernziel(status="in_arbeit"))

    assert response.status_code == 201
    assert response.get_json()["status"] == "in_arbeit"


def test_alle_drei_status_werden_akzeptiert(client):
    for status in ("offen", "in_arbeit", "erreicht"):
        response = client.post("/api/goals", json=gueltiges_lernziel(status=status))
        assert response.status_code == 201, f"Status {status} wurde abgelehnt"
        assert response.get_json()["status"] == status


def test_unbekannter_status_wird_abgelehnt(client):
    response = client.post("/api/goals", json=gueltiges_lernziel(status="fertig"))

    assert response.status_code == 400
    assert "status" in response.get_json()["errors"]


def test_status_null_wird_abgelehnt(client):
    response = client.post("/api/goals", json=gueltiges_lernziel(status=None))

    assert response.status_code == 400
    assert "status" in response.get_json()["errors"]
