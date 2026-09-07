# SPEC — <task-id>: [Tên Tác Vụ / Tính Năng]

## 1. Yêu Cầu Gốc & Bối Cảnh
- **Mã Ticket / Phase:** `<task-id>`
- **Nhóm Nghiệp Vụ:** `[inventory | purchase-order | forecast | master-data | auth-user]`
- **Tài liệu tham chiếu:** `docs/03-use-cases/UC-XXX...` và `.agents/modules/...`
- **Mô tả bài toán:** [Mô tả ngắn gọn mục tiêu người dùng mong muốn đạt được].

---

## 2. Ranh Giới Phạm Vi (Scope Boundaries)
- **Trong phạm vi (In-Scope):**
  - [Liệt kê các tính năng, endpoint, bảng dữ liệu hoặc UI cần thực hiện].
- **Ngoài phạm vi (Out-of-Scope):**
  - [Liệt kê các phần việc không làm trong task này để tránh phình phạm vi].

---

## 3. Tiêu Chuẩn Nghiệm Thu (Acceptance Criteria - AC)
1. **AC-1:** [Hành vi mong đợi 1]
2. **AC-2:** [Hành vi mong đợi 2]
3. **AC-3:** [Hành vi mong đợi 3]

---

## 4. Ma Trận Truy Xuất Kiến Trúc (Clean Architecture Traceability Matrix)

| Thành Phần | Tên File / Class / Model Tương Ứng | Ghi Chú |
| :--- | :--- | :--- |
| **Use Case / Nghiệp vụ** | `UC-XXX` | Đặc tả tại `docs/03-use-cases/` |
| **Domain Layer** | Entity, Value Object, Domain Service | `backend/src/domain/...` |
| **Application Layer** | Use Case, DTO, Port Interface | `backend/src/application/...` |
| **Infrastructure Layer**| Prisma Repository, Adapter | `backend/src/infrastructure/...` |
| **Presentation Layer** | Controller, Zod Schema, Express Route | `backend/src/api/...` |
| **Frontend UI (nếu có)** | React Component, TanStack Query Hook | `frontend/src/features/...` |

---

## 5. Rà Soát Điểm Dừng Bắt Buộc (Stop Points Check)
- [ ] Có thay đổi DB Schema / Prisma model không? *(Có / Không)*
- [ ] Có thay đổi API Contract / Endpoint / Mã lỗi không? *(Có / Không)*
- [ ] Có thay đổi Business Rules / PO State Machine không? *(Có / Không)*
- [ ] Có tái cấu trúc đa tầng (Refactor) không? *(Có / Không)*
- **Phân loại:** `[Major Scope (Cần duyệt Plan) | Minor Scope (Fast-track)]`

---

## 6. Xác Nhận (Sign-off)
- **Người xác nhận:** [Tên người dùng / Tech Lead]
- **Ngày xác nhận:** YYYY-MM-DD
