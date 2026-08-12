from fastapi import APIRouter

from study_api.core.schemas import ActionResult, OverviewResponse
from study_api.services import action_service, progress_service
from study_api.core.config import settings

router = APIRouter(tags=["actions"])


@router.post("/actions/check-env", response_model=ActionResult)
def check_env():
    return action_service.check_env()


@router.post("/actions/validate-dataset", response_model=ActionResult)
def validate_dataset():
    return action_service.validate_dataset()


@router.get("/overview", response_model=OverviewResponse)
def overview():
    return OverviewResponse(
        progress=progress_service.get_progress(),
        artifacts=action_service.list_artifacts(),
        study_root=str(settings.study_root),
    )
