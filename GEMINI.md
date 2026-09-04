# STATIC AGENT DIRECTIVES & CONTEXT: DSS AI PURCHASE

> [!IMPORTANT]
> **TÀI LIỆU QUY CHUẨN TỐI CAO DÀNH CHO AI AGENT (STATIC SYSTEM CONTEXT)**
> Mọi AI Agent (Gemini / Antigravity) khi làm việc trong repository này **BẮT BUỘC** phải đọc và tuân thủ tuyệt đối các quy tắc trong file này ở mọi phiên làm việc. Tuyệt đối không tự ý suy diễn, tự ý sửa đổi quy tắc nghiệp vụ, tự ý thay đổi công nghệ hoặc quét toàn bộ tài liệu khi chưa được chỉ định.

---

## 1. TỔNG QUAN HỆ THỐNG & RANH GIỚI NGHIỆP VỤ

* **Tên dự án:** Hệ Thống Hỗ Trợ Ra Quyết Định Mua Hàng Tích Hợp AI (DSS AI Purchase).
* **Bản chất hệ thống:** Là **Decision Support System (DSS)** hỗ trợ nhân viên ra quyết định mua hàng (Human-in-the-loop). Hệ thống đưa ra gợi ý kèm giải thích minh bạch (Explainable Insights); quyền quyết định và chốt đơn thuộc về con người.
* **Phạm vi mô hình:** Dành cho **1 cửa hàng bán lẻ đơn lẻ (Single Retail Store)** với quy mô quản lý dưới 1.000 SKU sản phẩm.
* **Ranh giới NGOÀI phạm vi (Out-of-scope - CẤM triển khai):**
  * ❌ KHÔNG quản lý chuỗi đa chi nhánh hoặc điều chuyển kho liên chi nhánh.
  * ❌ KHÔNG xây dựng phân hệ kế toán tài chính, công nợ chuyên sâu.
  * ❌ KHÔNG xây dựng màn hình thu ngân quét mã vạch (POS) (dữ liệu bán hàng nạp qua file Excel/CSV).
  * ❌ KHÔNG tự động gửi API đặt hàng hoặc tự động thanh toán tài chính cho nhà cung cấp.
  * ❌ KHÔNG quản lý chi tiết vị trí từng ô kệ kho (WMS) hay vị trí từng lô date chuyên sâu.

---

## 2. NGUYÊN TẮC VÀNG BẮT BUỘC DÀNH CHO AGENT (GOLDEN RULES)

### Rule 1: Tuyệt Đối Tuân Thủ Tài Liệu Đặc Tả (Strict Specification Adherence)
* Mọi cấu trúc bảng, tên trường, kiểu dữ liệu, mã lỗi, công thức toán học và luồng nghiệp vụ **đã được đóng băng** trong thư mục `docs/`.
* **CẤM** tự ý thêm/bớt trường dữ liệu trong CSDL nếu không có trong `04-data-model`.
* **CẤM** tự ý thay đổi mã trạng thái đơn hàng (`DRAFT`, `ORDERED`, `RECEIVED`, `CANCELLED`).
* **CẤM** tự ý thay đổi các công thức toán học định lượng: Vị trí tồn kho $\text{IP}$, Tồn kho an toàn $\text{SS}$, Điểm đặt hàng lại $\text{ROP}$, Số ngày bán $\text{DoS}$, Số lượng mua thô $Q_{raw}$, Làm tròn MOQ/Pack Size, Sai số WAPE/MAE, và Bộ 4 điểm nhà cung cấp.

### Rule 2: Đọc Đúng Tài Liệu Mục Tiêu (Targeted Reading - Tránh Quét Toàn Bộ)
* **KHÔNG ĐƯỢC** quét toàn bộ thư mục `docs/` một cách lãng phí token context.
* Trước khi lập trình bất kỳ module nào, Agent **BẮT BUỘC** phải tra cứu **Bảng Điều Hướng Tài Liệu (Section 3)** dưới đây và **chỉ đọc đúng các file được chỉ định**.

### Rule 3: Tuân Thủ Ngăn Xếp Công Nghệ (Tech Stack Confinement)
* **Backend:** Node.js 20+ + Express + TypeScript + **Clean Architecture** + **Prisma ORM** + Zod.
* **Frontend:** React 18 + Vite + TypeScript + **Feature-Based Architecture** + **TailwindCSS** + **TanStack Query** + **Apache ECharts**.
* **AI Service:** Python 3.10+ + **FastAPI** theo mô hình **Stateless Pure Compute Engine** (Không kết nối trực tiếp CSDL; nhận mảng lịch sử bán hàng qua HTTP POST từ Node.js, xử lý thuật toán dự báo và trả về JSON).
* **Database:** PostgreSQL 14+ (18 bảng chuẩn hóa 3NF, kiểm soát toàn vẹn giao dịch ACID).
* **DevOps:** Docker Compose (mạng nội bộ `dss-network`).

### Rule 4: Bảo Toàn Tính Toàn Vẹn Giao Dịch & Máy Trạng Thái (Integrity & State Rules)
* **Chống đặt trùng lặp 100% (`BR-001`):** Vị trí tồn kho $\text{IP} = \text{On-Hand} + \text{On-Order}$. Khi đơn hàng chuyển sang `ORDERED`, phải lập tức tăng $\text{On-Order}$.
* **Khóa đơn hàng (`BR-025`):** Khi đơn hàng ở trạng thái `ORDERED`, khóa cứng toàn bộ danh mục sản phẩm và số lượng. Chỉ cho phép 2 hành động: *Ghi nhận nhận hàng* hoặc *Hủy đơn*.
* **Giao dịch nguyên tử khi nhận hàng (`BR-018`, `UC-014`):** Thực thi trong 1 giao dịch cơ sở dữ liệu (`prisma.$transaction`): tăng $\text{On-Hand} += Q_{accepted}$, giải phóng $\text{On-Order} -= Q_{ordered}$, đóng đơn `RECEIVED`, lưu bản ghi vào `delivery_history`.
* **Cơ chế Fallback AI (`BR-007`):** Nếu sai số $\text{WAPE} > 40\%$, hệ thống tự động chuyển sang dùng thuật toán Trung bình trượt 7 ngày (SMA-7) an toàn.

### Rule 5: Chuẩn Hóa Phản Hồi API (Uniform Envelope)
* Mọi API của Backend bắt buộc phải bọc trong Envelope chuẩn:
  * Thành công: `{ success: true, data: ..., meta?: ..., timestamp: ... }`
  * Thất bại: `{ success: false, error: { code: ..., message: ..., details?: ... }, timestamp: ... }`

---

## 3. BẢNG ĐIỀU HƯỚNG TÀI LIỆU THEO TÁC VỤ (TASK-TO-DOCUMENT ROUTER)

Trước khi thực hiện một tác vụ cụ thể, Agent hãy tìm tác vụ trong bảng dưới đây và mở chính xác tài liệu được liên kết:

| Nhóm Tác Vụ Cần Triển Khai | Tài Liệu Bắt Buộc Phải Đọc Trước Khi Viết Code | Mục Đích & Phạm Vi Tham Chiếu |
| :--- | :--- | :--- |
| **Khởi tạo Database / Migration / Prisma** | 1. [`physical-schema.sql`](file:///c:/my_project/dss-ai-purchase/docs/04-data-model/physical-schema.sql)<br>2. [`data-dictionary.md`](file:///c:/my_project/dss-ai-purchase/docs/04-data-model/data-dictionary.md) | Copy trực tiếp DDL SQL, ENUMs, Check constraints, quan hệ khóa ngoại và kiểu dữ liệu. |
| **Backend: Thực Thể & Nghiệp Vụ Cốt Lõi (Domain Layer)** | 1. [`business-rules.md`](file:///c:/my_project/dss-ai-purchase/docs/02-requirements/business-rules.md)<br>2. [`backend-architecture.md`](file:///c:/my_project/dss-ai-purchase/docs/05-architecture/backend-architecture.md) | Cài đặt các Entities, Value Objects, Domain Services tính toán ($SS, ROP, Q_{raw}$, làm tròn MOQ/Pack Size, ABC-XYZ, OTIF). |
| **Backend: Triển Khai Use Case Cụ Thể (Application Layer)** | 1. [`backend-architecture.md`](file:///c:/my_project/dss-ai-purchase/docs/05-architecture/backend-architecture.md)<br>2. File Use Case tương ứng: [`UC-xxx.md`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/) | Đọc Main Flow, Alternative Flow, Exception Flow và triển khai Use Case Interactor. |
| **Backend: Triển Khai Giao Dịch Nhận Hàng / Chốt Đơn (ACID)** | 1. [`data-flow-and-integrity.md`](file:///c:/my_project/dss-ai-purchase/docs/04-data-model/data-flow-and-integrity.md)<br>2. [`UC-014-ghi-nhan-nhan-hang-va-cap-nhat-ton-kho.md`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-014-ghi-nhan-nhan-hang-va-cap-nhat-ton-kho.md) | Xem mã giả Transaction và cài đặt `PrismaUnitOfWork` cập nhật kho 2 chiều an toàn. |
| **Backend: Xây Dựng REST API Endpoint Cụ Thể** | 1. [`endpoints-spec.md`](file:///c:/my_project/dss-ai-purchase/docs/06-api-design/endpoints-spec.md)<br>2. [`overview.md (API)`](file:///c:/my_project/dss-ai-purchase/docs/06-api-design/overview.md) | Tra cứu Method, URI, Request Body, Zod Schema, Response 200/400/403/422 và Quyền hạn RBAC. |
| **Backend: Gọi Dịch Vụ AI Dự Báo** | 1. [`internal-ai-contracts.md`](file:///c:/my_project/dss-ai-purchase/docs/06-api-design/internal-ai-contracts.md)<br>2. [`ai-service-architecture.md`](file:///c:/my_project/dss-ai-purchase/docs/05-architecture/ai-service-architecture.md) | Cài đặt Axios Client gọi sang `POST /api/v1/forecast`, cấu hình timeout 4s và fallback cục bộ. |
| **Python: Triển Khai AI Service / Thuật Toán Dự Báo** | 1. [`ai-service-architecture.md`](file:///c:/my_project/dss-ai-purchase/docs/05-architecture/ai-service-architecture.md)<br>2. [`internal-ai-contracts.md`](file:///c:/my_project/dss-ai-purchase/docs/06-api-design/internal-ai-contracts.md)<br>3. [`business-rules.md (BR-006 -> BR-008)`](file:///c:/my_project/dss-ai-purchase/docs/02-requirements/business-rules.md) | Cài đặt FastAPI, Pydantic schemas, mô hình Holt-Winters, tính WAPE/MAE, dải mây tin cậy và Fallback SMA-7. |
| **Frontend: Cấu Trúc Module & Tính Năng (Feature-Based)** | 1. [`frontend-architecture.md`](file:///c:/my_project/dss-ai-purchase/docs/05-architecture/frontend-architecture.md)<br>2. [`endpoints-spec.md`](file:///c:/my_project/dss-ai-purchase/docs/06-api-design/endpoints-spec.md) | Tổ chức mã nguồn trong `src/features/<feature_name>`, cài đặt API hooks, components và types. |
| **Frontend: Quản Lý Cache & Tự Động Làm Mới (React Query)** | 1. [`frontend-architecture.md`](file:///c:/my_project/dss-ai-purchase/docs/05-architecture/frontend-architecture.md)<br>2. [`data-flow-and-integrity.md`](file:///c:/my_project/dss-ai-purchase/docs/04-data-model/data-flow-and-integrity.md) | Cấu hình Query Keys và thiết lập `invalidateQueries` khi chạy lại phân tích (`UC-011`) hoặc nhận hàng (`UC-014`). |
| **Frontend: Vẽ Biểu Đồ Chuỗi Thời Gian & Ma Trận 9 Ô** | 1. [`frontend-architecture.md (Section 5)`](file:///c:/my_project/dss-ai-purchase/docs/05-architecture/frontend-architecture.md)<br>2. [`UC-007`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-007-xem-du-bao-nhu-cau-ban-le.md) & [`UC-005`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-005-xem-phan-tich-ma-tran-abc-xyz.md) | Sử dụng Apache ECharts vẽ dải mây biến động tin cậy (Confidence Shaded Area) và Grid 9 ô click-to-filter. |
| **Frontend: Styling & Bảng Màu Rủi Ro Tồn Kho** | 1. [`frontend-architecture.md (Section 4)`](file:///c:/my_project/dss-ai-purchase/docs/05-architecture/frontend-architecture.md)<br>2. [`business-rules.md (BR-002)`](file:///c:/my_project/dss-ai-purchase/docs/02-requirements/business-rules.md) | Cấu hình `tailwind.config.js` với 5 màu chuẩn: Đỏ sẫm (Hết hàng), Đỏ cam (Nguy cấp), Vàng (Cần đặt), Xanh lá (An toàn), Tím (Tồn dư). |
| **DevOps: Đóng Gói Docker Compose & Môi Trường** | 1. [`deployment-and-devops.md`](file:///c:/my_project/dss-ai-purchase/docs/05-architecture/deployment-and-devops.md) | Sử dụng trực tiếp `docker-compose.yml`, các file Dockerfile mẫu và file `.env`. |
| **Lập Kế Hoạch & Trình Tự Triển Khai (Roadmap & Phases)** | 1. [`overview.md (Plan)`](file:///c:/my_project/dss-ai-purchase/docs/07-implementation-plan/overview.md)<br>2. [`phase-details.md`](file:///c:/my_project/dss-ai-purchase/docs/07-implementation-plan/phase-details.md) | Xem tổng quan 7 giai đoạn (Phase 0 -> Phase 6), ma trận phụ thuộc, tiêu chuẩn nghiệm thu DoD và checklist từng file. |

---

## 4. BẢNG TRA CỨU USE CASE $\leftrightarrow$ FILE TÀI LIỆU CHI TIẾT

Khi được yêu cầu lập trình một Use Case cụ thể, hãy mở trực tiếp file Use Case tương ứng:

| Mã Use Case | Tên Nghiệp Vụ Cốt Lõi | File Đặc Tả Chi Tiết Cần Đọc |
| :---: | :--- | :--- |
| **UC-001** | Quản lý danh mục sản phẩm | [`UC-001-quan-ly-danh-muc-san-pham.md`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-001-quan-ly-danh-muc-san-pham.md) |
| **UC-002** | Quản lý danh mục nhà cung cấp & bảng giá | [`UC-002-quan-ly-danh-muc-nha-cung-cap.md`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-002-quan-ly-danh-muc-nha-cung-cap.md) |
| **UC-003** | Nạp dữ liệu bán hàng & tồn kho (Excel/CSV) | [`UC-003-nap-du-lieu-ban-hang-va-ton-kho.md`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-003-nap-du-lieu-ban-hang-va-ton-kho.md) |
| **UC-004** | Theo dõi tồn kho & cảnh báo 5 cấp rủi ro | [`UC-004-theo-doi-ton-kho-va-canh-bao-rui-ro.md`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-004-theo-doi-ton-kho-va-canh-bao-rui-ro.md) |
| **UC-005** | Xem phân tích ma trận 9 ô ABC - XYZ | [`UC-005-xem-phan-tich-ma-tran-abc-xyz.md`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-005-xem-phan-tich-ma-tran-abc-xyz.md) |
| **UC-006** | Xem chi tiết phân tích sản phẩm 360° | [`UC-006-xem-chi-tiet-phan-tich-san-pham.md`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-006-xem-chi-tiet-phan-tich-san-pham.md) |
| **UC-007** | Xem dự báo nhu cầu bán lẻ AI (7/14/30 ngày) | [`UC-007-xem-du-bao-nhu-cau-ban-le.md`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-007-xem-du-bao-nhu-cau-ban-le.md) |
| **UC-008** | Nhập lượng bán dự kiến cho SP mới Cold Start | [`UC-008-nhap-luong-ban-du-kien-cho-san-pham-moi.md`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-008-nhap-luong-ban-du-kien-cho-san-pham-moi.md) |
| **UC-009** | Xem đánh giá & xếp hạng nhà cung cấp | [`UC-009-xem-danh-gia-va-xep-hang-nha-cung-cap.md`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-009-xem-danh-gia-va-xep-hang-nha-cung-cap.md) |
| **UC-010** | Xem khuyến nghị mua hàng thông minh (Explainable)| [`UC-010-xem-khuyen-nghi-mua-hang-thong-minh.md`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-010-xem-khuyen-nghi-mua-hang-thong-minh.md) |
| **UC-011** | Chạy lại phân tích & cập nhật DSS on-demand | [`UC-011-chay-lai-phan-tich-va-cap-nhat-khuyen-nghi.md`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-011-chay-lai-phan-tich-va-cap-nhat-khuyen-nghi.md) |
| **UC-012** | Lập và xác nhận đơn mua hàng (PO DRAFT -> ORDERED)| [`UC-012-lap-va-xac-nhan-don-mua-hang.md`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-012-lap-va-xac-nhan-don-mua-hang.md) |
| **UC-013** | Quản lý & tra cứu lịch sử đơn mua hàng / Hủy đơn | [`UC-013-quan-ly-va-tra-cuu-lich-su-don-mua-hang.md`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-013-quan-ly-va-tra-cuu-lich-su-don-mua-hang.md) |
| **UC-014** | Ghi nhận nhận hàng & Cập nhật tồn kho nguyên tử | [`UC-014-ghi-nhan-nhan-hang-va-cap-nhat-ton-kho.md`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-014-ghi-nhan-nhan-hang-va-cap-nhat-ton-kho.md) |
| **UC-015** | Đăng nhập & Quản lý phiên làm việc cá nhân | [`UC-015-dang-nhap-va-quan-ly-phien-lam-viec.md`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-015-dang-nhap-va-quan-ly-phien-lam-viec.md) |
| **UC-016** | Quản lý tài khoản người dùng (CRUD, Khóa, Phân quyền)| [`UC-016-quan-ly-tai-khoan-nguoi-dung.md`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-016-quan-ly-tai-khoan-nguoi-dung.md) |
| **UC-017** | Cấu hình trọng số đánh giá nhà cung cấp (Admin) | [`UC-017-cau-hinh-trong-so-danh-gia-nha-cung-cap.md`](file:///c:/my_project/dss-ai-purchase/docs/03-use-cases/UC-017-cau-hinh-trong-so-danh-gia-nha-cung-cap.md) |

---

## 5. QUY CHUẨN ĐẶT TÊN & ĐỊNH DẠNG MÃ NGUỒN (CODE CONVENTIONS)

1. **Ngôn ngữ trong mã nguồn:**
   * Mã nguồn, biến, hàm, class, comments kỹ thuật: **Tiếng Anh 100%**.
   * Thông báo lỗi trả về cho người dùng (UI messages, validation messages, toast): **Tiếng Việt 100%**.
2. **Quy tắc đặt tên (Naming Conventions):**
   * Class, Interface, Type, Component React: `PascalCase` (ví dụ: `ProductService`, `IProductRepository`, `InventoryTable`).
   * Biến, hàm, thuộc tính: `camelCase` (ví dụ: `calculateSafetyStock`, `onHand`, `totalAmount`).
   * Tên bảng CSDL, tên cột SQL: `snake_case` (ví dụ: `purchase_orders`, `committed_lead_time`).
   * Tên file React Component: `PascalCase.tsx` (ví dụ: `KpiRiskCards.tsx`).
   * Tên file Service, Controller, Router: `camelCase.ts` (ví dụ: `productController.ts`).
   * Tên hằng số, ENUM values: `UPPER_SNAKE_CASE` (ví dụ: `OUT_OF_STOCK`, `ORDERED`).
3. **Mã sinh tự động:**
   * Mã đơn mua hàng: Bắt buộc định dạng `PO-YYYYMMDD-XXXX` (ví dụ: `PO-20260904-0001`) (`BR-024`).

---

## 6. BẢNG KIỂM TRA TRƯỚC KHI BÀN GIAO MÃ NGUỒN (AGENT PRE-SUBMISSION CHECKLIST)

Trước khi xác nhận hoàn thành một tác vụ viết code, Agent phải tự kiểm tra:

- [ ] Tôi đã đọc đúng tài liệu được liên kết trong Section 3 & 4 chưa?
- [ ] Tên các trường cơ sở dữ liệu có khớp 100% với `data-dictionary.md` không?
- [ ] Tầng Domain có hoàn toàn độc lập, không bị phụ thuộc vào Express hay Prisma không?
- [ ] Phản hồi của API có tuân thủ đúng Envelope `{ success, data, meta, timestamp }` không?
- [ ] Dịch vụ AI Python có giữ đúng bản chất Stateless, không kết nối trực tiếp CSDL không?
- [ ] Thao tác nhận hàng (`UC-014`) có được bọc trong giao dịch nguyên tử (`prisma.$transaction`) không?
- [ ] Có tự ý phát sinh thêm thư viện ngoài phạm vi đã thống nhất không?
