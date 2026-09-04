import time
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings, START_TIME
from app.models.schemas import HealthResponse
from app.api.v1.router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.DESCRIPTION,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gắn các routers phiên bản v1 (/api/v1/forecast, /api/v1/health, ...)
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    tags=["Health & Monitoring"],
    summary="Root Healthcheck phục vụ Docker",
)
async def root_health_check() -> HealthResponse:
    """
    Healthcheck endpoint tại root URL phục vụ Docker Compose liveness probe.
    """
    uptime = round(time.time() - START_TIME, 2)
    return HealthResponse(
        status="HEALTHY",
        service="dss-ai-service",
        version=settings.VERSION,
        uptime_seconds=uptime,
    )


@app.get(
    "/",
    tags=["Root"],
    summary="Thông tin dịch vụ AI",
)
async def root_info():
    """
    Thông tin tổng quan về dịch vụ và điều hướng Swagger Documentation.
    """
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": "stateless_pure_compute",
        "docs_url": "/docs",
        "health_check": "/health",
        "api_v1": f"{settings.API_V1_STR}/forecast",
    }
