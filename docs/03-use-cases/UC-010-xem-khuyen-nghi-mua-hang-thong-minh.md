# Use Case Specification: UC-010 - Xem Khuyến Nghị Mua Hàng Thông Minh

---

## 1. Basic Information

* **Use Case ID:** `UC-010`
* **Use Case Name:** Xem khuyến nghị mua hàng thông minh (Smart Purchase Recommendations)
* **Primary Actor:** `Purchasing Staff`
* **Supporting Actor:** `System Admin` (Truy cập xem và giám sát - Read-only)
* **Goal:** Người dùng muốn xem danh sách các sản phẩm chạm ngưỡng cần đặt hàng ($\text{Inventory Position (IP)} \le \text{ROP}$), số lượng mua đề xuất $Q_{suggested}$ (đã được làm tròn theo quy cách đóng gói Pack Size và MOQ của nhà cung cấp), Ngày đặt hàng tối ưu ($\text{Order Date}$), gợi ý Nhà cung cấp tối ưu nhất (dựa trên điểm tổng hợp $Score_{NCC}$), và các thẻ giải thích quyết định chi tiết (Explainable Insights: vì sao cần mua, cơ sở số lượng, vì sao chọn NCC này) để ra quyết định mua hàng chính xác và chuyển tiếp sang lập đơn mua hàng (`UC-012`).
* **Trigger:** Người dùng truy cập màn hình "Khuyến nghị mua hàng" từ thanh điều hướng chính, hoặc click chuyển tiếp từ Dashboard tồn kho (`UC-004`).

---

## 2. Preconditions

1. Người dùng (`Purchasing Staff` hoặc `System Admin`) đã đăng nhập thành công vào hệ thống.
2. Danh mục sản phẩm (`UC-001`) và Danh mục nhà cung cấp (`UC-002`) đã tồn tại trên hệ thống.
3. Hệ thống đã có dữ liệu tồn kho hiện tại và nhu cầu dự báo $D_{avg}$.

---

## 3. Postconditions

### 3.1. Thành công (Success End Condition):
* Hệ thống hiển thị Bảng khuyến nghị mua hàng thông minh gồm 5 khối dữ liệu chuẩn hóa cho từng dòng sản phẩm:
  1. **Thông tin sản phẩm:** Mã SKU, Tên sản phẩm, ĐVT, Ngành hàng, Phân loại ABC-XYZ.
  2. **Thống kê tồn kho:** $\text{On-Hand}, \text{On-Order}, \text{IP}, \text{SS}, \text{ROP}, \text{DoS}$, Cấp độ rủi ro (`OUT_OF_STOCK`, `CRITICAL`, `WARNING`).
  3. **Đề xuất mua hàng:** Số lượng đề xuất $Q_{suggested}$ (đã làm tròn theo Pack Size & MOQ), Tổng tiền dự kiến ($\text{Total} = Q_{suggested} \times P_{supplier}$), Ngày đặt hàng tối ưu ($\text{Order Date}$).
  4. **Nhà cung cấp tối ưu:** Tên đối tác có điểm $Score_{NCC}$ cao nhất, Đơn giá $P_{supplier}$, Lead time $LT_{supplier}$, $\text{MOQ}, \text{Pack Size}$ (kèm dropdown cho phép người dùng đổi sang NCC khác nếu muốn).
  5. **Thẻ giải thích quyết định (Explainable Insights):** 3 dòng tóm tắt lý do ngắn gọn (Lý do cần mua, Cơ sở tính số lượng, Lý do chọn NCC này — nêu rõ cả lượng hàng $\text{On-Order}$ đang chờ giao).
* Người dùng có thể tích chọn 1 hoặc nhiều sản phẩm và nhấn nút **"Tạo đơn mua hàng"** $\rightarrow$ Hệ thống hiển thị popup xác nhận gom nhóm theo NCC và sinh đồng loạt các đơn hàng nháp (`DRAFT` PO) tương ứng.

### 3.2. Thất bại (Failure End Condition):
* Không thể tải dữ liệu khuyến nghị do lỗi cơ sở dữ liệu; hệ thống hiển thị thông báo lỗi và nút "Thử lại".

---

## 4. Main Success Flow (Xem danh sách khuyến nghị mua hàng)

| Step | Actor (Purchasing Staff / Admin) | System |
| :---: | :--- | :--- |
| **1** | Truy cập màn hình "Khuyến nghị mua hàng thông minh". | Truy vấn dữ liệu tồn kho thời gian thực ($\text{On-Hand}, \text{On-Order}$), nhu cầu dự báo theo chu kỳ kế hoạch mặc định $T = 14$ ngày ($\text{Forecasted Demand}_T$), phân loại ABC-XYZ và bảng giá nhà cung cấp của tất cả sản phẩm đang hoạt động (`IsActive = true`). |
| **2** | | Thực hiện quy trình phân tích và sinh khuyến nghị tự động:<br>1. **Lọc sản phẩm cần mua (`BR-002`, `BR-015`):** Xác định các SKU có $\text{IP} \le \text{ROP}$ (thuộc các mức `OUT_OF_STOCK`, `CRITICAL`, `WARNING`).<br>2. **Xác định NCC tối ưu (`BR-016`):** Với mỗi SKU, chọn đối tác phân phối có $Score_{NCC}$ cao nhất (nếu bằng điểm, ưu tiên NCC có Lead time $LT$ ngắn nhất, sau đó đến Đơn giá $P_{supplier}$ thấp hơn).<br>3. **Tính số lượng mua đề xuất $Q_{suggested}$ (`BR-014`):**<br>- $Q_{raw} = \text{Forecasted Demand}_T + \text{Safety Stock} - \text{IP}$.<br>- Nếu $Q_{raw} \le 0 \rightarrow Q_{suggested} = 0$.<br>- Nếu $Q_{raw} > 0$: Áp dụng $\text{MOQ} \rightarrow Q_1 = \max(Q_{raw}, \text{MOQ})$; sau đó làm tròn theo hộp/thùng: $Q_{suggested} = \lceil Q_1 / \text{Pack Size} \rceil \times \text{Pack Size}$.<br>4. **Xác định Ngày đặt hàng tối ưu (`BR-015`):**<br>- Vì $\text{IP} \le \text{ROP} \rightarrow$ Gợi ý đặt: *Hôm nay (Khẩn cấp)*.<br>5. **Sinh nội dung giải thích (Explainable Insights) (`BR-016`):** Tự động tạo 3 câu lý do ngắn gọn minh bạch (Lý do cần đặt, Cơ sở tính số lượng, Lý do chọn NCC).<br>6. Sắp xếp danh sách theo mức độ khẩn cấp (Hết hàng $\rightarrow$ Nguy cấp $\rightarrow$ Cần đặt). |
| **3** | | Hiển thị giao diện Khuyến nghị gồm: Bộ chọn Khung thời gian kế hoạch mua hàng $T \in \{7, 14, 30\}$ ngày (mặc định 14 ngày), Thanh thống kê tổng quan (Tổng số SKU cần mua, Tổng ngân sách dự kiến), Bộ lọc theo ngành hàng/mức khẩn cấp, Bảng danh sách khuyến nghị chi tiết, và Nút hành động "Tạo đơn mua hàng". |
| **4** | Xem xét các dòng khuyến nghị, kiểm tra thẻ giải thích và thông số mua hàng. | |

---

## 5. Alternative Flows

### A1. Tạo đơn mua hàng hàng loạt với cơ chế gom nhóm theo NCC (Batch Grouping)
* **A1.1.** Người dùng tích chọn 1 hoặc nhiều dòng sản phẩm tại bảng khuyến nghị.
* **A1.2.** Người dùng nhấn nút **"Tạo đơn mua hàng ([N] sản phẩm đã chọn)"**.
* **A1.3.** Hệ thống tự động phân tích và hiển thị Hộp thoại xác nhận gom nhóm (Grouping Modal):
  * Liệt kê danh sách các Nhà cung cấp kèm số lượng SKU và Tổng giá trị dự kiến tương ứng của từng đối tác (ví dụ: *NCC Vinamilk: 4 SKU - 12.500.000 đ; NCC TH True Milk: 3 SKU - 8.200.000 đ*).
* **A1.4.** Người dùng kiểm tra và bấm "Xác nhận tạo các đơn mua hàng".
* **A1.5.** Hệ thống tự động tạo đồng thời các đơn hàng ở trạng thái `DRAFT` (Đơn nháp) trong cơ sở dữ liệu (`UC-012`) và chuyển tiếp sang màn hình Quản lý đơn mua hàng (`UC-013`) kèm thông báo thành công.

### A2. Thay đổi Nhà cung cấp gợi ý (Human-in-the-Loop Override)
* **A2.1.** Tại một dòng khuyến nghị, người dùng click vào dropdown Nhà cung cấp để xem danh sách các đối tác khác cũng đang phân phối SKU này.
* **A2.2.** Người dùng chọn một Nhà cung cấp khác (ví dụ: Nhà cung cấp B có giá rẻ hơn nhưng thời gian giao dài hơn).
* **A2.3.** Hệ thống tự động tính toán lại $Q_{suggested}$ và Tổng tiền theo đúng $\text{MOQ}, \text{Pack Size}, P_{supplier}, LT_{supplier}$ của **Nhà cung cấp B vừa chọn**.

### A3. Điều chỉnh trực tiếp số lượng đặt mua trước khi tạo đơn
* **A3.1.** Người dùng nhập sửa lại số lượng tại ô $Q_{suggested}$ của một dòng sản phẩm (ví dụ: tăng từ 24 lên 48 lon).
* **A3.2.** Hệ thống kiểm tra nếu số lượng mới chưa chia hết cho Pack Size hoặc nhỏ hơn MOQ $\rightarrow$ Hiển thị cảnh báo màu vàng nhắc nhở nhưng vẫn cho phép người dùng quyết định.
* **A3.3.** Hệ thống cập nhật lại Tổng tiền dự kiến tức thời.

### A4. Lọc theo Mức độ khẩn cấp & Ngành hàng
* **A4.1.** Người dùng click chọn bộ lọc: Mức độ khẩn cấp (`OUT_OF_STOCK`, `CRITICAL`, `WARNING`) hoặc theo Ngành hàng sản phẩm.
* **A4.2.** Hệ thống lọc bảng danh sách theo đúng tiêu chí yêu cầu.

### A5. Thay đổi Khung thời gian kế hoạch mua hàng (Purchase Horizon Selector)
* **A5.1.** Người dùng chọn khung thời gian khác trên dropdown (chọn *7 ngày* hoặc *30 ngày*).
* **A5.2.** Hệ thống lấy tổng cầu dự báo $\text{Forecasted Demand}_T$ theo chu kỳ $T$ mới được chọn.
* **A5.3.** Hệ thống tính toán lại toàn bộ $Q_{suggested}$ và Tổng ngân sách dự kiến tức thời.

---

## 6. Exception Flows

### E1. Toàn bộ danh mục đều ở mức tồn kho an toàn (No Recommendations)
* **E1.1.** Tại Bước 2 của Main Flow, hệ thống kiểm tra không có sản phẩm nào có $\text{IP} \le \text{ROP}$.
* **E1.2.** Hệ thống hiển thị màn hình thông báo tích cực (Positive Empty State): *"Tất cả [N] sản phẩm trong cửa hàng đều đang ở mức tồn kho an toàn. Chưa cần đặt thêm hàng tại thời điểm này."* kèm nút bấm "Xem Dashboard tồn kho" (`UC-004`).

### E2. Sản phẩm cần mua nhưng chưa có Nhà cung cấp nào phân phối (`NO_SUPPLIER`)
* **E2.1.** Sản phẩm chạm ngưỡng $\text{IP} \le \text{ROP}$ nhưng trong hệ thống chưa được gán bất kỳ nhà cung cấp nào (`UC-002`).
* **E2.2.** Hệ thống vẫn hiển thị dòng sản phẩm này trên bảng khuyến nghị nhưng:
  * Cột Nhà cung cấp hiển thị nhãn cảnh báo màu vàng: `NO_SUPPLIER - Chưa có nhà cung cấp` (theo `BR-022`).
  * Vô hiệu hóa checkbox chọn tạo đơn mua cho dòng này.
  * Thẻ giải thích hiển thị: *"Cần liên hệ Admin bổ sung Nhà cung cấp cho sản phẩm trước khi lập đơn mua"*.

---

## 7. Business Rules Applied (Quy Tắc Nghiệp Vụ Áp Dụng)

* **BR-001 (Vị trí tồn kho IP):** $\text{IP} = \text{On-Hand} + \text{On-Order}$ (loại trừ đặt trùng lặp khi có đơn đang về).
* **BR-002 (Cấp độ rủi ro):** Điều kiện kích hoạt khuyến nghị là $\text{IP} \le \text{ROP}$ (các sản phẩm thuộc cấp `OUT_OF_STOCK`, `CRITICAL`, `WARNING`).
* **BR-008 (Tổng cầu dự báo theo chu kỳ $T$):** $\text{Forecasted Demand}_T = \lceil \sum_{t=1}^T \max(0, \hat{y}_t) \rceil$ với $T \in \{7, 14, 30\}$ ngày.
* **BR-014 (Công thức số lượng mua đề xuất $Q_{suggested}$):**
  * $Q_{raw} = \text{Forecasted Demand}_T + \text{Safety Stock} - \text{IP}$.
  * $Q_1 = \max(Q_{raw}, \text{MOQ})$.
  * $Q_{suggested} = \lceil Q_1 / \text{Pack Size} \rceil \times \text{Pack Size}$.
* **BR-015 (Thời điểm đặt hàng):** Do sản phẩm khuyến nghị có $\text{IP} \le \text{ROP} \rightarrow$ Gợi ý đặt: *Hôm nay*.
* **BR-016 (Lựa chọn NCC tối ưu & Explainable Insights):** Ưu tiên NCC có $Score_{NCC}$ cao nhất $\rightarrow$ Lead time ngắn nhất $\rightarrow$ Đơn giá rẻ nhất. Bắt buộc hiển thị 3 dòng giải thích minh bạch.
* **BR-021 (Sản phẩm vô hiệu hóa):** Loại trừ sản phẩm `IsActive = false` khỏi khuyến nghị.
* **BR-022 (Sản phẩm thiếu NCC):** Gắn cờ cảnh báo `NO_SUPPLIER` và khóa chức năng tạo đơn.
* **BR-023 (Hàng tồn bất động):** Loại trừ sản phẩm `DEAD_STOCK` khỏi khuyến nghị mua ($Q_{suggested} = 0$).

---

## 8. Related Requirements (Yêu Cầu Chức Năng Liên Quan)

* **FR-021:** Tự động phân tích và hiển thị danh sách khuyến nghị mua hàng ngay khi người dùng truy cập màn hình Khuyến nghị mua hàng.
* **FR-023:** Mỗi mục khuyến nghị mua hàng bao gồm đầy đủ các thông tin: Sản phẩm cần mua, Phân nhóm ABC-XYZ, Số lượng đề xuất mua ($Q_{suggested}$ đã tính đến $\text{On-Order}$ và làm tròn theo MOQ/Pack Size), Thời điểm nên đặt hàng, Nhà cung cấp tối ưu được gợi ý.
* **FR-024:** Hệ thống hiển thị thông tin giải thích minh bạch lý do khuyến nghị (Explainable Insights) cho từng sản phẩm.
* **FR-025:** Hệ thống tự động loại trừ các sản phẩm đã vô hiệu hóa (`IsActive = false`) và sản phẩm tồn bất động (`DEAD_STOCK`) khỏi danh sách khuyến nghị mua hàng.

