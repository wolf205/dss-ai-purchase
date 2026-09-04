from fastapi import APIRouter, status
from app.models.schemas import (
    ForecastRequest,
    ForecastResponse,
    ForecastBatchRequest,
    ForecastBatchResponse,
)
from app.services.forecasting_service import ForecastingService

router = APIRouter()


@router.post(
    "/forecast",
    response_model=ForecastResponse,
    status_code=status.HTTP_200_OK,
    summary="Dự báo nhu cầu bán lẻ cho 1 SKU",
    description=(
        "Nhận chuỗi thời gian lịch sử bán hàng và thực hiện dự báo theo 3 tầng dữ liệu (BR-006):\n"
        "- Dưới 14 ngày: Ước lượng Cold Start (COLD_START_ESTIMATE)\n"
        "- Từ 14 đến 29 ngày: Trung bình trượt 7 ngày (BASIC_SMA7)\n"
        "- Từ 30 ngày trở lên: Mô hình Holt-Winters (AI_MODEL) kèm cơ chế tự động Fallback SMA-7 khi WAPE > 40% (BR-007)"
    ),
)
async def generate_forecast(request: ForecastRequest) -> ForecastResponse:
    """
    Thực hiện dự báo nhu cầu bán lẻ cho 1 mã SKU.
    """
    return ForecastingService.forecast_single_sku(request)


@router.post(
    "/forecast/batch",
    response_model=ForecastBatchResponse,
    status_code=status.HTTP_200_OK,
    summary="Dự báo nhu cầu bán lẻ theo lô (Batch Processing)",
    description=(
        "Xử lý dự báo đồng loạt cho nhiều SKUs trong một lần gọi API. "
        "Tối ưu hóa hiệu năng phục vụ chạy lại phân tích định kỳ hoặc on-demand (< 3000ms cho 100 SKUs theo NFR-04)."
    ),
)
async def generate_forecast_batch(request: ForecastBatchRequest) -> ForecastBatchResponse:
    """
    Thực hiện dự báo nhu cầu bán lẻ theo lô cho danh sách SKUs.
    """
    return ForecastingService.forecast_batch(request)
