from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class PageResponse(BaseModel):
    items: list[Any]
    total: int
    page: int
    page_size: int
    pages: int


class AuditFields(ORMModel):
    id: str
    created_at: datetime
    updated_at: datetime
