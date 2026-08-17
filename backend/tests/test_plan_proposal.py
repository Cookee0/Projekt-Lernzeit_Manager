"""Prueft den Grobplanungs-Vorschlag GET /api/plans/proposal (FR-2.2, FR-3.3, Plan P7)."""

from datetime import date, timedelta

from app.extensions import db
from app.models.goal import Goal
from app.workload import MINUTES_PER_ECTS, months_until

PROPOSAL_URL = "/api/plans/proposal"
FUTURE_DATE = (date.today() + timedelta(days=200)).isoformat()


def test_requires_token(client):
    assert client.get(PROPOSAL_URL).status_code == 401


def test_empty_without_goals(client, auth_header):
    resp = client.get(PROPOSAL_URL, headers=auth_header)
    assert resp.status_code == 200
    data = resp.get_json()
    today = date.today()
    assert data["year"] == today.year
    assert data["month"] == today.month
    assert data["goals"] == []


def test_year_without_month_rejected(client, auth_header):
    resp = client.get(f"{PROPOSAL_URL}?year=2026", headers=auth_header)
    assert resp.status_code == 400
    assert "error" in resp.get_json()


def test_invalid_month_rejected(client, auth_header):
    resp = client.get(f"{PROPOSAL_URL}?year=2026&month=13", headers=auth_header)
    assert resp.status_code == 400


def test_proposal_with_slots_computes_deviation(client, auth_header, goal_id):
    today = date.today()
    resp = client.post(
        "/api/plans",
        json={
            "goal_id": goal_id,
            "year": today.year,
            "month": today.month,
            "duration_minutes": 120,
        },
        headers=auth_header,
    )
    assert resp.status_code == 201

    data = client.get(PROPOSAL_URL, headers=auth_header).get_json()
    assert len(data["goals"]) == 1
    entry = data["goals"][0]
    # goal_id-Fixture: 5 ECTS (Default), keine Sessions -> voller Restaufwand.
    target = date.today() + timedelta(days=200)
    expected_suggested = round(
        5 * MINUTES_PER_ECTS / months_until(target, today.year, today.month)
    )
    assert entry["suggested_month_minutes"] == expected_suggested
    assert entry["planned_minutes"] == 120
    assert entry["deviation_minutes"] == 120 - expected_suggested
    assert entry["weekly_budget_minutes"] > 0


def test_achieved_and_expired_goals_excluded(client, auth_header, goal_id):
    goal = db.session.get(Goal, goal_id)
    goal.status = "achieved"
    db.session.add(
        Goal(
            user_id=goal.user_id,
            title="Abgelaufen",
            module_name="ALT01",
            target_date=date.today() - timedelta(days=60),
            status="open",
        )
    )
    db.session.commit()

    data = client.get(PROPOSAL_URL, headers=auth_header).get_json()
    assert data["goals"] == []
