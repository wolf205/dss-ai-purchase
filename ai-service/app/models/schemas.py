import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class AlgorithmUsedEnum(str, Enum):
    """
    Thuật toán được sử dụng để tính toán dự báo nhu cầu.
    Tuân thủ theo internal-ai-contracts.md và BR-006, BR-007.
    """
    AI_MODEL = "AI_MODEL"                      # Holt-Winters Exponential Smoothing đạt chuẩn (WAPE <= 40%)
    FALLBACK_SMA7 = "FALLBACK_SMA7"            # Tự động Fallback sang SMA-7 khi mô hình AI có WAPE > 40% (BR-007)
    BASIC_SMA7 = "BASIC_SMA7"                  # Thuật toán SMA-7 cơ bản cho sản phẩm 14 <= N < 30 ngày (BR-006 Tier 2)
    COLD_START_ESTIMATE = "COLD_START_ESTIMATE"# Ước lượng cho sản phẩm mới N < 14 ngày dựa trên lượng bán dự kiến (BR-006 Tier 1)


class DailySalesRecord(BaseModel):
    """
    Bản ghi doanh số bán lẻ theo từng ngày.
    """
    date: datetime.date = Field(..., description="Ngày ghi nhận (YYYY-MM-DD)")
    quantity: int = Field(..., ge=0, description="Số lượng bán trong ngày (>= 0)")

    model_config = ConfigDict(populate_by_name=True)


class ForecastRequest(BaseModel):
    """
    Yêu cầu dự báo nhu cầu bán lẻ cho 1 SKU.
    Hỗ trợ cả snake_case và camelCase từ Backend Node.js.
    """
    sku: str = Field(..., min_length=1, description="Mã SKU sản phẩm")
    horizon_days: int = Field(
        14, 
        ge=7, 
        le=30, 
        alias="horizonDays", 
        description="Khung thời gian dự báo: 7, 14, hoặc 30 ngày (BR-008, UC-007)"
    )
    sales_history: List[DailySalesRecord] = Field(
        default_factory=list, 
        alias="salesHistory", 
        description="Chuỗi lịch sử bán hàng hàng ngày"
    )
    expected_daily_sales: Optional[int] = Field(
        None, 
        ge=1, 
        alias="expectedDailySales", 
        description="Lượng bán dự kiến ngày cho sản phẩm mới Cold Start (N < 14 ngày)"
    )

    model_config = ConfigDict(populate_by_name=True)


class ForecastBatchRequest(BaseModel):
    """
    Yêu cầu dự báo nhu cầu bán lẻ theo lô (Batch Processing) cho nhiều SKUs.
    """
    items: List[ForecastRequest] = Field(
        ..., 
        min_length=1, 
        description="Danh sách các yêu cầu dự báo của từng SKU"
    )

    model_config = ConfigDict(populate_by_name=True)


class ForecastPoint(BaseModel):
    """
    Điểm dự báo chi tiết cho một ngày trong tương lai kèm dải tin cậy.
    """
    date: datetime.date = Field(..., description="Ngày dự báo trong tương lai (YYYY-MM-DD)")
    predicted: int = Field(..., ge=0, description="Lượng bán dự báo làm tròn số nguyên (>= 0)")
    lower_bound: int = Field(
        ..., 
        ge=0, 
        alias="lowerBound", 
        description="Cận dưới dải tin cậy: max(0, ceil(predicted - 1.65 * MAE))"
    )
    upper_bound: int = Field(
        ..., 
        ge=0, 
        alias="upperBound", 
        description="Cận trên dải tin cậy: ceil(predicted + 1.65 * MAE)"
    )

    model_config = ConfigDict(populate_by_name=True)


class ForecastResponse(BaseModel):
    """
    Kết quả dự báo chi tiết cho 1 SKU trả về cho Backend Node.js.
    """
    sku: str = Field(..., description="Mã SKU sản phẩm")
    horizon_days: int = Field(..., alias="horizonDays", description="Khung thời gian dự báo (7, 14, hoặc 30 ngày)")
    forecasted_demand: int = Field(
        ..., 
        ge=0, 
        alias="forecastedDemand", 
        description="Tổng cầu dự báo chu kỳ T: ceil(sum(max(0, predicted))) (BR-008)"
    )
    daily_avg_demand: float = Field(
        ..., 
        ge=0.0, 
        alias="dailyAvgDemand", 
        description="Nhu cầu trung bình ngày: Forecasted Demand / T"
    )
    wape: Optional[float] = Field(
        None, 
        ge=0.0, 
        description="Sai số tỷ lệ phần trăm WAPE (%), null nếu là Cold Start hoặc Basic SMA-7"
    )
    mae: Optional[float] = Field(
        None, 
        ge=0.0, 
        description="Sai số tuyệt đối trung bình MAE, null nếu là Cold Start"
    )
    algorithm_used: AlgorithmUsedEnum = Field(
        ..., 
        alias="algorithmUsed", 
        description="Mã định danh thuật toán đã thực thi"
    )
    is_fallback: bool = Field(
        ..., 
        alias="isFallback", 
        description="Đánh dấu thuật toán AI bị lỗi/kém chính xác và phải chuyển sang SMA-7"
    )
    points: List[ForecastPoint] = Field(
        default_factory=list, 
        description="Danh sách chuỗi điểm dự báo từng ngày"
    )

    model_config = ConfigDict(populate_by_name=True)


class ForecastBatchResponse(BaseModel):
    """
    Kết quả xử lý dự báo theo lô (Batch Processing).
    """
    total_processed: int = Field(
        ..., 
        ge=0, 
        alias="totalProcessed", 
        description="Tổng số SKU đã được xử lý"
    )
    execution_time_ms: float = Field(
        ..., 
        ge=0.0, 
        alias="executionTimeMs", 
        description="Thời gian thực thi tính bằng mili-giây (ms)"
    )
    results: List[ForecastResponse] = Field(
        default_factory=list, 
        description="Danh sách kết quả dự báo của từng SKU"
    )

    model_config = ConfigDict(populate_by_name=True)


class HealthResponse(BaseModel):
    """
    Kết quả kiểm tra sức khỏe của AI Forecasting Service (GET /health).
    """
    status: str = Field(default="HEALTHY", description="Trạng thái dịch vụ: HEALTHY")
    service: str = Field(default="dss-ai-service", description="Tên định danh dịch vụ")
    version: str = Field(default="1.0.0", description="Phiên bản dịch vụ")
    uptime_seconds: float = Field(
        ..., 
        ge=0.0, 
        alias="uptimeSeconds", 
        description="Số giây dịch vụ đã chạy kể từ thời điểm khởi động"
    )

    model_config = ConfigDict(populate_by_name=True)
