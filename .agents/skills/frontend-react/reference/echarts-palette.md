# Frontend React — Bảng Màu 5 Cấp Rủi ro Tồn kho & Apache ECharts

Quy định tại `docs/05-architecture/frontend-architecture.md`.

---

## 1. Bảng Màu Chuẩn 5 Cấp độ Rủi ro Tồn kho

| Cấp độ Rủi ro | Mã ENUM | Màu Sắc | Mã Hex | Ý nghĩa & Điều kiện Kích hoạt |
| :--- | :--- | :--- | :--- | :--- |
| **Hết hàng** | `OUT_OF_STOCK` | Đỏ đậm (Dark Red) | `#DC2626` | $\text{On-Hand} = 0$. Ưu tiên cấp cứu hàng đầu. |
| **Nguy cơ cạn kiệt** | `CRITICAL_LOW` | Đỏ cam (Red-Orange)| `#EA580C` | $\text{On-Hand} < \text{Safety Stock}$ ($SS$). Rủi ro đứt hàng cao. |
| **Dưới mức an toàn** | `LOW` | Vàng cam (Amber) | `#F59E0B` | $\text{On-Hand} < \text{Reorder Point}$ ($ROP$). Cần lập đơn mua hàng. |
| **An toàn / Tối ưu** | `NORMAL` | Xanh lá (Green) | `#10B981` | $ROP \le \text{On-Hand} \le \text{Max Stock}$. Trạng thái lý tưởng. |
| **Dư thừa / Tồn đọng** | `OVERSTOCK` | Xanh tím (Purple/Indigo)| `#6366F1` | $\text{On-Hand} > \text{Max Stock}$. Đọng vốn, rủi ro hết hạn. |

> **Quy chuẩn Tailwind CSS:** Áp dụng đồng bộ cho Badge, Border, Background nhẹ (`bg-red-50 text-red-700 border-red-200`) và Icon cảnh báo trên bảng dữ liệu.

---

## 2. Cấu hình Biểu đồ Apache ECharts

### 2.1. Ma trận 9 Ô ABC-XYZ (Heatmap / Scatter Matrix)
- Trục X: Phân loại biến động nhu cầu (X, Y, Z).
- Trục Y: Phân loại giá trị doanh thu (A, B, C).
- Mỗi ô biểu diễn số lượng SKU và tổng vốn tồn đọng.
- Ô trọng tâm cần chú ý:
  - **AX**: Doanh thu cao, ổn định $\rightarrow$ Tự động hóa mua hàng tối đa.
  - **AZ**: Doanh thu cao, biến động mạnh $\rightarrow$ Cần chuyên viên theo dõi kỹ lưỡng.
  - **CZ**: Doanh thu thấp, biến động cao $\rightarrow$ Xem xét loại bỏ khỏi danh mục.

### 2.2. Biểu đồ Dự báo Nhu cầu có Dải Mây Tin cậy 95%
- Kết hợp 3 đường trên cùng 1 trục thời gian:
  1. Đường nét đứt xanh dương: Giá trị dự báo trung tâm (`predicted_quantity`).
  2. Vùng dải mây bán trong suốt (Area opacity 0.2): Giới hạn giữa `lower_bound` và `upper_bound`.
  3. Đường liền nét xám: Lịch sử bán hàng thực tế (`actual_sales`).
