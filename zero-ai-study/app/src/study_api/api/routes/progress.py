from fastapi import APIRouter, HTTPException

from study_api.core.schemas import ProgressResponse, ProgressUpdate, StepId
from study_api.services import progress_service

router = APIRouter(tags=["progress"])


@router.get("/progress", response_model=ProgressResponse)
def get_progress():
    return progress_service.get_progress()


@router.put("/progress/{step_id}", response_model=ProgressResponse)
def put_progress(step_id: StepId, body: ProgressUpdate):
    try:
        return progress_service.update_step(step_id, body)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
