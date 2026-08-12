from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from career_workspace.api.router import api_router
from career_workspace.core.config import settings
from career_workspace.core.database import engine, session_factory
from career_workspace.core.errors import AppError, app_error_handler
from career_workspace.core.security import hash_password
from career_workspace.models.base import Base
from career_workspace.models.entities import User


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    with session_factory() as db:
        existing = db.scalar(select(User).where(User.username == settings.initial_username))
        if not existing:
            db.add(
                User(
                    username=settings.initial_username,
                    password_hash=hash_password(settings.initial_password),
                    display_name="个人用户",
                )
            )
            db.commit()
    yield


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
app.add_exception_handler(AppError, app_error_handler)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/")
def root():
    return {
        "message": "zero-ai-interview API",
        "docs": "/docs",
        "health": f"{settings.api_prefix}/health",
    }
