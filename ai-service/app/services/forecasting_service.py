import math
import time
import datetime
import numpy as np
import pandas as pd
from typing import List

from app.core.config import settings
from app.models.schemas import (
    AlgorithmUsedEnum,
    ForecastRequest,
    ForecastBatchRequest,
    ForecastPoint,
    ForecastResponse,
    ForecastBatchResponse,
)
from app.services.model_evaluator import ModelEvaluator
from app.services.baseline_sma import BaselineSMA
from app.services.time_series_ml import TimeSeriesForecaster


class ForecastingService:
    """
    Bộ điều phối dịch vụ dự báo nhu cầu bán lẻ (Coordinator).
    Thực hiện phân tầng dữ liệu theo BR-006, tính tổng cầu theo BR-008,
    và điều phối xử lý theo lô (Batch Processing).
    """

    @classmethod
    def forecast_single_sku(cls, request: ForecastRequest) -> ForecastResponse:
        """
        Dự báo nhu cầu cho 1 SKU dựa trên chuỗi lịch sử bán hàng và mức độ trưởng thành dữ liệu.
        
        Quy tắc phân tầng BR-006:
        - Tier 1: N_days < 14 ngày -> COLD_START_ESTIMATE (sản phẩm mới, dựa trên expected_daily_sales).
        - Tier 2: 14 <= N_days < 30 ngày -> BASIC_SMA7 (dùng trung bình trượt 7 ngày).
        - Tier 3: N_days >= 30 ngày -> AI_MODEL (Holt-Winters; tự động chuyển FALLBACK_SMA7 nếu WAPE > 40%).
        """
        history = request.sales_history
        horizon = request.horizon_days

        # Sắp xếp lịch sử bán hàng theo thứ tự ngày tăng dần
        sorted_history = sorted(history, key=lambda x: x.date)
        n_days = len(sorted_history)

        # Xác định ngày cơ sở cuối cùng
        last_date = sorted_history[-1].date if sorted_history else datetime.date.today()

        # =========================================================================
        # TẦNG 1: COLD START ESTIMATE (N_days < 14 ngày)
        # =========================================================================
        if n_days < settings.MIN_DAYS_FOR_SMA7:
            if request.expected_daily_sales is not None:
                expected = request.expected_daily_sales
            elif sorted_history:
                # Nếu không truyền expected_daily_sales nhưng có lịch sử vài ngày, lấy trung bình
                expected = max(1, int(round(float(np.mean([h.quantity for h in sorted_history])))))
            else:
                expected = 1

            total_demand = expected * horizon
            daily_avg = float(expected)

            points: List[ForecastPoint] = []
            for i in range(1, horizon + 1):
                next_date = last_date + datetime.timedelta(days=i)
                points.append(
                    ForecastPoint(
                        date=next_date,
                        predicted=expected,
                        lower_bound=max(0, expected - 1),
                        upper_bound=expected + 1,
                    )
                )

            return ForecastResponse(
                sku=request.sku,
                horizon_days=horizon,
                forecasted_demand=total_demand,
                daily_avg_demand=daily_avg,
                wape=None,
                mae=None,
                algorithm_used=AlgorithmUsedEnum.COLD_START_ESTIMATE,
                is_fallback=False,
                points=points,
            )

        # Trích xuất chuỗi số lượng bán
        sales_values = [h.quantity for h in sorted_history]
        sales_series = pd.Series(sales_values, dtype=float)

        # =========================================================================
        # TẦNG 2: BASIC FORECAST (14 <= N_days < 30 ngày) -> Dùng SMA-7
        # =========================================================================
        if n_days < settings.MIN_DAYS_FOR_AI:
            raw_preds, std_val = BaselineSMA.predict(sales_series, horizon)

            # BR-008: Forecasted Demand = ceil(sum(max(0, y_hat_t)))
            total_raw = float(np.sum(np.maximum(0.0, raw_preds)))
            total_demand = int(math.ceil(total_raw))
            daily_avg = round(total_demand / horizon, 2)

            points = []
            for i, raw_val in enumerate(raw_preds, start=1):
                next_date = last_date + datetime.timedelta(days=i)
                pred_int = max(0, int(round(raw_val)))

                lower_b, upper_b = ModelEvaluator.calculate_confidence_bounds(
                    predicted=raw_val,
                    error_metric=std_val,
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
                horizon_days=horizon,
                forecasted_demand=total_demand,
                daily_avg_demand=daily_avg,
                wape=None,
                mae=round(std_val, 2),
                algorithm_used=AlgorithmUsedEnum.BASIC_SMA7,
                is_fallback=False,
                points=points,
            )

        # =========================================================================
        # TẦNG 3: AI READY (N_days >= 30 ngày) -> Chạy Holt-Winters
        # =========================================================================
        raw_preds, wape, mae, is_fallback = TimeSeriesForecaster.predict(sales_series, horizon)

        # BR-008: Forecasted Demand = ceil(sum(max(0, y_hat_t)))
        total_raw = float(np.sum(np.maximum(0.0, raw_preds)))
        total_demand = int(math.ceil(total_raw))
        daily_avg = round(total_demand / horizon, 2)

        points = []
        for i, raw_val in enumerate(raw_preds, start=1):
            next_date = last_date + datetime.timedelta(days=i)
            pred_int = max(0, int(round(raw_val)))

            lower_b, upper_b = ModelEvaluator.calculate_confidence_bounds(
                predicted=raw_val,
                error_metric=mae,
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

        algorithm = (
            AlgorithmUsedEnum.FALLBACK_SMA7 if is_fallback 
            else AlgorithmUsedEnum.AI_MODEL
        )

        return ForecastResponse(
            sku=request.sku,
            horizon_days=horizon,
            forecasted_demand=total_demand,
            daily_avg_demand=daily_avg,
            wape=round(wape, 2) if wape is not None else None,
            mae=round(mae, 2) if mae is not None else None,
            algorithm_used=algorithm,
            is_fallback=is_fallback,
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

        return ForecastBatchResponse(
            total_processed=len(results),
            execution_time_ms=round(elapsed_ms, 2),
            results=results,
        )
