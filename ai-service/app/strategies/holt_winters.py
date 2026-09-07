import warnings
import numpy as np
import pandas as pd
from statsmodels.tsa.holtwinters import ExponentialSmoothing

from app.core.config import settings
from app.core.logging import logger
from app.models.schemas import AlgorithmUsedEnum
from app.services.model_evaluator import ModelEvaluator
from app.strategies.base import BaseForecastStrategy, ForecastStrategyResult
from app.strategies.sma import SMAStrategy


class HoltWintersStrategy(BaseForecastStrategy):
    """
    Chiến lược dự báo chuỗi thời gian sử dụng mô hình Holt-Winters Triple Exponential Smoothing.
    Tích hợp tính chu kỳ tuần (seasonal_periods = 7), cơ chế Backtesting 7 ngày đánh giá sai số,
    và tự động Fallback sang SMA-7 khi WAPE > 40% theo BR-007.
    """

    def predict(
        self, 
        series: pd.Series, 
        horizon_days: int, 
        **kwargs
    ) -> ForecastStrategyResult:
        """
        Dự báo chuỗi thời gian cho horizon_days ngày tiếp theo.
        """
        n_days = len(series)

        # Nếu chuỗi dữ liệu chưa đủ 14 ngày, không thể backtest Holt-Winters 7 ngày -> Fallback ngay
        if n_days < 14:
            logger.info(
                f"Chuỗi dữ liệu N={n_days} < 14 ngày, không đủ điều kiện chạy Holt-Winters -> Kích hoạt Fallback SMA-7"
            )
            return SMAStrategy(as_fallback=True).predict(series, horizon_days, wape=None)

        # 1. Backtesting: Tách tập Train / Test (7 ngày cuối)
        train = series.iloc[:-7].astype(float)
        test = series.iloc[-7:].astype(float)

        wape = 999.0
        mae = 0.0

        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                model = ExponentialSmoothing(
                    train,
                    trend="add",
                    seasonal="add",
                    seasonal_periods=7,
                    initialization_method="heuristic",
                ).fit(use_brute=False)

                raw_test_preds = model.forecast(7)
                test_preds = np.maximum(0.0, np.asarray(raw_test_preds, dtype=float))

                wape = ModelEvaluator.calculate_wape(test.to_numpy(), test_preds)
                mae = ModelEvaluator.calculate_mae(test.to_numpy(), test_preds)
                logger.debug(
                    f"Backtesting Holt-Winters hoàn tất: WAPE={wape}%, MAE={mae:.2f}"
                )
        except Exception as e:
            logger.warning(
                f"Huấn luyện Holt-Winters Backtesting gặp lỗi số học hoặc ma trận suy biến: {e}. Kích hoạt Fallback."
            )
            wape = 999.0
            mae = 0.0

        # 2. Kiểm tra điều kiện Fallback theo BR-007 (Ngưỡng 40.0%)
        if wape > settings.WAPE_FALLBACK_THRESHOLD:
            logger.info(
                f"WAPE ({wape}%) vượt ngưỡng quy định BR-007 ({settings.WAPE_FALLBACK_THRESHOLD}%). "
                f"Tự động kích hoạt Fallback SMA-7."
            )
            return SMAStrategy(as_fallback=True).predict(series, horizon_days, wape=wape)

        # 3. Huấn luyện lại trên toàn bộ dữ liệu lịch sử để dự báo chu kỳ tới
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                full_model = ExponentialSmoothing(
                    series.astype(float),
                    trend="add",
                    seasonal="add",
                    seasonal_periods=7,
                    initialization_method="heuristic",
                ).fit(use_brute=False)

                raw_future_preds = full_model.forecast(horizon_days)
                predictions = np.maximum(0.0, np.asarray(raw_future_preds, dtype=float))

                logger.debug(
                    f"Holt-Winters đạt chuẩn: horizon={horizon_days}, WAPE={wape}%, MAE={mae:.2f}"
                )

                return ForecastStrategyResult(
                    predictions=predictions,
                    algorithm_used=AlgorithmUsedEnum.AI_MODEL,
                    is_fallback=False,
                    wape=wape,
                    mae=mae,
                    error_margin=mae,
                )
        except Exception as e:
            logger.warning(
                f"Huấn luyện Holt-Winters Full Model gặp sự cố bất ngờ: {e}. Fallback an toàn sang SMA-7."
            )
            return SMAStrategy(as_fallback=True).predict(series, horizon_days, wape=wape)
