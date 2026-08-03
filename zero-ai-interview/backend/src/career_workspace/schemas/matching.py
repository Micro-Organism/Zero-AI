from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MatchingCreate(BaseModel):
    job_posting_id: str
    resume_version_id: str


class EvidenceUpdate(BaseModel):
    strength: int = Field(ge=0, le=4)
    evidence_type: str = "manual"
    evidence_id: str | None = None
    explanation: str = ""


class MatchingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    job_posting_id: str
    resume_version_id: str
    status: str
    total_score: float
    score_breakdown: list
    created_at: datetime
    updated_at: datetime
