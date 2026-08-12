import hashlib
import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from career_workspace.core.database import get_db
from career_workspace.core.errors import AppError
from career_workspace.models.entities import Company, JobPosting, JobRequirement, User
from career_workspace.schemas.recruitment import (
    CompanyInput,
    CompanyResponse,
    JobPostingInput,
    JobPostingResponse,
    RequirementInput,
    RequirementResponse,
)
from career_workspace.services.auth import get_current_user

router = APIRouter(tags=["recruitment"])


def get_owned(db: Session, model, item_id: str, user_id: str):
    item = db.scalar(select(model).where(model.id == item_id, model.user_id == user_id))
    if not item or getattr(item, "deleted_at", None) is not None:
        raise AppError(404, "not_found", "数据不存在")
    return item


def paged(items, total: int, page: int, page_size: int):
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size if total else 0,
    }


@router.post("/companies", response_model=CompanyResponse, status_code=201)
def create_company(
    payload: CompanyInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    company = Company(user_id=user.id, **payload.model_dump())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.get("/companies")
def list_companies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: str = "",
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    statement = select(Company).where(Company.user_id == user.id, Company.deleted_at.is_(None))
    if keyword:
        statement = statement.where(Company.name.ilike(f"%{keyword}%"))
    statement = statement.order_by(Company.updated_at.desc())
    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    items = list(db.scalars(statement.offset((page - 1) * page_size).limit(page_size)))
    return paged(items, total, page, page_size)


@router.put("/companies/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: str,
    payload: CompanyInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    company = get_owned(db, Company, company_id, user.id)
    for key, value in payload.model_dump().items():
        setattr(company, key, value)
    db.commit()
    db.refresh(company)
    return company


@router.post("/job-postings", response_model=JobPostingResponse, status_code=201)
def create_job(
    payload: JobPostingInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if payload.company_id:
        get_owned(db, Company, payload.company_id, user.id)
    normalized = f"{payload.title}|{payload.source_url}|{' '.join(payload.source_text.split())}"
    fingerprint = hashlib.sha256(normalized.encode()).hexdigest()
    job = JobPosting(user_id=user.id, fingerprint=fingerprint, **payload.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.get("/job-postings")
def list_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: str = "",
    status: str = "",
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    statement = select(JobPosting).where(JobPosting.user_id == user.id, JobPosting.deleted_at.is_(None))
    if keyword:
        statement = statement.where(
            or_(
                JobPosting.title.ilike(f"%{keyword}%"),
                JobPosting.source_text.ilike(f"%{keyword}%"),
            )
        )
    if status:
        statement = statement.where(JobPosting.status == status)
    statement = statement.order_by(JobPosting.updated_at.desc())
    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    items = list(db.scalars(statement.offset((page - 1) * page_size).limit(page_size)))
    return paged(items, total, page, page_size)


@router.get("/job-postings/{job_id}")
def get_job(
    job_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    job = get_owned(db, JobPosting, job_id, user.id)
    requirements = list(
        db.scalars(
            select(JobRequirement)
            .where(JobRequirement.job_posting_id == job.id, JobRequirement.user_id == user.id)
            .order_by(JobRequirement.importance.desc())
        )
    )
    return {"job": job, "requirements": requirements}


@router.put("/job-postings/{job_id}", response_model=JobPostingResponse)
def update_job(
    job_id: str,
    payload: JobPostingInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    job = get_owned(db, JobPosting, job_id, user.id)
    for key, value in payload.model_dump().items():
        setattr(job, key, value)
    job.version += 1
    db.commit()
    db.refresh(job)
    return job


@router.delete("/job-postings/{job_id}", status_code=204)
def delete_job(
    job_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    job = get_owned(db, JobPosting, job_id, user.id)
    job.deleted_at = datetime.now(timezone.utc)
    db.commit()


def requirement_kind(sentence: str) -> str:
    if any(marker in sentence for marker in ("优先", "加分", "更佳")):
        return "preferred"
    if any(marker in sentence for marker in ("沟通", "协作", "文档", "自学")):
        return "soft_skill"
    if any(marker in sentence for marker in ("学历", "党员", "年龄")):
        return "company_specific"
    if any(marker in sentence for marker in ("职责", "负责", "参与")):
        return "responsibility"
    return "required"


def skill_name(sentence: str) -> str:
    known = [
        "Python",
        "PyTorch",
        "TensorFlow",
        "RAG",
        "Agent",
        "Java",
        "Spring AI",
        "LangChain4j",
        "Transformer",
        "Hugging Face",
        "LoRA",
        "SQL",
        "Docker",
        "Kubernetes",
        "MCP",
        "多模态",
        "计算机视觉",
        "NLP",
    ]
    matches = [item for item in known if item.lower() in sentence.lower()]
    return " / ".join(matches) if matches else sentence[:30].strip(" ：:")


@router.post("/job-postings/{job_id}/extract")
def extract_requirements(
    job_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    job = get_owned(db, JobPosting, job_id, user.id)
    db.query(JobRequirement).filter(
        JobRequirement.job_posting_id == job.id, JobRequirement.user_id == user.id
    ).delete()
    sentences = [part.strip() for part in re.split(r"[。；;\n]+", job.source_text) if part.strip()]
    if not sentences and job.source_text.strip():
        sentences = [job.source_text.strip()]
    requirements = []
    for sentence in sentences:
        kind = requirement_kind(sentence)
        requirement = JobRequirement(
            user_id=user.id,
            job_posting_id=job.id,
            kind=kind,
            skill=skill_name(sentence),
            description=sentence,
            importance=5 if kind == "required" else 3 if kind == "preferred" else 2,
            source_quote=sentence,
        )
        db.add(requirement)
        requirements.append(requirement)
    db.commit()
    for item in requirements:
        db.refresh(item)
    return {"requirements": requirements, "source": "baseline"}


@router.get("/job-postings/{job_id}/requirements", response_model=list[RequirementResponse])
def list_requirements(
    job_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    get_owned(db, JobPosting, job_id, user.id)
    return list(
        db.scalars(
            select(JobRequirement).where(
                JobRequirement.job_posting_id == job_id, JobRequirement.user_id == user.id
            )
        )
    )


@router.post("/job-postings/{job_id}/requirements", response_model=RequirementResponse, status_code=201)
def create_requirement(
    job_id: str,
    payload: RequirementInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    get_owned(db, JobPosting, job_id, user.id)
    item = JobRequirement(user_id=user.id, job_posting_id=job_id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item
