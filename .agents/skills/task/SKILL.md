---
name: task
description: Chạy quy trình task SPEC → PLAN → Implement → Verify của dự án DSS AI Purchase (GEMINI.md mục 4) — tạo/điền SPEC.md, PLAN.md, HANDOFF.md dưới .agents/tasks/<task-id>/ từ khuôn mẫu .agents/tasks/task-template/. Hỗ trợ phân loại Major Scope (cổng duyệt bắt buộc) vs Minor Scope (fast-track).
user-invocable: true
argument-hint: <task-id> [spec|plan|implement|verify|status]
---

# /task — SPEC → PLAN → Implement → Verify

Arguments truyền vào: `$ARGUMENTS` — token đầu là `<task-id>` (mã ticket hoặc số hiệu Phase, ví dụ: `PHASE-1`, `UC-004`, `BUG-101`; **bắt buộc**). Token thứ hai (tùy chọn) là bước: `spec`, `plan`, `implement`, `verify`, hoặc `status`.

Toàn bộ trạng thái của một task nằm ở `.agents/tasks/<task-id>/` (`SPEC.md`, `PLAN.md`, `HANDOFF.md`).

---

## 1. Nguyên tắc Phân loại Tác vụ

Trước khi bắt đầu, Agent xác định tác vụ thuộc nhóm nào:
- **Nhóm 1: Tác vụ Trọng yếu (Major Scope):** Thêm Use Case mới, đổi CSDL/Migration/Schema, đổi API/DTO, đổi Business Rules/PO State Machine, refactor lớn $\longrightarrow$ **Bắt buộc đi đủ 4 bước và DỪNG LẠI XIN DUYỆT PLAN** trước khi viết code.
- **Nhóm 2: Tác vụ Tinh gọn (Minor Scope):** Fix bug nhỏ cục bộ 1 hàm/1 file, đổi text/UI/translation, thêm tests, sửa lỗi type TypeScript $\longrightarrow$ **Được phép Fast-Track:** Bỏ qua bước tạo `PLAN.md` và gate duyệt, thực hiện trực tiếp nhưng **bắt buộc vượt qua bước Verify cơ học**.

---

## 2. Các Bước Thực thi Chi tiết

### `status`
1. Kiểm tra `.agents/tasks/<task-id>/` có tồn tại chưa.
2. Báo cáo trạng thái các file và gợi ý bước tiếp theo.

### `spec`
1. Giao subagent `task-scaffolder` tạo thư mục `.agents/tasks/<task-id>/` từ `task-template/`.
2. Đọc file đặc tả tương ứng trong `docs/03-use-cases/` và bảng điều phối tại `.agents/modules/`.
3. Điền `SPEC.md`: Mục tiêu, Acceptance Criteria (AC), Ràng buộc In/Out of Scope, Ma trận truy xuất sang Clean Architecture (`Use Case` $\rightarrow$ `Domain` $\rightarrow$ `Application` $\rightarrow$ `Infrastructure` $\rightarrow$ `Presentation`).
4. Với Major Scope: Chờ người dùng xác nhận nội dung `SPEC.md`.

### `plan`
1. Yêu cầu `SPEC.md` đã hoàn tất.
2. Lập kế hoạch theo chiều **Inside-Out**:
   - Bước 1: `Domain` (Entities, Value Objects, Domain Services, Repositories Interfaces, Pure Exceptions).
   - Bước 2: `Application` (Ports, DTOs, Use Cases, App Exceptions).
   - Bước 3: `Infrastructure` (Prisma Repositories, External Clients, Database Transactions).
   - Bước 4: `Presentation` (Zod Validations, Express Controllers, Middlewares, Routes).
   - Kế hoạch Unit Test (Jest / Pytest) và phương án Rollback.
3. 🛑 **DỪNG LẠI CHỜ NGƯỜI DÙNG DUYỆT** (nếu là Major Scope).

### `implement`
1. Triển khai mã nguồn đúng theo thứ tự các layer trong `PLAN.md`.
2. Tuân thủ nghiêm ngặt ma trận Clean Architecture (không import chéo).
3. Viết unit tests tương ứng với logic vừa tạo.

### `verify`
1. Giao subagent `clean-arch-guard` chạy các lệnh `git grep` quét vi phạm ranh giới.
2. Giao subagent `test-runner` chạy `npm test` và `pytest`.
3. Tổng hợp kết quả nghiệm thu cơ học vào `HANDOFF.md`.
4. Cập nhật thông tin thực tế (nếu có thay đổi) vào mục "Nguồn cập nhật" của `.agents/modules/<domain>/overview.md`.
5. Báo cáo kết quả và sẵn sàng bàn giao.
