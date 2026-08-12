from copy import deepcopy
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from career_workspace.core.database import get_db
from career_workspace.core.errors import AppError
from career_workspace.models.entities import (
    CareerProfile,
    ProjectExperience,
    Resume,
    ResumeVersion,
    Skill,
    User,
    WorkExperience,
)
from career_workspace.schemas.resume import (
    CareerProfileInput,
    ProjectExperienceInput,
    ProjectExperienceResponse,
    ReferenceAnalyzeInput,
    ResumeCreate,
    ResumeResponse,
    ResumeUpdate,
    ResumeVersionCreate,
    ResumeVersionResponse,
    SkillImportInput,
    SkillInput,
    SkillResponse,
    WorkExperienceInput,
    WorkExperienceResponse,
)
from career_workspace.services.audit import record_audit
from career_workspace.services.auth import get_current_user
from career_workspace.services.reference_analysis import analyze_reference_resume

router = APIRouter(tags=["resume"])


def owned(db: Session, model, item_id: str, user_id: str):
    item = db.scalar(select(model).where(model.id == item_id, model.user_id == user_id))
    if not item or getattr(item, "deleted_at", None) is not None:
        raise AppError(404, "not_found", "数据不存在")
    return item


def page_result(items, total: int, page: int, page_size: int):
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size if total else 0,
    }


@router.get("/career-profile")
def get_profile(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    profile = db.scalar(select(CareerProfile).where(CareerProfile.user_id == user.id))
    if not profile:
        profile = CareerProfile(user_id=user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.put("/career-profile")
def update_profile(
    payload: CareerProfileInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    profile = db.scalar(select(CareerProfile).where(CareerProfile.user_id == user.id))
    if not profile:
        profile = CareerProfile(user_id=user.id)
        db.add(profile)
    elif payload.version is not None and payload.version != profile.version:
        raise AppError(409, "version_conflict", "资料已被修改，请刷新后重试")
    for key, value in payload.model_dump(exclude={"version"}).items():
        setattr(profile, key, value)
    profile.version += 1
    db.commit()
    db.refresh(profile)
    return profile


def register_crud(model, input_schema, response_schema, path: str):
    @router.post(path, response_model=response_schema, status_code=201)
    def create_item(
        payload: input_schema,
        db: Session = Depends(get_db),
        user: User = Depends(get_current_user),
    ):
        values = payload.model_dump(exclude={"version"})
        item = model(user_id=user.id, **values)
        db.add(item)
        db.flush()
        record_audit(db, user, "create", model.__tablename__, item.id)
        db.commit()
        db.refresh(item)
        return item

    @router.get(path)
    def list_items(
        page: int = Query(1, ge=1),
        page_size: int = Query(20, ge=1, le=100),
        keyword: str = "",
        db: Session = Depends(get_db),
        user: User = Depends(get_current_user),
    ):
        statement = select(model).where(model.user_id == user.id, model.deleted_at.is_(None))
        if keyword:
            searchable = model.name if hasattr(model, "name") else model.company
            statement = statement.where(searchable.ilike(f"%{keyword}%"))
        statement = statement.order_by(model.updated_at.desc())
        total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
        items = list(db.scalars(statement.offset((page - 1) * page_size).limit(page_size)))
        return page_result(items, total, page, page_size)

    @router.put(f"{path}/{{item_id}}", response_model=response_schema)
    def update_item(
        item_id: str,
        payload: input_schema,
        db: Session = Depends(get_db),
        user: User = Depends(get_current_user),
    ):
        item = owned(db, model, item_id, user.id)
        if payload.version is not None and payload.version != item.version:
            raise AppError(409, "version_conflict", "数据已被修改，请刷新后重试")
        for key, value in payload.model_dump(exclude={"version"}).items():
            setattr(item, key, value)
        item.version += 1
        record_audit(db, user, "update", model.__tablename__, item.id)
        db.commit()
        db.refresh(item)
        return item

    @router.delete(f"{path}/{{item_id}}", status_code=204)
    def delete_item(
        item_id: str,
        db: Session = Depends(get_db),
        user: User = Depends(get_current_user),
    ):
        item = owned(db, model, item_id, user.id)
        item.deleted_at = datetime.now(timezone.utc)
        record_audit(db, user, "soft_delete", model.__tablename__, item.id)
        db.commit()


register_crud(WorkExperience, WorkExperienceInput, WorkExperienceResponse, "/work-experiences")
register_crud(ProjectExperience, ProjectExperienceInput, ProjectExperienceResponse, "/project-experiences")
register_crud(Skill, SkillInput, SkillResponse, "/skills")


@router.post("/resumes", response_model=ResumeResponse, status_code=201)
def create_resume(
    payload: ResumeCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    resume = Resume(user_id=user.id, **payload.model_dump())
    db.add(resume)
    db.flush()
    record_audit(db, user, "create", "resumes", resume.id)
    db.commit()
    db.refresh(resume)
    return resume


@router.get("/resumes")
def list_resumes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: str = "",
    kind: str = "",
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    statement = select(Resume).where(Resume.user_id == user.id, Resume.deleted_at.is_(None))
    if keyword:
        statement = statement.where(
            or_(Resume.title.ilike(f"%{keyword}%"), Resume.summary.ilike(f"%{keyword}%"))
        )
    if kind:
        statement = statement.where(Resume.kind == kind)
    statement = statement.order_by(Resume.updated_at.desc())
    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    items = list(db.scalars(statement.offset((page - 1) * page_size).limit(page_size)))
    return page_result(items, total, page, page_size)


@router.post("/resumes/analyze")
def analyze_reference_resume_route(
    payload: ReferenceAnalyzeInput,
    user: User = Depends(get_current_user),
):
    return analyze_reference_resume(payload.source_text, payload.title, payload.summary)


@router.post("/resumes/{resume_id}/import-skills")
def import_reference_skills(
    resume_id: str,
    payload: SkillImportInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    resume = owned(db, Resume, resume_id, user.id)
    existing = {
        item.name
        for item in db.scalars(
            select(Skill).where(Skill.user_id == user.id, Skill.deleted_at.is_(None))
        )
    }
    created = []
    skipped = []
    for item in payload.skills:
        if item.name in existing:
            skipped.append(item.name)
            continue
        skill = Skill(
            user_id=user.id,
            name=item.name,
            category=item.category,
            level=3,
            evidence=item.evidence or f"参考简历《{resume.title}》提取的技能点",
        )
        db.add(skill)
        existing.add(item.name)
        created.append(item.name)
    record_audit(db, user, "import", "resumes", resume.id)
    db.commit()
    return {"created": created, "skipped": skipped}


@router.get("/resumes/{resume_id}", response_model=ResumeResponse)
def get_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return owned(db, Resume, resume_id, user.id)


@router.put("/resumes/{resume_id}", response_model=ResumeResponse)
def update_resume(
    resume_id: str,
    payload: ResumeUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    resume = owned(db, Resume, resume_id, user.id)
    if payload.version != resume.version:
        raise AppError(409, "version_conflict", "简历已被修改，请刷新后重试")
    for key, value in payload.model_dump(exclude={"version"}, exclude_none=True).items():
        setattr(resume, key, value)
    resume.version += 1
    record_audit(db, user, "update", "resumes", resume.id)
    db.commit()
    db.refresh(resume)
    return resume


@router.delete("/resumes/{resume_id}", status_code=204)
def delete_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    resume = owned(db, Resume, resume_id, user.id)
    resume.deleted_at = datetime.now(timezone.utc)
    record_audit(db, user, "soft_delete", "resumes", resume.id)
    db.commit()


def build_snapshot(db: Session, user: User, resume: Resume) -> dict:
    content = resume.content or {}
    if resume.kind == "targeted" and isinstance(content.get("source_snapshot"), dict):
        snapshot = deepcopy(content["source_snapshot"])
        snapshot["resume"] = ResumeResponse.model_validate(resume).model_dump(mode="json")
        snapshot["targeting"] = {
            "job_title": content.get("job_title", ""),
            "match_score": content.get("match_score"),
            "evidence_sources": content.get("evidence_sources", []),
        }
        return snapshot
    work_ids = content.get("work_ids", [])
    project_ids = content.get("project_ids", [])
    skill_ids = content.get("skill_ids", [])
    works = (
        list(
            db.scalars(
                select(WorkExperience).where(
                    WorkExperience.user_id == user.id, WorkExperience.id.in_(work_ids)
                )
            )
        )
        if work_ids
        else []
    )
    projects = (
        list(
            db.scalars(
                select(ProjectExperience).where(
                    ProjectExperience.user_id == user.id, ProjectExperience.id.in_(project_ids)
                )
            )
        )
        if project_ids
        else []
    )
    skills = (
        list(db.scalars(select(Skill).where(Skill.user_id == user.id, Skill.id.in_(skill_ids))))
        if skill_ids
        else []
    )
    return {
        "resume": ResumeResponse.model_validate(resume).model_dump(mode="json"),
        "work_experiences": [
            WorkExperienceResponse.model_validate(item).model_dump(mode="json") for item in works
        ],
        "project_experiences": [
            ProjectExperienceResponse.model_validate(item).model_dump(mode="json") for item in projects
        ],
        "skills": [SkillResponse.model_validate(item).model_dump(mode="json") for item in skills],
        "skill_names": content.get("skill_names", []),
    }


@router.post("/resumes/{resume_id}/versions", response_model=ResumeVersionResponse, status_code=201)
def create_resume_version(
    resume_id: str,
    payload: ResumeVersionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    resume = owned(db, Resume, resume_id, user.id)
    latest = (
        db.scalar(select(func.max(ResumeVersion.version_no)).where(ResumeVersion.resume_id == resume.id)) or 0
    )
    version = ResumeVersion(
        user_id=user.id,
        resume_id=resume.id,
        version_no=latest + 1,
        note=payload.note,
        snapshot=build_snapshot(db, user, resume),
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version


@router.get("/resumes/{resume_id}/versions", response_model=list[ResumeVersionResponse])
def list_resume_versions(
    resume_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    owned(db, Resume, resume_id, user.id)
    return list(
        db.scalars(
            select(ResumeVersion)
            .where(ResumeVersion.resume_id == resume_id, ResumeVersion.user_id == user.id)
            .order_by(ResumeVersion.version_no.desc())
        )
    )
