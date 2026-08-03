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
