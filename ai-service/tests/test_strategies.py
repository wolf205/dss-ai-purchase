import numpy as np
import pandas as pd
import pytest

from app.models.schemas import AlgorithmUsedEnum
from app.strategies import (
    ColdStartStrategy,
    SMAStrategy,
    HoltWintersStrategy,
)


class TestStrategiesUnit:
    """Kiểm tra độc lập từng chiến lược dự báo (Strategy Pattern)."""

    def test_cold_start_with_expected_daily_sales(self):
        series = pd.Series([5.0, 7.0])
        strategy = ColdStartStrategy()
        result = strategy.predict(series, horizon_days=14, expected_daily_sales=20)

        assert len(result.predictions) == 14
        assert np.allclose(result.predictions, 20.0)
        assert result.algorithm_used == AlgorithmUsedEnum.COLD_START_ESTIMATE
        assert result.is_fallback is False
        assert result.wape is None

    def test_cold_start_without_expected_daily_sales(self):
        # Không có expected_daily_sales -> lấy trung bình các ngày có sẵn: (10 + 20) / 2 = 15
        series = pd.Series([10.0, 20.0])
        strategy = ColdStartStrategy()
        result = strategy.predict(series, horizon_days=7, expected_daily_sales=None)

        assert len(result.predictions) == 7
        assert np.allclose(result.predictions, 15.0)
        assert result.algorithm_used == AlgorithmUsedEnum.COLD_START_ESTIMATE

    def test_cold_start_empty_series_defaults_to_one(self):
        series = pd.Series([], dtype=float)
        strategy = ColdStartStrategy()
        result = strategy.predict(series, horizon_days=7, expected_daily_sales=None)

        assert len(result.predictions) == 7
        assert np.allclose(result.predictions, 1.0)

    def test_sma_strategy_tier2(self):
        series = pd.Series([10.0, 12.0, 14.0, 16.0, 18.0, 20.0, 22.0])
        strategy = SMAStrategy(as_fallback=False)
        result = strategy.predict(series, horizon_days=14)

        assert len(result.predictions) == 14
        assert np.allclose(result.predictions, 16.0)
        assert result.algorithm_used == AlgorithmUsedEnum.BASIC_SMA7
        assert result.is_fallback is False

    def test_sma_strategy_fallback(self):
        series = pd.Series([10.0, 12.0, 14.0, 16.0, 18.0, 20.0, 22.0])
        strategy = SMAStrategy(as_fallback=True)
        result = strategy.predict(series, horizon_days=14, wape=42.0)

        assert len(result.predictions) == 14
        assert np.allclose(result.predictions, 16.0)
        assert result.algorithm_used == AlgorithmUsedEnum.FALLBACK_SMA7
        assert result.is_fallback is True
        assert result.wape == 42.0

    def test_holt_winters_strategy_ai_model(self):
        weekly = [10, 12, 11, 14, 18, 28, 32]
        series = pd.Series(weekly * 5)
        strategy = HoltWintersStrategy()
        result = strategy.predict(series, horizon_days=14)

        assert len(result.predictions) == 14
        assert result.algorithm_used == AlgorithmUsedEnum.AI_MODEL
        assert result.is_fallback is False
        assert result.wape is not None
        assert result.wape <= 40.0
