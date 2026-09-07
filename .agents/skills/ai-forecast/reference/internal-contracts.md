# AI Forecast Service — Hợp đồng Giao tiếp JSON Nội bộ

Được quy định chi tiết tại `docs/06-api-design/internal-ai-contracts.md`.

---

## 1. Endpoint Dự báo Đơn SKU: `POST /api/v1/forecast/single`

### Request Payload (Backend $\rightarrow$ AI Service):
```json
{
  "sku": "SKU-00123",
  "forecast_horizon_days": 14,
  "confidence_level": 0.95,
  "sales_history": [
    { "date": "2026-08-01", "quantity": 12 },
    { "date": "2026-08-02", "quantity": 15 },
    ...
  ]
}
```

### Response Payload (AI Service $\rightarrow$ Backend):
```json
{
  "sku": "SKU-00123",
  "model_used": "HOLT_WINTERS_ADDITIVE",
  "fallback_used": false,
  "metrics": {
    "wape": 0.124,
    "mae": 1.85
  },
  "forecasts": [
    {
      "date": "2026-09-08",
      "predicted_quantity": 14.2,
      "lower_bound": 10.1,
      "upper_bound": 18.3
    },
    ...
  ]
}
```

---

## 2. Endpoint Phân tích Ma trận 9 Ô: `POST /api/v1/analytics/abc-xyz`

### Request Payload:
```json
{
  "products": [
    {
      "sku": "SKU-00123",
      "revenue": 150000000,
      "sales_quantities_by_period": [10, 12, 11, 14, 13, 15]
    }
  ]
}
```

### Phân loại:
- **ABC (Doanh thu Pareto):** A ($\le 80\%$), B ($80\% - 95\%$), C ($> 95\%$).
- **XYZ (Độ biến động CV = $\sigma / \mu$):** X ($CV \le 0.10$), Y ($0.10 < CV \le 0.25$), Z ($CV > 0.25$).

---

## 3. Quản lý Timeout & Retry tại Backend

- Backend sử dụng `AxiosAIForecastClient` (tầng `infrastructure/external-services/`).
- **Timeout cấu hình:** 15.000 ms cho tác vụ đơn lẻ, 60.000 ms cho tác vụ batch.
- Nếu AI Service sập hoặc quá tải (500/503), Backend bắt buộc trả về thông báo lỗi thân thiện thay vì làm sập luồng nghiệp vụ.
