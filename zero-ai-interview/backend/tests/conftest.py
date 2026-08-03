import os

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("SESSION_SECRET", "test-session-secret-that-is-long-enough")
os.environ.setdefault("INITIAL_USERNAME", "admin")
os.environ.setdefault("INITIAL_PASSWORD", "change-me")

import pytest
from fastapi.testclient import TestClient

from career_workspace.core.database import Base, engine, session_factory
from career_workspace.main import app
from career_workspace.models.entities import User
from career_workspace.core.security import hash_password


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with session_factory() as db:
        db.add(User(username="admin", password_hash=hash_password("change-me")))
        db.commit()
    yield


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def auth_client(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "change-me"},
    )
    assert response.status_code == 200
    return client
