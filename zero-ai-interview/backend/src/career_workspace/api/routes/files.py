import hashlib
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

from fastapi import APIRouter, Depends, File, Query, UploadFile
from fastapi.responses import FileResponse, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from career_workspace.core.config import settings
from career_workspace.core.database import get_db
from career_workspace.core.errors import AppError
from career_workspace.models.entities import FileAsset, ResumeVersion, User
from career_workspace.services.auth import get_current_user
from career_workspace.services.documents import ALLOWED_EXTENSIONS, extract_text
from career_workspace.services.export import resume_docx, resume_json, resume_markdown

router = APIRouter(tags=["files"])


@router.post("/files", status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    extension = Path(file.filename or "").suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise AppError(400, "unsupported_file_type", "不支持该文件格式")
    content = await file.read(settings.max_upload_bytes + 1)
    if len(content) > settings.max_upload_bytes:
        raise AppError(400, "file_too_large", "文件超过大小限制")
    digest = hashlib.sha256(content).hexdigest()
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    safe_name = f"{digest[:16]}-{datetime.now(timezone.utc).timestamp():.0f}{extension}"
    path = settings.upload_dir / safe_name
    path.write_bytes(content)
    try:
        extracted_text, status = extract_text(file.filename or safe_name, content)
    except (ValueError, OSError, KeyError) as exc:
        path.unlink(missing_ok=True)
        raise AppError(400, "parse_failed", "文件解析失败", str(exc)) from exc
    asset = FileAsset(
        user_id=user.id,
        original_name=Path(file.filename or safe_name).name,
        storage_key=safe_name,
        mime_type=file.content_type or "application/octet-stream",
        size=len(content),
        sha256=digest,
        extracted_text=extracted_text,
        status=status,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@router.get("/files")
def list_files(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    statement = (
        select(FileAsset)
        .where(FileAsset.user_id == user.id, FileAsset.deleted_at.is_(None))
        .order_by(FileAsset.updated_at.desc())
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


def owned_file(db: Session, file_id: str, user_id: str) -> FileAsset:
    asset = db.scalar(
        select(FileAsset).where(
            FileAsset.id == file_id,
            FileAsset.user_id == user_id,
            FileAsset.deleted_at.is_(None),
        )
    )
    if not asset:
        raise AppError(404, "not_found", "文件不存在")
    return asset


@router.get("/files/{file_id}/download")
def download_file(
    file_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    asset = owned_file(db, file_id, user.id)
    path = settings.upload_dir / asset.storage_key
    if not path.exists():
        raise AppError(404, "file_missing", "存储文件不存在")
    return FileResponse(path, media_type=asset.mime_type, filename=asset.original_name)


@router.delete("/files/{file_id}", status_code=204)
def delete_file(
    file_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    asset = owned_file(db, file_id, user.id)
    asset.deleted_at = datetime.now(timezone.utc)
    db.commit()


@router.get("/resume-versions/{version_id}/export/{format_name}")
def export_resume(
    version_id: str,
    format_name: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    version = db.scalar(
        select(ResumeVersion).where(
            ResumeVersion.id == version_id, ResumeVersion.user_id == user.id
        )
    )
    if not version:
        raise AppError(404, "not_found", "简历版本不存在")
    if format_name == "markdown":
        return Response(
            resume_markdown(version.snapshot),
            media_type="text/markdown; charset=utf-8",
            headers={"Content-Disposition": 'attachment; filename="resume.md"'},
        )
    if format_name == "json":
        return Response(
            resume_json(version.snapshot),
            media_type="application/json",
            headers={"Content-Disposition": 'attachment; filename="resume.json"'},
        )
    if format_name == "docx":
        return Response(
            resume_docx(version.snapshot),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": 'attachment; filename="resume.docx"'},
        )
    raise AppError(400, "unsupported_export", "不支持该导出格式")
