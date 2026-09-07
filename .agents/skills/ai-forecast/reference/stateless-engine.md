# AI Forecast Service — Stateless Pure Compute Engine & Thuật toán

## 1. Nguyên tắc Stateless Bất biến

1. **Tuyệt đối không kết nối Database:**
   - Dịch vụ AI (Python FastAPI) đóng vai trò là một **Máy tính toán số học thuần túy (Stateless Pure Compute Engine)**.
   - Không chứa bất kỳ thư viện ORM hay DB driver nào (`asyncpg`, `psycopg2`, `SQLAlchemy`).
   - Mọi dữ liệu lịch sử bán hàng và thông số SKU phải được Backend đóng gói vào HTTP Request body và truyền sang.
2. **Không lưu trữ phiên làm việc hoặc Cache cục bộ trên đĩa:**
   - Mỗi request được xử lý độc lập, kết quả tính toán trả ngay về cho Backend lưu vào PostgreSQL (`demand_forecasts`).

---

## 2. Thuật toán Dự báo Nhu cầu Bán lẻ

### 2.1. Holt-Winters Triple Exponential Smoothing (Mô hình chính)
- Sử dụng thư viện `statsmodels.tsa.holtwinters.ExponentialSmoothing`.
- **Cấu hình chuẩn:**
  - Trend: `add` (Cộng dồn).
  - Seasonal: `add` (Cộng dồn) với chu kỳ mùa vụ tuần $s = 7$ ngày (`seasonal_periods=7`).
  - Damped Trend: `True` (ngăn chặn dự báo tăng vọt phi thực tế ở tương lai xa).

### 2.2. Cơ chế Fallback SMA-7 (Simple Moving Average 7 ngày)
- **Điều kiện kích hoạt Fallback:**
  - Chuỗi dữ liệu lịch sử bán hàng ít hơn 14 ngày (không đủ 2 chu kỳ tuần).
  - Thuật toán Holt-Winters không hội tụ (`ConvergenceWarning` hoặc exception toán học).
- **Hành vi:**
  - Tự động chuyển sang tính giá trị trung bình trượt 7 ngày gần nhất (SMA-7).
  - Bắt buộc trả về cờ đánh dấu trong response: `"fallback_used": true`, `"fallback_reason": "INSUFFICIENT_HISTORY_FOR_SEASONALITY"`.

---

## 3. Độ đo Sai số & Dải Tin cậy 95%

1. **Độ đo WAPE (Weighted Absolute Percentage Error):**
   $$\text{WAPE} = \frac{\sum |y_t - \hat{y}_t|}{\sum y_t}$$
   - Tránh lỗi chia cho 0 khi ngày bán lẻ có lượng bán $y_t = 0$ (khác với MAPE bị vô định).
2. **Dải Tin cậy 95% (Prediction Confidence Interval):**
   - Trả về 3 giá trị cho mỗi ngày dự báo:
     - `predicted_quantity`: Giá trị kỳ vọng.
     - `lower_bound_95`: Cận dưới khoảng tin cậy 95% (chặn dưới $\ge 0$).
     - `upper_bound_95`: Cận trên khoảng tin cậy 95% (phục vụ biểu diễn dải mây dự báo trên giao diện).
