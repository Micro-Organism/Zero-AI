from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CareerProfileInput(BaseModel):
    full_name: str = ""
    headline: str = "人工智能工程师"
    email: str = ""
    phone: str = ""
    location: str = ""
    summary: str = ""
    target_roles: list[str] = Field(default_factory=list)
    version: int | None = None


class WorkExperienceInput(BaseModel):
    company: str = Field(min_length=1, max_length=200)
    role: str = Field(min_length=1, max_length=200)
    start_date: str = ""
    end_date: str = ""
    is_current: bool = False
    description: str = ""
    achievements: list[str] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)
    version: int | None = None


class ProjectExperienceInput(BaseModel):
    name: str = Field(min_length=1, max_length=240)
    role: str = ""
    start_date: str = ""
    end_date: str = ""
    background: str = ""
    responsibilities: list[str] = Field(default_factory=list)
    achievements: list[str] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)
    metrics: list[str] = Field(default_factory=list)
    version: int | None = None


class SkillInput(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: str = "通用"
    level: int = Field(default=1, ge=1, le=5)
    evidence: str = ""
    version: int | None = None


class ResumeCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    kind: str = "master"
    status: str = "draft"
    summary: str = ""
    content: dict = Field(default_factory=dict)


class ResumeUpdate(BaseModel):
    title: str | None = None
    status: str | None = None
    summary: str | None = None
    content: dict | None = None
    version: int


class ResumeVersionCreate(BaseModel):
    note: str = ""


class ReferenceAnalyzeInput(BaseModel):
    source_text: str = Field(min_length=1, max_length=200_000)
    title: str = ""
    summary: str = ""


class ReferenceSkillInput(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: str = "参考简历"
    evidence: str = ""


class SkillImportInput(BaseModel):
    skills: list[ReferenceSkillInput] = Field(min_length=1, max_length=100)


class EntityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime


class WorkExperienceResponse(EntityResponse):
    company: str
    role: str
    start_date: str
    end_date: str
    is_current: bool
    description: str
    achievements: list
    technologies: list
    version: int


class ProjectExperienceResponse(EntityResponse):
    name: str
    role: str
    start_date: str
    end_date: str
    background: str
    responsibilities: list
    achievements: list
    technologies: list
    metrics: list
    version: int


class SkillResponse(EntityResponse):
    name: str
    category: str
    level: int
    evidence: str
    version: int


class ResumeResponse(EntityResponse):
    title: str
    kind: str
    status: str
    summary: str
    content: dict
    source_resume_id: str | None
    source_matching_id: str | None
    version: int


class ResumeVersionResponse(EntityResponse):
    resume_id: str
    version_no: int
    note: str
    snapshot: dict
