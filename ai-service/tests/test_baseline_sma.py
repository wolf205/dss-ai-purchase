import numpy as np
import pandas as pd
import pytest
from app.strategies.sma import SMAStrategy
from app.models.schemas import AlgorithmUsedEnum


class TestSMAStrategy:
    """Kiểm tra thuật toán SMA-7 qua SMAStrategy."""

    def test_sma7_standard_7_days(self):
        # 7 ngày gần nhất: [10, 12, 14, 16, 18, 20, 22] -> Tổng = 112 -> Mean = 16.0
        series = pd.Series([10, 12, 14, 16, 18, 20, 22])
        strategy = SMAStrategy(as_fallback=False)
        result = strategy.predict(series, horizon_days=14)

        assert len(result.predictions) == 14
        assert np.allclose(result.predictions, 16.0)
        assert result.error_margin > 0.0
        assert result.algorithm_used == AlgorithmUsedEnum.BASIC_SMA7
        assert result.is_fallback is False

    def test_sma7_longer_history_uses_last_7_days_only(self):
        # 14 ngày lịch sử, 7 ngày đầu bán 100, 7 ngày sau bán 10:
        # [100, 100, 100, 100, 100, 100, 100, 10, 10, 10, 10, 10, 10, 10]
        # SMA-7 chỉ lấy 7 ngày cuối: mean = 10.0
        data = [100] * 7 + [10] * 7
        series = pd.Series(data)
        preds, std_val = SMAStrategy.compute_sma(series, horizon_days=7)

        assert len(preds) == 7
        assert np.allclose(preds, 10.0)

    def test_sma7_constant_sales_default_std(self):
        # Chuỗi giá trị đều đặn: [5, 5, 5, 5, 5, 5, 5] -> std = 0.0 -> tự động fallback sang 1.0
        series = pd.Series([5, 5, 5, 5, 5, 5, 5])
        preds, std_val = SMAStrategy.compute_sma(series, horizon_days=14)

        assert np.allclose(preds, 5.0)
        assert std_val == 1.0

    def test_sma7_empty_series(self):
        series = pd.Series([], dtype=float)
        strategy = SMAStrategy(as_fallback=False)
        result = strategy.predict(series, horizon_days=14)

        assert len(result.predictions) == 14
        assert np.allclose(result.predictions, 0.0)
        assert result.error_margin == 1.0

    def test_sma7_predictions_never_negative(self):
        series = pd.Series([0, 0, 0, 0, 0, 0, 0])
        preds, _ = SMAStrategy.compute_sma(series, horizon_days=30)
        assert np.all(preds >= 0.0)

    def test_sma7_as_fallback_flag(self):
        series = pd.Series([10, 12, 14, 16, 18, 20, 22])
        strategy = SMAStrategy(as_fallback=True)
        result = strategy.predict(series, horizon_days=14, wape=45.5)

        assert result.algorithm_used == AlgorithmUsedEnum.FALLBACK_SMA7
        assert result.is_fallback is True
        assert result.wape == 45.5
