from fastapi import APIRouter

from study_api.core.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    return {
        "status": "ok",
        "app": settings.app_name,
        "study_root": str(settings.study_root),
    }
