import datetime
import pandas as pd
import pytest

from app.models.schemas import DailySalesRecord
from app.preprocessing.time_series_cleaner import TimeSeriesCleaner


class TestTimeSeriesCleaner:
    """Kiểm tra module tiền xử lý dữ liệu chuỗi thời gian TimeSeriesCleaner."""

    def test_cleaner_empty_sales_history(self):
        """Trường hợp danh sách lịch sử bán hàng rỗng."""
        series, last_date, n_days = TimeSeriesCleaner.clean_and_fill_daily_series([])

        assert series.empty
        assert n_days == 0
        assert isinstance(last_date, datetime.date)

    def test_cleaner_single_day(self):
        """Trường hợp chỉ có 1 ngày bán."""
        history = [DailySalesRecord(date=datetime.date(2026, 8, 1), quantity=15)]
        series, last_date, n_days = TimeSeriesCleaner.clean_and_fill_daily_series(history)

        assert len(series) == 1
        assert n_days == 1
        assert last_date == datetime.date(2026, 8, 1)
        assert series.iloc[0] == 15.0

    def test_cleaner_consecutive_days_no_gaps(self):
        """Trường hợp chuỗi các ngày liên tục đầy đủ không có ngày khuyết."""
        history = [
            DailySalesRecord(date=datetime.date(2026, 8, i), quantity=i * 2)
            for i in range(1, 8)
        ]
        series, last_date, n_days = TimeSeriesCleaner.clean_and_fill_daily_series(history)

        assert len(series) == 7
        assert n_days == 7
        assert last_date == datetime.date(2026, 8, 7)
        assert list(series.values) == [2.0, 4.0, 6.0, 8.0, 10.0, 12.0, 14.0]

    def test_cleaner_date_gaps_zero_filled(self):
        """
        Trường hợp có ngày khuyết giữa chuỗi (cửa hàng nghỉ bán hoặc không có đơn).
        Kỳ vọng: Reindex liên tục và tự động điền 0.0 cho các ngày khuyết.
        """
        history = [
            DailySalesRecord(date=datetime.date(2026, 8, 1), quantity=10),
            # Ngày 2, 3 bị khuyết
            DailySalesRecord(date=datetime.date(2026, 8, 4), quantity=20),
            # Ngày 5 bị khuyết
            DailySalesRecord(date=datetime.date(2026, 8, 6), quantity=30),
        ]
        series, last_date, n_days = TimeSeriesCleaner.clean_and_fill_daily_series(history)

        assert len(series) == 6
        assert n_days == 6
        assert last_date == datetime.date(2026, 8, 6)
        # Kỳ vọng: Ngày 1 (10), Ngày 2 (0), Ngày 3 (0), Ngày 4 (20), Ngày 5 (0), Ngày 6 (30)
        expected = [10.0, 0.0, 0.0, 20.0, 0.0, 30.0]
        assert list(series.values) == expected

    def test_cleaner_duplicate_dates_aggregated(self):
        """Trường hợp cùng 1 ngày có nhiều bản ghi -> Gộp tổng số lượng."""
        history = [
            DailySalesRecord(date=datetime.date(2026, 8, 1), quantity=5),
            DailySalesRecord(date=datetime.date(2026, 8, 1), quantity=10),
            DailySalesRecord(date=datetime.date(2026, 8, 2), quantity=8),
        ]
        series, last_date, n_days = TimeSeriesCleaner.clean_and_fill_daily_series(history)

        assert len(series) == 2
        assert n_days == 2
        assert series.iloc[0] == 15.0  # 5 + 10
        assert series.iloc[1] == 8.0

    def test_cleaner_unordered_dates_sorted(self):
        """Trường hợp các ngày bị xáo trộn thứ tự -> Tự động sắp xếp tăng dần."""
        history = [
            DailySalesRecord(date=datetime.date(2026, 8, 5), quantity=50),
            DailySalesRecord(date=datetime.date(2026, 8, 1), quantity=10),
            DailySalesRecord(date=datetime.date(2026, 8, 3), quantity=30),
        ]
        series, last_date, n_days = TimeSeriesCleaner.clean_and_fill_daily_series(history)

        assert len(series) == 5
        assert n_days == 5
        assert last_date == datetime.date(2026, 8, 5)
        # Ngày 1 (10), Ngày 2 (0), Ngày 3 (30), Ngày 4 (0), Ngày 5 (50)
        assert list(series.values) == [10.0, 0.0, 30.0, 0.0, 50.0]
