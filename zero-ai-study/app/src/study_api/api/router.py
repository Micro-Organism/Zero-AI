from fastapi import APIRouter

from study_api.api.routes import actions, health, progress, setup

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(progress.router)
api_router.include_router(actions.router)
api_router.include_router(setup.router)
