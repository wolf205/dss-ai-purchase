# Internal AI Contracts: Hợp Đồng Giao Tiếp Giữa Backend & AI Service

---

## 1. Bối Cảnh Kiến Trúc & Ranh Giới Giao Tiếp

Hệ thống phân tách rạch ròi giữa **Core Backend (Node.js)** và **AI Service (Python FastAPI)**:
* **Môi trường kết nối:** Mạng nội bộ riêng ảo trong Docker (`dss-network`) hoặc `localhost:8000` khi chạy kiểm thử cục bộ.
* **Giao thức:** **HTTP/1.1 REST JSON** đồng bộ (Synchronous).
* **Đặc tính:** **Không trạng thái (Stateless)** — Node.js làm chủ hoàn toàn CSDL PostgreSQL, truy vấn dữ liệu chuỗi thời gian, gửi sang Python, nhận kết quả dự báo và tự lưu vào bảng `demand_forecasts`.

```
┌─────────────────────────┐                                 ┌─────────────────────────┐
│                         │   POST /api/v1/forecast (JSON)  │                         │
│   Node.js Core Backend  │ ──────────────────────────────> │    Python AI Service    │
│   (Clean Architecture)  │                                 │    (FastAPI Stateless)  │
│                         │ <────────────────────────────── │                         │
│                         │   ForecastResponse (JSON)       │                         │
└─────────────────────────┘                                 └─────────────────────────┘
```

---

## 2. Đặc Tả Endpoint Dự Báo: `POST /api/v1/forecast`

### 2.1. Request Contract

* **URL:** `http://ai-service:8000/api/v1/forecast`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`

#### Cấu Trúc Request Body (TypeScript Interface & Python Pydantic):

```typescript
// Định nghĩa DTO phía Backend (TypeScript)
export interface DailySalesHistoryItem {
  date: string;       // Định dạng YYYY-MM-DD
  quantity: number;   // Số lượng bán (>= 0)
}

export interface ForecastRequestPayload {
  sku: string;
  horizonDays: 7 | 14 | 30;
  salesHistory: DailySalesHistoryItem[];
  expectedDailySales?: number; // Dùng cho sản phẩm Cold Start (< 14 ngày)
}
```

```python
# Định nghĩa Schema phía AI Service (Python Pydantic)
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date

class DailySalesRecord(BaseModel):
    date: date
    quantity: int = Field(ge=0, description="Lượng bán ngày")

class ForecastRequest(BaseModel):
    sku: str
    horizon_days: int = Field(14, ge=7, le=30)
    sales_history: List[DailySalesRecord]
    expected_daily_sales: Optional[int] = None
```

#### JSON Payload Mẫu (Request):
```json
{
  "sku": "MILK-VNM-180",
  "horizon_days": 14,
  "sales_history": [
    { "date": "2026-08-01", "quantity": 12 },
    { "date": "2026-08-02", "quantity": 15 },
    { "date": "2026-08-03", "quantity": 8 },
    { "date": "2026-08-30", "quantity": 14 }
  ],
  "expected_daily_sales": null
}
```

---

### 2.2. Response Contract

#### Cấu Trúc Response Body:

```typescript
// Định nghĩa Response DTO phía Backend (TypeScript)
export interface ForecastPointDTO {
  date: string;         // YYYY-MM-DD
  predicted: number;    // Lượng bán dự báo làm tròn số nguyên (>= 0)
  lowerBound: number;   // Cận dưới dải tin cậy: max(0, ceil(predicted - 1.65 * MAE))
  upperBound: number;   // Cận trên dải tin cậy: ceil(predicted + 1.65 * MAE)
}

export interface ForecastResponsePayload {
  sku: string;
  horizonDays: number;
  forecastedDemand: number; // Tổng cầu dự báo chu kỳ: ceil(sum(max(0, predicted)))
  dailyAvgDemand: number;   // Nhu cầu trung bình ngày D_avg
  wape: number | null;      // Sai số WAPE (%)
  mae: number | null;       // Sai số tuyệt đối MAE
  algorithmUsed: 'AI_MODEL' | 'FALLBACK_SMA7' | 'BASIC_SMA7' | 'COLD_START_ESTIMATE';
  isFallback: boolean;
  points: ForecastPointDTO[];
}
```

#### JSON Payload Mẫu (Response Thành Công 200 OK):
```json
{
  "sku": "MILK-VNM-180",
  "horizon_days": 14,
  "forecasted_demand": 72,
  "daily_avg_demand": 5.14,
  "wape": 14.25,
  "mae": 1.18,
  "algorithm_used": "AI_MODEL",
  "is_fallback": false,
  "points": [
    {
      "date": "2026-09-05",
      "predicted": 5,
      "lower_bound": 3,
      "upper_bound": 7
    },
    {
      "date": "2026-09-06",
      "predicted": 6,
      "lower_bound": 4,
      "upper_bound": 8
    }
  ]
}
```

---

## 3. Đặc Tả Endpoint Hàng Loạt: `POST /api/v1/forecast/batch`

Để tối ưu hóa thời gian chạy phân tích toàn bộ danh mục cửa hàng ($< 1.000$ SKU) dưới 5 giây theo yêu cầu `NFR-002`, AI Service hỗ trợ endpoint xử lý theo lô (Batch Processing):

* **URL:** `http://ai-service:8000/api/v1/forecast/batch`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "items": [
      {
        "sku": "MILK-VNM-180",
        "horizon_days": 14,
        "sales_history": [...]
      },
      {
        "sku": "BEER-TIG-330",
        "horizon_days": 14,
        "sales_history": [...]
      }
    ]
  }
  ```
* **Response Body (`200 OK`):**
  ```json
  {
    "totalProcessed": 2,
    "executionTimeMs": 45,
    "results": [
      {
        "sku": "MILK-VNM-180",
        "forecasted_demand": 72,
        "daily_avg_demand": 5.14,
        "algorithm_used": "AI_MODEL",
        "is_fallback": false,
        "points": [...]
      },
      {
        "sku": "BEER-TIG-330",
        "forecasted_demand": 140,
        "daily_avg_demand": 10.0,
        "algorithm_used": "AI_MODEL",
        "is_fallback": false,
        "points": [...]
      }
    ]
  }
  ```

---

## 4. Đặc Tả Endpoint Kiểm Tra Sức Khỏe: `GET /health`

Phục vụ cơ chế Docker Healthcheck nhằm bảo đảm Backend chỉ khởi động khi AI Service đã sẵn sàng:

* **URL:** `http://ai-service:8000/health`
* **Method:** `GET`
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "HEALTHY",
    "service": "dss-ai-service",
    "version": "1.0.0",
    "uptimeSeconds": 1420
  }
  ```

---

## 5. Chính Sách Xử Lý Lỗi & Khả Năng Chống Chịu Lỗi (Fault-Tolerance & Graceful Degradation)

Nhằm đảm bảo hệ thống DSS không bao giờ bị tê liệt khi dịch vụ AI gặp sự cố mạng hoặc quá tải:

1. **Chính sách Timeout (HTTP Timeout Policy):**
   * Backend Node.js thiết lập `timeout: 4000` ($4\text{ giây}$). Nếu quá 4 giây AI Service chưa phản hồi, Axios sẽ tự động hủy kết nối.
2. **Cơ chế Dự phòng Cục bộ (Local Fallback in Node.js):**
   * Nếu AI Service bị sập (Connection Refused hoặc 500):
     * Backend Node.js **không ném lỗi 500 ra giao diện người dùng**.
     * Thay vào đó, Backend tự động kích hoạt hàm dự phòng tính toán **Trung bình trượt 7 ngày (SMA-7)** viết bằng TypeScript ngay tại Node.js.
     * Lưu kết quả với cờ `algorithm_used = 'FALLBACK_SMA7'` và `is_fallback = true`.
     * Toàn bộ quy trình sinh khuyến nghị mua hàng (`UC-010`) vẫn hoàn tất trơn tru, kèm thông báo cảnh báo nhẹ: *"Dịch vụ AI đang bận, hệ thống đã chuyển sang chế độ dự báo an toàn SMA-7"*.

---

## 6. Kết Luận

Hợp đồng giao tiếp nội bộ này tạo ra một ranh giới kỹ thuật vững chắc giữa **Backend Node.js** và **AI Service Python**. Việc chuẩn hóa dữ liệu đầu vào / đầu ra dưới dạng Pydantic/TypeScript Schemas và thiết lập cơ chế Graceful Degradation đảm bảo hệ thống vận hành bền bỉ, an toàn và đạt hiệu năng tối đa.
