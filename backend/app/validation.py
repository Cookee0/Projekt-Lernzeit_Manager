"""Gemeinsame Pruefungen fuer eingehende Daten der REST-Schnittstelle.

Jede Funktion prueft genau eine Sache. Bei Erfolg liefert sie den bereinigten
Wert zurueck, sonst wirft sie ValidationError. Die Ausnahme wird in
backend/app/__init__.py zentral in eine Antwort mit Status 400 uebersetzt.
"""

import re
from calendar import monthrange
from datetime import date

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$")
TIME_PATTERN = re.compile(r"^([01][0-9]|2[0-3]):[0-5][0-9]$")

MAX_FUTURE_YEARS = 10


class ValidationError(Exception):
    """Eine Eingabe verletzt eine fachliche Regel."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


def _is_missing(value) -> bool:
    return value is None or (isinstance(value, str) and value.strip() == "")


def require_text(value, field_label: str, max_length: int) -> str:
    """Pflichttext: nicht leer, nicht laenger als die Datenbankspalte."""
    if _is_missing(value):
        raise ValidationError(f"{field_label} darf nicht leer sein")
    text = str(value).strip()
    if len(text) > max_length:
        raise ValidationError(f"{field_label} darf hoechstens {max_length} Zeichen lang sein")
    return text


def optional_text(value, field_label: str, max_length: int) -> str | None:
    if _is_missing(value):
        return None
    return require_text(value, field_label, max_length)


def require_email(value) -> str:
    email = require_text(value, "E-Mail-Adresse", 255).lower()
    if not EMAIL_PATTERN.match(email):
        raise ValidationError("E-Mail-Adresse muss die Form name@domain.de haben")
    return email


def require_password(value) -> str:
    if _is_missing(value):
        raise ValidationError("Passwort darf nicht leer sein")
    password = str(value)
    if len(password) < 6:
        raise ValidationError("Passwort muss mindestens 6 Zeichen haben")
    if len(password) > 128:
        raise ValidationError("Passwort darf hoechstens 128 Zeichen haben")
    return password


def require_int_in_range(
    value, field_label: str, minimum: int, maximum: int, default: int | None = None
) -> int:
    """Ganze Zahl im erlaubten Bereich.

    Fehlt der Wert und ist ein Standardwert angegeben, wird dieser benutzt.
    Die Zahl 0 gilt ausdruecklich als vorhandener Wert - sie darf nicht
    stillschweigend durch den Standardwert ersetzt werden.
    """
    if _is_missing(value):
        if default is not None:
            return default
        raise ValidationError(f"{field_label} ist ein Pflichtfeld")
    try:
        number = int(value)
    except (TypeError, ValueError):
        raise ValidationError(f"{field_label} muss eine ganze Zahl sein") from None
    if number < minimum or number > maximum:
        raise ValidationError(
            f"{field_label} muss zwischen {minimum} und {maximum} liegen"
        )
    return number


def require_future_date(value, field_label: str) -> date:
    """ISO-Datum (JJJJ-MM-TT), heute oder spaeter, hoechstens 10 Jahre voraus."""
    if _is_missing(value):
        raise ValidationError(f"{field_label} ist ein Pflichtfeld")
    try:
        parsed = date.fromisoformat(str(value))
    except ValueError:
        raise ValidationError(
            f"{field_label} muss im Format JJJJ-MM-TT angegeben werden"
        ) from None
    today = date.today()
    if parsed < today:
        raise ValidationError(f"{field_label} darf nicht in der Vergangenheit liegen")
    if parsed.year > today.year + MAX_FUTURE_YEARS:
        raise ValidationError(
            f"{field_label} darf hoechstens {MAX_FUTURE_YEARS} Jahre in der Zukunft liegen"
        )
    return parsed


def require_day_of_month(value, year: int, month: int) -> int | None:
    """Tag im Monat, passend zur Laenge des Monats (Schaltjahre eingeschlossen)."""
    if _is_missing(value):
        return None
    last_day = monthrange(year, month)[1]
    return require_int_in_range(value, "Tag des Monats", 1, last_day)


def optional_clock_time(value) -> str | None:
    """Uhrzeit im 24-Stunden-Format HH:MM, zum Beispiel 14:30."""
    if _is_missing(value):
        return None
    text = str(value).strip()
    if not TIME_PATTERN.match(text):
        raise ValidationError("Uhrzeit muss im Format HH:MM angegeben werden, zum Beispiel 14:30")
    return text
