# Use Case Specification: UC-015 - Đăng Nhập & Quản Lý Phiên Làm Việc

---

## 1. Basic Information

* **Use Case ID:** `UC-015`
* **Use Case Name:** Đăng nhập & Quản lý phiên làm việc (Authentication & Session Management)
* **Primary Actor:** `Guest` / `Authenticated User` (`Purchasing Staff`, `System Admin`)
* **Supporting Actor:** Không có
* **Goal:** Người dùng muốn xác thực danh tính bằng Tên đăng nhập (hoặc Email) và Mật khẩu để truy cập vào hệ thống với đúng vai trò và quyền hạn tương ứng (`ADMIN` hoặc `STAFF`), duy trì phiên làm việc an toàn (Session/JWT Token thời hạn 8 tiếng, tự động khóa sau 30 phút không hoạt động), thực hiện Đổi mật khẩu cá nhân (bắt buộc ở lần đăng nhập đầu tiên), hoặc Đăng xuất an toàn khỏi hệ thống khi kết thúc phiên làm việc.
* **Trigger:**
  * Người dùng chưa đăng nhập truy cập vào hệ thống (tự động chuyển hướng về trang Đăng nhập).
  * Người dùng đã đăng nhập nhấn nút "Đổi mật khẩu" hoặc "Đăng xuất" từ menu tài khoản ở góc trên bên phải giao diện.

---

## 2. Preconditions

1. Người dùng có tài khoản hợp lệ đã được cấp bởi Quản trị viên (`UC-016`).
2. Tài khoản đang ở trạng thái hoạt động (`IsActive = true`).

---

## 3. Postconditions

### 3.1. Thành công (Success End Condition):
* **Khi Đăng nhập thành công:**
  * Hệ thống cấp mã phiên làm việc an toàn (JWT Token / Session Cookie có thời hạn 8 tiếng).
  * Tải thông tin người dùng (Họ tên, Email, Vai trò `ADMIN` hoặc `STAFF`).
  * Nếu tài khoản có cờ `MustChangePassword = true` (lần đầu đăng nhập hoặc vừa được reset mật khẩu): Bắt buộc người dùng đổi mật khẩu mới trước khi vào hệ thống.
  * Nếu tài khoản bình thường: Điều hướng người dùng đến màn hình chính tương ứng với quyền hạn (Staff $\rightarrow$ `UC-004: Dashboard Tồn kho`; Admin $\rightarrow$ `UC-004` hoặc `UC-016`).
* **Khi Đổi mật khẩu thành công:**
  * Mật khẩu mới được mã hóa (bằng thuật toán băm an toàn bcrypt/Argon2) và lưu vào cơ sở dữ liệu; gỡ bỏ cờ `MustChangePassword = false`.
  * Hiển thị thông báo thành công và duy trì phiên làm việc an toàn.
* **Khi Đăng xuất thành công:**
  * Hủy bỏ toàn bộ Token/Session hiện tại ở cả phía Client và Server.
  * Điều hướng người dùng quay trở lại trang Đăng nhập.

### 3.2. Thất bại (Failure End Condition):
* Từ chối đăng nhập hoặc đổi mật khẩu; hiển thị thông báo lỗi bảo mật phù hợp; không cấp quyền truy cập hệ thống.

---

## 4. Main Success Flow (Đăng nhập hệ thống)

| Step | Actor (Guest / User) | System |
| :---: | :--- | :--- |
| **1** | Truy cập địa chỉ ứng dụng hoặc màn hình Đăng nhập. | Hiển thị giao diện Đăng nhập gồm: Ô nhập Tên đăng nhập / Email, Ô nhập Mật khẩu (kèm nút ẩn/hiện mật khẩu), Nút bấm "Đăng nhập". |
| **2** | Nhập Tên đăng nhập (hoặc Email) và Mật khẩu $\rightarrow$ Nhấn nút **"Đăng nhập"**. | Kiểm tra tính hợp lệ cơ bản của dữ liệu nhập (không để trống). |
| **3** | | Thực hiện quy trình xác thực phía Server:<br>1. Tìm kiếm tài khoản trong cơ sở dữ liệu.<br>2. Kiểm tra trạng thái tài khoản `IsActive`: Nếu `false` $\rightarrow$ Từ chối (`E2`).<br>3. Kiểm tra mã băm mật khẩu (Hash verification): Nếu không khớp $\rightarrow$ Từ chối (`E1`).<br>4. Khởi tạo phiên làm việc an toàn (Tạo JWT Token có thời hạn 8 tiếng kèm Claims: `UserId`, `Username`, `FullName`, `Role`).<br>5. Ghi nhận thời gian đăng nhập gần nhất (`LastLoginAt`). |
| **4** | | Kiểm tra cờ `MustChangePassword`:<br>- **Nếu `MustChangePassword = true` (Đăng nhập lần đầu):** Bật popup bắt buộc đổi mật khẩu mới (chuyển sang luồng `A1`).<br>- **Nếu `MustChangePassword = false`:** Lưu Token vào bộ nhớ an toàn (Secure Cookie / Local Storage), tải Menu tương ứng với Vai trò (`ADMIN` hoặc `STAFF`), và điều hướng người dùng vào màn hình chính `UC-004: Dashboard Tồn kho & Cảnh báo rủi ro`. |

---

## 5. Alternative Flows

### A1. Bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên (First-time Login Force Change)
* **A1.1.** Hệ thống hiển thị modal khóa màn hình: *"Đây là lần đầu tiên bạn đăng nhập vào hệ thống. Vui lòng thiết lập mật khẩu mới để bảo vệ an toàn tài khoản của bạn."*
* **A1.2.** Người dùng nhập: Mật khẩu mới và Xác nhận mật khẩu mới $\rightarrow$ Nhấn "Lưu mật khẩu mới".
* **A1.3.** Hệ thống kiểm tra độ mạnh mật khẩu ($\ge 8$ ký tự, gồm chữ và số) $\rightarrow$ Mã hóa bcrypt và lưu vào cơ sở dữ liệu $\rightarrow$ Cập nhật cờ `MustChangePassword = false`.
* **A1.4.** Thông báo: *"Thiết lập mật khẩu thành công! Chào mừng bạn đến với hệ thống."* $\rightarrow$ Chuyển tiếp vào Dashboard `UC-004`.

### A2. Chủ động Đổi mật khẩu cá nhân (Change Password)
* **A2.1.** Người dùng đã đăng nhập click vào Avatar / Tên tài khoản ở góc trên bên phải $\rightarrow$ Chọn **"Đổi mật khẩu"**.
* **A2.2.** Hệ thống mở Form đổi mật khẩu gồm 3 ô nhập: Mật khẩu hiện tại, Mật khẩu mới, Xác nhận mật khẩu mới.
* **A2.3.** Người dùng nhập thông tin $\rightarrow$ Nhấn **"Lưu mật khẩu mới"**.
* **A2.4.** Hệ thống kiểm tra: Mật khẩu hiện tại phải đúng, mật khẩu mới $\ge 8$ ký tự, khớp xác nhận và không trùng mật khẩu cũ $\rightarrow$ Cập nhật hash mới $\rightarrow$ Thông báo thành công.

### A3. Đăng xuất khỏi hệ thống (Logout)
* **A3.1.** Người dùng click vào Menu tài khoản $\rightarrow$ Chọn **"Đăng xuất"**.
* **A3.2.** Hệ thống hiển thị hộp thoại xác nhận: *"Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?"*.
* **A3.3.** Người dùng nhấn "Đồng ý".
* **A3.4.** Hệ thống thu hồi / hủy Token phiên làm việc ở Server, xóa thông tin lưu ở Client, và chuyển hướng người dùng về trang Đăng nhập.

---

## 6. Exception Flows

### E1. Sai Tên đăng nhập hoặc Mật khẩu (Invalid Credentials)
* **E1.1.** Tại Bước 3 của Main Flow, Tên đăng nhập không tồn tại hoặc Mật khẩu không chính xác.
* **E1.2.** Hệ thống hiển thị thông báo lỗi bảo mật chung: *"Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại."* (không tiết lộ tài khoản có tồn tại hay không để chống dò quét tài khoản).
* **E1.3.** Hệ thống tăng biến đếm số lần đăng nhập sai. Nếu sai liên tiếp quá 5 lần, tạm thời khóa đăng nhập của IP/tài khoản này trong 15 phút (theo `NFR-004`).

### E2. Tài khoản bị vô hiệu hóa (Account Inactive / Locked)
* **E2.1.** Tài khoản có trạng thái `IsActive = false` (do Admin khóa tại `UC-016`).
* **E2.2.** Hệ thống từ chối đăng nhập và hiển thị thông báo: *"Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ Quản trị viên hệ thống để được hỗ trợ."*

### E3. Hết hạn phiên làm việc do không hoạt động (Session Inactivity Timeout)
* **E3.1.** Người dùng không thao tác trên hệ thống trong vòng **30 phút liên tục** hoặc phiên đã vượt quá **8 tiếng**.
* **E3.2.** Khi người dùng click thao tác mới, hệ thống trả về mã lỗi `401 Unauthorized` $\rightarrow$ Tự động chuyển hướng về trang Đăng nhập kèm thông báo: *"Phiên làm việc đã hết hạn do không hoạt động trong 30 phút. Vui lòng đăng nhập lại."*

### E4. Đổi mật khẩu thất bại (Change Password Validation Failure)
* **E4.1.** Tại Luồng A1 hoặc A2, người dùng nhập sai mật khẩu cũ, hoặc mật khẩu mới quá ngắn ($< 8$ ký tự), hoặc xác nhận mật khẩu không khớp.
* **E4.2.** Hệ thống hiển thị thông báo lỗi tương ứng tại từng ô nhập liệu và giữ nguyên form để người dùng sửa lại.

---

## 7. Business Rules Applied (Quy Tắc Nghiệp Vụ Áp Dụng)

* **BR-021 (Kiểm soát truy cập tài khoản):** Chỉ cho phép người dùng có `IsActive = true` đăng nhập và sử dụng hệ thống.
* **RBAC Matrix (Phân quyền theo vai trò):**
  * `ADMIN`: Toàn quyền cấu hình Master Data (`UC-001`, `UC-002`), Quản lý tài khoản (`UC-016`), Cấu hình trọng số NCC (`UC-017`), và giám sát toàn bộ báo cáo phân tích.
  * `STAFF`: Vận hành trực tiếp các nghiệp vụ mua hàng hàng ngày (`UC-003` $\rightarrow$ `UC-014`); chỉ có quyền xem (Read-only) các màn hình cấu hình Master Data.

---

## 8. Related Requirements (Yêu Cầu Chức Năng & Phi Chức Năng Liên Quan)

* **FR-031:** Hệ thống cung cấp chức năng đăng nhập, đăng xuất và quản lý phiên làm việc an toàn cho người dùng (hỗ trợ đổi mật khẩu cá nhân).
* **FR-033:** Hệ thống phân quyền truy cập theo 2 vai trò: Quản trị viên (`ADMIN`) và Nhân viên mua hàng (`STAFF`).
* **NFR-009:** Mật khẩu tài khoản người dùng phải được mã hóa một chiều (Hashing) an toàn trước khi lưu trữ vào cơ sở dữ liệu.
* **NFR-010:** Hệ thống phải thực thi cơ chế kiểm soát truy cập dựa trên vai trò (RBAC).
* **NFR-011:** Phiên đăng nhập (Session/Token) phải có cơ chế hết hạn hợp lý để bảo vệ hệ thống.

