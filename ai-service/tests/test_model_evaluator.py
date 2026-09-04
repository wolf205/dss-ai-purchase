import numpy as np
import pytest
from app.services.model_evaluator import ModelEvaluator

class TestModelEvaluator:
    """Kiểm tra độ chính xác của các công thức đánh giá WAPE, MAE và dải tin cậy."""

    def test_calculate_wape_standard(self):
        # Actuals: [10, 20, 30] -> Sum = 60
        # Preds:   [12, 18, 33] -> Absolute errors: [2, 2, 3] -> Sum = 7
        # WAPE = (7 / 60) * 100 = 11.6666... -> 11.67%
        actuals = np.array([10, 20, 30])
        preds = np.array([12, 18, 33])
        wape = ModelEvaluator.calculate_wape(actuals, preds)
        assert wape == 11.67

    def test_calculate_wape_perfect_match(self):
        actuals = np.array([15, 25, 40])
        preds = np.array([15, 25, 40])
        wape = ModelEvaluator.calculate_wape(actuals, preds)
        assert wape == 0.0

    def test_calculate_wape_zero_actuals_zero_predictions(self):
        # Cả thực tế và dự báo đều bằng 0 (hàng không bán được gì)
        actuals = np.array([0, 0, 0])
        preds = np.array([0, 0, 0])
        wape = ModelEvaluator.calculate_wape(actuals, preds)
        assert wape == 0.0

    def test_calculate_wape_zero_actuals_positive_predictions(self):
        # Thực tế bán 0 nhưng dự báo bán có số lượng -> Phạt lỗi 100%
        actuals = np.array([0, 0, 0])
        preds = np.array([5, 2, 1])
        wape = ModelEvaluator.calculate_wape(actuals, preds)
        assert wape == 100.0

    def test_calculate_mae_standard(self):
        actuals = np.array([10, 20, 30])
        preds = np.array([12, 18, 33])
        # Errors: [2, 2, 3] -> Mean = 7 / 3 = 2.33
        mae = ModelEvaluator.calculate_mae(actuals, preds)
        assert mae == 2.33

    def test_calculate_mae_empty(self):
        mae = ModelEvaluator.calculate_mae(np.array([]), np.array([]))
        assert mae == 0.0

    def test_confidence_bounds_standard(self):
        # predicted = 10.0, error = 2.0, z = 1.65
        # margin = 3.3 -> lower = floor(10 - 3.3) = 6, upper = ceil(10 + 3.3) = 14
        lower, upper = ModelEvaluator.calculate_confidence_bounds(
            predicted=10.0, error_metric=2.0, z=1.65
        )
        assert lower == 6
        assert upper == 14

    def test_confidence_bounds_non_negative(self):
        # predicted = 2.0, error = 5.0, z = 1.65 -> margin = 8.25
        # lower = max(0, floor(2.0 - 8.25)) = 0 (tuyệt đối không âm)
        lower, upper = ModelEvaluator.calculate_confidence_bounds(
            predicted=2.0, error_metric=5.0, z=1.65
        )
        assert lower == 0
        assert upper >= lower
