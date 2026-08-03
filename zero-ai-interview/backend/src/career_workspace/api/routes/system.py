import os

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from career_workspace.core.database import get_db
from career_workspace.models.entities import AIProviderConfig, AuditLog, ProcessingTask, User
from career_workspace.schemas.system import AIProviderInput
from career_workspace.services.auth import get_current_user

router = APIRouter(prefix="/system", tags=["system"])


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
        db.query(AIProviderConfig).filter(AIProviderConfig.user_id == user.id).update(
            {AIProviderConfig.is_default: False}
        )
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
