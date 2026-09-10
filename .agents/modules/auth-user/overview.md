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

- **Phân quyền 2 vai trò (`FR-033`, `UserRole`):**
  1. `ADMIN`: Toàn quyền hệ thống, cấu hình tham số, cấu hình trọng số nhà cung cấp, quản lý tài khoản người dùng (`UC-016`).
  2. `STAFF`: Nhân viên mua hàng, xem phân tích DSS, theo dõi tồn kho, lập/duyệt đơn mua hàng (PO), và ghi nhận nhận hàng kho (`UC-001` $\rightarrow$ `UC-014`).
- **Bảo mật & Mật khẩu:** Mật khẩu tối thiểu $\ge 8$ ký tự, bắt buộc được băm một chiều bằng Bcrypt (Salt rounds $\ge 10$) qua Port `IPasswordHasher` (`NFR-009`).
- **Phiên làm việc:** Sử dụng Stateless JWT Token thời hạn 8 tiếng (`DEC-API-003`, `NFR-011`) qua Port `ITokenService`.
- **Ràng buộc an toàn quản trị (`UC-016`):**
  * `Self-Lock Protection`: Admin không được tự khóa tài khoản hoặc tự hạ quyền quản trị của chính mình.
  * `Minimum Active Admin Protection`: Luôn đảm bảo có ít nhất 1 tài khoản `ADMIN` đang hoạt động trong hệ thống.

---

## 3. Thực thể & Bảng Dữ liệu Phụ trách

- Bảng: `users`.
- Domain Entity: `User`.
- Presentation: `authMiddleware`, `rbacMiddleware`.

---

## 4. Nguồn Cập nhật

- **2026-09-08:** Chuẩn hóa toàn diện 10 endpoints Nhóm 1 theo đặc tả `endpoints-spec.md`, bổ sung `ResetPasswordUseCase`, cơ chế `Self-Lock Protection` và `Minimum Active Admin Protection`. Đồng bộ chuẩn hóa 2 vai trò `ADMIN` và `STAFF` (`FR-033`).
