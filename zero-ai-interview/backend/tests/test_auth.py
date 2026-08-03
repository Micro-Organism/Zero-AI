def test_login_sets_session_cookie(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "change-me"},
    )

    assert response.status_code == 200
    assert "career_session" in response.cookies
    assert response.json()["username"] == "admin"


def test_invalid_password_is_rejected(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "wrong"},
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_credentials"


def test_me_requires_login(client):
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401


def test_logout_invalidates_cookie(auth_client):
    assert auth_client.get("/api/v1/auth/me").status_code == 200
    assert auth_client.post("/api/v1/auth/logout").status_code == 204
    assert auth_client.get("/api/v1/auth/me").status_code == 401
