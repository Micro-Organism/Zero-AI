from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from career_workspace.models.base import Base, IdMixin, TimestampMixin


class User(IdMixin, TimestampMixin, Base):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(Text)
    display_name: Mapped[str] = mapped_column(String(120), default="个人用户")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class CareerProfile(IdMixin, TimestampMixin, Base):
    __tablename__ = "career_profiles"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120), default="")
    headline: Mapped[str] = mapped_column(String(200), default="人工智能工程师")
    email: Mapped[str] = mapped_column(String(200), default="")
    phone: Mapped[str] = mapped_column(String(80), default="")
    location: Mapped[str] = mapped_column(String(120), default="")
    summary: Mapped[str] = mapped_column(Text, default="")
    target_roles: Mapped[list] = mapped_column(JSON, default=list)
    version: Mapped[int] = mapped_column(Integer, default=1)


class WorkExperience(IdMixin, TimestampMixin, Base):
    __tablename__ = "work_experiences"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    company: Mapped[str] = mapped_column(String(200), index=True)
    role: Mapped[str] = mapped_column(String(200))
    start_date: Mapped[str] = mapped_column(String(20), default="")
    end_date: Mapped[str] = mapped_column(String(20), default="")
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)
    description: Mapped[str] = mapped_column(Text, default="")
    achievements: Mapped[list] = mapped_column(JSON, default=list)
    technologies: Mapped[list] = mapped_column(JSON, default=list)
    version: Mapped[int] = mapped_column(Integer, default=1)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ProjectExperience(IdMixin, TimestampMixin, Base):
    __tablename__ = "project_experiences"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(240), index=True)
    role: Mapped[str] = mapped_column(String(160), default="")
    start_date: Mapped[str] = mapped_column(String(20), default="")
    end_date: Mapped[str] = mapped_column(String(20), default="")
    background: Mapped[str] = mapped_column(Text, default="")
    responsibilities: Mapped[list] = mapped_column(JSON, default=list)
    achievements: Mapped[list] = mapped_column(JSON, default=list)
    technologies: Mapped[list] = mapped_column(JSON, default=list)
    metrics: Mapped[list] = mapped_column(JSON, default=list)
    version: Mapped[int] = mapped_column(Integer, default=1)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Skill(IdMixin, TimestampMixin, Base):
    __tablename__ = "skills"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    category: Mapped[str] = mapped_column(String(80), default="通用")
    level: Mapped[int] = mapped_column(Integer, default=1)
    evidence: Mapped[str] = mapped_column(Text, default="")
    version: Mapped[int] = mapped_column(Integer, default=1)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Resume(IdMixin, TimestampMixin, Base):
    __tablename__ = "resumes"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    kind: Mapped[str] = mapped_column(String(40), default="master")
    status: Mapped[str] = mapped_column(String(40), default="draft")
    summary: Mapped[str] = mapped_column(Text, default="")
    content: Mapped[dict] = mapped_column(JSON, default=dict)
    source_resume_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    source_matching_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ResumeVersion(IdMixin, TimestampMixin, Base):
    __tablename__ = "resume_versions"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    resume_id: Mapped[str] = mapped_column(ForeignKey("resumes.id"), index=True)
    version_no: Mapped[int] = mapped_column(Integer)
    note: Mapped[str] = mapped_column(String(240), default="")
    snapshot: Mapped[dict] = mapped_column(JSON)


class Company(IdMixin, TimestampMixin, Base):
    __tablename__ = "companies"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(240), index=True)
    industry: Mapped[str] = mapped_column(String(120), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    source_url: Mapped[str] = mapped_column(Text, default="")
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class JobPosting(IdMixin, TimestampMixin, Base):
    __tablename__ = "job_postings"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    company_id: Mapped[str | None] = mapped_column(ForeignKey("companies.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(240), index=True)
    job_family: Mapped[str] = mapped_column(String(120), default="人工智能工程师")
    level: Mapped[str] = mapped_column(String(80), default="")
    location: Mapped[str] = mapped_column(String(120), default="")
    source_url: Mapped[str] = mapped_column(Text, default="")
    source_text: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(40), default="active")
    fingerprint: Mapped[str] = mapped_column(String(64), default="", index=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class JobRequirement(IdMixin, TimestampMixin, Base):
    __tablename__ = "job_requirements"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    job_posting_id: Mapped[str] = mapped_column(ForeignKey("job_postings.id"), index=True)
    kind: Mapped[str] = mapped_column(String(40), default="required")
    skill: Mapped[str] = mapped_column(String(160), default="")
    description: Mapped[str] = mapped_column(Text)
    importance: Mapped[int] = mapped_column(Integer, default=3)
    source_quote: Mapped[str] = mapped_column(Text, default="")


class MatchingProject(IdMixin, TimestampMixin, Base):
    __tablename__ = "matching_projects"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    job_posting_id: Mapped[str] = mapped_column(ForeignKey("job_postings.id"), index=True)
    resume_version_id: Mapped[str] = mapped_column(ForeignKey("resume_versions.id"), index=True)
    status: Mapped[str] = mapped_column(String(40), default="draft")
    total_score: Mapped[float] = mapped_column(Float, default=0)
    score_breakdown: Mapped[list] = mapped_column(JSON, default=list)


class RequirementEvidence(IdMixin, TimestampMixin, Base):
    __tablename__ = "requirement_evidence"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    matching_project_id: Mapped[str] = mapped_column(ForeignKey("matching_projects.id"), index=True)
    requirement_id: Mapped[str] = mapped_column(ForeignKey("job_requirements.id"), index=True)
    evidence_type: Mapped[str] = mapped_column(String(50), default="skill")
    evidence_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    strength: Mapped[int] = mapped_column(Integer, default=0)
    explanation: Mapped[str] = mapped_column(Text, default="")
    is_manual: Mapped[bool] = mapped_column(Boolean, default=False)


class GapItem(IdMixin, TimestampMixin, Base):
    __tablename__ = "gap_items"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    matching_project_id: Mapped[str] = mapped_column(ForeignKey("matching_projects.id"), index=True)
    requirement_id: Mapped[str] = mapped_column(ForeignKey("job_requirements.id"), index=True)
    priority: Mapped[str] = mapped_column(String(40), default="medium")
    suggestion: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(40), default="open")


class FileAsset(IdMixin, TimestampMixin, Base):
    __tablename__ = "file_assets"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    original_name: Mapped[str] = mapped_column(String(255))
    storage_key: Mapped[str] = mapped_column(String(500), unique=True)
    mime_type: Mapped[str] = mapped_column(String(160), default="application/octet-stream")
    size: Mapped[int] = mapped_column(Integer)
    sha256: Mapped[str] = mapped_column(String(64), index=True)
    extracted_text: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(40), default="ready")
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ProcessingTask(IdMixin, TimestampMixin, Base):
    __tablename__ = "processing_tasks"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    task_type: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(40), default="pending")
    progress: Mapped[int] = mapped_column(Integer, default=0)
    input_data: Mapped[dict] = mapped_column(JSON, default=dict)
    result_data: Mapped[dict] = mapped_column(JSON, default=dict)
    error_code: Mapped[str] = mapped_column(String(100), default="")
    error_message: Mapped[str] = mapped_column(Text, default="")
    retry_count: Mapped[int] = mapped_column(Integer, default=0)


class AIProviderConfig(IdMixin, TimestampMixin, Base):
    __tablename__ = "ai_provider_configs"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    base_url: Mapped[str] = mapped_column(Text)
    model: Mapped[str] = mapped_column(String(160))
    api_key_env: Mapped[str] = mapped_column(String(160), default="AI_API_KEY")
    timeout_seconds: Mapped[int] = mapped_column(Integer, default=60)
    max_retries: Mapped[int] = mapped_column(Integer, default=2)
    temperature: Mapped[float] = mapped_column(Float, default=0.2)
    max_tokens: Mapped[int] = mapped_column(Integer, default=2000)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)


class AuditLog(IdMixin, TimestampMixin, Base):
    __tablename__ = "audit_logs"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String(100))
    entity_type: Mapped[str] = mapped_column(String(100))
    entity_id: Mapped[str] = mapped_column(String(36), default="")
    details: Mapped[dict] = mapped_column(JSON, default=dict)
