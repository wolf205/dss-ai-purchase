import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.schemas import AlgorithmUsedEnum

client = TestClient(app)


class TestHealthAndRootEndpoints:
    """Kiểm tra các endpoints theo dõi sức khỏe hệ thống."""

    def test_root_endpoint(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "DSS AI Purchase" in data["service"]
        assert data["mode"] == "stateless_pure_compute"

    def test_root_health_check(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "HEALTHY"
        assert data["service"] == "dss-ai-service"
        assert data["version"] == "1.0.0"
        assert data["uptimeSeconds"] >= 0

    def test_api_v1_health_check(self):
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "HEALTHY"


class TestForecastEndpoints:
    """Kiểm tra endpoint POST /api/v1/forecast với 3 tầng dữ liệu BR-006."""

    def test_forecast_tier1_cold_start(self):
        """Tier 1: Số ngày bán < 14 -> COLD_START_ESTIMATE."""
        payload = {
            "sku": "NEW-MILK-001",
            "horizon_days": 14,
            "sales_history": [
                {"date": "2026-08-01", "quantity": 10},
                {"date": "2026-08-02", "quantity": 12},
                {"date": "2026-08-03", "quantity": 8},
            ],
            "expected_daily_sales": 10,
        }
        response = client.post("/api/v1/forecast", json=payload)
        assert response.status_code == 200
        data = response.json()

        assert data["sku"] == "NEW-MILK-001"
        assert data["horizonDays"] == 14
        assert data["forecastedDemand"] == 140  # 10 * 14
        assert data["dailyAvgDemand"] == 10.0
        assert data["wape"] is None
        assert data["mae"] is None
        assert data["algorithmUsed"] == AlgorithmUsedEnum.COLD_START_ESTIMATE
        assert data["isFallback"] is False
        assert len(data["points"]) == 14

    def test_forecast_tier2_basic_sma7(self):
        """Tier 2: 14 <= Số ngày bán < 30 -> BASIC_SMA7."""
        # Tạo chuỗi 20 ngày bán quanh mức 15
        history = [
            {"date": f"2026-08-{i:02d}", "quantity": 15 + (i % 3)}
            for i in range(1, 21)
        ]
        payload = {
            "sku": "REGULAR-MILK-180",
            "horizon_days": 7,
            "sales_history": history,
        }
        response = client.post("/api/v1/forecast", json=payload)
        assert response.status_code == 200
        data = response.json()

        assert data["sku"] == "REGULAR-MILK-180"
        assert data["horizonDays"] == 7
        assert data["algorithmUsed"] == AlgorithmUsedEnum.BASIC_SMA7
        assert data["isFallback"] is False
        assert data["wape"] is None
        assert data["mae"] is not None
        assert len(data["points"]) == 7

    def test_forecast_tier3_ai_model(self):
        """Tier 3: Số ngày bán >= 30, mẫu tuần rõ nét -> AI_MODEL (WAPE <= 40%)."""
        weekly_pattern = [10, 12, 11, 15, 20, 30, 35]
        history = []
        import datetime
        base_date = datetime.date(2026, 7, 1)

        # Tạo chuỗi 35 ngày (5 tuần)
        for i, qty in enumerate(weekly_pattern * 5):
            cur_date = base_date + datetime.timedelta(days=i)
            history.append({"date": cur_date.isoformat(), "quantity": qty})

        payload = {
            "sku": "BEER-TIG-330",
            "horizon_days": 14,
            "sales_history": history,
        }
        response = client.post("/api/v1/forecast", json=payload)
        assert response.status_code == 200
        data = response.json()

        assert data["sku"] == "BEER-TIG-330"
        assert data["horizonDays"] == 14
        assert data["algorithmUsed"] == AlgorithmUsedEnum.AI_MODEL
        assert data["isFallback"] is False
        assert data["wape"] is not None
        assert data["wape"] <= 40.0
        assert data["mae"] is not None
        assert len(data["points"]) == 14

    def test_forecast_tier3_volatile_fallback(self):
        """Tier 3: Chuỗi biến động mạnh làm WAPE > 40% -> Tự động Fallback sang SMA-7."""
        history = []
        import datetime
        base_date = datetime.date(2026, 7, 1)

        # 28 ngày đầu ổn định mức 10
        for i in range(28):
            cur_date = base_date + datetime.timedelta(days=i)
            history.append({"date": cur_date.isoformat(), "quantity": 10})

        # 7 ngày cuối tăng vọt 200
        for i in range(28, 35):
            cur_date = base_date + datetime.timedelta(days=i)
            history.append({"date": cur_date.isoformat(), "quantity": 200})

        payload = {
            "sku": "VOLATILE-SKU",
            "horizon_days": 14,
            "sales_history": history,
        }
        response = client.post("/api/v1/forecast", json=payload)
        assert response.status_code == 200
        data = response.json()

        assert data["sku"] == "VOLATILE-SKU"
        assert data["isFallback"] is True
        assert data["algorithmUsed"] == AlgorithmUsedEnum.FALLBACK_SMA7
        assert data["wape"] is not None
        assert data["wape"] > 40.0

    def test_forecast_batch(self):
        """Kiểm tra xử lý dự báo theo lô (Batch Processing)."""
        payload = {
            "items": [
                {
                    "sku": "SKU-BATCH-1",
                    "horizon_days": 7,
                    "sales_history": [
                        {"date": "2026-08-01", "quantity": 10},
                        {"date": "2026-08-02", "quantity": 12},
                    ],
                    "expected_daily_sales": 8,
                },
                {
                    "sku": "SKU-BATCH-2",
                    "horizon_days": 14,
                    "sales_history": [
                        {"date": f"2026-08-{i:02d}", "quantity": 15}
                        for i in range(1, 16)
                    ],
                },
            ]
        }
        response = client.post("/api/v1/forecast/batch", json=payload)
        assert response.status_code == 200
        data = response.json()

        assert data["totalProcessed"] == 2
        assert data["executionTimeMs"] >= 0.0
        assert len(data["results"]) == 2
        assert data["results"][0]["sku"] == "SKU-BATCH-1"
        assert data["results"][1]["sku"] == "SKU-BATCH-2"

    def test_forecast_validation_error_short_horizon(self):
        """Khung thời gian dự báo < 7 ngày bị từ chối với HTTP 422."""
        payload = {
            "sku": "INVALID-SKU",
            "horizon_days": 3,  # Invalid (< 7)
            "sales_history": [{"date": "2026-08-01", "quantity": 10}],
        }
        response = client.post("/api/v1/forecast", json=payload)
        assert response.status_code == 422

    def test_forecast_validation_error_negative_quantity(self):
        """Số lượng bán trong lịch sử âm bị từ chối với HTTP 422."""
        payload = {
            "sku": "INVALID-SKU",
            "horizon_days": 14,
            "sales_history": [{"date": "2026-08-01", "quantity": -5}],
        }
        response = client.post("/api/v1/forecast", json=payload)
        assert response.status_code == 422
