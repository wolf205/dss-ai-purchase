# GEMINI.md — DSS AI Purchase

File này áp dụng cho toàn bộ repo (`backend/`, `ai-service/`, `frontend/`, `docs/`). Đây là bản Hiến pháp Kỹ thuật và Hợp đồng Kiến trúc bắt buộc cho AI Agent trong suốt vòng đời dự án.

---

## 1. Cấu trúc Dự án & Bản chất Hệ thống

- **DSS AI Purchase** là Hệ thống Hỗ trợ Ra Quyết định Mua hàng Bán lẻ Tích hợp AI (Decision Support System — Human-in-the-loop) cho cửa hàng bán lẻ quy mô độc lập (< 1.000 SKU).
- Hệ thống gồm 3 thành phần chính và cơ sở dữ liệu:
  1. `backend/`: Node.js 20+ + Express + TypeScript + **Clean Architecture 4 tầng** + **Prisma ORM** + Zod validation.
  2. `ai-service/`: Python 3.10+ + **FastAPI** — Mô hình **Stateless Pure Compute Engine** (dự báo Holt-Winters, fallback SMA-7, WAPE/MAE, dải tin cậy 95%).
  3. `frontend/`: React 18 + Vite + TypeScript + **Feature-Based Architecture** + **TailwindCSS** + **TanStack Query** + **Apache ECharts**.
  4. Cơ sở dữ liệu: **PostgreSQL 16+** (18 bảng chuẩn hóa 3NF, kiểm soát toàn vẹn ACID).
  5. Mạng nội bộ & Triển khai: Docker Compose (`dss-network`).
- **Tài liệu nguồn chân lý (`docs/`)**: Toàn bộ yêu cầu nghiệp vụ (34 FR, 26 BR, 13 NFR), 17 tài liệu Use Case (`UC-001` đến `UC-017`), ERD 18 bảng (`docs/04-data-model/`), kiến trúc C4 (`docs/05-architecture/`) và đặc tả API (`docs/06-api-design/`) đã được chuẩn hóa chi tiết. **Tài liệu đặc tả là luật (Specification As Law)** — không tự ý thay đổi tên trường, công thức toán, hoặc tự bịa ra endpoint mới.

---

## 2. Hợp đồng Ranh giới Clean Architecture Bất biến

Chiều phụ thuộc của mã nguồn backend **CHỈ ĐƯỢC PHÉP HƯỚNG VÀO TRONG** (Inward Dependency):

$$\text{Presentation (API)} \longrightarrow \text{Infrastructure} \longrightarrow \text{Application} \longrightarrow \text{Domain}$$

### 2.1. Ma trận Phụ thuộc giữa các Tầng

| Tầng (Layer) | Được phép Import / Phụ thuộc | TUYỆT ĐỐI CẤM Import / Phụ thuộc |
| :--- | :--- | :--- |
| **Domain** (`backend/src/domain/`) | Chỉ kiểu dữ liệu nguyên bản TypeScript, Domain Entities, Value Objects, Domain Services, Domain Exceptions. | **CẤM 100%**: Application, Infrastructure, Presentation, Express, Prisma, các thư viện runtime bên ngoài (HTTP, Crypto, DB drivers), mã trạng thái HTTP. |
| **Application** (`backend/src/application/`) | `Domain`, các Interfaces/Ports của tầng mình, Application DTOs, Application Exceptions. | **CẤM 100%**: Infrastructure (Prisma, Axios client cụ thể), Presentation (Express req/res, HTTP codes). Mọi tương tác môi trường phải trừu tượng hóa qua Ports. |
| **Infrastructure** (`backend/src/infrastructure/`) | `Domain`, `Application` (triển khai Ports/Interfaces), thư viện bên thứ ba chuyên trách (PrismaClient, Bcrypt, Axios, ExcelJS). | **CẤM 100%**: Presentation Layer (Controllers, Express req/res, Route Handlers). |
| **Presentation** (`backend/src/api/`) | `Domain`, `Application` (Use Cases, DTOs, Exceptions), Zod, Express framework, Composition Root (DI). | **CẤM 100%**: Thực thi truy vấn DB trực tiếp trong Controller (Prisma queries). Mọi hành động bắt buộc ủy quyền cho Use Cases. |

### 2.2. Hợp đồng Phân cấp Ngoại lệ (Two-Tier Exception Architecture)

1. **Domain Exceptions (`backend/src/domain/exceptions/`):**
   - Đại diện vi phạm quy tắc bất biến nghiệp vụ (Business Invariants).
   - Kế thừa từ `DomainException` (`message`, `code = 'BUSINESS_RULE_VIOLATION'`, `details`).
   - **TUYỆT ĐỐI KHÔNG CHỨA HTTP STATUS CODE** (không `400`, `422`, không property `statusCode`).
2. **Application Exceptions (`backend/src/application/exceptions/`):**
   - Đại diện lỗi điều phối luồng: `EntityNotFoundException` (`RESOURCE_NOT_FOUND`), `DuplicateResourceException` (`DUPLICATE_RESOURCE`), `ValidationException` (`VALIDATION_ERROR`), `UnauthorizedException`, `ForbiddenException`.
   - Không chứa mã HTTP trong class.
3. **Ánh xạ HTTP duy nhất tại Middleware:**
   - Tệp `backend/src/api/middlewares/errorMiddleware.ts` là **NƠI DUY NHẤT** trong toàn bộ hệ thống được phép biết về mã trạng thái HTTP.

---

## 3. Ràng buộc Toàn vẹn Dữ liệu & Dịch vụ AI

1. **Stateless AI Service (Pure Compute Engine):**
   - `ai-service` tuyệt đối **KHÔNG KẾT NỐI TRỰC TIẾP** đến PostgreSQL. Mọi dữ liệu bán hàng và tham số phải do Backend đẩy qua HTTP payload theo hợp đồng tại [`docs/06-api-design/internal-ai-contracts.md`](docs/06-api-design/internal-ai-contracts.md).
   - Khi chuỗi thời gian không đủ điều kiện chạy Holt-Winters ($< 14$ ngày hoặc không đủ 2 chu kỳ tuần), AI Service bắt buộc tự động fallback sang SMA-7 kèm cờ cảnh báo `fallback_used: true`.
2. **Giao dịch Nguyên tử & Toàn vẹn Tồn kho (`BR-001`, `BR-018`):**
   - Mọi tác vụ ghi từ 2 bảng trở lên, hoặc thay đổi trạng thái kèm biến động tồn kho/lịch sử bắt buộc bọc trong `prisma.$transaction` hoặc `IUnitOfWork`.
   - Vị trí tồn kho bắt buộc bảo toàn công thức bất biến: $IP = \text{On-Hand} + \text{On-Order}$.

---

## 4. Phân loại Tác vụ & Quy trình Phê duyệt

Nhằm cân bằng giữa **tính kỷ luật kiến trúc** và **tốc độ phát triển**, AI Agent phân loại tác vụ thành 2 nhóm:

### 4.1. Nhóm 1: Tác vụ Trọng yếu (Major Scope) $\longrightarrow$ 🛑 CỔNG DUYỆT BẮT BUỘC (Hard Approval Gate)
* **Phạm vi:**
  1. Triển khai Use Case mới hoặc Phase mới trong lộ trình 7 Phase.
  2. Sửa đổi Database Schema / Prisma Migrations / Physical Schema DDL.
  3. Thay đổi hợp đồng API (URL Endpoint, Zod Schema request/response, HTTP status code).
  4. Thay đổi luồng nghiệp vụ cốt lõi, công thức tính toán (`BR-001` $\rightarrow$ `BR-026`), hoặc State Machine của đơn mua hàng PO.
  5. Tái cấu trúc (Refactor) diện rộng ảnh hưởng từ 2 tầng kiến trúc trở lên.
* **Quy trình:**
  1. Đọc kỹ tài liệu đặc tả liên quan trong `docs/` và bảng điều phối tại `.agents/modules/`.
  2. Lập kế hoạch theo chiều **Inside-Out**: `Domain` $\rightarrow$ `Application` $\rightarrow$ `Infrastructure` $\rightarrow$ `Presentation`.
  3. Trình bày Ma trận truy xuất (Traceability Matrix) và danh sách file `[NEW]` / `[MODIFY]`.
  4. 🛑 **DỪNG LẠI CHỜ USER XÁC NHẬN** trước khi viết bất kỳ mã nguồn nào.

### 4.2. Nhóm 2: Tác vụ Tinh gọn (Minor Scope) $\longrightarrow$ ⚡ ĐƯỢC PHÉP FAST-TRACK
* **Phạm vi:**
  1. Sửa bug nhỏ cục bộ (phạm vi 1 file / 1 hàm, không đổi interface hoặc DTO bên ngoài).
  2. Tinh chỉnh câu chữ hiển thị tiếng Việt, validation messages, toast notifications, comments.
  3. Bổ sung hoặc cập nhật Unit Tests / Integration Tests cho logic sẵn có.
  4. Sửa lỗi cú pháp, lint warnings, ép kiểu TypeScript không đổi hành vi hệ thống.
* **Quy trình:**
  * Được phép triển khai trực tiếp mà **không cần dừng lại xin duyệt kế hoạch**.
  * **Ràng buộc:** Bắt buộc tuân thủ 100% Hợp đồng ranh giới kiến trúc (Mục 2) và phải vượt qua Cổng nghiệm thu cơ học (Mục 7) trước khi báo cáo hoàn tất.

---

## 5. Lệnh Build, Test & Vận hành

### 5.1. Khởi động Toàn bộ bằng Docker Compose
```bash
docker compose up -d                  # Khởi động PostgreSQL 16, backend, ai-service, frontend
docker compose ps                     # Kiểm tra trạng thái các container
docker compose logs -f <service>      # Xem log service (backend | ai-service | frontend | postgres)
docker compose down                   # Dừng và hạ cụm container
```

### 5.2. Chạy Cục bộ Từng Service (Local Development)
- **PostgreSQL 16**: Chạy qua Docker container `dss-postgres` (Port `5432`).
- **Backend** (`backend/`):
  ```bash
  cd backend
  npm run dev                         # Chạy nodemon ts-node (Port 3000)
  npm run build                       # Biên dịch TypeScript (tsc)
  npm test                            # Chạy toàn bộ Jest test suite
  npx prisma migrate dev              # Chạy migration CSDL
  npx prisma generate                 # Sinh Prisma Client
  ```
- **AI Service** (`ai-service/`):
  ```bash
  cd ai-service
  uvicorn app.main:app --reload --port 8000   # Chạy FastAPI dev server
  pytest                              # Chạy toàn bộ Pytest test suite
  ```
- **Frontend** (`frontend/`):
  ```bash
  cd frontend
  npm run dev                         # Chạy Vite dev server (Port 5173)
  npm run build                       # Type-check (tsc -b) & Vite build
  npm run lint                        # Quét lint bằng ESLint
  ```

---

## 6. Quy chuẩn Đặt tên & Ngôn ngữ (Code Conventions)

1. **Ngôn ngữ trong mã nguồn:**
   - Mã nguồn, tên biến, hàm, class, interface, technical comments: **Tiếng Anh 100%**.
   - Thông báo lỗi và nhãn giao diện hiển thị cho người dùng (UI texts, validation messages, toasts): **Tiếng Việt 100%**.
2. **Quy tắc đặt tên:**
   - Class, Interface, Type, React Component: `PascalCase` (`CreateProductUseCase`, `IProductRepository`, `KpiRiskCards.tsx`).
   - Biến, hàm, thuộc tính: `camelCase` (`calculateSafetyStock`, `onHand`, `totalAmount`).
   - Tên bảng CSDL, cột CSDL: `snake_case` (`purchase_orders`, `committed_lead_time`).
   - Hằng số, ENUM: `UPPER_SNAKE_CASE` (`OUT_OF_STOCK`, `ORDERED`).
   - Mã sinh tự động: Mã PO bắt buộc định dạng `PO-YYYYMMDD-XXXX` (ví dụ: `PO-20260904-0001`) (`BR-024`).

---

## 7. Cổng Nghiệm thu Cơ học Bắt buộc (Verification Gate)

Trước khi bàn giao bất kỳ tác vụ nào, Agent **BẮT BUỘC** phải tự chạy các lệnh kiểm tra sau:

### 7.1. Quét Vi phạm Ranh giới Kiến trúc (Architecture Boundary Scan)
```bash
# 1. Domain Purity: Phải trả về 0 kết quả (Không chứa express, prisma, statusCode, res.status)
git grep -i -E "(express|prisma|@prisma|statusCode|res\.status)" backend/src/domain/

# 2. Application Purity: Phải trả về 0 kết quả (Không chứa express, prisma, res.status)
git grep -i -E "(express|prisma|@prisma|res\.status)" backend/src/application/

# 3. Presentation Boundary: Không chứa truy vấn Prisma trực tiếp trong Controllers
git grep -i -E "(prisma\.[a-z]+\.(find|create|update|delete))" backend/src/api/
```
> **Tiêu chuẩn:** Toàn bộ lệnh grep trên **PHẢI TRẢ VỀ RỖNG (0 MATCHES)**. Nếu phát hiện vi phạm, coi như task thất bại và phải refactor ngay.

### 7.2. Kiểm tra Biên dịch & Lint
```bash
cd backend && npm run build
cd frontend && npm run build && npm run lint
```
> **Tiêu chuẩn:** Không có lỗi biên dịch TypeScript (`tsc`) và không có lint errors.

### 7.3. Chạy Toàn bộ Test Suite Tự động
```bash
cd backend && npm test
cd ai-service && pytest
```
> **Tiêu chuẩn:** 100% test cases phải vượt qua (PASS). Không chấp nhận bỏ qua hoặc comment-out test.

---

## 8. Những Điều Cấm Tuyệt Đối

1. **CẤM vi phạm Inward Dependency của Clean Architecture:** Không để tầng trong biết về tầng ngoài.
2. **CẤM rò rỉ mã trạng thái HTTP vào Domain/Application:** Chỉ `errorMiddleware.ts` được quyền định nghĩa mã HTTP.
3. **CẤM Controller gọi trực tiếp Prisma hoặc chứa logic nghiệp vụ:** Mọi luồng phải đi qua Use Case.
4. **CẤM AI Service kết nối trực tiếp đến PostgreSQL:** Mọi truy vấn phải do Backend đảm nhiệm.
5. **CẤM tự ý thay đổi tài liệu đặc tả `docs/`:** Tài liệu `docs/` là chuẩn mực gốc, chỉ cập nhật khi có chỉ thị trực tiếp từ người dùng.
6. **CẤM thao tác phá hủy dữ liệu hoặc rò rỉ secrets:** Không `DROP DATABASE`, không hardcode mật khẩu/credentials thật vào commit hay chat.
7. **CẤM bỏ qua test:** Không dùng `--no-verify`, không comment code test để đối phó kết quả.

---

## 9. Hệ thống Điều phối & Tài liệu Tham khảo

- Kỹ thuật chuyên sâu: `.agents/skills/` (`clean-architecture/`, `database-prisma/`, `ai-forecast/`, `frontend-react/`, `verification-gate/`, `task/`).
- Bản đồ nghiệp vụ & trạng thái: `.agents/modules/` (`inventory/`, `purchase-order/`, `forecast/`, `master-data/`, `auth-user/`).
- Quản lý task: `.agents/tasks/` (`task-template/` gồm `SPEC.md`, `PLAN.md`, `HANDOFF.md`).
- Subagents tự động: `.agents/agents/` (`clean-arch-guard.md`, `test-runner.md`, `task-scaffolder.md`).
- Đặc tả chi tiết dự án: `docs/` (`01-business/` đến `07-implementation-plan/`).
