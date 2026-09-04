# Use Case Specification: UC-016 - Quản Lý Tài Khoản Người Dùng

---

## 1. Basic Information

* **Use Case ID:** `UC-016`
* **Use Case Name:** Quản lý tài khoản người dùng (User Account Management)
* **Primary Actor:** `System Admin`
* **Supporting Actor:** Không có (Dành riêng cho Quản trị viên)
* **Goal:** Quản trị viên hệ thống muốn xem danh sách toàn bộ người dùng, tạo tài khoản người dùng mới (gán vai trò `ADMIN` hoặc `STAFF`), chỉnh sửa thông tin người dùng (Họ tên, Email, Vai trò), Khóa / Mở khóa tài khoản (`IsActive = true / false`), hoặc Đặt lại mật khẩu (Reset Password) cho nhân viên khi họ quên mật khẩu, nhằm kiểm soát an ninh truy cập toàn hệ thống.
* **Trigger:** Quản trị viên truy cập mục "Quản lý người dùng" từ menu Quản trị hệ thống.

---

## 2. Preconditions

1. Người dùng đã đăng nhập vào hệ thống với vai trò Quản trị viên (**`System Admin`**).

---

## 3. Postconditions

### 3.1. Thành công (Success End Condition):
* Danh sách tài khoản người dùng được cập nhật chính xác:
  * **Khi Tạo mới:** Tài khoản mới được tạo với mật khẩu khởi tạo, vai trò được chỉ định, và cờ `MustChangePassword = true`.
  * **Khi Chỉnh sửa:** Thông tin cá nhân (Họ tên, Email) hoặc Vai trò (`Role`) được cập nhật.
  * **Khi Khóa/Mở khóa:** Trạng thái `IsActive` chuyển thành `false` (ngay lập tức thu hồi phiên làm việc qua Middleware) hoặc `true` (khôi phục truy cập).
  * **Khi Reset mật khẩu:** Mật khẩu tạm thời mới được tạo, mã hóa bcrypt và gán cờ `MustChangePassword = true`.
* Hiển thị thông báo thành công và làm mới bảng danh sách tài khoản.

### 3.2. Thất bại (Failure End Condition):
* Thao tác bị từ chối; hệ thống hiển thị thông báo lỗi cụ thể (ví dụ: trùng Username/Email, Admin tự khóa chính mình, hoặc khóa tài khoản Admin duy nhất còn lại).

---

## 4. Main Success Flow (Xem danh sách & Tạo tài khoản mới)

| Step | Actor (System Admin) | System |
| :---: | :--- | :--- |
| **1** | Truy cập màn hình "Quản lý tài khoản người dùng". | Kiểm tra quyền `ADMIN` $\rightarrow$ Truy vấn và hiển thị danh sách toàn bộ tài khoản người dùng trong hệ thống. |
| **2** | | Hiển thị bảng danh sách tài khoản gồm: Tên đăng nhập (Username), Họ và tên, Email, Vai trò (`ADMIN` / `STAFF`), Trạng thái hoạt động (`Hoạt động` / `Đã khóa`), Lần đăng nhập cuối, và Cột hành động (Sửa, Khóa/Mở khóa, Đặt lại mật khẩu). |
| **3** | Nhấn nút **"Thêm người dùng mới"**. | Hiển thị Form/Modal tạo người dùng: Tên đăng nhập (bắt buộc, duy nhất), Họ và tên, Email (bắt buộc, duy nhất), Mật khẩu khởi tạo, và Chọn Vai trò (`ADMIN` hoặc `STAFF`). |
| **4** | Nhập đầy đủ thông tin tài khoản mới $\rightarrow$ Nhấn **"Tạo tài khoản"**. | Thực hiện kiểm tra tính hợp lệ (Validation):<br>- Kiểm tra Tên đăng nhập và Email chưa tồn tại trong hệ thống.<br>- Kiểm tra định dạng Email hợp lệ.<br>- Kiểm tra Mật khẩu khởi tạo thỏa mãn độ mạnh ($\ge 8$ ký tự). |
| **5** | | Thực hiện lưu vào cơ sở dữ liệu:<br>1. Mã hóa mật khẩu khởi tạo bằng thuật toán bcrypt.<br>2. Lưu bản ghi tài khoản mới với `IsActive = true` và `MustChangePassword = true`.<br>3. Ghi log kiểm toán thao tác tạo tài khoản. |
| **6** | | Hiển thị thông báo: *"Tạo tài khoản người dùng [Username] thành công!"* và cập nhật lại bảng danh sách. |

---

## 5. Alternative Flows

### A1. Chỉnh sửa thông tin tài khoản người dùng
* **A1.1.** Admin nhấn nút "Chỉnh sửa" tại một dòng người dùng.
* **A1.2.** Hệ thống mở Form chỉnh sửa: Cho phép sửa Họ tên, Email, và thay đổi Vai trò (`Role`). Khóa không cho sửa ô Tên đăng nhập (Username).
* **A1.3.** Nếu đổi vai trò từ `ADMIN` sang `STAFF`, hệ thống kiểm tra số lượng Admin đang hoạt động (phải còn ít nhất 1 Admin khác).
* **A1.4.** Admin sửa thông tin $\rightarrow$ Nhấn "Lưu thay đổi".
* **A1.5.** Hệ thống kiểm tra Email mới không bị trùng với người dùng khác $\rightarrow$ Cập nhật thông tin $\rightarrow$ Thông báo: *"Cập nhật tài khoản thành công"*.

### A2. Khóa / Vô hiệu hóa tài khoản người dùng (`IsActive = false`)
* **A2.1.** Admin nhấn nút "Khóa tài khoản" tại dòng người dùng muốn vô hiệu hóa.
* **A2.2.** Hệ thống kiểm tra ràng buộc an toàn:
  * Nếu tài khoản được chọn là tài khoản Admin đang đăng nhập $\rightarrow$ Từ chối (`E3`).
  * Nếu tài khoản được chọn là tài khoản `ADMIN` duy nhất còn hoạt động trong hệ thống $\rightarrow$ Từ chối (`E4`).
* **A2.3.** Hệ thống hiển thị hộp thoại xác nhận: *"Bạn có chắc chắn muốn khóa tài khoản [Username]? Người dùng này sẽ bị chấm dứt phiên làm việc ngay lập tức và không thể đăng nhập nữa."*.
* **A2.4.** Admin nhấn "Đồng ý khóa".
* **A2.5.** Hệ thống cập nhật `IsActive = false`. Tại Middleware của request tiếp theo từ người dùng bị khóa, hệ thống trả về `401 Unauthorized` và đẩy văng ra trang Login tức thời.

### A3. Mở khóa tài khoản người dùng (`IsActive = true`)
* **A3.1.** Admin nhấn nút "Mở khóa" tại dòng tài khoản đang bị khóa.
* **A3.2.** Hệ thống hiển thị hộp thoại xác nhận $\rightarrow$ Admin nhấn "Đồng ý".
* **A3.3.** Hệ thống cập nhật `IsActive = true` $\rightarrow$ Thông báo: *"Đã khôi phục hoạt động cho tài khoản [Username]"*.

### A4. Đặt lại mật khẩu cho người dùng (Reset Password)
* **A4.1.** Khi nhân viên quên mật khẩu và yêu cầu cấp lại, Admin nhấn nút **"Đặt lại mật khẩu"** tại dòng người dùng đó.
* **A4.2.** Hệ thống hiển thị popup: Cho phép Admin nhập mật khẩu tạm thời mới (hoặc bấm nút "Tạo mật khẩu ngẫu nhiên").
* **A4.3.** Admin nhập mật khẩu tạm thời $\rightarrow$ Nhấn "Xác nhận đặt lại".
* **A4.4.** Hệ thống mã hóa bcrypt mật khẩu mới, cập nhật vào CSDL, và gán cờ `MustChangePassword = true` (để nhân viên buộc phải đổi mật khẩu khi đăng nhập tại `UC-015`).
* **A4.5.** Thông báo: *"Đã đặt lại mật khẩu cho tài khoản [Username]. Vui lòng gửi mật khẩu tạm thời này cho nhân viên."*.

---

## 6. Exception Flows

### E1. Người dùng không có quyền Admin cố gắng truy cập (Access Denied)
* **E1.1.** Người dùng có vai trò `STAFF` cố gắng truy cập trực tiếp đường dẫn URL quản lý tài khoản.
* **E1.2.** Hệ thống chặn truy cập, trả về mã lỗi `403 Forbidden` và hiển thị thông báo: *"Bạn không có quyền truy cập trang quản trị tài khoản này."*.

### E2. Trùng Tên đăng nhập hoặc Email (Duplicate Username / Email)
* **E2.1.** Tại Bước 4 của Main Flow, Tên đăng nhập hoặc Email đã tồn tại trên hệ thống.
* **E2.2.** Hệ thống báo lỗi tại ô nhập: *"Tên đăng nhập hoặc Email này đã được sử dụng. Vui lòng chọn giá trị khác."* và giữ nguyên form.

### E3. Admin tự khóa hoặc tự hạ quyền của chính mình (Self-lock Protection)
* **E3.1.** Admin đang đăng nhập thực hiện hành động "Khóa tài khoản" hoặc đổi vai trò của chính mình từ `ADMIN` thành `STAFF`.
* **E3.2.** Hệ thống từ chối thực hiện và hiển thị cảnh báo an toàn: *"Không thể tự khóa tài khoản hoặc tự hạ quyền quản trị của chính bạn."*.

### E4. Cố gắng khóa hoặc hạ quyền tài khoản Admin duy nhất còn lại
* **E4.1.** Hệ thống kiểm tra chỉ còn đúng 1 tài khoản `ADMIN` đang hoạt động (`IsActive = true`), Admin cố gắng khóa hoặc hạ quyền tài khoản này.
* **E4.2.** Hệ thống chặn thao tác và thông báo: *"Không thể khóa tài khoản này vì đây là tài khoản Quản trị viên duy nhất đang hoạt động trong hệ thống. Vui lòng tạo thêm tài khoản Admin khác trước khi thực hiện."*.

---

## 7. Business Rules Applied (Quy Tắc Nghiệp Vụ Áp Dụng)

* **BR-021 (Kiểm soát truy cập tài khoản):** Tài khoản có `IsActive = false` bị chặn truy cập và thu hồi quyền hạn ngay lập tức tại Middleware.
* **RBAC Matrix (Phân quyền quản trị):** Chỉ duy nhất vai trò `ADMIN` mới có quyền truy cập và thao tác màn hình `UC-016`.
* **Self-Lock & Minimum Active Admin Protection:** Luôn đảm bảo hệ thống có ít nhất 1 Quản trị viên hoạt động để không bao giờ bị mất quyền quản trị.

---

## 8. Related Requirements (Yêu Cầu Chức Năng Liên Quan)

* **FR-032:** Quản lý danh sách tài khoản người dùng (CRUD - Tạo mới, Xem, Cập nhật thông tin, Khóa/Mở khóa tài khoản, Đặt lại mật khẩu) dành riêng cho vai trò Quản trị viên (`ADMIN`).
* **FR-033:** Phân quyền vai trò người dùng (gán vai trò `STAFF` hoặc `ADMIN`).

