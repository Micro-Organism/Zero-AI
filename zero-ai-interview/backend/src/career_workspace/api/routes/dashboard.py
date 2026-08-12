from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from career_workspace.core.database import get_db
from career_workspace.models.entities import (
    GapItem,
    JobPosting,
    MatchingProject,
    Resume,
    Skill,
    User,
    WorkExperience,
)
from career_workspace.services.auth import get_current_user

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    work_count = (
        db.scalar(
            select(func.count())
            .select_from(WorkExperience)
            .where(WorkExperience.user_id == user.id, WorkExperience.deleted_at.is_(None))
        )
        or 0
    )
    skill_count = (
        db.scalar(
            select(func.count())
            .select_from(Skill)
            .where(Skill.user_id == user.id, Skill.deleted_at.is_(None))
        )
        or 0
    )
    completeness = min(100, work_count * 25 + min(skill_count, 5) * 8)
    recruitment_count = (
        db.scalar(
            select(func.count())
            .select_from(JobPosting)
            .where(JobPosting.user_id == user.id, JobPosting.deleted_at.is_(None))
        )
        or 0
    )
    targeted_count = (
        db.scalar(
            select(func.count())
            .select_from(Resume)
            .where(Resume.user_id == user.id, Resume.kind == "targeted", Resume.deleted_at.is_(None))
        )
        or 0
    )
    open_gaps = (
        db.scalar(
            select(func.count())
            .select_from(GapItem)
            .where(GapItem.user_id == user.id, GapItem.status == "open")
        )
        or 0
    )
    recent = list(
        db.scalars(
            select(MatchingProject)
            .where(MatchingProject.user_id == user.id)
            .order_by(MatchingProject.updated_at.desc())
            .limit(5)
        )
    )
    return {
        "resume_completeness": completeness,
        "recruitment_count": recruitment_count,
        "targeted_resume_count": targeted_count,
        "open_gap_count": open_gaps,
        "recent_matches": recent,
    }
