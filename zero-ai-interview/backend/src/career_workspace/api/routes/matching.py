from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from career_workspace.core.database import get_db
from career_workspace.core.errors import AppError
from career_workspace.models.entities import (
    JobPosting,
    JobRequirement,
    MatchingProject,
    RequirementEvidence,
    Resume,
    ResumeVersion,
    User,
)
from career_workspace.schemas.matching import EvidenceUpdate, MatchingCreate, MatchingResponse
from career_workspace.schemas.resume import ResumeResponse
from career_workspace.services.auth import get_current_user
from career_workspace.services.matching import recalculate

router = APIRouter(prefix="/matching-projects", tags=["matching"])


def get_owned(db: Session, model, item_id: str, user_id: str):
    item = db.scalar(select(model).where(model.id == item_id, model.user_id == user_id))
    if not item:
        raise AppError(404, "not_found", "数据不存在")
    return item


@router.post("", response_model=MatchingResponse, status_code=201)
def create_matching(
    payload: MatchingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    job = get_owned(db, JobPosting, payload.job_posting_id, user.id)
    version = get_owned(db, ResumeVersion, payload.resume_version_id, user.id)
    project = MatchingProject(
        user_id=user.id,
        job_posting_id=job.id,
        resume_version_id=version.id,
    )
    db.add(project)
    db.flush()
    requirements = list(
        db.scalars(select(JobRequirement).where(JobRequirement.job_posting_id == job.id))
    )
    recalculate(db, project, requirements, version.snapshot)
    db.commit()
    db.refresh(project)
    return project


@router.get("")
def list_matching(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    statement = (
        select(MatchingProject)
        .where(MatchingProject.user_id == user.id)
        .order_by(MatchingProject.updated_at.desc())
    )
    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    items = list(db.scalars(statement.offset((page - 1) * page_size).limit(page_size)))
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size if total else 0,
    }


@router.get("/{project_id}")
def get_matching(
    project_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    project = get_owned(db, MatchingProject, project_id, user.id)
    evidence = list(
        db.scalars(
            select(RequirementEvidence).where(
                RequirementEvidence.matching_project_id == project.id
            )
        )
    )
    return {"project": project, "evidence": evidence}


@router.post("/{project_id}/recalculate", response_model=MatchingResponse)
def recalculate_matching(
    project_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    project = get_owned(db, MatchingProject, project_id, user.id)
    version = get_owned(db, ResumeVersion, project.resume_version_id, user.id)
    requirements = list(
        db.scalars(
            select(JobRequirement).where(JobRequirement.job_posting_id == project.job_posting_id)
        )
    )
    recalculate(db, project, requirements, version.snapshot)
    db.commit()
    db.refresh(project)
    return project


@router.put("/{project_id}/evidence/{requirement_id}")
def update_evidence(
    project_id: str,
    requirement_id: str,
    payload: EvidenceUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    project = get_owned(db, MatchingProject, project_id, user.id)
    evidence = db.scalar(
        select(RequirementEvidence).where(
            RequirementEvidence.matching_project_id == project.id,
            RequirementEvidence.requirement_id == requirement_id,
        )
    )
    if not evidence:
        evidence = RequirementEvidence(
            user_id=user.id,
            matching_project_id=project.id,
            requirement_id=requirement_id,
        )
        db.add(evidence)
    for key, value in payload.model_dump().items():
        setattr(evidence, key, value)
    evidence.is_manual = True
    db.commit()
    db.refresh(evidence)
    return evidence


@router.post("/{project_id}/targeted-resume", response_model=ResumeResponse, status_code=201)
def create_targeted_resume(
    project_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    project = get_owned(db, MatchingProject, project_id, user.id)
    job = get_owned(db, JobPosting, project.job_posting_id, user.id)
    version = get_owned(db, ResumeVersion, project.resume_version_id, user.id)
    source_resume = get_owned(db, Resume, version.resume_id, user.id)
    targeted = Resume(
        user_id=user.id,
        title=f"{job.title} - 定制简历",
        kind="targeted",
        status="draft",
        summary=source_resume.summary,
        content={
            "source_snapshot": version.snapshot,
            "job_title": job.title,
            "match_score": project.total_score,
            "evidence_sources": [item["requirement_id"] for item in project.score_breakdown],
        },
        source_resume_id=source_resume.id,
        source_matching_id=project.id,
    )
    db.add(targeted)
    db.commit()
    db.refresh(targeted)
    return targeted
