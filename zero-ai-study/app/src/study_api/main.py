from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from study_api.api.router import api_router
from study_api.core.config import settings

app = FastAPI(title=settings.app_name, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/")
def root():
    return {
        "message": "zero-ai-study API",
        "docs": "/docs",
        "health": "/api/health",
    }
