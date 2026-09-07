---
name: ai-forecast
description: Kiến trúc dịch vụ AI dự báo (Python FastAPI), mô hình tính toán thuần túy Stateless Pure Compute Engine, thuật toán Holt-Winters, cơ chế Fallback SMA-7, tính toán WAPE/MAE, dải mây tin cậy 95%, và hợp đồng giao tiếp JSON nội bộ với Backend. Sử dụng khi làm việc với thư mục ai-service/, sửa thuật toán dự báo, hoặc tinh chỉnh client gọi AI từ Backend.
user-invocable: false
---

# AI Forecast Service — Mục lục `.agents/skills/ai-forecast/`

- [`stateless-engine.md`](reference/stateless-engine.md) — Nguyên tắc Stateless Pure Compute Engine, cấm kết nối CSDL trực tiếp, thuật toán Holt-Winters Triple Exponential Smoothing, cơ chế Fallback SMA-7, và xử lý Cold Start sản phẩm mới (`UC-008`). **Đọc khi**: sửa đổi logic tính toán toán học hoặc thuật toán AI trong `ai-service/`.
- [`internal-contracts.md`](reference/internal-contracts.md) — Đặc tả Payload JSON giao tiếp nội bộ giữa Backend và AI Service (`docs/06-api-design/internal-ai-contracts.md`), xử lý timeout, retry và format trả về dải tin cậy 95%. **Đọc khi**: viết client `AxiosAIForecastClient` hoặc chỉnh sửa endpoint FastAPI.
