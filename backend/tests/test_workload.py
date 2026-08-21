"""Prueft die Workload-Rechnung der Grobplanung (FR-2.1, Plan P7)."""

from datetime import date, timedelta

from app.workload import (
    MINUTES_PER_ECTS,
    months_until,
    remaining_minutes,
    weekly_budget_minutes,
    weeks_until,
)

TODAY = date(2026, 8, 17)


def test_remaining_minutes_subtracts_actual():
    assert remaining_minutes(5 * MINUTES_PER_ECTS, 600) == 5 * MINUTES_PER_ECTS - 600


def test_remaining_minutes_never_negative():
    assert remaining_minutes(1 * MINUTES_PER_ECTS, 999_999) == 0


def test_weeks_until_rounds_up_and_has_minimum_one():
    assert weeks_until(TODAY + timedelta(days=70), TODAY) == 10
    assert weeks_until(TODAY + timedelta(days=1), TODAY) == 1
    assert weeks_until(TODAY - timedelta(days=30), TODAY) == 1


def test_months_until_counts_inclusive_with_minimum_one():
    assert months_until(date(2027, 1, 15), 2026, 8) == 6
    assert months_until(date(2026, 8, 31), 2026, 8) == 1
    assert months_until(date(2026, 5, 1), 2026, 8) == 1


def test_weekly_budget_spreads_remaining_over_weeks():
    # 5 ECTS = 9000 min Restaufwand, Ziel in 10 Wochen -> 900 min/Woche
    target = TODAY + timedelta(days=70)
    assert weekly_budget_minutes(5 * MINUTES_PER_ECTS, 0, target, TODAY, "open") == 900


def test_weekly_budget_zero_for_achieved_goal():
    target = TODAY + timedelta(days=70)
    assert weekly_budget_minutes(5 * MINUTES_PER_ECTS, 0, target, TODAY, "achieved") == 0


def test_weekly_budget_zero_without_remaining_workload():
    target = TODAY + timedelta(days=70)
    assert weekly_budget_minutes(1 * MINUTES_PER_ECTS, MINUTES_PER_ECTS, target, TODAY, "open") == 0


def test_weekly_budget_past_target_uses_single_week():
    # Zieldatum verstrichen: der ganze Restaufwand faellt in eine Woche.
    target = TODAY - timedelta(days=5)
    assert weekly_budget_minutes(1 * MINUTES_PER_ECTS, 0, target, TODAY, "open") == MINUTES_PER_ECTS


def test_dashboard_delivers_weekly_budget(client, auth_header, goal_id):
    resp = client.get("/api/dashboard", headers=auth_header)
    assert resp.status_code == 200
    goal = resp.get_json()["goals"][0]
    assert goal["weekly_budget_minutes"] > 0


def test_weekly_budget_uses_workload_hours_override(client, auth_header):
    resp = client.post(
        "/api/goals",
        json={
            "title": "Override-Ziel",
            "module_name": "X",
            "target_date": (TODAY + timedelta(days=70)).isoformat(),
            "ects": 5,
            "workload_hours": 50,
        },
        headers=auth_header,
    )
    assert resp.status_code == 201
    goal = resp.get_json()
    assert goal["workload_hours"] == 50

    dash = client.get("/api/dashboard", headers=auth_header)
    goal_data = next(g for g in dash.get_json()["goals"] if g["id"] == goal["id"])
    # 50 Stunden = 3000 Minuten statt 5 * 1800 = 9000 Minuten aus der Formel.
    assert goal_data["planned_ects_minutes"] == 50 * 60


def test_goal_without_workload_hours_keeps_ects_formula(client, auth_header):
    resp = client.post(
        "/api/goals",
        json={
            "title": "Formel-Ziel",
            "module_name": "X",
            "target_date": (TODAY + timedelta(days=70)).isoformat(),
            "ects": 5,
        },
        headers=auth_header,
    )
    assert resp.status_code == 201
    goal = resp.get_json()
    assert goal["workload_hours"] is None

    dash = client.get("/api/dashboard", headers=auth_header)
    goal_data = next(g for g in dash.get_json()["goals"] if g["id"] == goal["id"])
    assert goal_data["planned_ects_minutes"] == 5 * MINUTES_PER_ECTS
