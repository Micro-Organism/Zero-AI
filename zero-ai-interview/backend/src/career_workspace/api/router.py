from fastapi import APIRouter

from career_workspace.api.routes import (
    auth,
    dashboard,
    files,
    insights,
    matching,
    recruitment,
    resumes,
    system,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(resumes.router)
api_router.include_router(recruitment.router)
api_router.include_router(matching.router)
api_router.include_router(files.router)
api_router.include_router(insights.router)
api_router.include_router(system.router)


@api_router.get("/health", tags=["system"])
def health():
    return {"status": "ok", "service": "zero-ai-interview"}
