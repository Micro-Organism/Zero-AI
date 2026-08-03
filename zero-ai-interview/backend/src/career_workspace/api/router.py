from fastapi import APIRouter

from career_workspace.api.routes import auth

api_router = APIRouter()
api_router.include_router(auth.router)


@api_router.get("/health", tags=["system"])
def health():
    return {"status": "ok", "service": "zero-ai-interview"}
