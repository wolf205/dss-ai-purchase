# CHI TIẾT CÁC GIAI ĐOẠN THỰC THI (DETAILED PHASE-BY-PHASE IMPLEMENTATION PLAN)
## DỰ ÁN: HỆ THỐNG HỖ TRỢ RA QUYẾT ĐỊNH MUA HÀNG TÍCH HỢP AI (DSS AI PURCHASE)

> **Tài liệu tham chiếu chuẩn:** [`GEMINI.md`](file:///c:/my_project/dss-ai-purchase/GEMINI.md), [`overview.md`](file:///c:/my_project/dss-ai-purchase/docs/07-implementation-plan/overview.md)  
> **Nguyên tắc bất biến:** Mọi quy ước cấu trúc bảng, tên cột, công thức toán học và mã trạng thái phải tuân thủ 100% tài liệu kiến trúc đã đóng băng.

---

## 1. PHASE 0: KHỞI TẠO PROJECT SCAFFOLDING, DEVOPS & DATABASE SETUP

### 1.1. Mục Tiêu (Objectives)
* Thiết lập cấu trúc thư mục chuẩn monorepo gồm 3 service: `backend/`, `frontend/`, `ai-service/`.
* Cấu hình môi trường mạng Docker Compose nội bộ (`dss-network`) kết nối PostgreSQL, Backend, AI Service và Frontend.
* Khởi tạo Prisma ORM từ schema vật lý `physical-schema.sql` (18 bảng, 12 ENUMs), chạy Migration và nạp dữ liệu mồi (Seed Data).

### 1.2. Tài Liệu Đầu Vào Bắt Buộc (Input Documents)
* [`physical-schema.sql`](file:///c:/my_project/dss-ai-purchase/docs/04-data-model/physical-schema.sql)
* [`data-dictionary.md`](file:///c:/my_project/dss-ai-purchase/docs/04-data-model/data-dictionary.md)
* [`deployment-and-devops.md`](file:///c:/my_project/dss-ai-purchase/docs/05-architecture/deployment-and-devops.md)

### 1.3. Danh Sách Nhiệm Vụ Chi Tiết (Work Breakdown Structure - WBS)
1. **Khởi tạo hạ tầng Docker:**
   * Tạo file `docker-compose.yml` ở thư mục gốc định nghĩa 4 dịch vụ:
     * `postgres`: Image `postgres:16-alpine`, port `5432:5432`, volume lưu trữ `pgdata`.
     * `ai-service`: Build từ `./ai-service`, port `8000:8000`.
     * `backend`: Build từ `./backend`, port `5000:5000`, phụ thuộc vào `postgres` và `ai-service`.
     * `frontend`: Build từ `./frontend`, port `3000:80`, reverse proxy qua Nginx.
   * Tạo các file `.env.example` cho toàn bộ dự án.
2. **Khởi tạo cấu trúc Backend (`/backend`):**
   * Khởi tạo `package.json` với Node.js 20+, TypeScript, Express, Prisma, Zod, bcrypt, jsonwebtoken, cors, helmet, dotenv, decimal.js.
   * Cấu hình `tsconfig.json` (Strict mode, ES2022, path aliases `@domain/*`, `@application/*`, `@infrastructure/*`, `@api/*`).
   * Cài đặt `prisma` CLI và khởi tạo thư mục `prisma/`.
   * Chuyển đổi toàn bộ 18 bảng, 12 ENUMs, các quan hệ 1-N, 1-1 và các chỉ mục (Indexes) từ `physical-schema.sql` sang `prisma/schema.prisma`.
3. **Thực thi Database Migration & Seed:**
   * Chạy lệnh `npx prisma migrate dev --name init_physical_schema` để tạo cấu trúc bảng trên PostgreSQL.
   * Viết file `prisma/seed.ts`:
     * Tạo tài khoản quản trị viên mặc định: `username: admin`, mật khẩu mã hóa bcrypt `Admin@123`, role: `ADMIN` (`UC-015`, `UC-016`).
     * Tạo bản ghi cấu hình trọng số đánh giá NCC mặc định trong `supplier_evaluation_configs`: `weight_otif = 0.35`, `weight_quality = 0.30`, `weight_price = 0.20`, `weight_lead_time = 0.15` (tổng = 1.00) (`BR-013`).
     * Cấu hình tham số hệ thống mặc định trong `system_configs`.

### 1.4. Tiêu Chuẩn Nghiệm Thu & Kiểm Thử (Phase 0 Exit Gate)
* [ ] Container `postgres` khởi động thành công, lắng nghe kết nối trên port 5432.
* [ ] `npx prisma db push` hoặc `npx prisma migrate dev` chạy không phát sinh lỗi cú pháp.
* [ ] Kiểm tra cơ sở dữ liệu có đủ **18 bảng** và **12 ENUMs** khớp 100% với `data-dictionary.md`.
* [ ] Chạy `npx prisma db seed` tạo thành công tài khoản `admin` và cấu hình trọng số chuẩn.

---

## 2. PHASE 1: DỊCH VỤ AI DỰ BÁO NHU CẦU (PYTHON FASTAPI - STATELESS COMPUTE ENGINE)

### 2.1. Mục Tiêu (Objectives)
* Xây dựng dịch vụ AI độc lập, không kết nối trực tiếp CSDL (Stateless Pure Compute).
* Hiện thực hóa mô hình dự báo chuỗi thời gian Holt-Winters và Baseline SMA-7 (Trung bình trượt 7 ngày).
* Hiện thực hóa bộ đánh giá sai số mô hình (WAPE, MAE) và cơ chế tự động Fallback sang SMA-7 khi $\text{WAPE} > 40\%$.
* Tính toán dải mây dao động tin cậy 95% ($\pm 1.96\sigma$).

### 2.2. Tài Liệu Đầu Vào Bắt Buộc (Input Documents)
* [`ai-service-architecture.md`](file:///c:/my_project/dss-ai-purchase/docs/05-architecture/ai-service-architecture.md)
* [`internal-ai-contracts.md`](file:///c:/my_project/dss-ai-purchase/docs/06-api-design/internal-ai-contracts.md)
* [`business-rules.md (BR-006, BR-007, BR-008)`](file:///c:/my_project/dss-ai-purchase/docs/02-requirements/business-rules.md)
* Đặc tả chi tiết 4 Milestones: [`phase-1-milestones.md`](file:///d:/projects/dss-ai-purchase/docs/07-implementation-plan/phase-1-milestones.md)

### 2.3. Cấu Trúc Thư Mục & Deliverables (`/ai-service`)
```
ai-service/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── forecast.py       # POST /api/v1/forecast, POST /api/v1/forecast/batch
│   │       │   └── health.py         # GET /health
│   │       └── router.py
│   ├── core/
│   │   └── config.py                 # App settings, loggers
│   ├── models/
│   │   └── schemas.py                # Pydantic Request/Response models khớp internal-ai-contracts.md
│   ├── services/
│   │   ├── time_series_ml.py         # Holt-Winters Exponential Smoothing
│   │   ├── baseline_sma.py           # SMA-7 Moving Average
│   │   └── model_evaluator.py        # WAPE, MAE, Confidence Interval calculations
│   └── main.py                       # FastAPI application entrypoint
├── tests/
│   ├── test_forecast_api.py
│   ├── test_holt_winters.py
│   ├── test_model_evaluator.py
│   └── test_fallback_logic.py
├── Dockerfile
└── requirements.txt
```

### 2.4. Danh Sách Nhiệm Vụ Chi Tiết
1. **Khai báo Pydantic Schemas (`schemas.py`):**
   * Khai báo chính xác các cấu trúc dữ liệu theo `internal-ai-contracts.md`: `TimeSeriesPoint`, `ForecastRequest`, `ForecastBatchRequest`, `ForecastDayItem`, `ModelEvaluationMetric`, `ForecastResponse`, `ForecastBatchResponse`.
2. **Bộ đánh giá chất lượng mô hình (`model_evaluator.py`):**
   * Công thức $\text{WAPE} = \frac{\sum_{t=1}^n |y_t - \hat{y}_t|}{\sum_{t=1}^n y_t} \times 100\%$.
   * Công thức $\text{MAE} = \frac{1}{n}\sum_{t=1}^n |y_t - \hat{y}_t|$.
   * Tính dải tin cậy 95%: $\text{Lower Bound} = \max(0, \hat{y}_t - 1.96 \times \sigma)$, $\text{Upper Bound} = \hat{y}_t + 1.96 \times \sigma$.
3. **Mô hình Baseline SMA-7 (`baseline_sma.py`):**
   * Tính trung bình bán lẻ 7 ngày gần nhất. Gán nhãn `model_used: "SMA-7"`.
4. **Mô hình Holt-Winters & Cơ chế Fallback (`time_series_ml.py`):**
   * Sử dụng `statsmodels.tsa.holtwinters.ExponentialSmoothing`.
   * Kiểm tra điều kiện dữ liệu lịch sử (`BR-006`):
     * Nếu chuỗi lịch sử $< 14$ ngày $\rightarrow$ Tự động dùng SMA-7 hoặc Cold Start.
     * Huấn luyện Holt-Winters trên tập lịch sử, đo kiểm trên 7 ngày kiểm thử gần nhất.
     * Nếu $\text{WAPE} > 40\%$ (`BR-007`) $\rightarrow$ Kích hoạt `fallback_applied: true`, trả về kết quả dự báo từ SMA-7.
5. **Endpoints & Batch Processing (`forecast.py`):**
   * Cài đặt `POST /api/v1/forecast` cho dự báo 1 SKU (chân trời 7, 14, 30 ngày).
   * Cài đặt `POST /api/v1/forecast/batch` cho dự báo hàng loạt toàn bộ danh mục cửa hàng.

### 2.5. Tiêu Chuẩn Nghiệm Thu & Kiểm Thử (Phase 1 Exit Gate)
* [ ] 100% Unit Tests với `pytest` vượt qua:
  * Test tính WAPE chính xác theo công thức với chuỗi thực tế.
  * Test kích hoạt fallback sang SMA-7 khi WAPE vượt quá 40%.
  * Test không trả về giá trị dự báo âm ($\text{Lower Bound} \ge 0$).
* [ ] Docker container `ai-service` build thành công và phản hồi `GET /health` mã 200 OK.
* [ ] Benchmark thời gian phản hồi: Dự báo đơn SKU $< 150\text{ms}$; Dự báo batch 100 SKU $< 3000\text{ms}$ (`NFR-04`).

---

## 3. PHASE 2: BACKEND CORE - MASTER DATA, INGESTION & SECURITY

### 3.1. Mục Tiêu (Objectives)
* Thiết lập khung sườn Backend theo đúng chuẩn **Clean Architecture** (Domain, Application, Infrastructure, API).
* Cài đặt cơ chế xác thực JWT, bảo vệ Endpoint bằng RBAC và chuẩn hóa toàn bộ phản hồi qua Uniform API Envelope.
* Triển khai các phân hệ Dữ liệu chủ: Quản lý người dùng, Sản phẩm, Nhà cung cấp & Bảng giá.
* Triển khai phân hệ Nạp dữ liệu bán hàng & tồn kho qua file Excel/CSV (`UC-003`).

### 3.2. Tài Liệu Đầu Vào Bắt Buộc (Input Documents)
* [`backend-architecture.md`](file:///c:/my_project/dss-ai-purchase/docs/05-architecture/backend-architecture.md)
* [`endpoints-spec.md`](file:///c:/my_project/dss-ai-purchase/docs/06-api-design/endpoints-spec.md)
* [`UC-001`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-001-quan-ly-danh-muc-san-pham.md), [`UC-002`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-002-quan-ly-danh-muc-nha-cung-cap.md), [`UC-003`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-003-nap-du-lieu-ban-hang-va-ton-kho.md), [`UC-015`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-015-dang-nhap-va-quan-ly-phien-lam-viec.md), [`UC-016`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-016-quan-ly-tai-khoan-nguoi-dung.md), [`UC-017`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-017-cau-hinh-trong-so-danh-gia-nha-cung-cap.md)

### 3.3. Cấu Trúc Mã Nguồn Clean Architecture (`/backend`)
```
backend/
├── src/
│   ├── domain/
│   │   ├── entities/            # User, Product, Category, Supplier, Inventory, etc.
│   │   ├── value-objects/       # SKU, Money, WeightDistribution
│   │   └── repositories/        # IUserRepository, IProductRepository, etc. (Interfaces)
│   ├── application/
│   │   ├── dtos/                # Request / Response DTOs
│   │   ├── use-cases/
│   │   │   ├── auth/            # LoginUseCase, RefreshTokenUseCase
│   │   │   ├── users/           # CreateUserUseCase, UpdateUserUseCase
│   │   │   ├── products/        # CreateProductUseCase, UpdateProductUseCase
│   │   │   ├── suppliers/       # ManageSupplierUseCase, UpdateWeightsUseCase
│   │   │   └── ingestion/       # ImportSalesInventoryUseCase
│   │   └── services/            # TokenService, ExcelParserService
│   ├── infrastructure/
│   │   ├── database/            # PrismaClient, Prisma repositories implementation
│   │   ├── security/            # BcryptHasher, JwtTokenProvider
│   │   └── parsers/             # ExcelJsFileParser
│   └── api/
│       ├── middlewares/         # authMiddleware, rbacMiddleware, validateRequest, errorHandler
│       ├── controllers/         # AuthController, ProductController, etc.
│       ├── routes/              # authRoutes, productRoutes, etc.
│       └── app.ts               # Express server configuration
```

### 3.4. Danh Sách Nhiệm Vụ Chi Tiết
1. **Khung xử lý đồng bộ & Bảo mật (Cross-Cutting Concerns):**
   * Xây dựng Middleware định dạng Envelope: Tự động bọc dữ liệu thành công trong `{ success: true, data, meta, timestamp }` và lỗi trong `{ success: false, error: { code, message, details }, timestamp }`.
   * Cài đặt `authMiddleware` giải mã JWT Access Token (hạn 15 phút) và xử lý Refresh Token (`UC-015`).
   * Cài đặt `rbacMiddleware` phân quyền nghiêm ngặt theo bảng quyền hạn: `ADMIN` vs `PURCHASER`.
2. **Quản lý người dùng & Phân quyền (`UC-015`, `UC-016`):**
   * Triển khai các endpoints: `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/users`, `POST /api/v1/users`, `PATCH /api/v1/users/:id/status`.
3. **Quản lý danh mục Sản phẩm & Nhà cung cấp (`UC-001`, `UC-002`, `UC-017`):**
   * CRUD Sản phẩm: Ràng buộc mã SKU không trùng lặp, quản lý quy cách đóng gói (Pack Size), giá vốn (`BR-011`).
   * CRUD Nhà cung cấp: Quản lý thời gian giao hàng cam kết (Committed Lead Time), bảng giá sản phẩm theo nhà cung cấp, MOQ, đánh dấu nhà cung cấp chính (`is_primary`) (`BR-012`).
   * Cấu hình trọng số NCC (`UC-017`): Kiểm tra tổng 4 trọng số $w_{otif} + w_{quality} + w_{price} + w_{leadtime} = 1.00$ (`BR-013`).
4. **Nạp dữ liệu bán hàng & Tồn kho qua Excel/CSV (`UC-003`):**
   * Đọc file template Excel chuẩn gồm 2 sheet: `SalesHistory` và `InventorySnapshots`.
   * Kiểm tra tính hợp lệ của từng dòng: Tồn tại SKU, số lượng bán $\ge 0$, ngày bán không vượt quá ngày hiện tại (`BR-009`).
   * Nếu có bất kỳ lỗi định dạng nghiêm trọng nào, từ chối nạp toàn bộ file và trả về danh sách chi tiết các dòng bị lỗi (`BR-010`).
   * Cập nhật số lượng tồn kho thực tế (`on_hand`) và lưu lịch sử bán hàng vào bảng `sales_history`.

### 3.5. Tiêu Chuẩn Nghiệm Thu & Kiểm Thử (Phase 2 Exit Gate)
* [ ] Kiểm tra Login trả về JWT hợp lệ; truy cập endpoint yêu cầu quyền ADMIN bằng token PURCHASER bị chặn với mã 403 Forbidden.
* [ ] Nạp file Excel mẫu thành công: Dữ liệu ghi nhận đầy đủ vào `sales_history` và `inventory`.
* [ ] Nạp file Excel chứa dòng sai SKU hoặc số lượng âm bị từ chối với mã lỗi `IMPORT_DATA_INVALID` kèm chi tiết số dòng.
* [ ] Cập nhật trọng số nhà cung cấp có tổng $\ne 100\%$ bị chặn với lỗi `SUPPLIER_WEIGHTS_INVALID_SUM`.

---

## 4. PHASE 3: BACKEND CORE - DSS ANALYTICS & PURCHASE RECOMMENDATION ENGINE

### 4.1. Mục Tiêu (Objectives)
* Triển khai các Domain Services tính toán định lượng tồn kho: Tồn kho an toàn ($SS$), Điểm đặt hàng lại ($ROP$), Số ngày bán còn lại ($DoS$), Phân loại 5 cấp rủi ro.
* Triển khai thuật toán phân tích ma trận 9 ô ABC-XYZ và thuật toán chấm điểm xếp hạng nhà cung cấp theo 4 tiêu chí.
* Xây dựng Client giao tiếp với AI Service (kèm Timeout 4s và Fallback cục bộ sang SMA-7).
* Hiện thực hóa Động cơ khuyến nghị mua hàng thông minh (Purchase Recommendation Engine) với công thức $Q_{raw}$, làm tròn MOQ/Pack Size và tạo nội dung giải trình minh bạch (Explainable Insights).
* Cung cấp API chạy lại phân tích theo yêu cầu (On-demand Recalculation - `UC-011`).

### 4.2. Tài Liệu Đầu Vào Bắt Buộc (Input Documents)
* [`business-rules.md (BR-001 -> BR-008, BR-013 -> BR-016)`](file:///c:/my_project/dss-ai-purchase/docs/02-requirements/business-rules.md)
* [`internal-ai-contracts.md`](file:///c:/my_project/dss-ai-purchase/docs/06-api-design/internal-ai-contracts.md)
* [`UC-004`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-004-theo-doi-ton-kho-va-canh-bao-rui-ro.md), [`UC-005`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-005-xem-phan-tich-ma-tran-abc-xyz.md), [`UC-006`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-006-xem-chi-tiet-phan-tich-san-pham.md), [`UC-007`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-007-xem-du-bao-nhu-cau-ban-le.md), [`UC-008`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-008-nhap-luong-ban-du-kien-cho-san-pham-moi.md), [`UC-009`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-009-xem-danh-gia-va-xep-hang-nha-cung-cap.md), [`UC-010`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-010-xem-khuyen-nghi-mua-hang-thong-minh.md), [`UC-011`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-011-chay-lai-phan-tich-va-cap-nhat-khuyen-nghi.md)

### 4.3. Danh Sách Nhiệm Vụ Chi Tiết
1. **Domain Services Định Lượng Tồn Kho:**
   * `InventoryCalculationService`:
     * Tính độ lệch chuẩn bán hàng $\sigma_L$ trong chu kỳ Lead Time.
     * $SS = Z_{\alpha} \times \sigma_L \times \sqrt{L}$ với $Z_{\alpha} = 1.65$ (cho mức độ phục vụ 95%).
     * $ROP = (d \times L) + SS$.
     * $DoS = \frac{\text{On-Hand}}{d}$ (với $d$ là nhu cầu bán trung bình ngày).
     * Phân loại 5 cấp độ rủi ro tồn kho (`BR-002`):
       * `OUT_OF_STOCK`: $\text{On-Hand} = 0$.
       * `CRITICAL`: $\text{On-Hand} \le SS$ (hoặc $DoS \le 3$).
       * `WARNING`: $SS < \text{On-Hand} \le ROP$ (hoặc $3 < DoS \le 7$).
       * `HEALTHY`: $ROP < \text{On-Hand} \le ROP \times 2$ (hoặc $7 < DoS \le 30$).
       * `OVERSTOCK`: $\text{On-Hand} > ROP \times 2$ (hoặc $DoS > 30$).
2. **Domain Service Phân Tích Ma Trận 9 Ô ABC - XYZ (`BR-004`, `UC-005`):**
   * Tính doanh thu tích lũy từng SKU trong 90 ngày gần nhất $\rightarrow$ Xếp hạng Pareto: Nhóm A (80% doanh thu đầu), Nhóm B (15% tiếp theo), Nhóm C (5% còn lại).
   * Tính hệ số biến thiên nhu cầu $CV = \frac{\sigma}{\mu}$: Nhóm X ($CV \le 0.10$), Nhóm Y ($0.10 < CV \le 0.25$), Nhóm Z ($CV > 0.25$).
   * Phối hợp thành 9 nhóm ma trận (AX, AY, AZ, BX, BY, BZ, CX, CY, CZ).
3. **Domain Service Đánh Giá Xếp Hạng Nhà Cung Cấp (`BR-013`, `UC-009`):**
   * Điểm OTIF ($S_{otif}$): Tỷ lệ phần trăm đơn hàng đạt chuẩn đúng hạn và đủ số lượng trong 6 tháng gần nhất.
   * Điểm Chất lượng ($S_{quality}$): $100\% - \text{Tỷ lệ hàng lỗi}$.
   * Điểm Giá cả ($S_{price}$): So sánh đơn giá hiện tại với mức giá cạnh tranh trên thị trường.
   * Điểm Lead Time ($S_{leadtime}$): Tỷ lệ thời gian giao hàng thực tế so với cam kết.
   * Điểm tổng hợp: $S_{total} = w_{otif}S_{otif} + w_{quality}S_{quality} + w_{price}S_{price} + w_{leadtime}S_{leadtime}$.
4. **AI Service Client & Fallback Engine (`AxiosAiServiceClient`):**
   * Kết nối HTTP POST sang `http://ai-service:8000/api/v1/forecast/batch`.
   * Cấu hình Timeout 4000ms (`NFR-04`).
   * Nếu AI Service bị gián đoạn hoặc timeout, tự động chuyển đổi sang Local Fallback Engine chạy thuật toán SMA-7 trên Node.js (`BR-007`).
5. **Purchase Recommendation Engine (`UC-010`, `BR-014`, `BR-015`, `BR-016`):**
   * Xác định Vị trí tồn kho: $\text{IP} = \text{On-Hand} + \text{On-Order}$ (`BR-001`).
   * Điều kiện kích hoạt gợi ý: $\text{IP} \le ROP$.
   * Tính nhu cầu mua thô: $Q_{raw} = \text{Forecast}_T + SS - \text{IP}$.
   * Ràng buộc MOQ: Nếu $Q_{raw} < \text{MOQ} \rightarrow$ Đưa lên bằng MOQ.
   * Ràng buộc Quy cách đóng gói: Làm tròn lên theo bội số của `pack_size`:
     $$Q_{suggested} = \lceil Q_{raw} / \text{pack\_size} \rceil \times \text{pack\_size}$$
   * Tạo lý do giải trình tự động: Ghi rõ SKU đang ở cấp rủi ro nào, tồn kho an toàn, số ngày bán còn lại, lý do làm tròn số lượng.
6. **On-demand Recalculation API (`UC-011`):**
   * Endpoint `POST /api/v1/recommendations/recalculate`: Thực thi toàn bộ chu trình tính toán trên và cập nhật lại bảng `recommendations`.

### 4.4. Tiêu Chuẩn Nghiệm Thu & Kiểm Thử (Phase 3 Exit Gate)
* [ ] 100% Unit Tests công thức toán ($SS, ROP, Q_{raw}$, ABC-XYZ, OTIF Score) cho kết quả chính xác theo tài liệu nghiệp vụ.
* [ ] Kiểm tra cơ chế chống đặt trùng (`BR-001`): Một SKU có `On-Hand` = 5, `ROP` = 20, nhưng `On-Order` = 20 thì $\text{IP} = 25 > ROP \rightarrow$ Không sinh gợi ý mua hàng.
* [ ] Kiểm thử ngắt kết nối AI Service: Backend vẫn tính toán được gợi ý mua hàng nhờ cơ chế Fallback SMA-7 cục bộ và gán cờ `fallback_applied: true`.

---

## 5. PHASE 4: BACKEND CORE - PURCHASE ORDERS LIFECYCLE & ATOMIC GOODS RECEIPT

### 5.1. Mục Tiêu (Objectives)
* Triển khai toàn diện Vòng đời và Máy trạng thái Đơn mua hàng (`DRAFT` $\rightarrow$ `ORDERED` $\rightarrow$ `RECEIVED` / `CANCELLED`).
* Thực thi triệt để quy tắc Khóa đơn hàng (`BR-025`) và Chống đặt trùng (`BR-001`) bằng cách cập nhật `on_order`.
* Triển khai Giao dịch nhận hàng nguyên tử ACID (`UC-014`, `BR-018`) thông qua `prisma.$transaction`.

### 5.2. Tài Liệu Đầu Vào Bắt Buộc (Input Documents)
* [`data-flow-and-integrity.md`](file:///c:/my_project/dss-ai-purchase/docs/04-data-model/data-flow-and-integrity.md)
* [`UC-012`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-012-lap-va-xac-nhan-don-mua-hang.md), [`UC-013`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-013-quan-ly-va-tra-cuu-lich-su-don-mua-hang.md), [`UC-014`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-014-ghi-nhan-nhan-hang-va-cap-nhat-ton-kho.md)
* [`business-rules.md (BR-001, BR-017 -> BR-025)`](file:///c:/my_project/dss-ai-purchase/docs/02-requirements/business-rules.md)

### 5.3. Danh Sách Nhiệm Vụ Chi Tiết
1. **Khởi tạo Đơn mua hàng từ Khuyến nghị (`UC-012`):**
   * Cho phép chọn nhiều khuyến nghị, tự động gom nhóm theo Nhà cung cấp.
   * Sinh mã đơn hàng tự động định dạng `PO-YYYYMMDD-XXXX` (`BR-024`).
   * Tạo đơn hàng ở trạng thái `DRAFT`.
2. **Xác nhận đặt hàng (`ConfirmPoUseCase` - `UC-012`):**
   * Kiểm tra điều kiện: Đơn hàng phải đang ở trạng thái `DRAFT`.
   * Cập nhật trạng thái sang `ORDERED`.
   * **Thực thi `BR-001`:** Lập tức tăng số lượng đang về `on_order += ordered_quantity` cho từng sản phẩm trong bảng `inventory`.
   * **Thực thi `BR-025`:** Khóa cứng toàn bộ danh sách sản phẩm và số lượng, không cho phép chỉnh sửa.
3. **Hủy đơn hàng (`CancelPoUseCase` - `UC-013`):**
   * Nếu hủy đơn `DRAFT`: Chuyển trạng thái sang `CANCELLED`.
   * Nếu hủy đơn `ORDERED`: Hoàn trả lại số lượng đang về `on_order -= ordered_quantity` trong `inventory`, sau đó chuyển sang `CANCELLED`.
4. **Giao dịch nhận hàng nguyên tử ACID (`GoodsReceiptUseCase` - `UC-014`):**
   * Sử dụng `prisma.$transaction` thực thi đồng thời các bước sau trong cùng 1 transaction:
     ```typescript
     await prisma.$transaction(async (tx) => {
       // 1. Kiểm tra đơn hàng đang ở trạng thái ORDERED
       const po = await tx.purchaseOrder.findUnique({ where: { id: poId }, include: { items: true } });
       if (po.status !== 'ORDERED') throw new InvalidPoStateException();

       // 2. Duyệt từng sản phẩm nhận hàng
       for (const item of receiptData.items) {
         const acceptedQty = item.deliveredQuantity - item.defectiveQuantity; // BR-018
         
         // 3. Cập nhật tồn kho 2 chiều
         await tx.inventory.update({
           where: { productId: item.productId },
           data: {
             onHand: { increment: acceptedQty },
             onOrder: { decrement: item.orderedQuantity }
           }
         });
       }

       // 4. Tính toán chỉ số OTIF của lần giao hàng này
       const isOnTime = new Date(receiptData.actualDeliveryDate) <= new Date(po.committedDeliveryDate);
       const isInFull = receiptData.items.every(i => (i.deliveredQuantity - i.defectiveQuantity) >= i.orderedQuantity);
       const isOtif = isOnTime && isInFull;

       // 5. Lưu bản ghi lịch sử nhận hàng (delivery_history)
       await tx.deliveryHistory.create({
         data: {
           purchaseOrderId: po.id,
           supplierId: po.supplierId,
           deliveryDate: receiptData.actualDeliveryDate,
           isOnTime,
           isInFull,
           isOtif,
           totalDelivered: receiptData.totalDelivered,
           totalDefective: receiptData.totalDefective,
           notes: receiptData.notes
         }
       });

       // 6. Đóng trạng thái đơn hàng thành RECEIVED
       await tx.purchaseOrder.update({
         where: { id: po.id },
         data: {
           status: 'RECEIVED',
           actualDeliveryDate: receiptData.actualDeliveryDate
         }
       });
     });
     ```
5. **Cập nhật lại Điểm số Nhà cung cấp:**
   * Kích hoạt cập nhật điểm OTIF và điểm Chất lượng của nhà cung cấp dựa trên bản ghi mới trong `delivery_history`.

### 5.4. Tiêu Chuẩn Nghiệm Thu & Kiểm Thử (Phase 4 Exit Gate)
* [ ] Kiểm thử chuyển đổi trạng thái: Cố tình sửa sản phẩm trong đơn `ORDERED` bị chặn với lỗi `PO_LOCKED`.
* [ ] Kiểm thử giao dịch nhận hàng thành công:
  * `on_hand` tăng đúng bằng $Q_{delivered} - Q_{defective}$.
  * `on_order` giảm đúng bằng số lượng đã đặt.
  * Bản ghi `delivery_history` được tạo với cờ `is_otif` tính toán chính xác.
  * Đơn hàng chuyển sang `RECEIVED`.
* [ ] Kiểm thử Rollback giao dịch: Mô phỏng lỗi ở bước cuối cùng $\rightarrow$ Toàn bộ cập nhật `on_hand`, `on_order` và trạng thái đơn hàng được khôi phục nguyên vẹn, không để lại dữ liệu rác.

---

## 6. PHASE 5: FRONTEND WEB SPA (REACT 18 + VITE + TAILWINDCSS + ECHARTS)

### 6.1. Mục Tiêu (Objectives)
* Xây dựng giao diện Web SPA hiện đại, thẩm mỹ cao theo phong cách Feature-Based Architecture.
* Thiết lập hệ màu cảnh báo 5 cấp rủi ro chuẩn hóa theo `BR-002`.
* Tích hợp thư viện đồ họa **Apache ECharts**: Biểu đồ dải mây dự báo tin cậy và Ma trận 9 ô ABC-XYZ tương tác lọc trực quan.
* Hiện thực hóa toàn bộ trải nghiệm người dùng từ Khuyến nghị $\rightarrow$ Tạo đơn $\rightarrow$ Chốt đơn $\rightarrow$ Nhận hàng.

### 6.2. Tài Liệu Đầu Vào Bắt Buộc (Input Documents)
* [`frontend-architecture.md`](file:///c:/my_project/dss-ai-purchase/docs/05-architecture/frontend-architecture.md)
* [`endpoints-spec.md`](file:///c:/my_project/dss-ai-purchase/docs/06-api-design/endpoints-spec.md)
* Tất cả các file Use Case UI [`UC-001` đến `UC-017`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/)

### 6.3. Cấu Trúc Module Tính Năng (`src/features/`)
```
frontend/
├── src/
│   ├── assets/
│   ├── components/              # Shared UI: Button, Input, Modal, Table, Badge, Drawer
│   ├── context/                 # AuthContext, ThemeContext
│   ├── features/
│   │   ├── auth/                # Login, PrivateRoute
│   │   ├── dashboard/           # Summary KPI Cards (Risk Overview, Pending POs)
│   │   ├── inventory/           # InventoryTable, 5-Level Risk Badges, Product360Drawer
│   │   ├── abc-xyz/             # AbcXyzMatrixChart (ECharts), MatrixCategoryTable
│   │   ├── forecast/            # ForecastChart (Confidence Area), ManualSalesInputModal
│   │   ├── suppliers/           # SupplierTable, SupplierScorecardRadar, ConfigWeightsModal
│   │   ├── recommendations/     # RecommendationWorkbench, ExplainableInsightPopover, BatchPoModal
│   │   ├── purchase-orders/     # PoList, PoDetailModal, ConfirmPoModal, GoodsReceiptModal
│   │   ├── data-import/         # ExcelUploadDropzone, ImportErrorModal
│   │   └── users/               # UserManagementTable, UserModal
│   ├── hooks/                   # useAuth, useDebounce, useNotification
│   ├── lib/                     # axiosClient (Interceptors, Uniform envelope unwrap), queryClient
│   └── types/                   # Shared TypeScript models
```

### 6.4. Danh Sách Nhiệm Vụ Chi Tiết
1. **Thiết lập Nền Tảng UI & Styling:**
   * Cấu hình `tailwind.config.js` với 5 màu chuẩn (`BR-002`):
     * `risk-out-of-stock`: `#7F1D1D` (Đỏ sẫm)
     * `risk-critical`: `#DC2626` (Đỏ cam)
     * `risk-warning`: `#D97706` (Vàng hổ phách)
     * `risk-healthy`: `#16A34A` (Xanh lá)
     * `risk-overstock`: `#7C3AED` (Tím nhạt)
   * Tạo Axios Client tự động đính kèm `Authorization: Bearer <token>`, tự động gọi làm mới token khi nhận mã 401, và unwrap Uniform Envelope.
2. **Module Dashboard & Theo Dõi Tồn Kho (`UC-004`, `UC-006`):**
   * Thẻ KPI thống kê: Tổng giá trị tồn kho, Số SKU hết hàng, Số SKU nguy cấp, Số đơn hàng chờ nhận.
   * Bảng theo dõi tồn kho phân trang, tìm kiếm SKU, lọc theo 5 cấp rủi ro.
   * Drawer xem chi tiết sản phẩm 360°: Lịch sử bán hàng, thông số $SS, ROP, DoS$, danh sách nhà cung cấp.
3. **Module Ma Trận 9 Ô ABC - XYZ (`UC-005`):**
   * Sử dụng Apache ECharts vẽ Grid 9 ô với màu sắc theo mức độ ưu tiên.
   * Tính năng tương tác: Click vào một ô bất kỳ (ví dụ ô `AX` hoặc `CZ`) $\rightarrow$ Bảng sản phẩm bên dưới lập tức lọc danh sách sản phẩm thuộc nhóm đó.
4. **Module Trực Quan Hóa Dự Báo AI (`UC-007`, `UC-008`):**
   * Sử dụng Apache ECharts vẽ chuỗi thời gian:
     * Đường nét liền: Lịch sử bán hàng thực tế.
     * Đường nét đứt: Dự báo nhu cầu bán lẻ trong tương lai (7, 14, 30 ngày).
     * Dải mây mờ (Confidence Shaded Area): Biểu diễn khoảng dao động tin cậy 95% giữa Lower Bound và Upper Bound.
   * Modal nhập lượng bán dự kiến cho sản phẩm mới Cold Start (`UC-008`).
5. **Module Khuyến Nghị Mua Hàng Thông Minh (`UC-010`, `UC-011`):**
   * Giao diện Bàn làm việc gợi ý mua hàng (Recommendation Workbench).
   * Popover giải trình minh bạch (Explainable Insights): Hiển thị chi tiết lý do hệ thống đề xuất số lượng này (Do rủi ro gì, nhu cầu dự báo bao nhiêu, tồn kho an toàn bao nhiêu, làm tròn MOQ/Pack Size thế nào).
   * Nút bấm "Chạy lại phân tích" (On-demand Recalculate) kèm thanh tiến trình trạng thái (`UC-011`).
   * Thao tác chọn nhiều SKU $\rightarrow$ Bấm "Lập đơn mua hàng" $\rightarrow$ Tự động phân tách thành các đơn Draft theo từng nhà cung cấp.
6. **Module Đơn Mua Hàng & Nhận Hàng (`UC-012`, `UC-013`, `UC-014`):**
   * Danh sách đơn hàng với tabs trạng thái (`Tất cả`, `Nháp`, `Đang đặt`, `Đã nhận`, `Đã hủy`).
   * Nút "Xác nhận đặt hàng" hiển thị cảnh báo khóa đơn và tăng lượng hàng đang về.
   * Modal "Ghi nhận nhận hàng" (`UC-014`): Nhập số lượng thực nhận, số lượng lỗi/hỏng $\rightarrow$ Hệ thống tự động tính trước số lượng chấp nhận và trạng thái OTIF.
   * Thiết lập `queryClient.invalidateQueries` để tự động cập nhật lại Dashboard, Tồn kho và Khuyến nghị ngay khi nhận hàng xong.

### 6.5. Tiêu Chuẩn Nghiệm Thu & Kiểm Thử (Phase 5 Exit Gate)
* [ ] Giao diện phản hồi mượt mà, không bị giật lag khi render bảng dữ liệu lớn.
* [ ] Biểu đồ ECharts dải mây dự báo hiển thị chuẩn xác, không bị lỗi scale trục thời gian.
* [ ] Thao tác tương tác click trên 9 ô ma trận ABC-XYZ lọc chính xác danh sách sản phẩm.
* [ ] Quy trình từ Khuyến nghị $\rightarrow$ Tạo đơn $\rightarrow$ Chốt đơn $\rightarrow$ Nhận hàng vận hành thông suốt trên giao diện người dùng.

---

## 7. PHASE 6: KIỂM THỬ TÍCH HỢP TOÀN DIỆN (E2E), TỐI ƯU HÓA & BÀN GIAO

### 7.1. Mục Tiêu (Objectives)
* Khởi tạo bộ dữ liệu giả lập chuẩn (Mock Data) gồm 100+ SKU mô phỏng đầy đủ các hành vi thực tế (sản phẩm theo mùa, sản phẩm biến động mạnh, sản phẩm mới).
* Thực hiện kiểm thử tích hợp xuyên suốt từ đầu đến cuối (End-to-End Test Scenarios).
* Đo kiểm và tinh chỉnh hiệu năng hệ thống nhằm thỏa mãn 13 tiêu chuẩn phi chức năng (NFR-01 đến NFR-13).
* Đóng gói Docker hoàn chỉnh và hoàn thiện tài liệu hướng dẫn vận hành.

### 7.2. Tài Liệu Đầu Vào Bắt Buộc (Input Documents)
* [`non-functional-requirements.md`](file:///c:/my_project/dss-ai-purchase/docs/02-requirements/non-functional-requirements.md)
* [`deployment-and-devops.md`](file:///c:/my_project/dss-ai-purchase/docs/05-architecture/deployment-and-devops.md)

### 7.3. Danh Sách Kịch Bản Kiểm Thử Toàn Diện (E2E Test Scenarios)
1. **Kịch Bản 1: Luồng Nghiệp Vụ Chính (Golden Happy Path):**
   * Nạp file Excel 90 ngày bán hàng của 100 SKU $\rightarrow$ Bấm Chạy lại phân tích (`UC-011`).
   * Kiểm tra ma trận ABC-XYZ phân bổ đủ các nhóm.
   * Kiểm tra danh sách Khuyến nghị mua hàng sinh ra đúng cho các SKU có $\text{IP} \le ROP$.
   * Chọn 3 khuyến nghị của cùng 1 Nhà cung cấp $\rightarrow$ Tạo đơn PO Draft.
   * Bấm Xác nhận đơn (`ORDERED`) $\rightarrow$ Kiểm tra `on_order` trong kho tăng lên tương ứng.
   * Thực hiện Nhận hàng (`UC-014`) với 1 vài sản phẩm có hàng lỗi $\rightarrow$ Kiểm tra `on_hand` tăng đúng bằng hàng đạt, `on_order` giảm về 0, đơn hàng chuyển sang `RECEIVED`, lịch sử giao hàng được ghi nhận và điểm OTIF của nhà cung cấp được cập nhật.
2. **Kịch Bản 2: Kiểm Thử Toàn Vẹn Giao Dịch Khi Có Lỗi (Resilience & Rollback):**
   * Giả lập sự cố ngắt kết nối database ngay giữa quá trình nhận hàng $\rightarrow$ Xác nhận toàn bộ giao dịch được Rollback, không có tình trạng `on_hand` tăng nhưng đơn hàng vẫn ở trạng thái `ORDERED`.
3. **Kịch Bản 3: Kiểm Thử Khả Năng Chống Chịu Khi AI Service Gặp Sự Cố:**
   * Tắt container `ai-service` $\rightarrow$ Bấm Chạy lại phân tích khuyến nghị trên giao diện.
   * Kiểm tra hệ thống Backend tự kích hoạt Fallback SMA-7, gợi ý mua hàng vẫn được tạo ra bình thường kèm cảnh báo "Dự báo bằng thuật toán dự phòng do AI bận".

### 7.4. Đo Kiểm Hiệu Năng & Tiêu Chuẩn Phi Chức Năng (NFR Checklist)
* [ ] **NFR-01:** Thời gian tải trang Dashboard và Tồn kho $< 1.5$ giây.
* [ ] **NFR-02:** Thời gian phản hồi API CRUD thông thường $< 200\text{ms}$.
* [ ] **NFR-03:** Thời gian chạy lại toàn bộ phân tích DSS cho 100 SKU $< 10$ giây.
* [ ] **NFR-04:** AI Service phản hồi đơn SKU $< 150\text{ms}$ và batch $< 3000\text{ms}$.
* [ ] **NFR-07:** Giao dịch nhận hàng nguyên tử đảm bảo tính toàn vẹn 100% trong `prisma.$transaction`.

### 7.5. Đóng Gói & Bàn Giao
* Kiểm tra lệnh khởi động duy nhất: `docker compose up -d --build`.
* Toàn bộ 4 dịch vụ (`postgres`, `backend`, `ai-service`, `frontend`) tự động kết nối và hoạt động ổn định.
* Cung cấp tài liệu hướng dẫn đăng nhập mặc định (`admin` / `Admin@123`) và các bước demo chuẩn.
