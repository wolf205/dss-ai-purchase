import time
from fastapi import APIRouter, status
from app.core.config import settings, START_TIME
from app.models.schemas import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Kiểm tra trạng thái sẵn sàng (Healthcheck & Liveness)",
    description="Trả về trạng thái hoạt động, phiên bản và thời gian uptime của dịch vụ AI.",
)
async def health_check() -> HealthResponse:
    """
    Endpoint kiểm tra sức khỏe và đo thời gian uptime của service.
    """
    uptime = round(time.time() - START_TIME, 2)
    return HealthResponse(
        status="HEALTHY",
        service="dss-ai-service",
        version=settings.VERSION,
        uptime_seconds=uptime,
    )
