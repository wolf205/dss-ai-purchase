# Nghiệp vụ: Dự Báo Nhu Cầu Bán Lẻ AI (Forecast Domain)

Nhóm chức năng dự báo nhu cầu bán hàng tương lai (7, 14, 30 ngày), phân tích độ tin cậy và xử lý khởi tạo sản phẩm mới (Cold Start).

---

## 1. Bản đồ Use Cases & Tài liệu Nguồn Chân lý

| Mã Use Case | Tên Chức Năng | File Đặc Tả Gốc trong `docs/` | Trạng thái Triển khai |
| :--- | :--- | :--- | :--- |
| **UC-007** | Xem dự báo nhu cầu bán lẻ AI (7/14/30 ngày) | [`docs/03-use-cases/UC-007-xem-du-bao-nhu-cau-ban-le.md`](../../docs/03-use-cases/UC-007-xem-du-bao-nhu-cau-ban-le.md) | Baseline Spec |
| **UC-008** | Nhập lượng bán dự kiến cho SP mới (Cold Start) | [`docs/03-use-cases/UC-008-nhap-luong-ban-du-kien-cho-san-pham-moi.md`](../../docs/03-use-cases/UC-008-nhap-luong-ban-du-kien-cho-san-pham-moi.md) | Baseline Spec |

---

## 2. Quy tắc Nghiệp vụ Cốt lõi (Business Rules)

- **`BR-002` (Mô hình dự báo nhu cầu):** Holt-Winters Triple Exponential Smoothing với tính mùa vụ tuần (7 ngày) làm thuật toán chính. Tự động fallback sang SMA-7 khi chuỗi lịch sử $< 14$ ngày.
- **`BR-003` (Độ đo sai số & Khoảng tin cậy):** Đánh giá sai số bằng WAPE và MAE. Trả về dải cận trên và cận dưới với khoảng tin cậy 95%.
- **Cold Start (`UC-008`):** Sản phẩm mới chưa có lịch sử bán hàng phải cho phép người dùng/chuyên viên nhập lượng bán ước tính thủ công trước khi AI có thể tính toán dự báo.

---

## 3. Thực thể & Bảng Dữ liệu Phụ trách

- Bảng: `demand_forecasts`, `sales_orders`, `sales_order_items`.
- Giao tiếp ngoại vi: Backend gọi `ai-service` qua Port `IAIForecastClient`.

---

## 4. Nguồn Cập nhật

*(Chưa có task nào cập nhật. Khởi tạo từ baseline tài liệu ban đầu).*
