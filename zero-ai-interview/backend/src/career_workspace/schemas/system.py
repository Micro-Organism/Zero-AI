from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AIProviderInput(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    base_url: str
    model: str
    api_key_env: str = "AI_API_KEY"
    timeout_seconds: int = Field(default=60, ge=5, le=600)
    max_retries: int = Field(default=2, ge=0, le=10)
    temperature: float = Field(default=0.2, ge=0, le=2)
    max_tokens: int = Field(default=2000, ge=100, le=100000)
    is_enabled: bool = True
    is_default: bool = False


class AIProviderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    base_url: str
    model: str
    api_key_env: str
    timeout_seconds: int
    max_retries: int
    temperature: float
    max_tokens: int
    is_enabled: bool
    is_default: bool
    api_key_configured: bool
    created_at: datetime
    updated_at: datetime
