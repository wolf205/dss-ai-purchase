# HANDOFF — <task-id>: [Báo Cáo Nghiệm Thu & Bàn Giao]

---

## 1. Tóm Tắt Kết Quả Triển Khai
- **Mã Ticket / Task:** `<task-id>`
- **Trạng thái:** `[HOÀN TẤT / HOÀN TẤT MỘT PHẦN]`
- **Mức độ đáp ứng Acceptance Criteria:** [X/Y AC đạt 100%]
- **Khác biệt so với PLAN ban đầu:** [Ghi rõ lý do nếu có thay đổi so với plan]

---

## 2. Kết Quả Nghiệm Thu Cơ Học (Verification Results)

### 2.1. Quét Ranh Giới Kiến Trúc (Architecture Boundary Scan)
| Lệnh Kiểm Tra | Kết Quả Thực Tế | Tiêu Chuẩn | Trạng Thái |
| :--- | :--- | :--- | :--- |
| `git grep ... domain/` | [Số matches] | 0 matches | `[PASS / FAIL]` |
| `git grep ... application/` | [Số matches] | 0 matches | `[PASS / FAIL]` |
| `git grep ... api/` (Prisma direct) | [Số matches] | 0 matches | `[PASS / FAIL]` |

### 2.2. Kiểm Tra Biên Dịch (Compilation)
- `backend (npm run build)`: `[PASS / FAIL]` (Mã thoát: 0)
- `frontend (npm run build)`: `[PASS / FAIL]` (Mã thoát: 0)
- `frontend (npm run lint)`: `[PASS / FAIL]` (0 errors)

### 2.3. Kiểm Tra Tự Động Toàn Bộ Test Suite (Automated Tests)
- `backend (npm test)`: [X/X test suites passed, Y/Y tests passed]
- `ai-service (pytest)`: [Z/Z passed]

---

## 3. Danh Sách Tệp Thay Đổi (Changed Files)
- `[NEW]` [đường dẫn tệp]
- `[MODIFY]` [đường dẫn tệp]

---

## 4. Cập Nhật Tri Thức Nghiệp Vụ (.agents/modules/)
- [ ] Đã bổ sung/cập nhật thông tin nghiệp vụ thực tế vào `.agents/modules/<domain>/overview.md`? `[Đã cập nhật / Không có thay đổi nghiệp vụ]`.
- Dòng cập nhật: `- <task-id> — [Tóm tắt 1 dòng] (cập nhật YYYY-MM-DD)`.

---

## 5. Hướng Dẫn Kiểm Thử Thủ Công & Ghi Chú Reviewer
[Mô tả các bước người dùng có thể chạy thử nghiệm trên UI/Postman để kiểm tra tính năng].
