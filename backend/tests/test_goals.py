import pytest

REGISTER_URL = "/api/auth/register"
LOGIN_URL = "/api/auth/login"
GOALS_URL = "/api/goals"

_GOAL_PAYLOAD = {
    "title": "T",
    "module_name": "M",
    "target_date": "2027-01-01",
    "ects": 5,
    "status": "open",
}


@pytest.fixture
def auth_header(client):
    reg = {"email": "goals@example.com", "name": "G", "password": "pass123"}
    client.post(REGISTER_URL, json=reg)
    resp = client.post(LOGIN_URL, json={"email": "goals@example.com", "password": "pass123"})
    token = resp.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


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
