from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Zero AI Interview"
    api_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./data/zero-ai-interview.db"
    session_secret: str = "replace-this-session-secret-before-production"
    session_cookie_name: str = "career_session"
    session_ttl_seconds: int = 60 * 60 * 12
    initial_username: str = "admin"
    initial_password: str = "change-me"
    upload_dir: Path = Path("./data/uploads")
    max_upload_bytes: int = 15 * 1024 * 1024
    frontend_origins: str = "http://localhost:3100,http://127.0.0.1:3100"

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.frontend_origins.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
