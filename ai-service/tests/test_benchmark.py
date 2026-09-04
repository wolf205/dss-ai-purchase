import time
import datetime
import random
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.schemas import ForecastBatchRequest, ForecastRequest

client = TestClient(app)


class TestBenchmarkNFR04:
    """
    Đo kiểm hiệu năng và tiêu chuẩn phi chức năng NFR-04:
    - Dự báo đơn lẻ (Single SKU) < 150ms.
    - Dự báo hàng loạt (Batch 100 SKUs) < 3000ms (3 giây).
    """

    def test_single_sku_latency_under_150ms(self):
        """Đo kiểm thời gian xử lý trung bình cho 1 SKU với 60 ngày lịch sử."""
        weekly_pattern = [10, 12, 11, 15, 20, 30, 35]
        history = []
        base_date = datetime.date(2026, 6, 1)

        for i in range(60):
            cur_date = base_date + datetime.timedelta(days=i)
            history.append({
                "date": cur_date.isoformat(), 
                "quantity": weekly_pattern[i % 7] + random.randint(0, 3)
            })

        payload = {
            "sku": "BENCHMARK-SKU-001",
            "horizon_days": 14,
            "sales_history": history,
        }

        # Warm-up 1 lần
        client.post("/api/v1/forecast", json=payload)

        # Chạy đo 20 lần
        latencies = []
        for _ in range(20):
            t0 = time.perf_counter()
            resp = client.post("/api/v1/forecast", json=payload)
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            assert resp.status_code == 200
            latencies.append(elapsed_ms)

        avg_latency_ms = sum(latencies) / len(latencies)
        print(f"\n[BENCHMARK] Single SKU Latency: Avg={avg_latency_ms:.2f}ms, Min={min(latencies):.2f}ms, Max={max(latencies):.2f}ms")

        # Khẳng định thỏa mãn NFR-04 (< 150ms)
        assert avg_latency_ms < 150.0, f"Single SKU trung bình ({avg_latency_ms:.2f}ms) vượt quá 150ms!"

    def test_batch_100_skus_latency_under_3000ms(self):
        """
        Đo kiểm thời gian xử lý toàn bộ danh mục 100 SKUs trong 1 request.
        Mô phỏng hỗn hợp thực tế: 10 Cold Start, 20 SMA-7, 70 AI Holt-Winters.
        """
        items = []
        base_date = datetime.date(2026, 6, 1)

        for i in range(100):
            sku_id = f"SKU-BATCH-{i:03d}"
            if i < 10:
                # 10 SKU Cold Start (5 ngày lịch sử)
                history = [
                    {"date": (base_date + datetime.timedelta(days=d)).isoformat(), "quantity": random.randint(1, 5)}
                    for d in range(5)
                ]
                items.append({
                    "sku": sku_id,
                    "horizon_days": 14,
                    "sales_history": history,
                    "expected_daily_sales": random.randint(2, 6)
                })
            elif i < 30:
                # 20 SKU Basic SMA-7 (20 ngày lịch sử)
                history = [
                    {"date": (base_date + datetime.timedelta(days=d)).isoformat(), "quantity": random.randint(5, 15)}
                    for d in range(20)
                ]
                items.append({
                    "sku": sku_id,
                    "horizon_days": 14,
                    "sales_history": history
                })
            else:
                # 70 SKU AI Ready (35 - 60 ngày lịch sử)
                n_days = 35 + (i % 25)
                history = [
                    {"date": (base_date + datetime.timedelta(days=d)).isoformat(), "quantity": (d % 7) * 3 + random.randint(5, 10)}
                    for d in range(n_days)
                ]
                items.append({
                    "sku": sku_id,
                    "horizon_days": 14,
                    "sales_history": history
                })

        batch_payload = {"items": items}

        t0 = time.perf_counter()
        resp = client.post("/api/v1/forecast/batch", json=batch_payload)
        total_time_ms = (time.perf_counter() - t0) * 1000.0

        assert resp.status_code == 200
        data = resp.json()

        assert data["totalProcessed"] == 100
        print(f"\n[BENCHMARK] Batch 100 SKUs Total Time: {total_time_ms:.2f}ms (Internal Measured: {data['executionTimeMs']}ms)")

        # Khẳng định thỏa mãn NFR-04 (< 3000ms)
        assert total_time_ms < 3000.0, f"Batch 100 SKUs ({total_time_ms:.2f}ms) vượt quá 3000ms!"


class TestEdgeCasesAndIntegrity:
    """Kiểm tra các kịch bản biên và bảo đảm tính toàn vẹn dữ liệu."""

    def test_unsorted_history_dates_automatically_sorted(self):
        """Mảng lịch sử gửi lên bị xáo trộn ngày -> Service tự động sắp xếp tăng dần."""
        shuffled_history = [
            {"date": "2026-08-05", "quantity": 15},
            {"date": "2026-08-01", "quantity": 10},
            {"date": "2026-08-03", "quantity": 12},
            {"date": "2026-08-02", "quantity": 8},
            {"date": "2026-08-04", "quantity": 14},
        ]
        payload = {
            "sku": "SHUFFLED-SKU",
            "horizon_days": 7,
            "sales_history": shuffled_history,
            "expected_daily_sales": 10,
        }
        resp = client.post("/api/v1/forecast", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        # Ngày đầu tiên của chuỗi dự báo phải bắt đầu sau ngày lớn nhất (2026-08-05) -> 2026-08-06
        assert data["points"][0]["date"] == "2026-08-06"
        assert data["points"][-1]["date"] == "2026-08-12"

    def test_all_zeros_sales_history(self):
        """Sản phẩm có chuỗi 35 ngày toàn số 0 (hàng bất động) -> Dự báo bằng 0, không lỗi."""
        base_date = datetime.date(2026, 7, 1)
        history = [
            {"date": (base_date + datetime.timedelta(days=i)).isoformat(), "quantity": 0}
            for i in range(35)
        ]
        payload = {
            "sku": "DEAD-STOCK-SKU",
            "horizon_days": 14,
            "sales_history": history,
        }
        resp = client.post("/api/v1/forecast", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["forecastedDemand"] == 0
        assert data["dailyAvgDemand"] == 0.0
        for pt in data["points"]:
            assert pt["predicted"] == 0
            assert pt["lowerBound"] == 0

    @pytest.mark.parametrize("horizon", [7, 14, 30])
    def test_supported_horizons(self, horizon):
        """Hỗ trợ đầy đủ 3 khung thời gian quy chuẩn: 7, 14, 30 ngày."""
        base_date = datetime.date(2026, 7, 1)
        history = [
            {"date": (base_date + datetime.timedelta(days=i)).isoformat(), "quantity": 10}
            for i in range(20)
        ]
        payload = {
            "sku": f"HORIZON-{horizon}",
            "horizon_days": horizon,
            "sales_history": history,
        }
        resp = client.post("/api/v1/forecast", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["horizonDays"] == horizon
        assert len(data["points"]) == horizon
