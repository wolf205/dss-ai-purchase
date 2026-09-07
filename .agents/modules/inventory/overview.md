# Nghiệp vụ: Quản lý Tồn kho & Cảnh báo Rủi ro (Inventory Domain)

Nhóm chức năng theo dõi trạng thái hàng hóa, cảnh báo 5 cấp độ rủi ro tồn kho, và phân tích ma trận 9 ô ABC-XYZ.

---

## 1. Bản đồ Use Cases & Tài liệu Nguồn Chân lý

| Mã Use Case | Tên Chức Năng | File Đặc Tả Gốc trong `docs/` | Trạng thái Triển khai |
| :--- | :--- | :--- | :--- |
| **UC-004** | Theo dõi tồn kho & cảnh báo 5 cấp rủi ro | [`docs/03-use-cases/UC-004-theo-doi-ton-kho-va-canh-bao-rui-ro.md`](../../docs/03-use-cases/UC-004-theo-doi-ton-kho-va-canh-bao-rui-ro.md) | Baseline Spec |
| **UC-005** | Xem phân tích ma trận 9 ô ABC - XYZ | [`docs/03-use-cases/UC-005-xem-phan-tich-ma-tran-abc-xyz.md`](../../docs/03-use-cases/UC-005-xem-phan-tich-ma-tran-abc-xyz.md) | Baseline Spec |
| **UC-006** | Xem chi tiết phân tích sản phẩm 360° | [`docs/03-use-cases/UC-006-xem-chi-tiet-phan-tich-san-pham.md`](../../docs/03-use-cases/UC-006-xem-chi-tiet-phan-tich-san-pham.md) | Baseline Spec |

---

## 2. Quy tắc Nghiệp vụ Cốt lõi (Business Rules)

- **`BR-001` (Vị trí tồn kho):** $IP = \text{On-Hand} + \text{On-Order}$.
- **`BR-004` (Tồn kho an toàn Safety Stock):** $SS = Z \times \sigma_L \times \sqrt{L}$. Với cửa hàng bán lẻ quy mô nhỏ, $Z = 1.65$ (mức phục vụ 95%).
- **`BR-005` (Điểm đặt hàng lại Reorder Point):** $ROP = (\bar{d} \times L) + SS$.
- **`BR-006` (Tồn kho tối đa Max Stock):** $\text{Max Stock} = ROP + \text{EOQ}$.
- **`BR-007` (5 Cấp độ rủi ro):** `OUT_OF_STOCK` ($\text{On-Hand} = 0$), `CRITICAL_LOW` ($\text{On-Hand} < SS$), `LOW` ($\text{On-Hand} < ROP$), `NORMAL` ($ROP \le \text{On-Hand} \le \text{Max Stock}$), `OVERSTOCK` ($\text{On-Hand} > \text{Max Stock}$).

---

## 3. Thực thể & Bảng Dữ liệu Phụ trách

- Bảng: `inventories`, `inventory_transactions`, `daily_inventory_snapshots`, `abc_xyz_classifications`.
- Domain Entity: `Inventory`, `InventoryTransaction`.
- Domain Service: `InventoryCalculator`, `ABCXYZClassifier`.

---

## 4. Nguồn Cập nhật

*(Chưa có task nào cập nhật. Khởi tạo từ baseline tài liệu ban đầu).*
