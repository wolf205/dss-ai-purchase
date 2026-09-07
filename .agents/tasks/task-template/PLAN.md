# PLAN — <task-id>: [Tên Kế Hoạch Triển Khai]

Yêu cầu tiên quyết: `SPEC.md` đã được điền và xác nhận.

---

## 1. Phân Tích Tác Động (Impact Analysis)
- **Tầng bị ảnh hưởng:** `[Domain | Application | Infrastructure | Presentation | AI Service | Frontend]`
- **Cơ sở dữ liệu:** Có migration mới không? `[Có / Không]`. Có nguy cơ mất dữ liệu không?
- **Hợp đồng API:** Có thay đổi endpoint hoặc request/response payload không?

---

## 2. Kế Hoạch Triển Khai Cuốn Chiếu Theo Chiều Sâu (Inside-Out)

### Bước 1: Domain Layer (`backend/src/domain/`)
- [ ] `[NEW/MODIFY]` `entities/...`: [Mô tả thực thể, quy tắc bất biến]
- [ ] `[NEW/MODIFY]` `value-objects/...`: [Mô tả Value Object]
- [ ] `[NEW/MODIFY]` `services/...`: [Mô tả logic tính toán thuần túy]
- [ ] `[NEW/MODIFY]` `repositories/...`: [Định nghĩa interface repository]
- [ ] `[NEW/MODIFY]` `exceptions/...`: [Định nghĩa DomainException nếu cần]

### Bước 2: Application Layer (`backend/src/application/`)
- [ ] `[NEW/MODIFY]` `ports/...`: [Định nghĩa Interface giao tiếp ngoại vi]
- [ ] `[NEW/MODIFY]` `dtos/...`: [Định nghĩa Input/Output DTOs]
- [ ] `[NEW/MODIFY]` `use-cases/...`: [Triển khai Use Case điều phối]
- [ ] `[NEW/MODIFY]` `exceptions/...`: [Định nghĩa ApplicationException]

### Bước 3: Infrastructure Layer (`backend/src/infrastructure/`)
- [ ] `[NEW/MODIFY]` `database/schema.prisma` / Migrations: [Nếu có sửa DB]
- [ ] `[NEW/MODIFY]` `repositories/...`: [Triển khai Prisma Repository tương ứng]
- [ ] `[NEW/MODIFY]` `external-services/...`: [Triển khai client gọi AI nếu cần]

### Bước 4: Presentation Layer (`backend/src/api/`)
- [ ] `[NEW/MODIFY]` `validations/...`: [Định nghĩa Zod Schema xác thực]
- [ ] `[NEW/MODIFY]` `controllers/...`: [Triển khai Controller gọi Use Case]
- [ ] `[NEW/MODIFY]` `routes/...`: [Gắn Controller vào Express Router]

### Bước 5: AI Service (nếu có) (`ai-service/`)
- [ ] `[NEW/MODIFY]` `app/...`: [Cập nhật endpoint FastAPI hoặc thuật toán]

### Bước 6: Frontend UI (nếu có) (`frontend/`)
- [ ] `[NEW/MODIFY]` `src/features/...`: [Tạo/sửa UI component, React Query hook]

---

## 3. Kế Hoạch Kiểm Thử Tự Động (Test Plan)
- **Unit Tests Backend (Jest):**
  - File test: `backend/tests/unit/...`
  - Kịch bản kiểm thử: [Liệt kê các ca kiểm thử chính, ca biên phân chia cho 0]
- **Unit Tests AI Service (Pytest):**
  - File test: `ai-service/tests/...`
- **Architecture Boundary Scan:**
  - Chạy `git grep` kiểm tra tính tinh khiết của Domain và Application.

---

## 4. Phương Án Phục Hồi (Rollback Strategy)
- Nếu gặp lỗi nghiêm trọng trong quá trình triển khai:
  - Khôi phục mã nguồn: `git checkout ...`
  - Khôi phục CSDL: [Lệnh rollback migration nếu có]
