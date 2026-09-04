import math
import numpy as np
from app.core.config import settings

class ModelEvaluator:
    """
    Bộ đánh giá chất lượng mô hình dự báo và tính toán dải tin cậy.
    Tuân thủ theo BR-007 và internal-ai-contracts.md.
    """

    @staticmethod
    def calculate_wape(actuals: np.ndarray, predictions: np.ndarray) -> float:
        """
        Tính sai số phần trăm tuyệt đối có trọng số (Weighted Absolute Percentage Error - WAPE).
        Công thức: WAPE = (sum(|y_i - y_hat_i|) / sum(y_i)) * 100% (BR-007).
        
        Xử lý trường hợp đặc biệt:
        - Nếu sum(actuals) == 0:
            + Nếu sum(|predictions|) == 0: WAPE = 0.0% (dự báo chuẩn không bán được gì).
            + Nếu predictions > 0: WAPE = 100.0% (thực tế 0 nhưng dự báo có bán).
        """
        actuals = np.asarray(actuals, dtype=float)
        predictions = np.asarray(predictions, dtype=float)

        total_actual = float(np.sum(actuals))
        absolute_errors = np.abs(actuals - predictions)
        total_error = float(np.sum(absolute_errors))

        if total_actual == 0.0:
            return 0.0 if total_error == 0.0 else 100.0

        wape = (total_error / total_actual) * 100.0
        return float(round(wape, 2))

    @staticmethod
    def calculate_mae(actuals: np.ndarray, predictions: np.ndarray) -> float:
        """
        Tính sai số tuyệt đối trung bình (Mean Absolute Error - MAE).
        Công thức: MAE = (1/n) * sum(|y_i - y_hat_i|).
        """
        actuals = np.asarray(actuals, dtype=float)
        predictions = np.asarray(predictions, dtype=float)

        if len(actuals) == 0:
            return 0.0

        mae = float(np.mean(np.abs(actuals - predictions)))
        return float(round(mae, 2))

    @staticmethod
    def calculate_confidence_bounds(
        predicted: float, 
        error_metric: float, 
        z: float = settings.CONFIDENCE_INTERVAL_Z
    ) -> tuple[int, int]:
        """
        Tính cận dưới và cận trên của dải tin cậy (~90-95%) cho từng điểm dự báo.
        Công thức theo internal-ai-contracts.md:
        - lower_bound = max(0, floor(predicted - z * error_metric))
        - upper_bound = ceil(predicted + z * error_metric)
        """
        pred_val = max(0.0, float(predicted))
        err_val = max(0.0, float(error_metric))

        margin = z * err_val
        lower_bound = max(0, int(math.floor(pred_val - margin)))
        upper_bound = max(lower_bound, int(math.ceil(pred_val + margin)))

        return lower_bound, upper_bound
