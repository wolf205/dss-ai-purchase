# Nghiệp vụ: Dữ Liệu Danh Mục Cốt Lõi (Master Data Domain)

Nhóm chức năng quản lý danh mục sản phẩm, nhà cung cấp, bảng giá SKU, nhập dữ liệu bán hàng & tồn kho ban đầu qua Excel.

---

## 1. Bản đồ Use Cases & Tài liệu Nguồn Chân lý

| Mã Use Case | Tên Chức Năng | File Đặc Tả Gốc trong `docs/` | Trạng thái Triển khai |
| :--- | :--- | :--- | :--- |
| **UC-001** | Quản lý danh mục sản phẩm (CRUD, Pack size, MOQ) | [`docs/03-use-cases/UC-001-quan-ly-danh-muc-san-pham.md`](../../docs/03-use-cases/UC-001-quan-ly-danh-muc-san-pham.md) | Baseline Spec |
| **UC-002** | Quản lý nhà cung cấp & bảng giá theo SKU | [`docs/03-use-cases/UC-002-quan-ly-danh-muc-nha-cung-cap.md`](../../docs/03-use-cases/UC-002-quan-ly-danh-muc-nha-cung-cap.md) | Baseline Spec |
| **UC-003** | Nạp dữ liệu bán hàng & tồn kho (Excel/CSV) | [`docs/03-use-cases/UC-003-nap-du-lieu-ban-hang-va-ton-kho.md`](../../docs/03-use-cases/UC-003-nap-du-lieu-ban-hang-va-ton-kho.md) | Baseline Spec |
| **UC-009** | Xem đánh giá & xếp hạng nhà cung cấp | [`docs/03-use-cases/UC-009-xem-danh-gia-va-xep-hang-nha-cung-cap.md`](../../docs/03-use-cases/UC-009-xem-danh-gia-va-xep-hang-nha-cung-cap.md) | Baseline Spec |
| **UC-017** | Cấu hình trọng số đánh giá NCC (Admin) | [`docs/03-use-cases/UC-017-cau-hinh-trong-so-danh-gia-nha-cung-cap.md`](../../docs/03-use-cases/UC-017-cau-hinh-trong-so-danh-gia-nha-cung-cap.md) | Baseline Spec |

---

## 2. Quy tắc Nghiệp vụ Cốt lõi (Business Rules)

- **`BR-008` (Thông số SKU):** Mỗi sản phẩm gắn với 1 mã SKU duy nhất, có danh mục cha, hạn sử dụng (nếu có).
- **`BR-011` / `BR-012` (Lead Time & MOQ Nhà cung cấp):** Mỗi quan hệ Nhà cung cấp - SKU có thời gian giao hàng cam kết (Lead Time ngày), số lượng đặt tối thiểu (MOQ) và giá mua.
- **`BR-016` (Đánh giá nhà cung cấp đa tiêu chí):** Điểm số tổng hợp dựa trên 3 tiêu chí: Giá ($W_{\text{price}}$), Tỷ lệ giao đúng hạn OTIF ($W_{\text{otif}}$), và Tỷ lệ chất lượng đạt chuẩn ($W_{\text{quality}}$). Tổng 3 trọng số bắt buộc bằng $1.0$ (`BR-017`).

---

## 3. Thực thể & Bảng Dữ liệu Phụ trách

- Bảng: `categories`, `products`, `suppliers`, `supplier_products`, `supplier_evaluations`, `system_configs`.
- Domain Entity: `Product`, `Supplier`, `SupplierProduct`, `Category`.
- Domain Service: `SupplierScoringService`.

---

## 4. Nguồn Cập nhật

*(Chưa có task nào cập nhật. Khởi tạo từ baseline tài liệu ban đầu).*
