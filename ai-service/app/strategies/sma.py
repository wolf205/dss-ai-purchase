from typing import Optional, Tuple
import numpy as np
import pandas as pd

from app.models.schemas import AlgorithmUsedEnum
from app.strategies.base import BaseForecastStrategy, ForecastStrategyResult
from app.core.logging import logger


class SMAStrategy(BaseForecastStrategy):
    """
    Chiến lược dự báo cơ sở theo Trung bình trượt 7 ngày (Simple Moving Average - SMA-7).
    Áp dụng cho:
    - BR-006 Tier 2: Sản phẩm có 14 <= N < 30 ngày (BASIC_SMA7).
    - BR-007: Fallback an toàn khi mô hình AI Holt-Winters có WAPE > 40% (FALLBACK_SMA7).
    """

    def __init__(self, as_fallback: bool = False):
        self.as_fallback = as_fallback

    @staticmethod
    def compute_sma(sales_series: pd.Series, horizon_days: int) -> Tuple[np.ndarray, float]:
        """
        Tính toán mảng dự báo SMA-7 và độ lệch chuẩn của 7 ngày gần nhất.
        """
        if len(sales_series) == 0:
            return np.zeros(horizon_days, dtype=float), 1.0

        window_size = min(7, len(sales_series))
        recent_window = sales_series.iloc[-window_size:]

        sma_val = max(0.0, float(recent_window.mean()))
        predictions = np.full(horizon_days, sma_val, dtype=float)

        if window_size > 1:
            std_val = float(recent_window.std(ddof=1))
            if np.isnan(std_val) or std_val <= 0.0:
                std_val = 1.0
        else:
            std_val = 1.0

        return predictions, round(std_val, 2)

    def predict(
        self, 
        series: pd.Series, 
        horizon_days: int, 
        wape: Optional[float] = None,
        **kwargs
    ) -> ForecastStrategyResult:
        """
        Dự báo nhu cầu chuỗi thời gian dựa trên SMA-7.
        """
        preds, std_val = self.compute_sma(series, horizon_days)

        if self.as_fallback:
            algo = AlgorithmUsedEnum.FALLBACK_SMA7
            is_fallback = True
            logger.info(
                f"Kích hoạt Fallback SMA-7: horizon={horizon_days}, WAPE={wape}%, std={std_val}"
            )
        else:
            algo = AlgorithmUsedEnum.BASIC_SMA7
            is_fallback = False
            logger.debug(
                f"SMAStrategy (Tier 2 Basic): horizon={horizon_days}, mean={preds[0]:.2f}, std={std_val}"
            )

        return ForecastStrategyResult(
            predictions=preds,
            algorithm_used=algo,
            is_fallback=is_fallback,
            wape=wape,
            mae=std_val,
            error_margin=std_val,
        )
