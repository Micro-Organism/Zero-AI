import os

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from career_workspace.core.database import get_db
from career_workspace.core.errors import AppError
from career_workspace.models.entities import AIProviderConfig, AuditLog, ProcessingTask, User
from career_workspace.schemas.system import AIProviderInput
from career_workspace.services.auth import get_current_user
from career_workspace.services.llm import test_connection

router = APIRouter(prefix="/system", tags=["system"])


def get_owned_provider(db: Session, provider_id: str, user_id: str) -> AIProviderConfig:
    provider = db.scalar(
        select(AIProviderConfig).where(
            AIProviderConfig.id == provider_id,
            AIProviderConfig.user_id == user_id,
        )
    )
    if not provider:
        raise AppError(404, "not_found", "AI 服务配置不存在")
    return provider


def clear_default_provider(db: Session, user_id: str, except_id: str | None = None) -> None:
    query = db.query(AIProviderConfig).filter(AIProviderConfig.user_id == user_id)
    if except_id:
        query = query.filter(AIProviderConfig.id != except_id)
    query.update({AIProviderConfig.is_default: False})


def provider_response(item: AIProviderConfig) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "base_url": item.base_url,
        "model": item.model,
        "api_key_env": item.api_key_env,
        "api_key_configured": bool(os.getenv(item.api_key_env)),
        "timeout_seconds": item.timeout_seconds,
        "max_retries": item.max_retries,
        "temperature": item.temperature,
        "max_tokens": item.max_tokens,
        "is_enabled": item.is_enabled,
        "is_default": item.is_default,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }


@router.post("/ai-providers", status_code=201)
def create_provider(
    payload: AIProviderInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if payload.is_default:
        clear_default_provider(db, user.id)
    item = AIProviderConfig(user_id=user.id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return provider_response(item)


@router.get("/ai-providers")
def list_providers(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    items = list(
        db.scalars(
            select(AIProviderConfig)
            .where(AIProviderConfig.user_id == user.id)
            .order_by(AIProviderConfig.is_default.desc(), AIProviderConfig.updated_at.desc())
        )
    )
    return [provider_response(item) for item in items]


@router.put("/ai-providers/{provider_id}")
def update_provider(
    provider_id: str,
    payload: AIProviderInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = get_owned_provider(db, provider_id, user.id)
    if payload.is_default:
        clear_default_provider(db, user.id, item.id)
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return provider_response(item)


@router.delete("/ai-providers/{provider_id}", status_code=204)
def delete_provider(
    provider_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = get_owned_provider(db, provider_id, user.id)
    db.delete(item)
    db.commit()


@router.post("/ai-providers/{provider_id}/test-connection")
def test_provider_connection(
    provider_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = get_owned_provider(db, provider_id, user.id)
    return test_connection(item)


@router.get("/tasks")
def list_tasks(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return list(
        db.scalars(
            select(ProcessingTask)
            .where(ProcessingTask.user_id == user.id)
            .order_by(ProcessingTask.updated_at.desc())
            .limit(100)
        )
    )


@router.get("/audit-logs")
def list_audit_logs(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return list(
        db.scalars(
            select(AuditLog)
            .where(AuditLog.user_id == user.id)
            .order_by(AuditLog.created_at.desc())
            .limit(100)
        )
    )
