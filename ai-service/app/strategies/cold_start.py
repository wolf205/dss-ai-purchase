from typing import Optional
import numpy as np
import pandas as pd

from app.models.schemas import AlgorithmUsedEnum
from app.strategies.base import BaseForecastStrategy, ForecastStrategyResult
from app.core.logging import logger


class ColdStartStrategy(BaseForecastStrategy):
    """
    Chiến lược ước lượng nhu cầu cho sản phẩm mới (Cold Start - BR-006 Tier 1).
    Áp dụng khi dữ liệu lịch sử N_days < 14 ngày.
    """

    def predict(
        self, 
        series: pd.Series, 
        horizon_days: int, 
        expected_daily_sales: Optional[int] = None, 
        **kwargs
    ) -> ForecastStrategyResult:
        """
        Dự báo dựa trên lượng bán kỳ vọng ngày (expected_daily_sales) 
        hoặc trung bình các ngày đã có trong lịch sử ngắn hạn.
        """
        if expected_daily_sales is not None:
            expected = int(expected_daily_sales)
        elif not series.empty and len(series) > 0:
            mean_val = float(series.mean())
            expected = max(1, int(round(mean_val)))
        else:
            expected = 1

        logger.debug(
            f"ColdStartStrategy: horizon={horizon_days}, expected_daily_sales={expected}"
        )

        predictions = np.full(horizon_days, float(expected), dtype=float)

        return ForecastStrategyResult(
            predictions=predictions,
            algorithm_used=AlgorithmUsedEnum.COLD_START_ESTIMATE,
            is_fallback=False,
            wape=None,
            mae=None,
            error_margin=1.0,
        )
