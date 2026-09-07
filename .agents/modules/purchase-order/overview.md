# Nghiệp vụ: Đơn Mua Hàng & Khuyến Nghị DSS (Purchase Order Domain)

Nhóm chức năng tạo khuyến nghị mua hàng thông minh, lập đơn mua (PO), quản lý vòng đời đơn và ghi nhận nhận hàng nguyên tử.

---

## 1. Bản đồ Use Cases & Tài liệu Nguồn Chân lý

| Mã Use Case | Tên Chức Năng | File Đặc Tả Gốc trong `docs/` | Trạng thái Triển khai |
| :--- | :--- | :--- | :--- |
| **UC-010** | Xem khuyến nghị mua hàng thông minh (Explainable) | [`docs/03-use-cases/UC-010-xem-khuyen-nghi-mua-hang-thong-minh.md`](../../docs/03-use-cases/UC-010-xem-khuyen-nghi-mua-hang-thong-minh.md) | Baseline Spec |
| **UC-011** | Chạy lại phân tích & cập nhật DSS on-demand | [`docs/03-use-cases/UC-011-chay-lai-phan-tich-va-cap-nhat-khuyen-nghi.md`](../../docs/03-use-cases/UC-011-chay-lai-phan-tich-va-cap-nhat-khuyen-nghi.md) | Baseline Spec |
| **UC-012** | Lập và xác nhận đơn mua hàng (PO) | [`docs/03-use-cases/UC-012-lap-va-xac-nhan-don-mua-hang.md`](../../docs/03-use-cases/UC-012-lap-va-xac-nhan-don-mua-hang.md) | Baseline Spec |
| **UC-013** | Quản lý & tra cứu lịch sử đơn mua hàng / Hủy đơn | [`docs/03-use-cases/UC-013-quan-ly-va-tra-cuu-lich-su-don-mua-hang.md`](../../docs/03-use-cases/UC-013-quan-ly-va-tra-cuu-lich-su-don-mua-hang.md) | Baseline Spec |
| **UC-014** | Ghi nhận nhận hàng & Cập nhật tồn kho nguyên tử | [`docs/03-use-cases/UC-014-ghi-nhan-nhan-hang-va-cap-nhat-ton-kho.md`](../../docs/03-use-cases/UC-014-ghi-nhan-nhan-hang-va-cap-nhat-ton-kho.md) | Baseline Spec |

---

## 2. Quy tắc Nghiệp vụ Cốt lõi (Business Rules)

- **`BR-009` (Số lượng đề xuất mua tối ưu):** $Q_{\text{suggest}} = \max(0, \text{Max Stock} - IP)$.
- **`BR-010` (Quy chuẩn làm tròn đơn hàng):** Số lượng mua thực tế phải làm tròn lên theo MOQ (Minimum Order Quantity) và bội số của Pack Size.
- **`BR-018` (Giao dịch nguyên tử):** Tác vụ nhận hàng/hủy đơn bắt buộc bọc trong transaction ACID.
- **`BR-024` (Định dạng mã PO):** Bắt buộc theo mẫu `PO-YYYYMMDD-XXXX` (ví dụ `PO-20260904-0001`).
- **`BR-025` (Máy trạng thái đơn hàng):**
  - `DRAFT` $\longrightarrow$ `ORDERED` $\longrightarrow$ `RECEIVED`.
  - Hủy đơn: Chỉ cho phép hủy khi ở trạng thái `DRAFT` hoặc `ORDERED`. Khi đã `RECEIVED` tuyệt đối cấm chuyển về `CANCELLED`.

---

## 3. Thực thể & Bảng Dữ liệu Phụ trách

- Bảng: `purchase_orders`, `purchase_order_items`, `goods_receipts`, `goods_receipt_items`, `dss_recommendations`.
- Domain Entity: `PurchaseOrder`, `PurchaseOrderItem`, `GoodsReceipt`.
- Domain Service: `OrderRoundingService`, `PurchaseOrderStateMachine`.

---

## 4. Nguồn Cập nhật

*(Chưa có task nào cập nhật. Khởi tạo từ baseline tài liệu ban đầu).*
