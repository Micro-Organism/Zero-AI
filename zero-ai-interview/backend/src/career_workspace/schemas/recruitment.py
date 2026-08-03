from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CompanyInput(BaseModel):
    name: str = Field(min_length=1, max_length=240)
    industry: str = ""
    description: str = ""
    source_url: str = ""


class JobPostingInput(BaseModel):
    company_id: str | None = None
    title: str = Field(min_length=1, max_length=240)
    job_family: str = "人工智能工程师"
    level: str = ""
    location: str = ""
    source_url: str = ""
    source_text: str = ""
    status: str = "active"


class RequirementInput(BaseModel):
    kind: str = "required"
    skill: str = ""
    description: str
    importance: int = Field(default=3, ge=1, le=5)
    source_quote: str = ""


class CompanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    industry: str
    description: str
    source_url: str
    created_at: datetime
    updated_at: datetime


class JobPostingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    company_id: str | None
    title: str
    job_family: str
    level: str
    location: str
    source_url: str
    source_text: str
    status: str
    version: int
    created_at: datetime
    updated_at: datetime


class RequirementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    job_posting_id: str
    kind: str
    skill: str
    description: str
    importance: int
    source_quote: str
    created_at: datetime
    updated_at: datetime
