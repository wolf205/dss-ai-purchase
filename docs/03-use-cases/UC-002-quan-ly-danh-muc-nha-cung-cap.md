# Use Case Specification: UC-002 - Quản Lý Danh Mục Nhà Cung Cấp

---

## 1. Basic Information

* **Use Case ID:** `UC-002`
* **Use Case Name:** Quản lý danh mục nhà cung cấp (Supplier Catalog Management)
* **Primary Actor:** `System Admin`
* **Supporting Actor:** `Purchasing Staff` (Truy cập xem và tra cứu danh mục - Read-only)
* **Goal:** Quản trị viên muốn quản lý toàn diện thông tin các nhà cung cấp của cửa hàng (tạo mới thông tin liên hệ, thiết lập danh mục sản phẩm phân phối kèm đơn giá nhập, chính sách MOQ, quy cách đóng gói Pack Size, thời gian giao hàng Lead time cam kết và quản lý trạng thái hợp tác `IsActive`).
* **Trigger:** Quản trị viên truy cập màn hình "Quản lý danh mục nhà cung cấp" từ thanh điều hướng chính của hệ thống.

---

## 2. Preconditions

1. Người dùng (`System Admin`) đã đăng nhập thành công vào hệ thống với vai trò Quản trị viên.
2. Danh mục sản phẩm (`UC-001`) đã được khởi tạo để có thể liên kết sản phẩm với nhà cung cấp.
3. Hệ thống đang hoạt động bình thường và kết nối ổn định với cơ sở dữ liệu.

---

## 3. Postconditions

### 3.1. Thành công (Success End Condition):
* Nhà cung cấp mới được thêm vào hệ thống với đầy đủ thông tin liên hệ (danh mục sản phẩm có thể gán ngay hoặc bổ sung sau); trạng thái mặc định là `IsActive = true`, nhãn ban đầu là `NEW_SUPPLIER`.
* Thông tin liên hệ hoặc chính sách giá/MOQ/Pack Size/Lead time của nhà cung cấp được cập nhật chính xác.
* Trạng thái hợp tác của nhà cung cấp được chuyển đổi:
  * Nếu `IsActive = false`: Nhà cung cấp bị vô hiệu hóa, tự động bị loại trừ khỏi các thuật toán gợi ý mua hàng (`UC-010`) và không thể chọn khi tạo đơn mua mới (`UC-012`). Lịch sử giao hàng quá khứ và các đơn mua đang giao (`ORDERED`) vẫn được bảo toàn nguyên vẹn.
  * Nếu `IsActive = true`: Nhà cung cấp được kích hoạt lại và đưa vào quy trình đánh giá, gợi ý mua hàng ở chu kỳ tiếp theo.
* Nếu xóa một sản phẩm khỏi danh mục của NCC: Sản phẩm đó sẽ không còn được gợi ý mua từ NCC này trong tương lai; dữ liệu các đơn hàng cũ và đơn đang giao (`ORDERED`) vẫn được bảo toàn.

### 3.2. Thất bại (Failure End Condition):
* Dữ liệu nhà cung cấp không thay đổi; hệ thống hiển thị thông báo lỗi chi tiết cho người dùng (ví dụ: trùng mã/tên NCC, đơn giá nhập $\le 0$, MOQ $< 1$, Pack Size $< 1$, Lead time $< 1$).

---

## 4. Main Success Flow (Thêm mới nhà cung cấp)

| Step | Actor (System Admin) | System |
| :---: | :--- | :--- |
| **1** | Truy cập màn hình "Quản lý danh mục nhà cung cấp". | Hiển thị bảng danh sách các nhà cung cấp hiện có (Mã NCC, Tên NCC, Số điện thoại, Email, Địa chỉ, Số mặt hàng phân phối, Điểm hiệu suất $Score_{NCC}$, Trạng thái `IsActive`). |
| **2** | Nhấn nút "Thêm nhà cung cấp mới". | Hiển thị form thêm mới nhà cung cấp gồm 2 phần: Thông tin chung và Danh mục sản phẩm phân phối. |
| **3** | Nhập các thông tin chung của nhà cung cấp:<br>- **Mã nhà cung cấp:** Chuỗi ký tự duy nhất (Bắt buộc).<br>- **Tên nhà cung cấp:** Chuỗi ký tự (Bắt buộc).<br>- **Số điện thoại:** Định dạng SĐT hợp lệ (Bắt buộc).<br>- **Email:** Định dạng email hợp lệ (Tùy chọn).<br>- **Địa chỉ:** Chuỗi ký tự (Tùy chọn). | |
| **4** | *(Tùy chọn)* Tại phần "Danh mục sản phẩm phân phối", nhấn "Thêm sản phẩm" và thiết lập chính sách:<br>- Chọn **Sản phẩm (SKU)** từ danh mục.<br>- **Đơn giá nhập ($P_{supplier}$):** Số thực $> 0$ (Bắt buộc nếu thêm SP).<br>- **Số lượng đặt tối thiểu (MOQ):** Số nguyên $\ge 1$ (Mặc định = 1).<br>- **Quy cách đóng gói (Pack Size):** Số nguyên $\ge 1$ (Mặc định = 1).<br>- **Lead time cam kết ($LT_{supplier}$):** Số nguyên $\ge 1$ ngày (Bắt buộc nếu thêm SP). | |
| **5** | Nhấn nút "Lưu nhà cung cấp". | Kiểm tra tính hợp lệ của dữ liệu (Validation):<br>- Kiểm tra mã NCC và tên NCC chưa tồn tại.<br>- Kiểm tra các trường bắt buộc không để trống.<br>- Kiểm tra các giá trị số: Đơn giá $> 0$, MOQ $\ge 1$, Pack Size $\ge 1$, Lead time $\ge 1$.<br>- Kiểm tra không có sản phẩm bị gán trùng lặp trong cùng 1 NCC. |
| **6** | | Lưu thông tin nhà cung cấp và bảng giá sản phẩm vào cơ sở dữ liệu Master Data với `IsActive = true` và nhãn `NEW_SUPPLIER`. |
| **7** | | Hiển thị thông báo thành công *"Thêm nhà cung cấp mới thành công"*, đóng form và cập nhật lại bảng danh sách nhà cung cấp. |

---

## 5. Alternative Flows

### A1. Chỉnh sửa thông tin và bảng giá sản phẩm của nhà cung cấp
* **A1.1.** Tại bảng danh sách, `System Admin` chọn một nhà cung cấp và nhấn nút "Chỉnh sửa".
* **A1.2.** Hệ thống hiển thị form chỉnh sửa với đầy đủ dữ liệu hiện tại (Mã NCC ở chế độ chỉ đọc).
* **A1.3.** `System Admin` điều chỉnh thông tin liên hệ, thêm/xóa sản phẩm phân phối, hoặc cập nhật Đơn giá, MOQ, Pack Size, Lead time cam kết $\rightarrow$ Nhấn "Cập nhật".
* **A1.4.** Hệ thống kiểm tra hợp lệ dữ liệu $\rightarrow$ Lưu cập nhật $\rightarrow$ Tự động kích hoạt tính lại điểm Giá ($S_{price}$) và Lead time ($S_{leadtime}$) $\rightarrow$ Hiển thị thông báo *"Cập nhật thông tin nhà cung cấp thành công"*.

### A2. Vô hiệu hóa nhà cung cấp ngừng hợp tác (`IsActive = false`)
* **A2.1.** `System Admin` chọn nhà cung cấp cần ngừng hợp tác và nhấn "Vô hiệu hóa" (hoặc gạt tắt trạng thái hoạt động).
* **A2.2.** Hệ thống hiển thị hộp thoại xác nhận: *"Bạn có chắc chắn muốn vô hiệu hóa nhà cung cấp này? Nhà cung cấp sẽ không được gợi ý trong các khuyến nghị mua hàng và không thể tạo đơn mua mới. Dữ liệu lịch sử và các đơn đang giao vẫn được bảo toàn."*
* **A2.3.** `System Admin` nhấn "Xác nhận".
* **A2.4.** Hệ thống cập nhật `IsActive = false` $\rightarrow$ Hiển thị thông báo *"Đã vô hiệu hóa nhà cung cấp"* $\rightarrow$ Cập nhật nhãn trạng thái trên danh sách.

### A3. Kích hoạt lại nhà cung cấp (`IsActive = true`)
* **A3.1.** `System Admin` lọc danh sách NCC "Đã vô hiệu hóa", chọn nhà cung cấp và nhấn "Kích hoạt lại".
* **A3.2.** Hệ thống cập nhật `IsActive = true` $\rightarrow$ Hiển thị thông báo *"Đã kích hoạt lại nhà cung cấp"* $\rightarrow$ NCC được đưa trở lại quy trình đánh giá và gợi ý mua hàng.

### A4. Tra cứu và xem chi tiết nhà cung cấp (Áp dụng cho `System Admin` và `Purchasing Staff`)
* **A4.1.** Người dùng nhập từ khóa tìm kiếm (Mã NCC, Tên NCC, Tên sản phẩm cung cấp) hoặc chọn bộ lọc trạng thái.
* **A4.2.** Hệ thống lọc và hiển thị danh sách thỏa mãn.
* **A4.3.** Người dùng click vào một nhà cung cấp để xem màn hình chi tiết: Thông tin liên hệ, Danh mục sản phẩm & Bảng giá, Điểm hiệu suất tổng hợp $Score_{NCC}$, 4 điểm thành phần và nhãn `NEW_SUPPLIER` (nếu có).
* *(Ghi chú: Đối với `Purchasing Staff`, giao diện hiển thị ở chế độ chỉ đọc, ẩn các nút Thêm mới, Sửa và Vô hiệu hóa).*

---

## 6. Exception Flows

### E1. Trùng lặp thông tin nhà cung cấp (Duplicate Supplier)
* **E1.1.** Tại Bước 5 của Main Flow, hệ thống phát hiện Mã NCC hoặc Tên NCC đã tồn tại trong hệ thống.
* **E1.2.** Hệ thống hiển thị thông báo lỗi tại trường tương ứng: *"Mã hoặc Tên nhà cung cấp đã tồn tại. Vui lòng kiểm tra lại."*
* **E1.3.** Người dùng chỉnh sửa lại thông tin và tiếp tục từ Bước 5.

### E2. Dữ liệu không hợp lệ (Validation Failure)
* **E2.1.** Tại Bước 5 của Main Flow hoặc Bước A1.4, hệ thống phát hiện:
  * Thiếu các trường bắt buộc (Mã NCC, Tên NCC, SĐT).
  * Đơn giá nhập $\le 0$; MOQ $< 1$; Pack Size $< 1$; Lead time $< 1$; hoặc sai định dạng email/SĐT.
  * Trùng lặp SKU trong danh sách sản phẩm cung ứng của cùng một NCC.
* **E2.2.** Hệ thống đánh dấu đỏ các trường bị lỗi và hiển thị thông báo: *"Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường được đánh dấu."*
* **E2.3.** Người dùng chỉnh sửa dữ liệu và tiếp tục từ Bước 5.

### E3. Quyền hạn không hợp lệ (Unauthorized Access / 403 Forbidden)
* **E3.1.** Người dùng với vai trò `Purchasing Staff` cố gắng can thiệp thao tác Thêm mới, Sửa hoặc Vô hiệu hóa nhà cung cấp qua API.
* **E3.2.** Hệ thống chặn yêu cầu, trả về lỗi `403 Forbidden` và hiển thị thông báo: *"Bạn không có quyền thực hiện thao tác này. Chức năng chỉ dành cho Quản trị viên."*

---

## 7. Business Rules Applied (Quy Tắc Nghiệp Vụ Áp Dụng)

* **BR-004 & BR-012 (Quy tắc phân cấp Lead time):**
  * Khi gợi ý mua hàng và chấm điểm NCC cụ thể: Sử dụng chính xác Lead time cam kết ($LT_{supplier}$) của từng NCC.
  * Khi tính ROP tổng quát trên Dashboard: Ưu tiên lấy $LT_{supplier}$ của NCC có $Score_{NCC}$ cao nhất; nếu chưa có NCC thì fallback về Lead time mặc định ($L$) trong `UC-001`.
* **BR-012 (Điểm thành phần NCC):** Đơn giá nhập ($P_{supplier}$) và Lead time cam kết ($LT_{supplier}$) được dùng trực tiếp để tính $S_{price} = \frac{P_{min}}{P_{supplier}} \times 100$ và $S_{leadtime} = \frac{LT_{min}}{LT_{supplier}} \times 100$.
* **BR-013 (Đánh giá NCC mới):** Nhà cung cấp mới tạo (< 3 lần giao) tự động được gán nhãn `NEW_SUPPLIER` và tính điểm ban đầu dựa trên $S_{price}$ và $S_{leadtime}$.
* **BR-014 (Quy cách đóng gói & MOQ):** Tham số MOQ và Pack Size được dùng để làm tròn số lượng đặt mua đề xuất ($Q_{suggested}$).
* **BR-016 (Lựa chọn NCC tối ưu):** Danh mục sản phẩm liên kết với NCC là căn cứ để hệ thống so sánh và lựa chọn NCC tối ưu trong các khuyến nghị mua hàng.
* **BR-021 (Vô hiệu hóa đối tác):** Nhà cung cấp có `IsActive = false` bị loại trừ hoàn toàn khỏi danh sách gợi ý mua hàng và form tạo đơn mua mới.

---

## 8. Related Requirements (Yêu Cầu Chức Năng Liên Quan)

* **FR-002:** Quản lý danh mục nhà cung cấp (xem, thêm mới, chỉnh sửa, vô hiệu hóa thông tin nhà cung cấp, thông tin liên hệ, danh mục sản phẩm cung cấp, đơn giá nhập, MOQ, Lead time cam kết).
