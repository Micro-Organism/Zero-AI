from fastapi import Cookie, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from career_workspace.core.database import get_db
from career_workspace.core.errors import AppError
from career_workspace.core.security import parse_session_token
from career_workspace.models.entities import User


def get_current_user(
    db: Session = Depends(get_db),
    career_session: str | None = Cookie(default=None),
) -> User:
    if not career_session:
        raise AppError(401, "authentication_required", "请先登录")
    user_id = parse_session_token(career_session)
    if not user_id:
        raise AppError(401, "invalid_session", "登录状态已失效")
    user = db.scalar(select(User).where(User.id == user_id, User.is_active.is_(True)))
    if not user:
        raise AppError(401, "invalid_session", "登录状态已失效")
    return user
