import pytest
from datetime import date
from pydantic import ValidationError

from app.models.schemas import (
    AlgorithmUsedEnum,
    DailySalesRecord,
    ForecastRequest,
    ForecastBatchRequest,
    ForecastPoint,
    ForecastResponse,
    ForecastBatchResponse,
    HealthResponse,
)
from app.core.config import settings


class TestSettings:
    """Kiểm tra cấu hình app/core/config.py."""

    def test_default_settings(self):
        assert settings.PROJECT_NAME == "DSS AI Purchase - AI Forecasting Service"
        assert settings.VERSION == "1.0.0"
        assert settings.API_V1_STR == "/api/v1"
        assert settings.PORT == 8000
        assert settings.WAPE_FALLBACK_THRESHOLD == 40.0
        assert settings.MIN_DAYS_FOR_SMA7 == 14
        assert settings.MIN_DAYS_FOR_AI == 30
        assert settings.DEFAULT_HORIZON_DAYS == 14


class TestDailySalesRecord:
    """Kiểm tra validation cho DailySalesRecord."""

    def test_valid_record(self):
        record = DailySalesRecord(date="2026-08-01", quantity=15)
        assert record.date == date(2026, 8, 1)
        assert record.quantity == 15

    def test_zero_quantity_allowed(self):
        record = DailySalesRecord(date="2026-08-01", quantity=0)
        assert record.quantity == 0

    def test_negative_quantity_rejected(self):
        with pytest.raises(ValidationError):
            DailySalesRecord(date="2026-08-01", quantity=-1)


class TestForecastRequest:
    """Kiểm tra validation cho ForecastRequest hỗ trợ cả snake_case và camelCase."""

    def test_valid_request_snake_case(self):
        payload = {
            "sku": "MILK-VNM-180",
            "horizon_days": 14,
            "sales_history": [
                {"date": "2026-08-01", "quantity": 10},
                {"date": "2026-08-02", "quantity": 12},
            ],
            "expected_daily_sales": 5,
        }
        req = ForecastRequest(**payload)
        assert req.sku == "MILK-VNM-180"
        assert req.horizon_days == 14
        assert len(req.sales_history) == 2
        assert req.expected_daily_sales == 5

    def test_valid_request_camel_case(self):
        """Node.js Core Backend gửi payload định dạng camelCase."""
        payload = {
            "sku": "MILK-VNM-180",
            "horizonDays": 7,
            "salesHistory": [
                {"date": "2026-08-01", "quantity": 8},
            ],
            "expectedDailySales": 3,
        }
        req = ForecastRequest(**payload)
        assert req.sku == "MILK-VNM-180"
        assert req.horizon_days == 7
        assert req.expected_daily_sales == 3

    def test_invalid_horizon_too_short(self):
        with pytest.raises(ValidationError):
            ForecastRequest(
                sku="TEST-SKU",
                horizon_days=5,  # ge=7
                sales_history=[{"date": "2026-08-01", "quantity": 10}],
            )

    def test_invalid_horizon_too_long(self):
        with pytest.raises(ValidationError):
            ForecastRequest(
                sku="TEST-SKU",
                horizon_days=45,  # le=30
                sales_history=[{"date": "2026-08-01", "quantity": 10}],
            )

    def test_empty_sku_rejected(self):
        with pytest.raises(ValidationError):
            ForecastRequest(
                sku="",
                horizon_days=14,
                sales_history=[{"date": "2026-08-01", "quantity": 10}],
            )


class TestForecastPointAndResponse:
    """Kiểm tra validation và serialization cho ForecastPoint và ForecastResponse."""

    def test_valid_point(self):
        point = ForecastPoint(
            date="2026-09-05",
            predicted=5,
            lower_bound=3,
            upper_bound=7,
        )
        assert point.predicted == 5
        assert point.lower_bound == 3
        assert point.upper_bound == 7

    def test_negative_point_rejected(self):
        with pytest.raises(ValidationError):
            ForecastPoint(
                date="2026-09-05",
                predicted=-1,
                lower_bound=0,
                upper_bound=5,
            )

    def test_valid_response_ai_model(self):
        response_data = {
            "sku": "MILK-VNM-180",
            "horizon_days": 14,
            "forecasted_demand": 72,
            "daily_avg_demand": 5.14,
            "wape": 14.25,
            "mae": 1.18,
            "algorithm_used": AlgorithmUsedEnum.AI_MODEL,
            "is_fallback": False,
            "points": [
                {
                    "date": "2026-09-05",
                    "predicted": 5,
                    "lower_bound": 3,
                    "upper_bound": 7,
                }
            ],
        }
        res = ForecastResponse(**response_data)
        assert res.sku == "MILK-VNM-180"
        assert res.algorithm_used == AlgorithmUsedEnum.AI_MODEL
        assert res.is_fallback is False
        assert res.wape == 14.25
        assert res.mae == 1.18

        # Kiểm tra serialize ra dict theo alias (camelCase)
        dict_camel = res.model_dump(by_alias=True)
        assert dict_camel["forecastedDemand"] == 72
        assert dict_camel["dailyAvgDemand"] == 5.14
        assert dict_camel["algorithmUsed"] == "AI_MODEL"
        assert dict_camel["isFallback"] is False

    def test_valid_response_cold_start_null_metrics(self):
        """Sản phẩm Cold Start có wape và mae là None."""
        response_data = {
            "sku": "NEW-SKU-001",
            "horizon_days": 14,
            "forecasted_demand": 14,
            "daily_avg_demand": 1.0,
            "wape": None,
            "mae": None,
            "algorithm_used": AlgorithmUsedEnum.COLD_START_ESTIMATE,
            "is_fallback": False,
            "points": [],
        }
        res = ForecastResponse(**response_data)
        assert res.wape is None
        assert res.mae is None
        assert res.algorithm_used == AlgorithmUsedEnum.COLD_START_ESTIMATE

    def test_valid_response_fallback_sma7(self):
        """Sản phẩm bị Fallback do WAPE > 40%."""
        response_data = {
            "sku": "VOLATILE-SKU",
            "horizon_days": 14,
            "forecasted_demand": 120,
            "daily_avg_demand": 8.57,
            "wape": 52.3,
            "mae": 4.1,
            "algorithm_used": AlgorithmUsedEnum.FALLBACK_SMA7,
            "is_fallback": True,
            "points": [],
        }
        res = ForecastResponse(**response_data)
        assert res.is_fallback is True
        assert res.algorithm_used == AlgorithmUsedEnum.FALLBACK_SMA7
        assert res.wape == 52.3


class TestBatchAndHealth:
    """Kiểm tra ForecastBatchRequest/Response và HealthResponse."""

    def test_batch_request(self):
        req = ForecastBatchRequest(
            items=[
                {
                    "sku": "SKU-1",
                    "horizon_days": 14,
                    "sales_history": [{"date": "2026-08-01", "quantity": 10}],
                },
                {
                    "sku": "SKU-2",
                    "horizon_days": 7,
                    "sales_history": [{"date": "2026-08-01", "quantity": 20}],
                },
            ]
        )
        assert len(req.items) == 2

    def test_batch_response(self):
        res = ForecastBatchResponse(
            total_processed=2,
            execution_time_ms=45.2,
            results=[],
        )
        assert res.total_processed == 2
        assert res.execution_time_ms == 45.2

        dict_camel = res.model_dump(by_alias=True)
        assert dict_camel["totalProcessed"] == 2
        assert dict_camel["executionTimeMs"] == 45.2

    def test_health_response(self):
        health = HealthResponse(
            status="HEALTHY",
            service="dss-ai-service",
            version="1.0.0",
            uptime_seconds=120.5,
        )
        assert health.status == "HEALTHY"
        assert health.uptime_seconds == 120.5

        dict_camel = health.model_dump(by_alias=True)
        assert dict_camel["uptimeSeconds"] == 120.5


class TestSchemaEdgeCases:
    """Kiểm tra các kịch bản biên và ngoại lệ."""

    def test_cold_start_empty_sales_history_allowed(self):
        """Sản phẩm Cold Start vừa tạo có thể có mảng sales_history rỗng."""
        req = ForecastRequest(
            sku="COLD-START-SKU",
            horizon_days=14,
            expected_daily_sales=5,
        )
        assert req.sku == "COLD-START-SKU"
        assert req.sales_history == []
        assert req.expected_daily_sales == 5

    def test_invalid_algorithm_enum_rejected(self):
        """Không cho phép enum thuật toán không nằm trong danh mục định nghĩa."""
        with pytest.raises(ValidationError):
            ForecastResponse(
                sku="SKU-TEST",
                horizon_days=14,
                forecasted_demand=50,
                daily_avg_demand=3.5,
                algorithm_used="UNSUPPORTED_AI",  # Invalid enum
                is_fallback=False,
            )

    def test_negative_forecasted_demand_rejected(self):
        """Tổng cầu dự báo không được là số âm."""
        with pytest.raises(ValidationError):
            ForecastResponse(
                sku="SKU-TEST",
                horizon_days=14,
                forecasted_demand=-10,
                daily_avg_demand=3.5,
                algorithm_used=AlgorithmUsedEnum.AI_MODEL,
                is_fallback=False,
            )

