# Use Case Specification: UC-001 - Quản Lý Danh Mục Sản Phẩm

---

## 1. Basic Information

* **Use Case ID:** `UC-001`
* **Use Case Name:** Quản lý danh mục sản phẩm (Product Catalog Management)
* **Primary Actor:** `System Admin`
* **Supporting Actor:** `Purchasing Staff` (Truy cập xem và tra cứu danh mục - Read-only)
* **Goal:** Quản trị viên muốn quản trị toàn bộ danh mục sản phẩm của cửa hàng (tạo mới SKU, cập nhật thông tin định danh, cấu hình giá vốn tham chiếu, thiết lập tham số tồn kho mặc định và chuyển đổi trạng thái kinh doanh của sản phẩm).
* **Trigger:** Quản trị viên truy cập màn hình "Quản lý danh mục sản phẩm" từ thanh điều hướng chính của hệ thống.

---

## 2. Preconditions

1. Người dùng (`System Admin`) đã đăng nhập thành công vào hệ thống với vai trò Quản trị viên.
2. Hệ thống đang hoạt động bình thường và kết nối ổn định với cơ sở dữ liệu.

---

## 3. Postconditions

### 3.1. Thành công (Success End Condition):
* Sản phẩm mới được lưu vào cơ sở dữ liệu với đầy đủ thông tin định danh và tham số cấu hình ban đầu; trạng thái mặc định là `IsActive = true`.
* Thông tin sản phẩm hoặc các tham số cấu hình (Giá vốn, Lead time mặc định, Min Safety Stock) được cập nhật chính xác.
* Trạng thái kinh doanh của sản phẩm được chuyển đổi:
  * Nếu `IsActive = false`: Sản phẩm bị vô hiệu hóa, tự động bị loại trừ khỏi Dashboard cảnh báo tồn kho, mô hình dự báo AI, danh sách khuyến nghị mua hàng mới và form tạo đơn mua hàng mới. Dữ liệu lịch sử và các đơn mua hàng đang chờ giao (`ORDERED`) vẫn được bảo toàn nguyên vẹn.
  * Nếu `IsActive = true`: Sản phẩm được kích hoạt lại và đưa vào quy trình phân tích tự động ở chu kỳ tiếp theo.

### 3.2. Thất bại (Failure End Condition):
* Dữ liệu danh mục không thay đổi; hệ thống giữ nguyên trạng thái và hiển thị thông báo lỗi chi tiết cho người dùng (ví dụ: trùng mã SKU, giá trị số âm, thiếu thông tin bắt buộc).

---

## 4. Main Success Flow (Thêm mới sản phẩm)

| Step | Actor (System Admin) | System |
| :---: | :--- | :--- |
| **1** | Truy cập màn hình "Quản lý danh mục sản phẩm". | Hiển thị bảng danh sách sản phẩm hiện có (Mã SKU, Tên sản phẩm, Ngành hàng, Đơn vị tính, Giá vốn, Giá bán niêm yết, Lead time mặc định, Min Safety Stock, Trạng thái `IsActive`). |
| **2** | Nhấn nút "Thêm sản phẩm mới". | Hiển thị form thêm mới sản phẩm với các trường dữ liệu. |
| **3** | Nhập các thông tin sản phẩm:<br>- **Mã SKU:** Chuỗi ký tự duy nhất (Bắt buộc).<br>- **Tên sản phẩm:** Chuỗi ký tự (Bắt buộc).<br>- **Ngành hàng / Danh mục:** Chọn hoặc nhập phân loại (Bắt buộc).<br>- **Đơn vị tính:** Lon, Chai, Hộp, Gói... (Bắt buộc).<br>- **Giá vốn tham chiếu:** Số thực $> 0$ (Bắt buộc).<br>- **Giá bán niêm yết:** Số thực $> 0$ (Bắt buộc; phục vụ tính doanh thu cho phân tích ma trận ABC).<br>- **Lead time mặc định ($L$):** Số nguyên $\ge 1$ ngày (Mặc định = 1).<br>- **Min Safety Stock:** Số nguyên $\ge 0$ (Mức sàn an toàn tối thiểu, mặc định = 0). | |
| **4** | Nhấn nút "Lưu sản phẩm". | Kiểm tra tính hợp lệ của dữ liệu (Validation):<br>- Kiểm tra các trường bắt buộc không được để trống.<br>- Kiểm tra mã SKU chưa tồn tại trong hệ thống.<br>- Kiểm tra giá vốn $> 0$; giá bán $> 0$; Lead time $\ge 1$; Min Safety Stock $\ge 0$. |
| **5** | | Lưu thông tin sản phẩm mới vào cơ sở dữ liệu Master Data với trạng thái `IsActive = true`. |
| **6** | | Hiển thị thông báo thành công *"Thêm sản phẩm mới thành công"*, đóng form và cập nhật lại bảng danh sách sản phẩm. |

---

## 5. Alternative Flows

### A1. Chỉnh sửa thông tin sản phẩm và tham số cấu hình
* **A1.1.** Tại bảng danh sách sản phẩm, `System Admin` chọn một sản phẩm và nhấn nút "Chỉnh sửa".
* **A1.2.** Hệ thống hiển thị form chỉnh sửa với dữ liệu hiện tại của sản phẩm (Mã SKU ở chế độ chỉ đọc - Read-only).
* **A1.3.** `System Admin` sửa đổi các trường thông tin (Tên, Ngành hàng, ĐVT, Giá vốn, Giá bán niêm yết, Lead time mặc định, Min Safety Stock) và nhấn "Cập nhật".
* **A1.4.** Hệ thống kiểm tra hợp lệ dữ liệu $\rightarrow$ Lưu cập nhật vào cơ sở dữ liệu $\rightarrow$ Hiển thị thông báo *"Cập nhật thông tin sản phẩm thành công"* $\rightarrow$ Cập nhật lại danh sách.

### A2. Vô hiệu hóa sản phẩm ngừng kinh doanh (`IsActive = false`)
* **A2.1.** Tại bảng danh sách sản phẩm, `System Admin` chọn sản phẩm cần ngừng kinh doanh và nhấn "Vô hiệu hóa" (hoặc gạt tắt trạng thái hoạt động).
* **A2.2.** Hệ thống hiển thị hộp thoại xác nhận: *"Bạn có chắc chắn muốn vô hiệu hóa sản phẩm này? Sản phẩm sẽ bị loại trừ khỏi cảnh báo tồn kho, dự báo AI, gợi ý mua hàng và tạo đơn mua mới. Dữ liệu lịch sử và các đơn đang giao vẫn được bảo toàn."*
* **A2.3.** `System Admin` nhấn "Xác nhận".
* **A2.4.** Hệ thống cập nhật `IsActive = false` cho sản phẩm $\rightarrow$ Hiển thị thông báo *"Đã vô hiệu hóa sản phẩm"* $\rightarrow$ Cập nhật nhãn trạng thái trên danh sách.

### A3. Kích hoạt lại sản phẩm đã vô hiệu hóa (`IsActive = true`)
* **A3.1.** `System Admin` lọc danh sách sản phẩm "Đã vô hiệu hóa", chọn sản phẩm và nhấn "Kích hoạt lại".
* **A3.2.** Hệ thống cập nhật `IsActive = true` $\rightarrow$ Hiển thị thông báo *"Đã kích hoạt lại sản phẩm"* $\rightarrow$ Sản phẩm được đưa trở lại quy trình phân tích và gợi ý mua hàng ở chu kỳ tiếp theo.

### A4. Tra cứu và Lọc danh mục sản phẩm (Áp dụng cho `System Admin` và `Purchasing Staff`)
* **A4.1.** Người dùng nhập từ khóa tìm kiếm (Mã SKU hoặc Tên sản phẩm) hoặc chọn bộ lọc (Theo Ngành hàng, Theo trạng thái Hoạt động / Vô hiệu hóa).
* **A4.2.** Hệ thống lọc và hiển thị danh sách sản phẩm thỏa mãn điều kiện tìm kiếm.
* *(Ghi chú: Đối với `Purchasing Staff`, giao diện hiển thị danh sách ở chế độ chỉ đọc, ẩn các nút Thêm mới, Sửa và Vô hiệu hóa).*

---

## 6. Exception Flows

### E1. Trùng lặp mã SKU (Duplicate SKU)
* **E1.1.** Tại Bước 4 của Main Flow, hệ thống phát hiện mã SKU vừa nhập đã tồn tại trong cơ sở dữ liệu.
* **E1.2.** Hệ thống giữ nguyên dữ liệu trên form, hiển thị thông báo lỗi nổi bật tại trường SKU: *"Mã SKU này đã tồn tại trong hệ thống. Vui lòng sử dụng mã khác."*
* **E1.3.** Người dùng chỉnh sửa lại mã SKU và tiếp tục từ Bước 4.

### E2. Dữ liệu không hợp lệ (Validation Failure)
* **E2.1.** Tại Bước 4 của Main Flow hoặc Bước A1.4, hệ thống phát hiện:
  * Thiếu một trong các trường bắt buộc (Mã SKU, Tên, Đơn vị tính, Ngành hàng).
  * Hoặc Giá vốn $\le 0$; Giá bán $\le 0$; Lead time $< 1$; Min Safety Stock $< 0$; hoặc sai định dạng số.
* **E2.2.** Hệ thống đánh dấu đỏ các trường bị lỗi và hiển thị thông báo lỗi cụ thể: *"Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường được đánh dấu."*
* **E2.3.** Người dùng sửa đổi dữ liệu và tiếp tục từ Bước 4.

### E3. Quyền hạn không hợp lệ (Unauthorized Access / 403 Forbidden)
* **E3.1.** Người dùng với vai trò `Purchasing Staff` cố gắng can thiệp thao tác Thêm mới, Sửa hoặc Vô hiệu hóa sản phẩm thông qua gửi yêu cầu trái phép.
* **E3.2.** Hệ thống chặn yêu cầu, trả về lỗi `403 Forbidden` và hiển thị thông báo: *"Bạn không có quyền thực hiện thao tác này. Chức năng chỉ dành cho Quản trị viên."*

---

## 7. Business Rules Applied (Quy Tắc Nghiệp Vụ Áp Dụng)

* **BR-003 (Tồn kho an toàn & Mức sàn an toàn):** 
  * Tham số Lead time mặc định ($L$) và `Min Safety Stock` trong UC-001 thuần túy lưu trữ Master Data.
  * Khi hệ thống tính toán tồn kho an toàn tại `UC-004`/`UC-010`, mức an toàn thực tế áp dụng:
    $$\text{SS}_{final} = \max(\text{SS}_{statistical}, \text{Min Safety Stock})$$
* **BR-004 (Điểm đặt hàng lại ROP):** Tham số Lead time ($L$) được dùng làm đầu vào cho công thức $\text{ROP} = \lceil D_{avg} \times L + \text{SS}_{final} \rceil$.
* **BR-009 (Doanh thu phân loại ABC):** Trường `Giá bán niêm yết` được sử dụng để tính doanh thu bán hàng khi dữ liệu lịch sử nạp vào không chứa sẵn cột doanh thu.
* **BR-021 (Sản phẩm vô hiệu hóa):** Sản phẩm có `IsActive = false` bị loại trừ khỏi phân tích tồn kho, dự báo AI, khuyến nghị mua hàng và tạo đơn mua mới; nhưng vẫn bảo toàn lịch sử và cho phép nhận hàng các đơn đã chốt.
* **BR-022 (Sản phẩm chưa có nhà cung cấp):** Sản phẩm mới tạo chưa gán liên kết với nhà cung cấp nào sẽ hiển thị cảnh báo `NO_SUPPLIER`.

---

## 8. Related Requirements (Yêu Cầu Chức Năng Liên Quan)

* **FR-001:** Quản lý danh mục sản phẩm (xem, thêm mới, chỉnh sửa, vô hiệu hóa mã SKU, tên, ĐVT, ngành hàng, giá vốn tham chiếu, giá bán niêm yết).
* **FR-003:** Cấu hình các tham số ngưỡng tồn kho cơ bản cho từng sản phẩm (Tồn kho an toàn tối thiểu, Lead time dự kiến).

