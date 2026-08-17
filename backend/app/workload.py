"""Workload-Rechnung fuer die Grobplanung (FR-2.1, FR-2.2, FR-3.3).

Der Lernaufwand eines Moduls leitet sich aus seinen ECTS-Punkten ab
(Kickoff-Beschluss); ein ECTS-Punkt entspricht 30 Stunden (Teamentscheidung
vom 2026-08-17, IU-Rechnung "5 ECTS = 150 Stunden").
"""

from datetime import date
from math import ceil

MINUTES_PER_ECTS = 30 * 60  # 30 Stunden je ECTS-Punkt, in Minuten


def remaining_minutes(ects: int, actual_minutes: int) -> int:
    """Restaufwand eines Ziels: Gesamtworkload minus bereits gelernte Zeit."""
    return max(0, ects * MINUTES_PER_ECTS - actual_minutes)


def weeks_until(target: date, today: date) -> int:
    """Anzahl angebrochener Wochen bis zum Zieldatum, mindestens 1.

    Ein bereits verstrichenes Zieldatum zaehlt wie eine Woche, damit der
    Restaufwand nicht durch 0 geteilt wird und weiterhin sichtbar bleibt.
    """
    return max(1, ceil(max(0, (target - today).days) / 7))


def months_until(target: date, year: int, month: int) -> int:
    """Kalendermonate vom Monat (year, month) bis zum Monat des Zieldatums,
    beide einschliesslich, mindestens 1."""
    return max(1, (target.year - year) * 12 + target.month - month + 1)


def weekly_budget_minutes(
    ects: int, actual_minutes: int, target: date, today: date, status: str
) -> int:
    """Wochenbudget je Modul (FR-2.1): Restaufwand pro verbleibender Woche.

    Erreichte Ziele und Ziele ohne Restaufwand haben Budget 0.
    """
    if status == "achieved":
        return 0
    rest = remaining_minutes(ects, actual_minutes)
    if rest == 0:
        return 0
    return round(rest / weeks_until(target, today))
