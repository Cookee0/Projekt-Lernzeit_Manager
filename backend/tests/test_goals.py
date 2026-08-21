from datetime import date, timedelta

GOALS_URL = "/api/goals"

FUTURE_DATE = (date.today() + timedelta(days=200)).isoformat()

_GOAL_PAYLOAD = {
    "title": "T",
    "module_name": "M",
    "target_date": "2027-01-01",
    "ects": 5,
    "status": "open",
}


def test_list_goals_empty(client, auth_header):
    resp = client.get(GOALS_URL, headers=auth_header)
    assert resp.status_code == 200
    assert resp.get_json() == []


def test_create_goal(client, auth_header):
    payload = {
        "title": "Prog 1",
        "module_name": "DLBIPPR01",
        "target_date": "2027-02-28",
        "ects": 5,
        "status": "open",
    }
    resp = client.post(GOALS_URL, json=payload, headers=auth_header)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["title"] == "Prog 1"
    assert data["ects"] == 5


def test_create_goal_missing_fields(client, auth_header):
    resp = client.post(GOALS_URL, json={"title": "Incomplete"}, headers=auth_header)
    assert resp.status_code == 400


def test_update_goal_status(client, auth_header):
    create_resp = client.post(GOALS_URL, json=_GOAL_PAYLOAD, headers=auth_header)
    goal_id = create_resp.get_json()["id"]
    resp = client.put(f"{GOALS_URL}/{goal_id}", json={"status": "achieved"}, headers=auth_header)
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "achieved"


def test_delete_goal(client, auth_header):
    create_resp = client.post(
        GOALS_URL,
        json={**_GOAL_PAYLOAD, "title": "Del"},
        headers=auth_header,
    )
    goal_id = create_resp.get_json()["id"]
    resp = client.delete(f"{GOALS_URL}/{goal_id}", headers=auth_header)
    assert resp.status_code == 204
    get_resp = client.get(f"{GOALS_URL}/{goal_id}", headers=auth_header)
    assert get_resp.status_code == 404


def test_create_goal_with_priority_and_result(client, auth_header):
    resp = client.post(
        GOALS_URL,
        json={
            "title": "Klausur Statistik",
            "module_name": "STAT01",
            "target_date": FUTURE_DATE,
            "priority": "high",
            "grade": "1,7",
            "result_note": "Altklausuren waren entscheidend.",
        },
        headers=auth_header,
    )
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["priority"] == "high"
    assert body["grade"] == "1,7"
    assert body["result_note"] == "Altklausuren waren entscheidend."


def test_create_goal_rejects_unknown_priority(client, auth_header):
    resp = client.post(
        GOALS_URL,
        json={
            "title": "Falsche Prioritaet",
            "module_name": "X",
            "target_date": FUTURE_DATE,
            "priority": "dringend",
        },
        headers=auth_header,
    )
    assert resp.status_code == 400


def test_goal_without_priority_stays_valid(client, auth_header):
    """FR-1.4 ist "Could" - die Prioritaet bleibt optional."""
    resp = client.post(
        GOALS_URL,
        json={"title": "Ohne Prio", "module_name": "X", "target_date": FUTURE_DATE},
        headers=auth_header,
    )
    assert resp.status_code == 201
    assert resp.get_json()["priority"] is None


def test_create_goal_rejects_workload_hours_out_of_range(client, auth_header):
    resp = client.post(
        GOALS_URL,
        json={
            "title": "Zu viele Stunden",
            "module_name": "X",
            "target_date": FUTURE_DATE,
            "workload_hours": 1001,
        },
        headers=auth_header,
    )
    assert resp.status_code == 400


def test_update_goal_clears_workload_hours_with_empty_string(client, auth_header):
    create_resp = client.post(
        GOALS_URL,
        json={**_GOAL_PAYLOAD, "workload_hours": 50},
        headers=auth_header,
    )
    goal_id = create_resp.get_json()["id"]
    assert create_resp.get_json()["workload_hours"] == 50

    resp = client.put(
        f"{GOALS_URL}/{goal_id}", json={"workload_hours": ""}, headers=auth_header
    )
    assert resp.status_code == 200
    assert resp.get_json()["workload_hours"] is None
