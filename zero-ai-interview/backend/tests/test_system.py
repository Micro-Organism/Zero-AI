def test_ai_provider_never_returns_api_key_value(auth_client, monkeypatch):
    monkeypatch.setenv("TEST_MODEL_KEY", "secret-value")
    created = auth_client.post(
        "/api/v1/system/ai-providers",
        json={
            "name": "测试模型",
            "base_url": "https://example.test/v1",
            "model": "test-model",
            "api_key_env": "TEST_MODEL_KEY",
            "is_default": True,
        },
    )
    assert created.status_code == 201
    assert "secret-value" not in str(created.json())

    listing = auth_client.get("/api/v1/system/ai-providers")
    assert listing.status_code == 200
    assert listing.json()[0]["api_key_configured"] is True


def test_ai_provider_can_be_updated_and_deleted(auth_client):
    created = auth_client.post(
        "/api/v1/system/ai-providers",
        json={
            "name": "本地模型",
            "base_url": "http://127.0.0.1:8000/v1",
            "model": "old-model",
        },
    ).json()

    updated = auth_client.put(
        f"/api/v1/system/ai-providers/{created['id']}",
        json={
            "name": "本地 vLLM",
            "base_url": "http://127.0.0.1:8000/v1",
            "model": "new-model",
            "is_default": True,
        },
    )
    assert updated.status_code == 200
    assert updated.json()["model"] == "new-model"
    assert updated.json()["is_default"] is True

    deleted = auth_client.delete(f"/api/v1/system/ai-providers/{created['id']}")
    assert deleted.status_code == 204
    assert auth_client.get("/api/v1/system/ai-providers").json() == []


def test_ai_provider_connection_uses_openai_compatible_models_endpoint(auth_client, monkeypatch):
    monkeypatch.setenv("TEST_MODEL_KEY", "secret-value")
    created = auth_client.post(
        "/api/v1/system/ai-providers",
        json={
            "name": "测试模型",
            "base_url": "https://example.test/v1/",
            "model": "test-model",
            "api_key_env": "TEST_MODEL_KEY",
        },
    ).json()

    class FakeResponse:
        status_code = 200

        def raise_for_status(self):
            return None

    def fake_get(url, *, headers, timeout):
        assert url == "https://example.test/v1/models"
        assert headers["Authorization"] == "Bearer secret-value"
        assert timeout == 60
        return FakeResponse()

    monkeypatch.setattr("career_workspace.services.llm.httpx.get", fake_get)
    response = auth_client.post(f"/api/v1/system/ai-providers/{created['id']}/test-connection")

    assert response.status_code == 200
    assert response.json()["ok"] is True
    assert response.json()["model"] == "test-model"
