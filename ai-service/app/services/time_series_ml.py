import warnings
import numpy as np
import pandas as pd
from typing import Tuple, Optional
from statsmodels.tsa.holtwinters import ExponentialSmoothing

from app.core.config import settings
from app.services.model_evaluator import ModelEvaluator
from app.services.baseline_sma import BaselineSMA


class TimeSeriesForecaster:
    """
    Động cơ dự báo chuỗi thời gian sử dụng mô hình Holt-Winters Exponential Smoothing.
    Tích hợp tính chu kỳ tuần (seasonal_periods = 7), cơ chế Backtesting đánh giá sai số,
    và tự động Fallback sang SMA-7 khi WAPE > 40% theo BR-007.
    """

    @staticmethod
    def predict(
        sales_series: pd.Series, 
        horizon_days: int
    ) -> Tuple[np.ndarray, Optional[float], float, bool]:
        """
        Dự báo chuỗi thời gian cho horizon_days ngày tiếp theo.
        
        Quy trình xử lý:
        1. Backtesting: Cắt 7 ngày gần nhất làm tập Test, phần còn lại làm tập Train.
        2. Huấn luyện Holt-Winters trên tập Train, dự báo 7 ngày và tính WAPE, MAE.
        3. Kiểm tra điều kiện Fallback theo BR-007 (ngưỡng WAPE > 40.0%):
           - Nếu WAPE > 40.0% (hoặc mô hình không hội tụ): Kích hoạt Fallback SMA-7, cờ is_fallback = True.
           - Nếu WAPE <= 40.0%: Huấn luyện lại trên toàn bộ chuỗi và dự báo tương lai, cờ is_fallback = False.
           
        Returns:
            predictions: Mảng numpy chứa lượng bán dự báo cho horizon_days ngày (luôn >= 0).
            wape: Sai số WAPE (%) đo được trên tập Test 7 ngày.
            mae: Sai số MAE (hoặc độ lệch chuẩn khi fallback).
            is_fallback: True nếu phải kích hoạt thuật toán dự phòng SMA-7, ngược lại False.
        """
        n_days = len(sales_series)
        
        # Nếu chuỗi dữ liệu chưa đủ 14 ngày, không thể backtest Holt-Winters 7 ngày -> Fallback ngay
        if n_days < 14:
            preds, std_val = BaselineSMA.predict(sales_series, horizon_days)
            return preds, None, std_val, True

        # 1. Backtesting: Chia tập dữ liệu Train / Test (7 ngày cuối)
        train = sales_series.iloc[:-7].astype(float)
        test = sales_series.iloc[-7:].astype(float)

        wape = 999.0
        mae = 0.0

        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                # Huấn luyện mô hình Holt-Winters với chu kỳ tuần 7 ngày
                model = ExponentialSmoothing(
                    train,
                    trend="add",
                    seasonal="add",
                    seasonal_periods=7,
                    initialization_method="heuristic"
                ).fit(use_brute=False)
                
                # Dự báo 7 ngày kiểm thử
                raw_test_preds = model.forecast(7)
                test_preds = np.maximum(0.0, np.asarray(raw_test_preds, dtype=float))

                wape = ModelEvaluator.calculate_wape(test.to_numpy(), test_preds)
                mae = ModelEvaluator.calculate_mae(test.to_numpy(), test_preds)
        except Exception:
            # Nếu phát sinh lỗi hội tụ số học hoặc ma trận suy biến -> ép WAPE = 999.0 để kích hoạt fallback
            wape = 999.0
            mae = 0.0

        # 2. Kiểm tra điều kiện Fallback theo BR-007 (Ngưỡng 40%)
        if wape > settings.WAPE_FALLBACK_THRESHOLD:
            fallback_preds, fallback_std = BaselineSMA.predict(sales_series, horizon_days)
            return fallback_preds, wape, fallback_std, True

        # 3. Huấn luyện lại trên toàn bộ dữ liệu lịch sử để dự báo chu kỳ tới
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                full_model = ExponentialSmoothing(
                    sales_series.astype(float),
                    trend="add",
                    seasonal="add",
                    seasonal_periods=7,
                    initialization_method="heuristic"
                ).fit(use_brute=False)

                raw_future_preds = full_model.forecast(horizon_days)
                predictions = np.maximum(0.0, np.asarray(raw_future_preds, dtype=float))
                return predictions, wape, mae, False
        except Exception:
            # Trường hợp hiếm khi huấn luyện full model gặp sự cố -> Fallback an toàn
            fallback_preds, fallback_std = BaselineSMA.predict(sales_series, horizon_days)
            return fallback_preds, wape, fallback_std, True
