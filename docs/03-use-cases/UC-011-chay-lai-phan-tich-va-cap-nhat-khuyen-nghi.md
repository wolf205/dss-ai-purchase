# Use Case Specification: UC-011 - Chạy Lại Phân Tích & Cập Nhật Khuyến Nghị

---

## 1. Basic Information

* **Use Case ID:** `UC-011`
* **Use Case Name:** Chạy lại phân tích & cập nhật khuyến nghị (On-Demand Pipeline Execution & Recommendations Refresh)
* **Primary Actor:** `Purchasing Staff`
* **Supporting Actor:** `System Admin`
* **Goal:** Người dùng muốn chủ động kích hoạt hệ thống thực thi lại toàn bộ chuỗi phân tích DSS (Pipeline gồm: Phân loại ABC-XYZ, Dự báo nhu cầu AI, Tính toán chỉ số an toàn SS/ROP, Đánh giá xếp hạng NCC, và Sinh danh sách khuyến nghị mua hàng mới nhất) theo yêu cầu (On-demand) ngay sau khi có sự thay đổi về dữ liệu (vừa nạp file bán hàng mới, vừa điều chỉnh trọng số NCC, vừa xác nhận đơn hàng, hoặc vừa nhập hàng mới về kho), với thời gian phản hồi toàn chuỗi $< 5$ giây.
* **Trigger:**
  * Người dùng nhấn nút "Chạy lại phân tích" (Re-run Analysis) trên thanh tiêu đề của bất kỳ màn hình Dashboard / Phân tích nào.
  * Hệ thống tự động kích hoạt sau khi hoàn tất nạp dữ liệu (`UC-003`), xác nhận nhận hàng (`UC-014`), hoặc lưu cấu hình trọng số NCC (`UC-017`).

---

## 2. Preconditions

1. Người dùng (`Purchasing Staff` hoặc `System Admin`) đã đăng nhập thành công vào hệ thống.
2. Cơ sở dữ liệu hoạt động bình thường và có dữ liệu danh mục sản phẩm.

---

## 3. Postconditions

### 3.1. Thành công (Success End Condition):
* Toàn bộ 5 giai đoạn của Pipeline phân tích DSS được thực thi tuần tự và hoàn tất trong thời gian $< 5$ giây:
  1. Cập nhật phân loại ma trận ABC-XYZ cho toàn bộ SKU (`UC-005`).
  2. Cập nhật kết quả dự báo nhu cầu bán lẻ và kiểm tra Fallback SMA-7 (`UC-007`).
  3. Cập nhật các chỉ số tồn kho thời gian thực ($\text{IP}, \text{SS}, \text{ROP}, \text{DoS}$) và 5 cấp độ rủi ro (`UC-004`).
  4. Cập nhật điểm hiệu suất tổng hợp $Score_{NCC}$ của toàn bộ nhà cung cấp (`UC-009`).
  5. Cập nhật danh sách khuyến nghị mua hàng và nội dung giải thích Explainable Insights (`UC-010`).
* Hiển thị thông báo hoàn thành (Toast Notification), cập nhật nhãn thời gian *"Phân tích lần cuối: [HH:mm:ss - DD/MM/YYYY]"*, và tự động làm mới mượt mà các bảng số liệu trên màn hình hiện tại.

### 3.2. Thất bại (Failure End Condition):
* Quá trình thực thi bị gián đoạn do lỗi tính toán hoặc quá thời gian timeout ( $> 10$ giây); hệ thống giữ nguyên kết quả phân tích cũ và hiển thị thông báo lỗi chi tiết.

---

## 4. Main Success Flow (Chạy lại chuỗi phân tích DSS On-Demand)

| Step | Actor (Purchasing Staff / Admin) | System |
| :---: | :--- | :--- |
| **1** | Nhấn nút **"Chạy lại phân tích"** trên góc phải thanh điều hướng. | Tiếp nhận yêu cầu, đổi nút sang trạng thái đang chạy (*"Đang phân tích..."* kèm biểu tượng xoay), kích hoạt thanh tiến trình mỏng trên đầu trang (Top Loading Bar) theo chế độ Non-blocking UI để người dùng vẫn tương tác xem màn hình bình thường. |
| **2** | | **Thực thi Giai đoạn 1 (Phân loại ABC-XYZ):** Tính toán doanh thu 30 ngày, hệ số $CV$, phân nhóm A/B/C, X/Y/Z và ma trận 9 ô (`BR-009`, `BR-010`, `BR-011`). |
| **3** | | **Thực thi Giai đoạn 2 (Dự báo Nhu cầu AI):** Áp dụng mô hình dự báo chuỗi thời gian cho các khung 7/14/30 ngày, tính WAPE/MAE, tự động Fallback về SMA-7 nếu $\text{WAPE} > 40\%$, và tính $D_{avg}$ (`BR-006`, `BR-007`, `BR-008`). |
| **4** | | **Thực thi Giai đoạn 3 (Tồn kho & Rủi ro):** Tính $\text{IP} = \text{On-Hand} + \text{On-Order}$, tính $\text{SS}_{final}, \text{ROP}, \text{Max Stock}, \text{DoS}$, và gán 1 trong 5 cấp độ rủi ro cho từng SKU (`BR-001` $\rightarrow$ `BR-005`). |
| **5** | | **Thực thi Giai đoạn 4 (Đánh giá Nhà cung cấp):** Tính 4 điểm thành phần ($S_{price}, S_{otif}, S_{quality}, S_{leadtime}$) trên 10 lần giao gần nhất và điểm tổng hợp $Score_{NCC}$ (`BR-012`, `BR-013`). |
| **6** | | **Thực thi Giai đoạn 5 (Sinh Khuyến nghị Mua hàng):** Lọc các SKU có $\text{IP} \le \text{ROP}$, chọn NCC tối ưu, tính $Q_{suggested}$ theo Pack Size & MOQ, xác định Ngày đặt tối ưu và sinh nội dung Explainable Insights (`BR-014` $\rightarrow$ `BR-018`). |
| **7** | | Lưu toàn bộ kết quả phân tích mới vào cơ sở dữ liệu, hiển thị Toast thông báo: *"Đã hoàn tất phân tích toàn bộ dữ liệu trong [X.X] giây"* (với $X.X < 5.0\text{s}$ theo `NFR-002`), cập nhật nhãn *"Phân tích lần cuối: [HH:mm:ss]"*, và làm mới lại dữ liệu trên giao diện. |

---

## 5. Alternative Flows

### A1. Tự động kích hoạt sau khi Nạp dữ liệu bán hàng hoặc kiểm kho (`UC-003`)
* **A1.1.** Tại `UC-003`, sau khi người dùng nạp file bán hàng hoặc file kiểm kê tồn kho thành công:
* **A1.2.** Hệ thống tự động kích hoạt chạy ngầm `UC-011` để cập nhật lại toàn bộ chỉ số.
* **A1.3.** Thông báo trên màn hình nạp file: *"Đã nạp file và hoàn tất phân tích dữ liệu mới"*.

### A2. Tự động kích hoạt sau khi Quản trị viên lưu cấu hình trọng số NCC (`UC-017`)
* **A2.1.** Tại `UC-017`, Admin thay đổi và lưu bộ trọng số tiêu chí mới ($w_{otif}, w_{quality}, w_{price}, w_{leadtime}$).
* **A2.2.** Hệ thống tự động kích hoạt `UC-011` từ Giai đoạn 4 để tính lại điểm $Score_{NCC}$, cập nhật lại việc lựa chọn NCC tối ưu và số lượng mua đề xuất tại `UC-010`.

### A3. Tự động kích hoạt sau khi Nhận hàng từ nhà cung cấp (`UC-014`)
* **A3.1.** Tại `UC-014`, sau khi nhân viên bấm "Xác nhận nhận hàng" (cập nhật tăng $\text{On-Hand}$ và giải phóng $\text{On-Order}$):
* **A3.2.** Hệ thống tự động kích hoạt `UC-011` để cập nhật lại trạng thái rủi ro tồn kho và gỡ sản phẩm khỏi danh sách khuyến nghị nếu đã đủ hàng.

---

## 6. Exception Flows

### E1. Quá trình tính toán bị quá tải hoặc lỗi kết nối (Pipeline Timeout / Error)
* **E1.1.** Trong quá trình thực thi bước 2-6, xảy ra sự cố nghẽn mạng hoặc lỗi thuật toán vượt quá 10 giây.
* **E1.2.** Hệ thống hủy tiến trình đang chạy dở (Abort & Rollback), giữ nguyên dữ liệu phân tích của phiên trước đó để không làm gián đoạn việc xem báo cáo của người dùng.
* **E1.3.** Hiển thị thông báo lỗi: *"Không thể hoàn tất phân tích dữ liệu do hệ thống bận. Kết quả phân tích trước đó vẫn được giữ nguyên. Vui lòng thử lại sau."*

---

## 7. Business Rules Applied (Quy Tắc Nghiệp Vụ Áp Dụng)

* **Toàn bộ BR-001 đến BR-020:** Áp dụng toàn bộ hệ thống 20 Business Rules theo trình tự logic 5 giai đoạn liên hoàn:
  * Giai đoạn 1: `BR-009`, `BR-010`, `BR-011`.
  * Giai đoạn 2: `BR-006`, `BR-007`, `BR-008`.
  * Giai đoạn 3: `BR-001`, `BR-002`, `BR-003`, `BR-004`, `BR-005`.
  * Giai đoạn 4: `BR-012`, `BR-013`, `BR-019`.
  * Giai đoạn 5: `BR-014`, `BR-015`, `BR-016`.
* **BR-021 (Sản phẩm/NCC vô hiệu hóa):** Loại trừ tất cả các bản ghi `IsActive = false` trong toàn bộ chuỗi tính toán.

---

## 8. Related Requirements (Yêu Cầu Chức Năng & Phi Chức Năng Liên Quan)

* **FR-008:** Tự động tính toán SS và ROP cho từng sản phẩm.
* **FR-009:** Phân loại danh mục theo ma trận ABC-XYZ.
* **FR-013:** Dự báo nhu cầu tiêu thụ bán lẻ theo các khung thời gian.
* **FR-019:** Tính toán điểm hiệu suất nhà cung cấp.
* **FR-021:** Tự động phân tích và hiển thị danh sách khuyến nghị mua hàng.
* **FR-022:** Nút "Chạy lại phân tích" để người dùng chủ động kích hoạt làm mới toàn bộ kết quả phân tích và khuyến nghị on-demand.
* **NFR-002:** Thời gian thực thi toàn bộ pipeline phân tích và sinh khuyến nghị phải hoàn tất trong vòng **$< 5$ giây** (với quy mô danh mục dưới 1,000 SKU).
