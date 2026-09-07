import datetime
import math
import time
from typing import List
import numpy as np

from app.core.config import settings
from app.core.logging import logger
from app.models.schemas import (
    AlgorithmUsedEnum,
    ForecastRequest,
    ForecastBatchRequest,
    ForecastPoint,
    ForecastResponse,
    ForecastBatchResponse,
)
from app.preprocessing.time_series_cleaner import TimeSeriesCleaner
from app.services.model_evaluator import ModelEvaluator
from app.strategies.base import ForecastStrategyResult
from app.strategies.cold_start import ColdStartStrategy
from app.strategies.sma import SMAStrategy
from app.strategies.holt_winters import HoltWintersStrategy


class ForecastingService:
    """
    Bộ điều phối dịch vụ dự báo nhu cầu bán lẻ (Coordinator).
    Thực hiện điều phối pipeline dự báo:
    1. Tiền xử lý dữ liệu qua TimeSeriesCleaner (lấp đầy ngày khuyết bằng 0.0, gộp trùng lặp).
    2. Định tuyến thuật toán theo BR-006 (Cold Start -> SMA-7 -> Holt-Winters).
    3. Hậu xử lý tập trung (Single Post-Processor) tính tổng cầu BR-008 và dải tin cậy 95%.
    4. Xử lý theo lô (Batch Processing) đảm bảo NFR-04 (< 3000ms cho 100 SKUs).
    """

    @classmethod
    def _select_and_execute_strategy(
        cls, 
        request: ForecastRequest, 
        sales_series, 
        n_days: int
    ) -> ForecastStrategyResult:
        """
        Định tuyến và thực thi chiến lược dự báo phù hợp với mức độ trưởng thành của dữ liệu.
        
        Quy tắc phân tầng BR-006:
        - Tier 1: N_days < 14 ngày -> ColdStartStrategy.
        - Tier 2: 14 <= N_days < 30 ngày -> SMAStrategy (Basic SMA-7).
        - Tier 3: N_days >= 30 ngày -> HoltWintersStrategy (tự động Fallback sang SMA-7 nếu WAPE > 40%).
        """
        if n_days < settings.MIN_DAYS_FOR_SMA7:
            strategy = ColdStartStrategy()
            return strategy.predict(
                series=sales_series,
                horizon_days=request.horizon_days,
                expected_daily_sales=request.expected_daily_sales,
            )

        if n_days < settings.MIN_DAYS_FOR_AI:
            strategy = SMAStrategy(as_fallback=False)
            return strategy.predict(
                series=sales_series,
                horizon_days=request.horizon_days,
            )

        strategy = HoltWintersStrategy()
        return strategy.predict(
            series=sales_series,
            horizon_days=request.horizon_days,
        )

    @classmethod
    def forecast_single_sku(cls, request: ForecastRequest) -> ForecastResponse:
        """
        Dự báo nhu cầu cho 1 SKU dựa trên chuỗi lịch sử bán hàng và mức độ trưởng thành dữ liệu.
        """
        # 1. Tiền xử lý dữ liệu chuỗi thời gian: Sắp xếp, gộp trùng, reindex dải ngày & zero-imputation
        sales_series, last_date, n_days = TimeSeriesCleaner.clean_and_fill_daily_series(
            request.sales_history
        )

        # 2. Định tuyến & thực thi chiến lược dự báo
        result = cls._select_and_execute_strategy(request, sales_series, n_days)

        # 3. Hậu xử lý tập trung (Single Post-Processing Pipeline)
        # BR-008: Forecasted Demand = ceil(sum(max(0, y_hat_t)))
        total_raw = float(np.sum(np.maximum(0.0, result.predictions)))
        total_demand = int(math.ceil(total_raw))
        daily_avg = round(total_demand / request.horizon_days, 2)

        # Sinh các điểm dự báo ngày kèm dải tin cậy
        points: List[ForecastPoint] = []
        for i, raw_val in enumerate(result.predictions, start=1):
            next_date = last_date + datetime.timedelta(days=i)
            pred_int = max(0, int(round(raw_val)))

            if result.algorithm_used == AlgorithmUsedEnum.COLD_START_ESTIMATE:
                lower_b = max(0, pred_int - 1)
                upper_b = pred_int + 1
            else:
                lower_b, upper_b = ModelEvaluator.calculate_confidence_bounds(
                    predicted=raw_val,
                    error_metric=result.error_margin,
                    z=settings.CONFIDENCE_INTERVAL_Z,
                )

            points.append(
                ForecastPoint(
                    date=next_date,
                    predicted=pred_int,
                    lower_bound=lower_b,
                    upper_bound=upper_b,
                )
            )

        return ForecastResponse(
            sku=request.sku,
            horizon_days=request.horizon_days,
            forecasted_demand=total_demand,
            daily_avg_demand=daily_avg,
            wape=round(result.wape, 2) if result.wape is not None else None,
            mae=round(result.mae, 2) if result.mae is not None else None,
            algorithm_used=result.algorithm_used,
            is_fallback=result.is_fallback,
            points=points,
        )

    @classmethod
    def forecast_batch(cls, request: ForecastBatchRequest) -> ForecastBatchResponse:
        """
        Dự báo nhu cầu bán lẻ theo lô (Batch Processing) cho toàn bộ danh mục sản phẩm.
        Đo lường thời gian thực thi để kiểm soát NFR-04 (< 3000ms cho 100 SKUs).
        """
        start_time = time.perf_counter()
        results: List[ForecastResponse] = []

        for item in request.items:
            res = cls.forecast_single_sku(item)
            results.append(res)

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        logger.info(
            f"Batch Processing: Hoàn thành dự báo cho {len(results)} SKUs trong {elapsed_ms:.2f}ms"
        )

        return ForecastBatchResponse(
            total_processed=len(results),
            execution_time_ms=round(elapsed_ms, 2),
            results=results,
        )
