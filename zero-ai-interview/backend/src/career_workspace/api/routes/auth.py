from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from career_workspace.core.config import settings
from career_workspace.core.database import get_db
from career_workspace.core.errors import AppError
from career_workspace.core.security import create_session_token, hash_password, verify_password
from career_workspace.models.entities import User
from career_workspace.schemas.auth import ChangePasswordRequest, LoginRequest, UserResponse
from career_workspace.services.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


def to_response(user: User) -> UserResponse:
    return UserResponse(id=user.id, username=user.username, display_name=user.display_name)


@router.post("/login", response_model=UserResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.username == payload.username))
    if not user or not verify_password(payload.password, user.password_hash):
        raise AppError(401, "invalid_credentials", "用户名或密码错误")
    response.set_cookie(
        settings.session_cookie_name,
        create_session_token(user.id),
        max_age=settings.session_ttl_seconds,
        httponly=True,
        samesite="lax",
        secure=False,
    )
    return to_response(user)


@router.post("/logout", status_code=204)
def logout(response: Response):
    response.delete_cookie(settings.session_cookie_name)


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return to_response(user)


@router.post("/change-password", response_model=UserResponse)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, user.password_hash):
        raise AppError(400, "invalid_current_password", "当前密码不正确")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return to_response(user)
