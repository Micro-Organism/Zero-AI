from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "zero-ai-study-api"
    api_prefix: str = "/api"
    # zero-ai-study 根目录（app/src/study_api/core → 上 4 级到 zero-ai-study）
    study_root: Path = Path(__file__).resolve().parents[4]

    @property
    def progress_file(self) -> Path:
        return self.study_root / "data" / "progress.json"

    @property
    def dataset_file(self) -> Path:
        return self.study_root / "datasets" / "sample_alpaca_zh.jsonl"

    class Config:
        env_prefix = "STUDY_"


settings = Settings()
