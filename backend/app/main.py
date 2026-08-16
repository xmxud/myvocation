"""MyVocation FastAPI Application — Main Entry Point."""
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.config import settings
from app.database import init_db

# Import routers
from app.routers.auth import router as auth_router
from app.routers.nodes import router as nodes_router
from app.routers.phases import router as phases_router
from app.routers.executions import router as executions_router
from app.routers.learning import router as learning_router
from app.routers.tags import router as tags_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    description="个人规划管理系统 API — 2026我在行动",
    version="2.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(nodes_router)
app.include_router(phases_router)
app.include_router(executions_router)
app.include_router(learning_router)
app.include_router(tags_router)


# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.status_code, "message": exc.detail, "data": None},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"code": 500, "message": str(exc), "data": None},
    )


# Health check
@app.get("/api/health")
async def health():
    return {"message": "Backend is running successfully."}


# Root
@app.get("/")
async def root():
    return {
        "code": 0,
        "message": "Welcome to MyVocation API v2",
        "data": {"service": settings.app_name, "version": "2.0.0"},
    }
