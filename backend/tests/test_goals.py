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


def _angelegtes_lernziel(client, **overrides) -> dict:
    """Legt ein Lernziel an und gibt die Antwort als Dictionary zurueck."""
    response = client.post("/api/goals", json=gueltiges_lernziel(**overrides))
    assert response.status_code == 201
    return response.get_json()


def test_einzelnes_lernziel_abrufen(client):
    angelegt = _angelegtes_lernziel(client, title="Klausur Statistik")

    response = client.get(f"/api/goals/{angelegt['id']}")

    assert response.status_code == 200
    assert response.get_json()["title"] == "Klausur Statistik"


def test_unbekanntes_lernziel_abrufen_liefert_404(client):
    response = client.get("/api/goals/999")

    assert response.status_code == 404
    assert "id" in response.get_json()["errors"]


def test_lernziel_bearbeiten_aendert_alle_felder(client):
    angelegt = _angelegtes_lernziel(client)
    neues_datum = (date.today() + timedelta(days=45)).isoformat()

    response = client.put(
        f"/api/goals/{angelegt['id']}",
        json={
            "title": "Neuer Titel",
            "module": "Statistik (DLBDSSS01)",
            "target_date": neues_datum,
            "status": "erreicht",
        },
    )

    assert response.status_code == 200
    body = response.get_json()
    assert body["id"] == angelegt["id"]
    assert body["title"] == "Neuer Titel"
    assert body["module"] == "Statistik (DLBDSSS01)"
    assert body["target_date"] == neues_datum
    assert body["status"] == "erreicht"


def test_lernziel_verschieben_aendert_nur_das_zieldatum(client):
    angelegt = _angelegtes_lernziel(client)
    neues_datum = (date.today() + timedelta(days=400)).isoformat()

    response = client.put(
        f"/api/goals/{angelegt['id']}",
        json=gueltiges_lernziel(target_date=neues_datum),
    )

    assert response.status_code == 200
    body = response.get_json()
    assert body["target_date"] == neues_datum
    assert body["title"] == angelegt["title"]
    assert body["module"] == angelegt["module"]


def test_bearbeitung_ist_in_der_liste_sichtbar(client):
    angelegt = _angelegtes_lernziel(client)

    client.put(f"/api/goals/{angelegt['id']}", json=gueltiges_lernziel(title="Geaendert"))

    liste = client.get("/api/goals").get_json()
    assert len(liste) == 1
    assert liste[0]["title"] == "Geaendert"


def test_unbekanntes_lernziel_bearbeiten_liefert_404(client):
    response = client.put("/api/goals/999", json=gueltiges_lernziel())

    assert response.status_code == 404


def test_bearbeiten_mit_ungueltigen_daten_liefert_400_und_aendert_nichts(client):
    angelegt = _angelegtes_lernziel(client, title="Unveraendert")

    response = client.put(f"/api/goals/{angelegt['id']}", json=gueltiges_lernziel(title="  "))

    assert response.status_code == 400
    assert "title" in response.get_json()["errors"]
    unveraendert = client.get(f"/api/goals/{angelegt['id']}").get_json()
    assert unveraendert["title"] == "Unveraendert"


def test_lernziel_loeschen_liefert_204(client):
    angelegt = _angelegtes_lernziel(client)

    response = client.delete(f"/api/goals/{angelegt['id']}")

    assert response.status_code == 204
    assert response.get_data() == b""


def test_geloeschtes_lernziel_ist_aus_der_liste_verschwunden(client):
    bleibt = _angelegtes_lernziel(client, title="bleibt")
    geht = _angelegtes_lernziel(client, title="geht")

    client.delete(f"/api/goals/{geht['id']}")

    liste = client.get("/api/goals").get_json()
    assert [goal["title"] for goal in liste] == ["bleibt"]
    assert client.get(f"/api/goals/{bleibt['id']}").status_code == 200


def test_zweimal_loeschen_liefert_beim_zweiten_mal_404(client):
    angelegt = _angelegtes_lernziel(client)

    assert client.delete(f"/api/goals/{angelegt['id']}").status_code == 204
    assert client.delete(f"/api/goals/{angelegt['id']}").status_code == 404
