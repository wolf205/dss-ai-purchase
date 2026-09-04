# Use Case Specification: UC-004 - Theo Dõi Tồn Kho & Cảnh Báo Rủi Ro

---

## 1. Basic Information

* **Use Case ID:** `UC-004`
* **Use Case Name:** Theo dõi tồn kho & cảnh báo rủi ro (Inventory Tracking & Risk Monitoring)
* **Primary Actor:** `Purchasing Staff`
* **Supporting Actor:** `System Admin` (Truy cập xem và giám sát - Read-only)
* **Goal:** Người dùng muốn theo dõi bức tranh toàn cảnh về tình hình tồn kho khả dụng của toàn bộ danh mục sản phẩm theo thời gian thực, tự động tính toán các chỉ số an toàn ($\text{SS}, \text{ROP}, \text{DoS}$), phân loại và lọc nhanh các sản phẩm rơi vào 5 cấp độ rủi ro (`OUT_OF_STOCK`, `CRITICAL`, `WARNING`, `NORMAL`, `OVERSTOCK`) và phát hiện hàng tồn bất động (`DEAD_STOCK`) để kịp thời đưa ra quyết định xử lý.
* **Trigger:** Người dùng truy cập màn hình "Dashboard Tồn kho" từ thanh điều hướng chính của hệ thống.

---

## 2. Preconditions

1. Người dùng (`Purchasing Staff` hoặc `System Admin`) đã đăng nhập thành công vào hệ thống.
2. Danh mục sản phẩm (`UC-001`) đã tồn tại trên hệ thống và có ít nhất 1 sản phẩm đang hoạt động (`IsActive = true`).
3. Hệ thống đã có dữ liệu tồn kho thực tế ($\text{On-Hand}$) và lịch sử bán hàng được nạp từ `UC-003`.

---

## 3. Postconditions

### 3.1. Thành công (Success End Condition):
* Hệ thống tính toán thời gian thực (Real-time) và trực quan hóa:
  * Thống kê tổng quan (KPI Cards): Tổng số SKU, Số lượng SKU Hết hàng (`OUT_OF_STOCK`), Nguy cấp (`CRITICAL`), Cần đặt hàng (`WARNING`), An toàn (`NORMAL`), Tồn đọng vốn (`OVERSTOCK`) và Hàng bất động (`DEAD_STOCK`).
  * Biểu đồ phân bổ tỷ lệ rủi ro tồn kho toàn cửa hàng.
  * Bảng danh sách chi tiết từng sản phẩm được sắp xếp mặc định theo độ nghiêm trọng rủi ro giảm dần, hiển thị đầy đủ: $\text{On-Hand}, \text{On-Order}, \text{Inventory Position (IP)}, \text{Safety Stock (SS)}, \text{Reorder Point (ROP)}, \text{Days of Supply (DoS)}$, Thanh đo mức tồn kho trực quan (Segmented Visual Gauge) và Nút hành động nhanh "Đặt hàng ngay".
* Người dùng lọc và tìm kiếm danh sách sản phẩm theo từng nhóm rủi ro để đưa ra hành động kịp thời.

### 3.2. Thất bại (Failure End Condition):
* Không thể tải dữ liệu tồn kho do lỗi kết nối cơ sở dữ liệu; hệ thống hiển thị thông báo lỗi và nút "Thử lại".

---

## 4. Main Success Flow (Xem Dashboard tồn kho & cảnh báo)

| Step | Actor (Purchasing Staff / Admin) | System |
| :---: | :--- | :--- |
| **1** | Truy cập màn hình "Dashboard Tồn kho & Cảnh báo rủi ro". | Truy vấn dữ liệu tồn kho $\text{On-Hand}$, các đơn hàng đang chờ giao $\text{On-Order}$, và nhu cầu dự báo $D_{avg}$ của tất cả sản phẩm đang hoạt động (`IsActive = true`). |
| **2** | | Áp dụng các quy tắc tính toán thời gian thực cho từng SKU:<br>1. $\text{Inventory Position (IP)} = \text{On-Hand} + \text{On-Order}$ (`BR-001`).<br>2. Tính $\text{SS}_{final} = \max(\lceil 1.65 \times \sigma_d \times \sqrt{L} \rceil, \text{Min Safety Stock})$ (`BR-003`).<br>3. Tính $\text{ROP} = \lceil D_{avg} \times L + \text{SS}_{final} \rceil$ và $\text{Max Stock} = \text{ROP} + \lceil D_{avg} \times 30 \rceil$ (`BR-004`).<br>4. Tính $\text{Days of Supply (DoS)} = \text{On-Hand} / D_{avg}$ (`BR-005`).<br>5. Đánh giá và gán 1 trong 5 cấp độ rủi ro tồn kho (`BR-002`) và kiểm tra cờ `DEAD_STOCK` (`BR-023`).<br>6. Sắp xếp danh sách mặc định theo mức độ nghiêm trọng: `OUT_OF_STOCK` $\rightarrow$ `CRITICAL` $\rightarrow$ `WARNING` $\rightarrow$ `OVERSTOCK` $\rightarrow$ `NORMAL`. |
| **3** | | Hiển thị giao diện Dashboard gồm 3 khu vực chính:<br>- **Khu vực 1 (KPI Cards):** Các thẻ đếm tổng số SKU theo từng mức rủi ro (kèm màu sắc: Đỏ đậm, Đỏ cam, Vàng, Xanh lá, Tím).<br>- **Khu vực 2 (Biểu đồ phân bổ):** Biểu đồ tròn/cột trực quan hóa tỷ lệ an toàn vs rủi ro toàn cửa hàng.<br>- **Khu vực 3 (Bảng dữ liệu SKU):** Bảng danh sách phân trang hiển thị: Mã SKU, Tên sản phẩm, Ngành hàng, $\text{On-Hand}, \text{On-Order}, \text{IP}, \text{SS}, \text{ROP}, \text{DoS}$, Thanh đo mức tồn kho trực quan (Segmented Color Bar: Vùng Đỏ/Vàng/Xanh/Tím), Nhãn trạng thái rủi ro và Nút hành động "Đặt hàng ngay". |
| **4** | Xem thông tin tổng quan và bảng dữ liệu. | |

---

## 5. Alternative Flows

### A1. Lọc nhanh danh sách sản phẩm theo Cấp độ rủi ro
* **A1.1.** Người dùng click vào một trong các thẻ KPI (ví dụ: click vào thẻ **"Nguy cấp - CRITICAL (12 SKU)"** hoặc **"Hết hàng - OUT OF STOCK (3 SKU)"**).
* **A1.2.** Hệ thống tự động áp dụng bộ lọc và chỉ hiển thị danh sách các sản phẩm thuộc cấp độ rủi ro đã chọn tại bảng dữ liệu.
* **A1.3.** Người dùng có thể click nút "Xóa bộ lọc" để quay lại xem toàn bộ danh mục.

### A2. Tìm kiếm và lọc nâng cao
* **A2.1.** Người dùng nhập từ khóa tìm kiếm (Mã SKU hoặc Tên sản phẩm) hoặc chọn lọc theo Ngành hàng / Trạng thái hàng bất động (`DEAD_STOCK`).
* **A2.2.** Hệ thống lọc tức thời và cập nhật lại bảng danh sách sản phẩm.

### A3. Đặt hàng nhanh từ từng dòng sản phẩm (Row-Level Quick Order)
* **A3.1.** Tại một dòng sản phẩm có trạng thái rủi ro (`OUT_OF_STOCK`, `CRITICAL`, `WARNING`), người dùng nhấn nút hành động nhanh **"Đặt hàng ngay"**.
* **A3.2.** Hệ thống điều hướng trực tiếp sang màn hình `UC-012: Lập đơn mua hàng`, tự động điền sẵn SKU này kèm số lượng đề xuất $Q_{suggested}$ (đã tính theo MOQ/Pack Size) và Nhà cung cấp tối ưu được gợi ý.

### A4. Điều hướng xem phân tích chi tiết sản phẩm 360° (`UC-006`)
* **A4.1.** Tại bảng dữ liệu, người dùng click vào tên hoặc mã SKU của một sản phẩm bất kỳ.
* **A4.2.** Hệ thống điều hướng sang màn hình `UC-006: Xem chi tiết phân tích sản phẩm` để xem bức tranh toàn cảnh (Biểu đồ lịch sử, đường dự báo AI, danh sách NCC và giá nhập).

### A5. Điều hướng nhanh sang màn hình Khuyến nghị mua hàng tổng thể (`UC-010`)
* **A5.1.** Người dùng nhấn nút "Xem toàn bộ đề xuất mua hàng" trên đầu Dashboard.
* **A5.2.** Hệ thống chuyển tiếp sang màn hình `UC-010: Xem khuyến nghị mua hàng thông minh` với danh sách toàn bộ các sản phẩm cần mua theo lô.

---

## 6. Exception Flows

### E1. Hệ thống chưa có dữ liệu sản phẩm (Empty State)
* **E1.1.** Tại Bước 1 của Main Flow, hệ thống kiểm tra không có sản phẩm nào trong cơ sở dữ liệu (`Count = 0`).
* **E1.2.** Hệ thống hiển thị màn hình rỗng (Empty State) kèm thông báo hướng dẫn: *"Chưa có dữ liệu sản phẩm trong hệ thống. Vui lòng thêm sản phẩm mới hoặc nạp dữ liệu từ file."* kèm nút bấm chuyển nhanh đến `UC-001` hoặc `UC-003`.

### E2. Sản phẩm mới chưa đủ dữ liệu bán hàng (Cold Start)
* **E2.1.** Đối với sản phẩm mới ($N_{days} < 14$), hệ thống chưa có chuỗi thời gian để tính $\sigma_d$.
* **E2.2.** Hệ thống hiển thị nhãn `COLD_START`, tính $\text{SS} = \lceil D_{expected} \times 2 \text{ ngày} \rceil$ (theo `BR-003` và `UC-008`), và gán trạng thái rủi ro theo mức an toàn ban đầu này.

---

## 7. Business Rules Applied (Quy Tắc Nghiệp Vụ Áp Dụng)

* **BR-001 (Vị trí tồn kho):** $\text{Inventory Position (IP)} = \text{On-Hand} + \text{On-Order}$ (tính cả lượng hàng đang chờ giao để không cảnh báo thiếu trùng lặp).
* **BR-002 (5 Cấp độ rủi ro tồn kho):**
  * `OUT_OF_STOCK`: $\text{On-Hand} \le 0$ (Màu đỏ sẫm - Báo động khẩn cấp).
  * `CRITICAL`: $\text{IP} < \text{Safety Stock}$ (Màu đỏ cam - Đã thâm hụt dự phòng).
  * `WARNING`: $\text{Safety Stock} \le \text{IP} \le \text{ROP}$ (Màu vàng - Chạm ngưỡng đặt hàng).
  * `NORMAL`: $\text{ROP} < \text{IP} \le \text{Max Stock}$ (Màu xanh lá - Tồn kho an toàn).
  * `OVERSTOCK`: $\text{IP} > \text{Max Stock}$ (Màu tím - Tồn dư đọng vốn).
* **BR-003 (Tồn kho an toàn SS):** $\text{SS}_{final} = \max(\lceil 1.65 \times \sigma_d \times \sqrt{L} \rceil, \text{Min Safety Stock})$.
* **BR-004 (Điểm đặt hàng lại ROP & Max Stock):** $\text{ROP} = \lceil (D_{avg} \times L) + \text{SS}_{final} \rceil$; $\text{Max Stock} = \text{ROP} + \lceil D_{avg} \times 30 \rceil$.
* **BR-005 (Số ngày bán còn lại DoS):** $\text{DoS} = \text{On-Hand} / D_{avg}$ (nếu $D_{avg} = 0 \rightarrow \text{DoS} = 999$).
* **BR-021 (Sản phẩm vô hiệu hóa):** Sản phẩm có `IsActive = false` bị loại trừ hoàn toàn khỏi bảng Dashboard này.
* **BR-023 (Hàng tồn bất động):** Gắn cờ cảnh báo `DEAD_STOCK` nếu sản phẩm có $\text{On-Hand} > 0$ nhưng không bán được chiếc nào trong 30 ngày liên tục.

---

## 8. Related Requirements (Yêu Cầu Chức Năng Liên Quan)

* **FR-007:** Hiển thị bảng và biểu đồ theo dõi số lượng tồn kho khả dụng hiện tại của toàn bộ danh mục sản phẩm.
* **FR-008:** Tự động tính toán Tồn kho an toàn (Safety Stock) và Điểm đặt hàng lại (Reorder Point - ROP) cho từng sản phẩm theo quy tắc nghiệp vụ.
* **FR-010:** Tự động phát hiện và phân loại trạng thái rủi ro tồn kho của từng sản phẩm theo 5 cấp độ: `OUT_OF_STOCK`, `CRITICAL`, `WARNING`, `NORMAL`, `OVERSTOCK`.
* **FR-011:** Tự động phát hiện và cảnh báo các sản phẩm tồn kho bất động (`DEAD_STOCK` - không bán được trong 30 ngày liên tục).
