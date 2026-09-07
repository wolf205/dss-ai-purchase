# Nghiệp vụ: Xác Thực & Quản Trị Người Dùng (Auth & User Domain)

Nhóm chức năng đăng nhập, cấp phát JWT token, quản lý phiên làm việc và phân quyền dựa trên vai trò (RBAC).

---

## 1. Bản đồ Use Cases & Tài liệu Nguồn Chân lý

| Mã Use Case | Tên Chức Năng | File Đặc Tả Gốc trong `docs/` | Trạng thái Triển khai |
| :--- | :--- | :--- | :--- |
| **UC-015** | Đăng nhập & Quản lý phiên làm việc cá nhân | [`docs/03-use-cases/UC-015-dang-nhap-va-quan-ly-phien-lam-viec.md`](../../docs/03-use-cases/UC-015-dang-nhap-va-quan-ly-phien-lam-viec.md) | Baseline Spec |
| **UC-016** | Quản lý tài khoản người dùng (CRUD, Khóa, Phân quyền) | [`docs/03-use-cases/UC-016-quan-ly-tai-khoan-nguoi-dung.md`](../../docs/03-use-cases/UC-016-quan-ly-tai-khoan-nguoi-dung.md) | Baseline Spec |

---

## 2. Quy tắc Nghiệp vụ Cốt lõi (Business Rules)

- **`BR-026` (Phân quyền 3 vai trò):**
  1. `ADMIN`: Toàn quyền hệ thống, cấu hình trọng số nhà cung cấp, quản lý tài khoản.
  2. `PURCHASE_STAFF`: Nhân viên mua hàng, xem phân tích DSS, lập và duyệt đơn mua hàng (PO).
  3. `WAREHOUSE_STAFF`: Nhân viên kho, kiểm nhận hàng (Goods Receipt) và cập nhật số lượng thực nhập.
- **Bảo mật:** Mật khẩu bắt buộc được băm bằng Bcrypt (Salt rounds $\ge 10$) qua Port `IPasswordHasher`.
- **Phiên làm việc:** Sử dụng JWT Token có thời hạn (Access Token 1h, Refresh Token 7 ngày) qua Port `ITokenService`.

---

## 3. Thực thể & Bảng Dữ liệu Phụ trách

- Bảng: `users`.
- Domain Entity: `User`.
- Presentation: `authMiddleware`, `rbacMiddleware`.

---

## 4. Nguồn Cập nhật

*(Chưa có task nào cập nhật. Khởi tạo từ baseline tài liệu ban đầu).*
