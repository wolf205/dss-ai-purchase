import datetime
from typing import List, Tuple
import pandas as pd

from app.models.schemas import DailySalesRecord
from app.core.logging import logger


class TimeSeriesCleaner:
    """
    Module tiền xử lý chuỗi thời gian bán hàng cho AI Service.
    Đảm bảo dữ liệu chuỗi thời gian liên tục, lấp đầy ngày khuyết (zero-imputation),
    gộp trùng lặp và giữ nhịp sinh học chu kỳ tuần (7 ngày) cho các mô hình dự báo.
    """

    @staticmethod
    def clean_and_fill_daily_series(
        sales_history: List[DailySalesRecord]
    ) -> Tuple[pd.Series, datetime.date, int]:
        """
        Làm sạch, sắp xếp và lấp đầy ngày khuyết bằng giá trị 0.0 cho chuỗi lịch sử bán hàng.

        Args:
            sales_history: Danh sách các bản ghi bán hàng theo ngày từ Request.

        Returns:
            series: pd.Series chứa số lượng bán liên tục mỗi ngày (dtype float, index là DatetimeIndex).
            last_date: Ngày cơ sở cuối cùng của chuỗi lịch sử (datetime.date).
            n_days: Tổng số ngày liên tục sau khi đã điền khuyết.
        """
        if not sales_history:
            today = datetime.date.today()
            logger.debug("sales_history rỗng, trả về chuỗi trống")
            return pd.Series([], dtype=float), today, 0

        # 1. Sắp xếp theo ngày tăng dần và gộp các bản ghi trùng lặp cùng ngày (nếu có)
        daily_dict = {}
        for item in sales_history:
            d = item.date
            daily_dict[d] = daily_dict.get(d, 0) + item.quantity

        sorted_dates = sorted(daily_dict.keys())
        min_date = sorted_dates[0]
        max_date = sorted_dates[-1]

        # 2. Tạo dải ngày đầy đủ liên tục theo tần suất hàng ngày (Daily Frequency)
        full_date_range = pd.date_range(start=min_date, end=max_date, freq="D")
        total_days = len(full_date_range)
        recorded_days = len(sorted_dates)

        # 3. Lấp đầy 0.0 cho các ngày không có giao dịch bán
        filled_values = [float(daily_dict.get(ts.date(), 0.0)) for ts in full_date_range]
        series = pd.Series(data=filled_values, index=full_date_range, dtype=float)

        if total_days > recorded_days:
            gap_count = total_days - recorded_days
            logger.debug(
                f"Đã lấp đầy {gap_count} ngày khuyết bằng 0.0 (từ {min_date} đến {max_date})"
            )

        return series, max_date, total_days
