REGISTER_URL = "/api/auth/register"
LOGIN_URL = "/api/auth/login"
ME_URL = "/api/auth/me"


def test_register_success(client):
    payload = {"email": "test@example.com", "name": "Test", "password": "secret123"}
    resp = client.post(REGISTER_URL, json=payload)
    assert resp.status_code == 201
    data = resp.get_json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"


def test_register_missing_fields(client):
    resp = client.post(REGISTER_URL, json={"email": "x@x.com"})
    assert resp.status_code == 400


def test_register_duplicate_email(client):
    payload = {"email": "dup@example.com", "name": "Dup", "password": "secret123"}
    client.post(REGISTER_URL, json=payload)
    resp = client.post(REGISTER_URL, json=payload)
    assert resp.status_code == 409


def test_login_success(client):
    reg = {"email": "login@example.com", "name": "L", "password": "pass123"}
    client.post(REGISTER_URL, json=reg)
    resp = client.post(LOGIN_URL, json={"email": "login@example.com", "password": "pass123"})
    assert resp.status_code == 200
    assert "access_token" in resp.get_json()


def test_login_wrong_password(client):
    reg = {"email": "wrong@example.com", "name": "W", "password": "correct"}
    client.post(REGISTER_URL, json=reg)
    resp = client.post(LOGIN_URL, json={"email": "wrong@example.com", "password": "incorrect"})
    assert resp.status_code == 401


def test_me_requires_auth(client):
    resp = client.get(ME_URL)
    assert resp.status_code == 401


def test_me_with_token(client):
    client.post(REGISTER_URL, json={"email": "me@example.com", "name": "Me", "password": "pass123"})
    token_resp = client.post(LOGIN_URL, json={"email": "me@example.com", "password": "pass123"})
    token = token_resp.get_json()["access_token"]
    resp = client.get(ME_URL, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.get_json()["email"] == "me@example.com"
