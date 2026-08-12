"""Einheitliche Ausgabe von Zeitpunkten an die Schnittstelle.

Die Datenbank speichert Zeitpunkte in koordinierter Weltzeit (UTC), aber ohne
Zeitzonen-Kennzeichnung. Gibt man sie unveraendert aus, deutet JavaScript im
Browser sie als Ortszeit und rechnet um zwei Stunden daneben (Sommerzeit in
Deutschland). Das angehaengte 'Z' kennzeichnet den Wert ausdruecklich als UTC.
"""

from datetime import datetime, timezone


def iso_utc(value: datetime | None) -> str | None:
    """Gibt einen Zeitpunkt als '2026-08-11T21:08:09+00:00' in der Kurzform mit 'Z' aus.

    Zeitpunkte ohne Zeitzonen-Angabe werden als UTC verstanden, weil die
    Anwendung ausschliesslich UTC speichert (siehe _now in
    backend/app/routes/sessions.py). Bereits gekennzeichnete Zeitpunkte werden
    nach UTC umgerechnet.
    """
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    else:
        value = value.astimezone(timezone.utc)
    return value.isoformat().replace("+00:00", "Z")
