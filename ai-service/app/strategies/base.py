from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional
import numpy as np
import pandas as pd

from app.models.schemas import AlgorithmUsedEnum


@dataclass
class ForecastStrategyResult:
    """
    Kết quả chuẩn hóa đầu ra từ tất cả các chiến lược dự báo (Strategy).
    Đảm bảo tính nhất quán (Polymorphic Contract) để Coordinator dễ dàng xử lý.
    """
    predictions: np.ndarray
    algorithm_used: AlgorithmUsedEnum
    is_fallback: bool = False
    wape: Optional[float] = None
    mae: Optional[float] = None
    error_margin: float = 1.0


class BaseForecastStrategy(ABC):
    """
    Giao diện cơ sở trừu tượng cho tất cả các thuật toán dự báo chuỗi thời gian.
    Tuân thủ nguyên lý Strategy Pattern và Open/Closed Principle (OCP).
    """

    @abstractmethod
    def predict(
        self, 
        series: pd.Series, 
        horizon_days: int, 
        **kwargs
    ) -> ForecastStrategyResult:
        """
        Thực hiện dự báo cho horizon_days ngày tiếp theo.

        Args:
            series: Chuỗi thời gian số lượng bán hàng thực tế đã được làm sạch.
            horizon_days: Khung thời gian cần dự báo (7, 14, hoặc 30 ngày).
            **kwargs: Các tham số bổ sung tùy theo từng chiến lược.

        Returns:
            ForecastStrategyResult: Kết quả dự báo chuẩn hóa.
        """
        pass
