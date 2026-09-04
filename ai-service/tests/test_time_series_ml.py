import numpy as np
import pandas as pd
import pytest
from app.services.time_series_ml import TimeSeriesForecaster

class TestTimeSeriesForecaster:
    """Kiểm tra mô hình Holt-Winters, tính toán WAPE/MAE và cơ chế Fallback BR-007."""

    def test_holt_winters_seasonal_series_success(self):
        """
        Chuỗi 35 ngày có tính chu kỳ tuần rõ nét (bán mạnh cuối tuần).
        Mô hình AI dự báo chuẩn xác -> WAPE <= 40% -> is_fallback = False.
        """
        # Mẫu 7 ngày: Thứ 2 (10) -> Chủ nhật (30)
        weekly_pattern = [10, 12, 11, 14, 18, 28, 32]
        # Nhân bản 5 tuần = 35 ngày
        sales_data = weekly_pattern * 5
        series = pd.Series(sales_data)

        preds, wape, mae, is_fallback = TimeSeriesForecaster.predict(series, horizon_days=14)

        assert len(preds) == 14
        assert np.all(preds >= 0.0)
        assert wape is not None
        assert wape <= 40.0, f"Kỳ vọng WAPE <= 40%, thực tế: {wape}%"
        assert is_fallback is False
        assert mae is not None
        assert mae >= 0.0

    def test_holt_winters_volatile_fallback_triggered(self):
        """
        Chuỗi có sự biến động cực đoan ở 7 ngày gần nhất so với lịch sử.
        Mô hình AI backtest gặp sai số lớn -> WAPE > 40% -> Tự động kích hoạt Fallback SMA-7 (BR-007).
        """
        # 28 ngày đầu bán đều đặn quanh mức 10
        base_history = [10] * 28
        # 7 ngày cuối nhảy vọt bất thường (quá tải / nhiễu) lên mức 150 - 300
        spike_week = [150, 200, 180, 250, 220, 300, 280]
        series = pd.Series(base_history + spike_week)

        preds, wape, mae, is_fallback = TimeSeriesForecaster.predict(series, horizon_days=14)

        assert len(preds) == 14
        assert np.all(preds >= 0.0)
        assert wape is not None
        assert wape > 40.0, f"Kỳ vọng WAPE > 40%, thực tế: {wape}%"
        # Bắt buộc cờ is_fallback = True theo quy tắc BR-007
        assert is_fallback is True
        # Giá trị dự báo fallback là SMA-7 của 7 ngày cuối (~225.7)
        assert np.allclose(preds, float(np.mean(spike_week)))

    def test_holt_winters_short_history_fallback(self):
        """Chuỗi dưới 14 ngày không đủ điều kiện chạy Holt-Winters -> Fallback ngay."""
        series = pd.Series([10, 12, 8, 14, 15, 9, 11, 13, 10, 12])  # 10 ngày
        preds, wape, mae, is_fallback = TimeSeriesForecaster.predict(series, horizon_days=7)

        assert len(preds) == 7
        assert np.all(preds >= 0.0)
        assert is_fallback is True
        assert wape is None

    def test_holt_winters_predictions_never_negative(self):
        """Dự báo từ chuỗi giảm dần về 0 không bao giờ tạo ra lượng bán âm."""
        # Chuỗi giảm dần: 20 -> 0
        data = [20 - (i % 20) for i in range(35)]
        series = pd.Series(data)

        preds, _, _, _ = TimeSeriesForecaster.predict(series, horizon_days=14)
        assert np.all(preds >= 0.0)
