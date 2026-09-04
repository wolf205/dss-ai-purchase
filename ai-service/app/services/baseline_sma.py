import numpy as np
import pandas as pd

class BaselineSMA:
    """
    Thuật toán dự báo cơ sở Trung bình trượt 7 ngày (Simple Moving Average - SMA-7).
    Áp dụng cho:
    - BR-006 Tier 2: Sản phẩm 14 <= N < 30 ngày (BASIC_SMA7).
    - BR-007: Fallback an toàn khi mô hình AI Holt-Winters có WAPE > 40% (FALLBACK_SMA7).
    """

    @staticmethod
    def predict(sales_series: pd.Series, horizon_days: int) -> tuple[np.ndarray, float]:
        """
        Dự báo nhu cầu cho horizon_days ngày tiếp theo dựa trên trung bình 7 ngày gần nhất.
        
        Args:
            sales_series: Chuỗi thời gian số lượng bán hàng thực tế đã được sắp xếp tăng dần theo ngày.
            horizon_days: Số ngày cần dự báo trong tương lai (7, 14, 30).
            
        Returns:
            predictions: Mảng numpy chứa giá trị dự báo cho từng ngày (độ dài = horizon_days).
            error_margin: Độ lệch chuẩn của 7 ngày gần nhất để làm căn cứ tính dải tin cậy.
        """
        if len(sales_series) == 0:
            return np.zeros(horizon_days, dtype=float), 1.0

        # Lấy tối đa 7 ngày gần nhất
        window_size = min(7, len(sales_series))
        recent_window = sales_series.iloc[-window_size:]

        # Tính giá trị trung bình bán lẻ mỗi ngày
        sma_val = float(recent_window.mean())
        sma_val = max(0.0, sma_val)

        # Tạo mảng dự báo cho toàn bộ chu kỳ horizon_days
        predictions = np.full(horizon_days, sma_val, dtype=float)

        # Tính độ lệch chuẩn làm độ biến thiên ước lượng cho dải tin cậy
        if window_size > 1:
            std_val = float(recent_window.std(ddof=1))
            if np.isnan(std_val) or std_val <= 0.0:
                std_val = 1.0
        else:
            std_val = 1.0

        return predictions, round(std_val, 2)
