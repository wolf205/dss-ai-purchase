# Use Case Specification: UC-005 - Xem Phân Tích Ma Trận ABC - XYZ

---

## 1. Basic Information

* **Use Case ID:** `UC-005`
* **Use Case Name:** Xem phân tích ma trận ABC - XYZ (Product Classification & ABC-XYZ Matrix Analysis)
* **Primary Actor:** `Purchasing Staff`
* **Supporting Actor:** `System Admin` (Truy cập xem và giám sát - Read-only)
* **Goal:** Người dùng muốn phân tích và phân loại toàn bộ danh mục sản phẩm theo 2 chiều kết hợp: Tỷ trọng đóng góp doanh thu (Ma trận Pareto ABC: A $\le 80\%$, B: $80-95\%$, C $> 95\%$) và Mức độ ổn định của nhu cầu tiêu thụ (Hệ số biến thiên XYZ: X $\le 0.5$, Y: $0.5-1.0$, Z $> 1.0$) trên chu kỳ 30 ngày gần nhất, từ đó trực quan hóa ma trận 9 ô (AX $\rightarrow$ CZ) để áp dụng chiến lược tồn kho và mua hàng tối ưu.
* **Trigger:** Người dùng truy cập màn hình "Phân tích ABC - XYZ" từ thanh điều hướng chính của hệ thống.

---

## 2. Preconditions

1. Người dùng (`Purchasing Staff` hoặc `System Admin`) đã đăng nhập thành công vào hệ thống.
2. Danh mục sản phẩm (`UC-001`) đã tồn tại trên hệ thống và có các sản phẩm đang hoạt động (`IsActive = true`).
3. Hệ thống đã có dữ liệu lịch sử bán hàng trong 30 ngày gần nhất được nạp từ `UC-003`.

---

## 3. Postconditions

### 3.1. Thành công (Success End Condition):
* Hệ thống tính toán và trực quan hóa:
  * **Ma trận trực quan 9 ô (ABC-XYZ Matrix Grid):** Thể hiện số lượng SKU và tỷ lệ % doanh thu trong từng ô (AX, AY, AZ, BX, BY, BZ, CX, CY, CZ) kèm mã màu phân nhóm chiến lược.
  * **Bảng dữ liệu chi tiết danh mục:** Hiển thị danh sách toàn bộ sản phẩm với đầy đủ: Doanh thu 30 ngày, % Đóng góp, % Tích lũy (Cumulative %), Nhóm ABC, Lượng bán trung bình ngày ($\mu_d$), Độ lệch chuẩn ($\sigma_d$), Hệ số biến thiên ($CV$), Nhóm XYZ, Nhóm ma trận kết hợp (ví dụ: `AX`) và Hướng dẫn chiến lược tồn kho tương ứng.
* Người dùng có thể click tương tác trực tiếp vào từng ô trong ma trận để lọc nhanh danh sách các mặt hàng thuộc nhóm chiến lược đó.

### 3.2. Thất bại (Failure End Condition):
* Không thể tải dữ liệu do lỗi cơ sở dữ liệu; hệ thống hiển thị thông báo lỗi và nút "Thử lại".

---

## 4. Main Success Flow (Xem ma trận phân loại ABC - XYZ)

| Step | Actor (Purchasing Staff / Admin) | System |
| :---: | :--- | :--- |
| **1** | Truy cập màn hình "Phân tích ABC - XYZ". | Truy vấn dữ liệu bán hàng trong cửa sổ cố định **30 ngày gần nhất** của tất cả sản phẩm đang hoạt động (`IsActive = true`). |
| **2** | | Thực hiện tính toán phân loại cho từng SKU:<br>1. **Tính Doanh thu & Phân loại ABC (`BR-009`):** Tính tổng doanh thu $= \sum (\text{Qty} \times \text{Selling Price})$, sắp xếp giảm dần, tính % tích lũy $\rightarrow$ Gán nhóm A ($\le 80\%$), B ($80-95\%$), C ($> 95\%$).<br>2. **Tính Hệ số biến thiên & Phân loại XYZ (`BR-010`):** Tính lượng bán trung bình ngày $\mu_d$, độ lệch chuẩn ngày $\sigma_d \rightarrow$ Tính $CV = \sigma_d / \mu_d \rightarrow$ Gán nhóm X ($CV \le 0.5$), Y ($0.5 < CV \le 1.0$), Z ($CV > 1.0$).<br>3. **Gán Nhóm ma trận kết hợp (`BR-011`):** Ghép mã thành 1 trong 9 nhóm (AX, AY, AZ, BX, BY, BZ, CX, CY, CZ). |
| **3** | | Hiển thị giao diện phân tích gồm 2 phần tập trung:<br>- **Phần 1 (Lưới ma trận 9 ô tương tác):** Bố cục $3 \times 3$ trực quan (Trục dọc: ABC, Trục ngang: XYZ) hiển thị số lượng SKU và % doanh thu trong từng ô.<br>- **Phần 2 (Bảng dữ liệu chi tiết):** Bảng danh sách phân trang hiển thị SKU, Tên, Doanh thu, % Tích lũy, Nhóm ABC, $\mu_d, \sigma_d, CV$, Nhóm XYZ, Nhóm kết hợp, và Chiến lược tồn kho khuyến nghị. |
| **4** | Xem thông tin phân tích tổng quan và bảng dữ liệu. | |

---

## 5. Alternative Flows

### A1. Lọc danh sách sản phẩm theo ô ma trận (Interactive Matrix Filtering)
* **A1.1.** Người dùng click trực tiếp vào một ô bất kỳ trên lưới ma trận (ví dụ: click vào ô **"AX - Mặt hàng chủ lực, bán đều"** hoặc ô **"AZ - Doanh thu cao, sức mua thất thường"**).
* **A1.2.** Hệ thống kích hoạt bộ lọc và cập nhật bảng chi tiết bên dưới chỉ hiển thị danh sách các sản phẩm thuộc ô ma trận đã chọn.
* **A1.3.** Hệ thống hiển thị nhãn chiến lược tồn kho tương ứng của nhóm này (theo `BR-011`):
  * *Nhóm AX:* "Mặt hàng chiến lược bán chạy nhất, nhu cầu cực kỳ ổn định $\rightarrow$ Ưu tiên cung ứng liên tục, duy trì Safety Stock thấp".
  * *Nhóm AZ:* "Doanh thu trọng điểm nhưng nhu cầu biến động mạnh $\rightarrow$ Cần duy trì Safety Stock cao để chống đứt hàng".
  * *Nhóm CZ:* "Mặt hàng giá trị thấp, bán chậm thất thường $\rightarrow$ Kiểm soát chặt, không đặt mua vượt ROP".
* **A1.4.** Người dùng nhấn "Xem tất cả" để hủy bộ lọc ô ma trận.

### A2. Lọc theo Ngành hàng
* **A2.1.** Người dùng chọn một ngành hàng cụ thể từ danh sách chọn (Dropdown).
* **A2.2.** Hệ thống tính toán lại phân loại ABC-XYZ và làm mới lưới ma trận chỉ trong phạm vi ngành hàng đã chọn.

### A3. Điều hướng xem phân tích chi tiết sản phẩm 360° (`UC-006`)
* **A3.1.** Tại bảng dữ liệu, người dùng click vào tên hoặc mã SKU của một sản phẩm.
* **A3.2.** Hệ thống chuyển tiếp sang màn hình `UC-006: Xem chi tiết phân tích sản phẩm` để xem chuyên sâu về SKU này.

---

## 6. Exception Flows

### E1. Sản phẩm mới chưa đủ 14 ngày dữ liệu bán hàng (Cold Start)
* **E1.1.** Đối với các sản phẩm mới ($N_{days} < 14$), hệ thống chưa có đủ chuỗi thời gian để tính toán hệ số biến thiên $CV$ một cách tin cậy.
* **E1.2.** Hệ thống hiển thị nhãn nhóm XYZ là `COLD_START` (Chưa phân nhóm XYZ), gán nhóm ABC dựa trên doanh thu hiện có, và ghi chú: *"Cần tích lũy đủ 14 ngày bán để phân loại XYZ tự động"*.

### E2. Sản phẩm không bán được chiếc nào trong 30 ngày (Dead Stock)
* **E2.1.** Sản phẩm có doanh thu 30 ngày $= 0$ và $\mu_d = 0$.
* **E2.2.** Hệ thống tự động gán vào **Nhóm C** (về doanh thu) và **Nhóm Z** (về biến động), đồng thời gắn cờ cảnh báo `DEAD_STOCK` (theo `BR-023`).

---

## 7. Business Rules Applied (Quy Tắc Nghiệp Vụ Áp Dụng)

* **BR-009 (Phân loại Pareto ABC theo Doanh thu):**
  * Sắp xếp sản phẩm giảm dần theo tổng doanh thu 30 ngày: $\text{Revenue} = \sum (\text{Quantity} \times \text{Selling Price})$.
  * Nhóm A: $\text{Cumulative \%} \le 80\%$.
  * Nhóm B: $80\% < \text{Cumulative \%} \le 95\%$.
  * Nhóm C: $\text{Cumulative \%} > 95\%$.
* **BR-010 (Phân loại XYZ theo Hệ số biến thiên nhu cầu):**
  * $CV = \sigma_d / \mu_d$ (trong 30 ngày gần nhất).
  * Nhóm X: $CV \le 0.5$ (Nhu cầu rất ổn định).
  * Nhóm Y: $0.5 < CV \le 1.0$ (Nhu cầu biến động trung bình/mùa vụ).
  * Nhóm Z: $CV > 1.0$ (Nhu cầu biến động mạnh / thất thường).
* **BR-011 (Ma trận kết hợp 9 ô ABC-XYZ):** Định hướng chiến lược tồn kho và ưu tiên gợi ý mua hàng cho từng nhóm (AX $\rightarrow$ CZ).
* **BR-021 (Sản phẩm vô hiệu hóa):** Loại trừ các sản phẩm `IsActive = false` khỏi bảng phân tích ma trận.
* **BR-023 (Hàng tồn bất động):** Sản phẩm 30 ngày bán $= 0$ được xếp nhóm CZ và gắn cờ `DEAD_STOCK`.

---

## 8. Related Requirements (Yêu Cầu Chức Năng Liên Quan)

* **FR-009:** Hệ thống tự động phân loại danh mục sản phẩm theo ma trận kết hợp **ABC - XYZ Analysis** (dựa trên doanh số bán hàng và hệ số biến thiên nhu cầu $CV$).
