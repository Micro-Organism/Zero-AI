from sqlalchemy.orm import Session

from career_workspace.models.entities import AuditLog, User


def record_audit(
    db: Session,
    user: User,
    action: str,
    entity_type: str,
    entity_id: str,
    details: dict | None = None,
) -> None:
    db.add(
        AuditLog(
            user_id=user.id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details or {},
        )
    )
