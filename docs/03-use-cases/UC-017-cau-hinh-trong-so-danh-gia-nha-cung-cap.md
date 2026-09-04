# Use Case Specification: UC-017 - Cấu Hình Trọng Số Đánh Giá Nhà Cung Cấp

---

## 1. Basic Information

* **Use Case ID:** `UC-017`
* **Use Case Name:** Cấu hình trọng số đánh giá nhà cung cấp (Supplier Weight Configuration)
* **Primary Actor:** `System Admin`
* **Supporting Actor:** Không có (Dành riêng cho Quản trị viên)
* **Goal:** Quản trị viên hệ thống muốn xem, mô phỏng tác động What-If theo thời gian thực, và tùy chỉnh tỷ lệ phần trăm trọng số (số nguyên bước nhảy 1%) của 4 tiêu chí đánh giá hiệu suất nhà cung cấp ($w_{otif}, w_{quality}, w_{price}, w_{leadtime}$), đảm bảo tổng 4 trọng số luôn bằng đúng $100\%$ ($\sum w_i = 100\%$), hoặc khôi phục về bộ trọng số mặc định chuẩn (35% OTIF, 30% Chất lượng, 20% Giá, 15% Tốc độ giao); sau khi lưu cấu hình, hệ thống tự động kích hoạt tính toán lại toàn bộ điểm hiệu suất $Score_{NCC}$ của các nhà cung cấp (`UC-009`) và cập nhật lại đề xuất nhà cung cấp tối ưu trong Khuyến nghị mua hàng (`UC-010`).
* **Trigger:** Quản trị viên truy cập mục "Cấu hình trọng số NCC" từ menu Quản trị hệ thống, hoặc bấm nút chuyển tiếp từ màn hình Đánh giá NCC (`UC-009`).

---

## 2. Preconditions

1. Người dùng đã đăng nhập vào hệ thống với vai trò Quản trị viên (**`System Admin`**).

---

## 3. Postconditions

### 3.1. Thành công (Success End Condition):
* Bộ trọng số đánh giá hiệu suất nhà cung cấp mới ($w_{otif}, w_{quality}, w_{price}, w_{leadtime}$) thỏa mãn $\sum w_i = 100\%$ được lưu thành công vào cơ sở dữ liệu.
* Hệ thống tự động kích hoạt tiến trình tính toán lại:
  * Cập nhật lại toàn bộ điểm tổng hợp $Score_{NCC}$ của tất cả các nhà cung cấp (`UC-009`).
  * Cập nhật lại việc xếp hạng và lựa chọn Nhà cung cấp tối ưu nhất cho từng sản phẩm trong Khuyến nghị mua hàng (`UC-010`).
* Hiển thị thông báo thành công và ghi log kiểm toán thay đổi cấu hình.

### 3.2. Thất bại (Failure End Condition):
* Cấu hình không được lưu; hệ thống hiển thị thông báo lỗi (ví dụ: tổng trọng số khác 100%, có trọng số âm); giữ nguyên bộ trọng số đang áp dụng.

---

## 4. Main Success Flow (Tùy chỉnh trọng số & Mô phỏng tác động What-If)

| Step | Actor (System Admin) | System |
| :---: | :--- | :--- |
| **1** | Truy cập màn hình "Cấu hình trọng số đánh giá NCC". | Kiểm tra quyền `ADMIN` $\rightarrow$ Truy vấn và hiển thị bộ trọng số hiện tại đang áp dụng trong hệ thống. |
| **2** | | Hiển thị giao diện cấu hình gồm 3 khu vực trực quan:<br>- **Khu vực 1 (4 Thanh trượt Sliders bước nhảy 1%):** $w_{otif}$ (35%), $w_{quality}$ (30%), $w_{price}$ (20%), $w_{leadtime}$ (15%).<br>- **Khu vực 2 (Thanh chỉ báo Tổng % thời gian thực & Biểu đồ Donut):** $\sum w_i = 100\%$ (màu xanh) hoặc $\neq 100\%$ (màu đỏ kèm số chênh lệch).<br>- **Khu vực 3 (Bảng mô phỏng tác động What-If Preview):** So sánh Top 5 Nhà cung cấp (Điểm cũ vs Điểm mới mô phỏng, kèm mũi tên biến động thứ hạng $\uparrow / \downarrow$). |
| **3** | Kéo thanh trượt hoặc nhập số % cho từng tiêu chí (ví dụ: tăng trọng số Đơn giá lên 30%, giảm OTIF xuống 25%). | Cập nhật tức thời Biểu đồ Donut, tính lại Tổng trọng số $\sum w_i$, và tính toán lại tức thời Bảng mô phỏng What-If Top 5 NCC để Admin quan sát sự thay đổi thứ hạng trước khi lưu. |
| **4** | Kiểm tra Tổng trọng số đạt đúng $100\%$ và nhấn nút **"Lưu cấu hình trọng số"**. | Hiển thị hộp thoại xác nhận: *"Hệ thống sẽ lưu bộ trọng số mới và tự động tính toán lại điểm hiệu suất của toàn bộ Nhà cung cấp cũng như các gợi ý mua hàng. Bạn có muốn tiếp tục?"*. |
| **5** | Nhấn "Xác nhận lưu". | Thực hiện lưu cấu hình và kích hoạt Pipeline:<br>1. Lưu bộ trọng số mới vào CSDL (`BR-013`).<br>2. Tự động kích hoạt chuỗi tính toán lại `UC-011` (Giai đoạn 4 & 5).<br>3. Ghi log kiểm toán thao tác thay đổi cấu hình. |
| **6** | | Hiển thị thông báo thành công: *"Đã lưu bộ trọng số đánh giá NCC và cập nhật lại toàn bộ điểm hiệu suất thành công!"*. |

---

## 5. Alternative Flows

### A1. Khôi phục về bộ trọng số mặc định chuẩn (Reset to System Defaults)
* **A1.1.** Admin nhấn nút **"Khôi phục mặc định"** trên thanh công cụ.
* **A1.2.** Hệ thống tự động điền lại bộ trọng số chuẩn:
  * $w_{otif} = 35\%$
  * $w_{quality} = 30\%$
  * $w_{price} = 20\%$
  * $w_{leadtime} = 15\%$
  * $\sum w_i = 100\%$
* **A1.3.** Admin nhấn "Lưu cấu hình trọng số" để áp dụng lại giá trị mặc định.

### A2. Tự động cân bằng phần trăm còn lại (Auto-balance Feature)
* **A2.1.** Sau khi Admin điều chỉnh 1 hoặc 2 tiêu chí, Admin bấm nút "Tự động cân bằng".
* **A2.2.** Hệ thống tự động phân bổ đều số % nguyên còn lại cho các tiêu chí chưa điều chỉnh để tổng luôn đạt chính xác $100\%$.

---

## 6. Exception Flows

### E1. Tổng trọng số không bằng 100% ($\sum w_i \neq 100\%$)
* **E1.1.** Tại Bước 3, tổng 4 trọng số là $95\%$ (thiếu 5%) hoặc $105\%$ (thừa 5%).
* **E1.2.** Hệ thống hiển thị thanh cảnh báo màu đỏ: *"Tổng các trọng số hiện tại là [N]%. Vui lòng điều chỉnh để tổng bằng đúng 100% (còn thiếu/thừa [M]%)."* và **vô hiệu hóa nút Lưu cấu hình**.

### E2. Trọng số có giá trị âm ($w_i < 0\%$)
* **E2.1.** Người dùng cố tình nhập số âm vào ô phần trăm.
* **E2.2.** Hệ thống chặn không cho nhập số âm và tự động đưa về mức tối thiểu $0\%$.

### E3. Người dùng không có quyền Admin cố gắng truy cập
* **E3.1.** Người dùng có vai trò `STAFF` cố gắng truy cập trang cấu hình trọng số.
* **E3.2.** Hệ thống chặn truy cập với mã lỗi `403 Forbidden` và thông báo: *"Chỉ Quản trị viên mới có quyền cấu hình trọng số hệ thống."*.

---

## 7. Business Rules Applied (Quy Tắc Nghiệp Vụ Áp Dụng)

* **BR-013 (Ràng buộc bộ trọng số đánh giá nhà cung cấp):**
  * Công thức: $Score_{NCC} = (w_{otif} \times S_{otif}) + (w_{quality} \times S_{quality}) + (w_{price} \times S_{price}) + (w_{leadtime} \times S_{leadtime})$.
  * Ràng buộc bắt buộc: $w_{otif} + w_{quality} + w_{price} + w_{leadtime} = 100\%$ và $w_i \ge 0\%$ (bước nhảy $1\%$).
  * Trọng số mặc định hệ thống: $w_{otif} = 35\%, w_{quality} = 30\%, w_{price} = 20\%, w_{leadtime} = 15\%$.
* **RBAC Matrix (Phân quyền quản trị):** Dành riêng cho `System Admin`.

---

## 8. Related Requirements (Yêu Cầu Chức Năng Liên Quan)

* **FR-034:** Hệ thống cho phép Quản trị viên (Admin) tùy chỉnh tỷ trọng (trọng số %) của các tiêu chí đánh giá nhà cung cấp (Giá, Giao đúng hạn, Chất lượng, Lead Time) với điều kiện tổng bằng 100%.

