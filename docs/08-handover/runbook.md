# SỔ TAY VẬN HÀNH & HƯỚNG DẪN BÀN GIAO (SYSTEM RUNBOOK)
## HỆ THỐNG HỖ TRỢ RA QUYẾT ĐỊNH MUA HÀNG TÍCH HỢP AI (DSS AI PURCHASE)

> **Phiên bản:** 1.0 (Phase 6 Final Release)  
> **Trạng thái:** Sẵn sàng nghiệm thu và đưa vào vận hành (Production Ready)  
> **Đối tượng:** Quản trị viên hệ thống, Kỹ sư vận hành (DevOps), Trưởng phòng Mua hàng, QA Tester  

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

DSS AI Purchase là giải pháp Hỗ trợ Ra Quyết định Mua hàng Bán lẻ Tích hợp Trí tuệ Nhân tạo (Decision Support System — Human-in-the-loop) cho cửa hàng bán lẻ quy mô độc lập (< 1.000 SKU), bao gồm 3 phân hệ dịch vụ độc lập:

```mermaid
flowchart LR
    subgraph Client["Trình Duyệt Người Dùng"]
        FE["Frontend SPA\n(React 18 + Vite + TailwindCSS + ECharts)\nPort: 5173"]
    end

    subgraph CoreBackend["Hệ Thống Lõi Nghiệp Vụ"]
        BE["Backend API Server\n(Node.js 20+ Express Clean Architecture)\nPort: 3000"]
    end

    subgraph AIService["Động Cơ Dự Báo AI (Stateless)"]
        AI["AI Pure Compute Engine\n(FastAPI + Python 3.10 + Statsmodels)\nPort: 8000"]
    end

    subgraph DataTier["Tầng Lưu Trữ"]
        DB[(PostgreSQL 16+\n18 Bảng 3NF Chuẩn Hóa)\nPort: 5432]
    end

    FE -->|REST API + JWT Bearer| BE
    BE -->|Prisma ORM + ACID Transactions| DB
    BE -->|HTTP Batch Forecast Payload\n(Timeout 4s, Fallback SMA-7)| AI
```

### Các Thông Số Cổng (Ports) & Dịch Vụ
| Dịch Vụ | Công Nghệ | Cổng Nội Bộ | Cổng Công Khai | Nhiệm Vụ Chính |
| :--- | :--- | :--- | :--- | :--- |
| **dss-frontend** | React 18, Vite, TailwindCSS | 5173 | `http://localhost:5173` | Giao diện quản trị, biểu đồ ECharts 9 ô ABC-XYZ, dải mây dự báo, quản lý PO |
| **dss-backend** | Node.js, Express, Clean Architecture, Prisma | 3000 | `http://localhost:3000` | API nghiệp vụ, xác thực JWT, RBAC, kiểm soát vị trí tồn kho IP, điều phối DSS |
| **dss-ai-service** | Python 3.10+, FastAPI, Statsmodels | 8000 | `http://localhost:8000` | Stateless Compute Engine chạy mô hình Holt-Winters, tính WAPE/MAE, dải tin cậy 95% |
| **dss-postgres** | PostgreSQL 16 Alpine | 5432 | `localhost:5432` | RDBMS 18 bảng chuẩn hóa 3NF, kiểm soát toàn vẹn ACID, Generated Column `calculated_ip` |

---

## 2. YÊU CẦU MÔI TRƯỜNG & CÀI ĐẶT TIÊN QUYẾT

Để triển khai và vận hành hệ thống, máy chủ hoặc máy trạm phát triển cần đáp ứng:
- **Hệ điều hành:** Windows 10/11, Ubuntu 20.04+, hoặc macOS 12+
- **Docker Desktop / Docker Engine:** 24.0+ (kèm `docker compose`)
- **Node.js:** 20.x LTS trở lên
- **Python:** 3.10+ (nếu chạy local service thay vì Docker)
- **RAM tối thiểu:** 8 GB (Khuyến nghị 16 GB để chạy đồng thời mô hình dự báo và cơ sở dữ liệu)

---

## 3. HƯỚNG DẪN KHỞI ĐỘNG HỆ THỐNG

### Phương Án A: Khởi Động 1-Click Bằng Docker Compose (Khuyến Nghị Vận Hành)
Chỉ cần 1 lệnh duy nhất tại thư mục gốc của dự án:
```bash
# Khởi động toàn bộ cụm dịch vụ ở chế độ background
docker compose up -d

# Kiểm tra trạng thái sức khỏe (Health Check)
docker compose ps
```
Khi hiển thị toàn bộ 4 container ở trạng thái `Up (healthy)`, truy cập ngay:
- **Ứng dụng Web (Frontend):** `http://localhost:5173`
- **Swagger / Backend Health:** `http://localhost:3000/api/v1/health`
- **Tài liệu AI Service API:** `http://localhost:8000/docs`

Để dừng hệ thống:
```bash
docker compose down
```

---

### Phương Án B: Khởi Động Môi Trường Phát Triển Cục Bộ (Local Development)
1. **Khởi động PostgreSQL:**
   ```bash
   docker compose up -d postgres
   ```
2. **Khởi động Backend:**
   ```bash
   cd backend
   npm install
   npx prisma db push --skip-generate
   npm run dev
   # Server lắng nghe tại http://localhost:3000
   ```
3. **Khởi động AI Service:**
   ```bash
   cd ai-service
   # Khởi tạo venv nếu chưa có: python -m venv venv && source venv/bin/activate (hoặc venv\Scripts\activate trên Windows)
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   # FastAPI lắng nghe tại http://localhost:8000
   ```
4. **Khởi động Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   # Vite dev server lắng nghe tại http://localhost:5173
   ```

---

## 4. DỮ LIỆU MẪU THỰC TẾ & KỊCH BẢN SEED (PHASE 6 DATASET)

Hệ thống tích hợp bộ sinh dữ liệu bán lẻ có định hướng (**Domain-Aware Synthetic Retail Generator**) mô phỏng chính xác hành vi kinh doanh của cửa hàng bán lẻ FMCG Việt Nam:

### 4.1. Đặc Tính Bộ Dữ Liệu Phase 6
- **Quy mô danh mục:** 120 SKU thuộc 6 ngành hàng chủ lực (Sữa & Chế phẩm, Nước giải khát, Hóa phẩm giặt tẩy, Bánh kẹo & Snack, Gia vị & Dầu ăn, Chăm sóc cá nhân).
- **Mạng lưới nhà cung cấp:** 6 Nhà cung cấp chiến lược (Vinamilk Distribution, Coca-Cola Beverage VN, Unilever Consumer Care, Masan Consumer Trade, Orion Food Vina, P&G Vietnam Distribution) với thời gian giao hàng cam kết và trọng số đánh giá thực tế.
- **Chuỗi thời gian bán hàng:** 9.870 bản ghi giao dịch trải dài **90 ngày liên tục**, có tính chu kỳ tuần rõ nét (cuối tuần doanh số tăng $30\% - 40\%$), nhiễu ngẫu nhiên và xu hướng tăng trưởng.
- **Lịch sử giao hàng (OTIF):** 30 đơn hàng lịch sử mô phỏng tỷ lệ giao đủ hàng và đúng hẹn để thuật toán tính điểm nhà cung cấp hoạt động ngay.
- **Độ bao phủ rủi ro:** Phân bổ đầy đủ vào **9 ô Ma trận ABC-XYZ** và **5 Cấp độ rủi ro tồn kho** (`OUT_OF_STOCK`, `CRITICAL_RISK`, `HIGH_RISK`, `OPTIMAL`, `OVERSTOCK`).

### 4.2. Lệnh Nạp Dữ Liệu Mẫu
Chạy lệnh sau tại thư mục `backend/`:
```bash
cd backend
npm run seed:phase6
```
> *Lưu ý:* Script sẽ dọn sạch dữ liệu cũ và tái lập 120 SKU, tính toán lại vị trí tồn kho $IP = \text{On-Hand} + \text{On-Order}$ và nạp đầy đủ lịch sử bán hàng.

---

## 5. TÀI KHOẢN ĐĂNG NHẬP MẶC ĐỊNH (RBAC)

Hệ thống phân quyền nghiêm ngặt theo tiêu chuẩn `NFR-010` và `FR-033`:

| Tên Đăng Nhập | Mật Khẩu | Vai Trò | Quyền Hạn Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| **`admin`** | `Admin@123` | **ADMIN** | Toàn quyền quản trị hệ thống, quản lý tài khoản người dùng, cấu hình trọng số nhà cung cấp, chạy phân tích DSS, duyệt và hủy đơn mua hàng PO, xác nhận nhận hàng. |
| **`staff`** | `Staff@123` | **STAFF** | Tra cứu tồn kho, xem khuyến nghị mua hàng AI, lập đơn mua hàng nháp (DRAFT), thực hiện kiểm đếm và nhận hàng kho. Bị chặn truy cập quản trị tài khoản và cấu hình trọng số. |

---

## 6. KỊCH BẢN DEMO NGHIỆP VỤ E2E (END-TO-END DEMO WALKTHROUGH)

Sau khi nạp dữ liệu bằng `npm run seed:phase6`, người dùng có thể thực hiện kiểm thử toàn bộ luồng nghiệp vụ khép kín theo các bước sau:

### Bước 1: Đăng Nhập & Quan Sát Tổng Quan Tồn Kho (Dashboard)
1. Đăng nhập tài khoản `admin` / `Admin@123`.
2. Truy cập màn hình **Tổng quan Tồn kho**:
   - Quan sát 4 thẻ chỉ số KPI tổng thể: Tổng SKU (120), SKU Hết hàng, SKU Nguy cơ, SKU Tồn tối ưu.
   - Quan sát **Ma trận 9 ô ABC-XYZ**: Các sản phẩm AX (doanh thu lớn, nhu cầu ổn định như Sữa tươi Vinamilk, Dầu Tường An) được định vị rõ nét.

### Bước 2: Kích Hoạt Phân Tích DSS On-Demand (`UC-011`, `NFR-002`)
1. Bấm nút **"Chạy phân tích DSS"** trên thanh công cụ.
2. Hệ thống thực thi quy trình phân tích tự động:
   - Trích xuất 90 ngày lịch sử bán hàng cho toàn bộ 120 SKU.
   - Gửi payload phân tích theo lô sang AI Service (Holt-Winters $s=7$).
   - Nhận kết quả dự báo, tính toán Điểm đặt hàng lại $ROP = D \cdot L + SS$.
   - Tính toán lượng đặt hàng đề xuất $Q_{raw} = \max(0, ROP - IP)$ và làm tròn theo MOQ/Lô.
   - Xếp hạng nhà cung cấp tối ưu nhất theo điểm tổng hợp $Score = w_p P + w_q Q + w_d D$.
   - Hoàn tất toàn bộ danh mục trong thời gian **$\approx 2.5$ giây** (Vượt tiêu chuẩn `NFR-002` $\le 5$ giây).

### Bước 3: Đánh Giá Khuyến Nghị & Tính Minh Bạch Giải Trình AI (`NFR-005`)
1. Chuyển sang màn hình **Khuyến nghị Mua hàng**:
   - Hệ thống hiển thị danh sách các SKU cần mua ngay được đánh dấu màu Đỏ (`OUT_OF_STOCK`, `CRITICAL_RISK`) hoặc Vàng (`HIGH_RISK`).
   - Mở chi tiết khuyến nghị của SKU: Bấm vào thẻ **Giải trình đề xuất (Explainable DSS)** để xem các yếu tố định lượng: Nhu cầu dự báo trung bình ngày, Lead time của NCC, Hệ số an toàn $Z$, Tồn kho an toàn $SS$, và Điểm số OTIF của Nhà cung cấp được chọn.

### Bước 4: Chuyển Khuyến Nghị Thành Đơn Mua Hàng PO (`UC-012`, `BR-001`, `BR-024`)
1. Chọn 1 hoặc nhiều mặt hàng khuyến nghị và bấm **"Tạo Đơn Mua Hàng"**.
2. Đơn PO được khởi tạo ở trạng thái **`DRAFT`** với mã đơn tự sinh chuẩn `PO-YYYYMMDD-XXXX`.
3. Bấm **"Xác nhận gửi nhà cung cấp"** $\longrightarrow$ Đơn chuyển sang trạng thái **`ORDERED`**:
   - **Bảo toàn vị trí tồn kho (`BR-001`):** Trường `on_order` của các sản phẩm tương ứng trong kho lập tức tăng lên đúng bằng số lượng đặt.
   - Hệ thống lập tức loại trừ nhu cầu mua của SKU này trong các lần phân tích tiếp theo, loại bỏ hoàn toàn rủi ro đặt trùng hàng.

### Bước 5: Tiếp Nhận Hàng Kho Nguyên Tử ACID (`UC-014`, `BR-017`, `BR-018`, `NFR-007`)
1. Chuyển sang màn hình **Đơn Mua Hàng**, chọn đơn đang ở trạng thái `ORDERED`.
2. Bấm **"Nhận hàng"**: Nhập số lượng thực nhận và số lượng hàng lỗi/hỏng (nếu có).
3. Bấm **"Hoàn tất nhận hàng"**:
   - Hệ thống thực thi giao dịch nguyên tử `prisma.$transaction`:
     * Tăng số lượng hàng thực có `on_hand = on_hand + accepted_quantity`.
     * Giảm số lượng hàng đang về `on_order = on_order - ordered_quantity`.
     * Cập nhật trạng thái đơn PO thành `RECEIVED`.
     * Ghi nhận lịch sử giao hàng `delivery_history` để cập nhật tỷ lệ OTIF cho nhà cung cấp.
   - Bất biến giao dịch: Nếu có lỗi hệ thống hoặc mạng đứt quãng giữa chừng, toàn bộ thay đổi tự động rollback $100\%$, ngăn chặn tuyệt đối tình trạng lệch kho.

---

## 7. CỔNG NGHIỆM THU & BÁO CÁO KIỂM THỬ TỰ ĐỘNG

Dự án đã thiết lập bộ kiểm thử toàn diện vượt qua Cổng Nghiệm Thu Cơ Học (Verification Gate):

```bash
# 1. Chạy toàn bộ 30 Test Suites Backend (117 tests)
cd backend && npm test

# 2. Kiểm thử riêng biệt Đo kiểm Hiệu năng (Performance Benchmarks)
cd backend && npx jest tests/performance/performanceBenchmark.test.ts

# 3. Kiểm tra biên dịch TypeScript nghiêm ngặt
cd backend && npm run build
cd frontend && npm run build

# 4. Quét vi phạm ranh giới Clean Architecture (0 vi phạm)
git grep -i -E "(express|prisma|@prisma|statusCode|res\.status)" backend/src/domain/
git grep -i -E "(express|prisma|@prisma|res\.status)" backend/src/application/
git grep -i -E "(prisma\.[a-z]+\.(find|create|update|delete))" backend/src/api/
```

### Kết Quả Đo Kiểm NFR Thực Tế
| Tiêu Chuẩn NFR | Yêu Cầu Thiết Kế | Kết Quả Đo Kiểm Thực Tế | Trạng Thái |
| :--- | :--- | :--- | :--- |
| **NFR-01 (API Response Time)** | CRUD Tra cứu $\le 500$ms | `GET /products`: **31ms**<br>`GET /inventory`: **26ms**<br>`GET /suppliers`: **10ms** | **ĐẠT (Vượt 15 lần)** |
| **NFR-02 (DSS Pipeline Speed)** | Phân tích toàn bộ danh mục $\le 5.000$ms | Chạy DSS cho 120 SKU: **2.598ms** | **ĐẠT (Vượt 2 lần)** |
| **NFR-04 (Fallback Resilience)** | Timeout $\le 4.000$ms, tự động Fallback SMA-7 | Backend tự động chuyển đổi sang SMA-7 cục bộ khi AI offline hoặc WAPE > 40% | **ĐẠT (100% test pass)** |
| **NFR-07 (ACID Data Integrity)** | Nhận hàng nguyên tử, rollback khi lỗi | Tăng On-hand, giảm On-order, rollback $100\%$ khi có lỗi DB | **ĐẠT (100% test pass)** |
| **NFR-09 & 010 (Security & RBAC)** | Bcrypt rounds=12, RBAC Middleware | Phân quyền ADMIN/STAFF nghiêm ngặt, chặn truy cập trái phép | **ĐẠT (100% test pass)** |

---

## 8. HƯỚNG DẪN XỬ LÝ SỰ CỐ (TROUBLESHOOTING & FAQS)

### Sự cố 1: Dịch vụ AI Service không phản hồi hoặc bị sập
- **Hiện tượng:** Log backend hiển thị `[AI Forecast Client] Failed to connect to AI Service. Switching to Local Fallback Engine`.
- **Hành vi hệ thống:** Hệ thống **không bị sập** và người dùng không nhận lỗi `500`. Backend tự động kích hoạt thuật toán **SMA-7 (Simple Moving Average 7 ngày)** nội bộ, gắn cờ cảnh báo `fallbackUsed = true` và `WAPE = 0.0`.
- **Khắc phục:** Kiểm tra trạng thái container AI: `docker compose logs dss-ai-service`. Nếu container sập do tràn RAM, khởi động lại bằng `docker compose restart dss-ai-service`.

### Sự cố 2: Lỗi PostgreSQL `cannot insert into generated column "calculated_ip"`
- **Nguyên nhân:** Cột `calculated_ip` trong bảng `inventory` là cột tính toán tự động `GENERATED ALWAYS AS (on_hand + on_order) STORED`.
- **Khắc phục:** Tuyệt đối không truyền trường `calculated_ip` hoặc `calculatedIp` trong câu lệnh `create` hay `update` của Prisma. Hệ thống tự động cập nhật giá trị cột này từ `on_hand` và `on_order`.

### Sự cố 3: Cần thiết lập lại dữ liệu thử nghiệm từ đầu (Factory Reset)
- **Thực hiện:**
  ```bash
  cd backend
  npx prisma migrate reset --force
  npm run seed:phase6
  ```
  Lệnh này sẽ xóa toàn bộ database, tái áp dụng schema migration và nạp lại 120 SKU cùng 9.870 giao dịch mẫu chuẩn.

---
*Tài liệu được biên soạn và bảo chứng kỹ thuật bởi Đội ngũ Kiến trúc Dự án DSS AI Purchase.*
