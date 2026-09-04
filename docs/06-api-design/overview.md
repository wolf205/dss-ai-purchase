# API Overview: Chuẩn Mực & Danh Mục Thiết Kế API

---

## 📋 BẢNG THEO DÕI QUYẾT ĐỊNH THIẾT KẾ API (DECISION LOG)

| ID | Vấn Đề Quyết Định | Quyết Định Cuối Cùng Đã Thống Nhất | Cơ Sở & Rationale Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| **DEC-API-001** | Tiền tố & Phiên bản API | Áp dụng tiền tố **`/api/v1`** cho toàn bộ các endpoints bên ngoài (Client-to-Backend). | Hỗ trợ quản lý vòng đời API, bảo đảm khả năng tương thích ngược và nâng cấp trong tương lai. |
| **DEC-API-002** | Cấu trúc Envelope phản hồi | Chuẩn hóa **Uniform Response Envelope** cho cả phản hồi thành công (`success: true`, `data`, `meta`) và phản hồi lỗi (`success: false`, `error: { code, message, details }`). | Giúp Frontend dễ dàng xử lý phản hồi đồng nhất qua Axios Interceptor; phân tách rõ ràng dữ liệu payload và thông tin phân trang/lỗi. |
| **DEC-API-003** | Cơ chế Xác thực & Phiên | Xác thực không trạng thái (Stateless) qua **JWT Bearer Token** gửi trong HTTP Header `Authorization: Bearer <token>`. | Đảm bảo an toàn, tối ưu hiệu năng, không cần lưu session trên server; tự động hết hạn sau 8 giờ làm việc theo `NFR-011`. |
| **DEC-API-004** | Cơ chế Phân quyền (RBAC) | Kiểm soát truy cập dựa trên vai trò với 2 vai trò chuẩn: **`ADMIN`** và **`STAFF`**. | Thực thi nghiêm ngặt `NFR-010` và `FR-033`, chặn nhân viên can thiệp vào quản trị tài khoản và cấu hình trọng số NCC. |
| **DEC-API-005** | Chuẩn phân trang & tìm kiếm | Tham số URL chuẩn: `?page=1&limit=20&sort=createdAt:desc&search=...&filter=...`. | Tối ưu thời gian tải trang dưới 2 giây (`NFR-001`), tránh kéo toàn bộ dữ liệu lớn về trình duyệt. |
| **DEC-API-006** | Thao tác trạng thái đặc thù | Thiết kế dạng Action Endpoints rõ nghĩa: `/purchase-orders/:id/confirm`, `/purchase-orders/:id/receive`, `/recommendations/run-analysis`. | Tránh việc cập nhật trạng thái tùy tiện qua `PATCH /orders/:id`, bảo đảm thực thi đúng máy trạng thái `BR-017` và giao dịch nguyên tử `BR-018`. |
| **DEC-API-007** | Định dạng dữ liệu trao đổi | **100% JSON UTF-8** cho request và response; ngoại lệ duy nhất là nạp tệp sử dụng `multipart/form-data` và xuất file PDF/Excel. | Đảm bảo tính tiêu chuẩn, dễ dàng serialize/deserialize giữa React, Express và Python. |
| **DEC-API-008** | Phân tách API nội bộ | Tách biệt hoàn toàn External API (Node.js phục vụ Frontend) và Internal API (FastAPI phục vụ Node.js qua mạng nội bộ Docker). | Bảo mật tối đa, cô lập dịch vụ AI khỏi internet, đơn giản hóa kiến trúc mạng. |

---

## 1. Nguyên Tắc & Quy Ước Thiết Kế (API Conventions)

### 1.1. Cấu Trúc Định Tuyến (URI Structure)
* Toàn bộ API được phục vụ tại: `https://<domain>/api/v1/<resource>`
* Tên tài nguyên (Resources) luôn sử dụng **danh từ số nhiều, chữ thường, nối bằng dấu gạch nối (kebab-case)**:
  * `/api/v1/products`
  * `/api/v1/suppliers`
  * `/api/v1/purchase-orders`
  * `/api/v1/sales-history`
  * `/api/v1/data-import`

### 1.2. Các Phương Thức HTTP (HTTP Methods)
* **`GET`**: Truy vấn danh sách hoặc chi tiết một tài nguyên (An toàn & Idempotent).
* **`POST`**: Tạo mới tài nguyên hoặc kích hoạt một hành động nghiệp vụ (Action/RPC).
* **`PUT`**: Cập nhật toàn bộ thông tin của một tài nguyên hiện có.
* **`PATCH`**: Cập nhật một phần thuộc tính (ví dụ: đổi trạng thái `is_active`).
* **`DELETE`**: Hủy liên kết hoặc vô hiệu hóa tài nguyên (Hệ thống không xóa vật lý dữ liệu giao dịch).

### 1.3. Mã Trạng Thái HTTP (HTTP Status Codes)
* **`200 OK`**: Yêu cầu thành công, có dữ liệu trả về trong body.
* **`201 Created`**: Tạo mới tài nguyên thành công (kèm dữ liệu bản ghi vừa tạo).
* **`204 No Content`**: Thao tác thành công, không có nội dung trả về (ví dụ: đăng xuất).
* **`400 Bad Request`**: Dữ liệu gửi lên sai định dạng hoặc vi phạm Zod validation.
* **`401 Unauthorized`**: Thiếu token xác thực, token hết hạn hoặc không hợp lệ.
* **`403 Forbidden`**: Đã xác thực nhưng người dùng không có quyền truy cập (RBAC chặn).
* **`404 Not Found`**: Không tìm thấy tài nguyên yêu cầu (SKU, Order ID, Supplier ID...).
* **`409 Conflict`**: Xung đột dữ liệu (trùng mã SKU, trùng mã NCC, trùng email).
* **`422 Unprocessable Entity`**: Dữ liệu đúng định dạng nhưng vi phạm Quy tắc nghiệp vụ (Domain Exception).
* **`500 Internal Server Error`**: Lỗi sự cố hệ thống máy chủ ngoài dự tính.

---

## 2. Cấu Trúc Envelope Phản Hồi Chuẩn Hóa (Uniform Response Envelopes)

### 2.1. Phản Hồi Thành Công Đơn Lẻ (Single Object Success)
```json
{
  "success": true,
  "data": {
    "sku": "MILK-VNM-180",
    "name": "Sữa tươi tiệt trùng Vinamilk 180ml",
    "category": "Sữa & Bơ sữa",
    "costPrice": 6500,
    "sellingPrice": 8500,
    "isActive": true
  },
  "timestamp": "2026-09-04T09:00:00.000Z"
}
```

### 2.2. Phản Hồi Thành Công Dạng Danh Sách Có Phân Trang (Paginated List Success)
```json
{
  "success": true,
  "data": [
    { "sku": "MILK-VNM-180", "name": "Sữa tươi Vinamilk 180ml", "onHand": 24 },
    { "sku": "BEER-TIG-330", "name": "Bia Tiger 330ml", "onHand": 120 }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 150,
    "totalPages": 8
  },
  "timestamp": "2026-09-04T09:00:00.000Z"
}
```

### 2.3. Phản Hồi Thất Bại / Lỗi (Error Envelope)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu gửi lên không thỏa mãn điều kiện kiểm tra.",
    "details": [
      {
        "field": "moq",
        "issue": "Số lượng đặt hàng tối thiểu phải lớn hơn hoặc bằng 1"
      }
    ]
  },
  "timestamp": "2026-09-04T09:00:00.000Z"
}
```

---

## 3. Danh Mục Mã Lỗi Chuẩn Hóa (Standard Error Codes Catalog)

| Mã Lỗi (`error.code`) | HTTP Status | Ý Nghĩa Nghiệp Vụ & Tình Huống Kích Hoạt |
| :--- | :---: | :--- |
| **`VALIDATION_ERROR`** | `400` | Dữ liệu đầu vào sai kiểu, thiếu trường bắt buộc hoặc vi phạm schema Zod (`FR-006`). |
| **`INVALID_CREDENTIALS`** | `401` | Sai tên đăng nhập hoặc mật khẩu (`UC-015`). |
| **`TOKEN_EXPIRED`** | `401` | Phiên làm việc JWT đã hết hạn (`NFR-011`). |
| **`UNAUTHORIZED`** | `401` | Chưa đăng nhập hoặc thiếu Bearer Token trong header. |
| **`FORBIDDEN`** | `403` | Không đủ quyền thực hiện thao tác (Staff cố tình gọi API của Admin) (`FR-033`). |
| **`ACCOUNT_LOCKED`** | `403` | Tài khoản đã bị khóa bởi Quản trị viên (`UC-016`). |
| **`RESOURCE_NOT_FOUND`** | `404` | Bản ghi yêu cầu không tồn tại trong cơ sở dữ liệu. |
| **`DUPLICATE_RESOURCE`** | `409` | Trùng lặp trường duy nhất: mã SKU, mã NCC, tên đăng nhập, email. |
| **`ORDER_LOCKED`** | `422` | Cố tình sửa đổi đơn hàng đã ở trạng thái `ORDERED`, `RECEIVED`, hoặc `CANCELLED` (`BR-025`). |
| **`INVALID_STATE_TRANSITION`**| `422` | Chuyển đổi trạng thái đơn hàng không hợp lệ theo máy trạng thái `BR-017`. |
| **`WEIGHT_SUM_INVALID`** | `422` | Tổng 4 trọng số đánh giá NCC khác 100% (`BR-013`, `UC-017`). |
| **`DEFECT_EXCEEDS_DELIVERED`**| `422` | Số lượng hàng lỗi lớn hơn số lượng thực tế giao tới (`UC-014`). |
| **`BUSINESS_RULE_VIOLATION`**| `422` | Vi phạm các quy tắc nghiệp vụ khác của hệ thống DSS. |
| **`FILE_SIZE_EXCEEDED`** | `400` | Tệp tin Excel/CSV tải lên vượt quá giới hạn 10MB (`UC-003`). |
| **`INTERNAL_SERVER_ERROR`**| `500` | Lỗi máy chủ không mong muốn hoặc lỗi kết nối cơ sở dữ liệu. |

---

## 4. Cơ Chế Xác Thực & Ma Trận Phân Quyền (Authentication & RBAC Matrix)

### 4.1. Cấu Trúc JWT Token Payload
```json
{
  "sub": "a0000000-0000-0000-0000-000000000001",
  "username": "admin",
  "role": "ADMIN",
  "iat": 1788508800,
  "exp": 1788537600
}
```

### 4.2. Ma Trận Phân Quyền API (RBAC Matrix)

| Nhóm Tài Nguyên API | Đường Dẫn Cơ Sở | Quyền `ADMIN` | Quyền `STAFF` | Ghi Chú Bảo Mật |
| :--- | :--- | :---: | :---: | :--- |
| **Xác thực cá nhân** | `/api/v1/auth/*` | ✅ Toàn quyền | ✅ Toàn quyền | Đổi mật khẩu, lấy thông tin cá nhân |
| **Quản trị người dùng** | `/api/v1/users/*` | ✅ Toàn quyền | ❌ Chặn (403) | Dành riêng cho Quản trị viên (`UC-016`) |
| **Danh mục Sản phẩm** | `/api/v1/products` | ✅ Đọc & Ghi | 👁️ Chỉ xem (GET) | Staff không được thêm, sửa, khóa SKU (`UC-001`) |
| **Danh mục Nhà cung cấp** | `/api/v1/suppliers` | ✅ Đọc & Ghi | 👁️ Chỉ xem (GET) | Staff không được sửa giá và thông tin NCC (`UC-002`) |
| **Cấu hình Trọng số NCC**| `/api/v1/config/supplier-weights` | ✅ Đọc & Ghi | ❌ Chặn (403) | Dành riêng cho Quản trị viên (`UC-017`) |
| **Nạp dữ liệu (Import)** | `/api/v1/data-import/*` | ✅ Toàn quyền | ✅ Toàn quyền | Nạp file bán hàng & tồn kho (`UC-003`) |
| **Dashboard Tồn kho** | `/api/v1/inventory/*` | 👁️ Xem giám sát | ✅ Toàn quyền | Theo dõi, lọc rủi ro, phân tích 360 (`UC-004`) |
| **Dự báo Nhu cầu AI** | `/api/v1/forecasts/*` | 👁️ Xem giám sát | ✅ Toàn quyền | Xem dự báo, nhập Cold Start (`UC-007`, `UC-008`) |
| **Khuyến nghị Mua hàng** | `/api/v1/recommendations/*` | 👁️ Xem giám sát | ✅ Toàn quyền | Xem gợi ý, chạy lại DSS on-demand (`UC-010`, `UC-011`)|
| **Đơn Mua Hàng (PO)** | `/api/v1/purchase-orders/*` | 👁️ Xem giám sát | ✅ Toàn quyền | Lập đơn, chốt đơn, hủy đơn (`UC-012`, `UC-013`) |
| **Nhận Hàng Kho** | `/api/v1/purchase-orders/:id/receive`| 👁️ Xem giám sát | ✅ Toàn quyền | Nghiệm thu và cập nhật kho 2 chiều (`UC-014`) |

---

## 5. Danh Mục Tổng Hợp 32 Endpoints Hệ Thống (API Endpoints Catalog)

Dưới đây là danh mục toàn bộ **32 endpoints** được chuẩn hóa, phân theo 7 phân vùng nghiệp vụ:

| STT | Phương Thức | Đường Dẫn Endpoint | Phân Quyền | Tên Chức Năng Nghiệp Vụ | Use Case Ánh Xạ |
| :---: | :---: | :--- | :---: | :--- | :---: |
| **NHÓM 1: XÁC THỰC & QUẢN TRỊ TÀI KHOẢN (AUTH & USERS)** | | | | | |
| **1** | `POST` | `/api/v1/auth/login` | Public | Đăng nhập tài khoản & Nhận JWT token | `UC-015` |
| **2** | `POST` | `/api/v1/auth/logout` | Auth | Đăng xuất phiên làm việc | `UC-015` |
| **3** | `GET` | `/api/v1/auth/me` | Auth | Lấy thông tin tài khoản hiện hành | `UC-015` |
| **4** | `POST` | `/api/v1/auth/change-password` | Auth | Đổi mật khẩu cá nhân | `UC-015` |
| **5** | `GET` | `/api/v1/users` | `ADMIN` | Danh sách tài khoản người dùng (phân trang) | `UC-016` |
| **6** | `POST` | `/api/v1/users` | `ADMIN` | Tạo tài khoản người dùng mới | `UC-016` |
| **7** | `GET` | `/api/v1/users/:id` | `ADMIN` | Xem chi tiết tài khoản người dùng | `UC-016` |
| **8** | `PUT` | `/api/v1/users/:id` | `ADMIN` | Chỉnh sửa thông tin / vai trò người dùng | `UC-016` |
| **9** | `PATCH`| `/api/v1/users/:id/status` | `ADMIN` | Khóa / Mở khóa tài khoản người dùng | `UC-016` |
| **10**| `POST` | `/api/v1/users/:id/reset-password`| `ADMIN` | Đặt lại mật khẩu tài khoản người dùng | `UC-016` |
| **NHÓM 2: DANH MỤC SẢN PHẨM & NẠP DỮ LIỆU (PRODUCTS & INGESTION)** | | | | | |
| **11**| `GET` | `/api/v1/products` | Auth | Danh sách sản phẩm (tìm kiếm, lọc ngành hàng) | `UC-001` |
| **12**| `POST` | `/api/v1/products` | `ADMIN` | Thêm mới sản phẩm Master Data | `UC-001` |
| **13**| `GET` | `/api/v1/products/:sku` | Auth | Xem chi tiết thông tin một sản phẩm | `UC-001` |
| **14**| `PUT` | `/api/v1/products/:sku` | `ADMIN` | Cập nhật thông tin & tham số tồn kho an toàn | `UC-001` |
| **15**| `PATCH`| `/api/v1/products/:sku/status` | `ADMIN` | Kích hoạt / Vô hiệu hóa sản phẩm (`is_active`)| `UC-001` |
| **16**| `POST` | `/api/v1/data-import/upload` | Auth | Tải lên file Excel/CSV bán hàng & kiểm kê | `UC-003` |
| **17**| `GET` | `/api/v1/data-import/history` | Auth | Lịch sử các phiên nạp dữ liệu từ file | `UC-003` |
| **18**| `POST` | `/api/v1/sales-history/manual` | Auth | Nhập thủ công số lượng bán theo ngày | `UC-003` |
| **NHÓM 3: DANH MỤC NHÀ CUNG CẤP & ĐÁNH GIÁ (SUPPLIERS & EVALUATION)** | | | | | |
| **19**| `GET` | `/api/v1/suppliers` | Auth | Danh sách nhà cung cấp & điểm tổng hợp | `UC-002`, `UC-009` |
| **20**| `POST` | `/api/v1/suppliers` | `ADMIN` | Thêm mới nhà cung cấp | `UC-002` |
| **21**| `GET` | `/api/v1/suppliers/:id` | Auth | Xem chi tiết thông tin và bảng giá NCC | `UC-002` |
| **22**| `PUT` | `/api/v1/suppliers/:id` | `ADMIN` | Cập nhật thông tin liên hệ nhà cung cấp | `UC-002` |
| **23**| `POST` | `/api/v1/suppliers/:id/products` | `ADMIN` | Gán sản phẩm phân phối (Đơn giá, MOQ, Pack) | `UC-002` |
| **24**| `GET` | `/api/v1/suppliers/evaluations` | Auth | Bảng xếp hạng & chi tiết 4 điểm thành phần | `UC-009` |
| **25**| `GET` | `/api/v1/config/supplier-weights`| `ADMIN` | Xem bộ trọng số đánh giá NCC hiện hành | `UC-017` |
| **26**| `PUT` | `/api/v1/config/supplier-weights`| `ADMIN` | Cập nhật bộ 4 trọng số (ràng buộc tổng 100%)| `UC-017` |
| **NHÓM 4: TỒN KHO & PHÂN TÍCH MA TRẬN ABC-XYZ (INVENTORY & ANALYTICS)** | | | | | |
| **27**| `GET` | `/api/v1/inventory/dashboard` | Auth | Thống kê KPI 5 cấp rủi ro & tỷ lệ phân bổ | `UC-004` |
| **28**| `GET` | `/api/v1/inventory/items` | Auth | Bảng tồn kho SKU chi tiết (IP, SS, ROP, DoS) | `UC-004` |
| **29**| `GET` | `/api/v1/inventory/abc-xyz` | Auth | Ma trận 9 ô ABC-XYZ & danh sách sản phẩm | `UC-005` |
| **30**| `GET` | `/api/v1/products/:sku/360` | Auth | Xem chi tiết góc nhìn toàn cảnh SKU 360° | `UC-006` |
| **NHÓM 5: DỰ BÁO NHU CẦU BÁN HÀNG AI (DEMAND FORECASTING)** | | | | | |
| **31**| `GET` | `/api/v1/forecasts` | Auth | Danh sách tổng cầu dự báo theo khung 7/14/30 | `UC-007` |
| **32**| `GET` | `/api/v1/forecasts/:sku` | Auth | Biểu đồ chuỗi thời gian & Dải tin cậy 95% | `UC-007` |
| **33**| `POST` | `/api/v1/forecasts/cold-start` | `STAFF` | Nhập lượng bán dự kiến $D_{expected}$ cho SP mới| `UC-008` |
| **NHÓM 6: KHUYẾN NGHỊ MUA HÀNG THÔNG MINH (RECOMMENDATIONS)** | | | | | |
| **34**| `GET` | `/api/v1/recommendations` | Auth | Danh sách đề xuất mua kèm Explainable Cards | `UC-010` |
| **35**| `POST` | `/api/v1/recommendations/run-analysis`| `STAFF`| Kích hoạt chạy lại toàn bộ DSS on-demand | `UC-011` |
| **NHÓM 7: ĐƠN MUA HÀNG & NHẬN HÀNG KHO (PURCHASE ORDERS & RECEIPT)** | | | | | |
| **36**| `POST` | `/api/v1/purchase-orders` | `STAFF` | Tạo đơn mua hàng mới (Trạng thái `DRAFT`) | `UC-012` |
| **37**| `POST` | `/api/v1/purchase-orders/:id/confirm`| `STAFF`| Xác nhận chốt đơn (`ORDERED`, tăng On-Order)| `UC-012` |
| **38**| `GET` | `/api/v1/purchase-orders` | Auth | Tra cứu lịch sử đơn hàng theo 4 trạng thái | `UC-013` |
| **39**| `GET` | `/api/v1/purchase-orders/:id` | Auth | Chi tiết đơn mua hàng và các dòng sản phẩm | `UC-013` |
| **40**| `POST` | `/api/v1/purchase-orders/:id/cancel`| `STAFF` | Hủy đơn hàng (giải phóng On-Order nếu có) | `UC-013` |
| **41**| `POST` | `/api/v1/purchase-orders/:id/receive`| `STAFF`| Ghi nhận nhận hàng nguyên tử (tăng On-Hand) | `UC-014` |

---

## 6. Ma Trận Truy Vết 3 Chiều (Requirements $\leftrightarrow$ Use Cases $\leftrightarrow$ Endpoints)

| Nhóm Nghiệp Vụ | Functional Requirements (FRs) | Use Cases (UCs) | Các Endpoints Phục Vụ | Trạng Thái Truy Vết |
| :--- | :--- | :---: | :--- | :---: |
| **Xác thực & Quản trị người dùng** | `FR-031`, `FR-032`, `FR-033` | `UC-015`, `UC-016` | `/auth/login`, `/logout`, `/me`, `/users`, `/users/:id/status` | ✅ 100% Bao phủ |
| **Danh mục Sản phẩm** | `FR-001`, `FR-003` | `UC-001` | `GET/POST/PUT /products`, `PATCH /products/:sku/status` | ✅ 100% Bao phủ |
| **Danh mục Nhà cung cấp** | `FR-002` | `UC-002` | `GET/POST/PUT /suppliers`, `/suppliers/:id/products` | ✅ 100% Bao phủ |
| **Nạp dữ liệu Bán hàng & Tồn kho** | `FR-004`, `FR-005`, `FR-006` | `UC-003` | `/data-import/upload`, `/data-import/history`, `/sales-history/manual` | ✅ 100% Bao phủ |
| **Theo dõi Tồn kho & Rủi ro** | `FR-007`, `FR-008`, `FR-010`, `FR-011`| `UC-004`, `UC-006` | `/inventory/dashboard`, `/inventory/items`, `/products/:sku/360` | ✅ 100% Bao phủ |
| **Phân tích Ma trận ABC-XYZ** | `FR-009` | `UC-005`, `UC-006` | `/inventory/abc-xyz` | ✅ 100% Bao phủ |
| **Dự báo Nhu cầu AI** | `FR-012`, `FR-013`, `FR-014`, `FR-015`| `UC-007` | `/forecasts`, `/forecasts/:sku` | ✅ 100% Bao phủ |
| **Sản phẩm mới Cold Start** | `FR-016` | `UC-008` | `POST /forecasts/cold-start` | ✅ 100% Bao phủ |
| **Đánh giá Hiệu suất NCC** | `FR-019`, `FR-020` | `UC-009` | `/suppliers/evaluations` | ✅ 100% Bao phủ |
| **Cấu hình Trọng số NCC** | `FR-034` | `UC-017` | `GET/PUT /config/supplier-weights` | ✅ 100% Bao phủ |
| **Khuyến nghị Mua hàng Thông minh**| `FR-021`, `FR-023`, `FR-024`, `FR-025`| `UC-010` | `GET /recommendations` | ✅ 100% Bao phủ |
| **Chạy lại Phân tích On-demand** | `FR-022` | `UC-011` | `POST /recommendations/run-analysis` | ✅ 100% Bao phủ |
| **Lập & Chốt Đơn Mua Hàng (PO)** | `FR-026`, `FR-027`, `FR-028`, `FR-029`| `UC-012` | `POST /purchase-orders`, `POST /purchase-orders/:id/confirm` | ✅ 100% Bao phủ |
| **Quản lý & Hủy Đơn Mua Hàng** | `FR-030` | `UC-013` | `GET /purchase-orders`, `/purchase-orders/:id`, `/cancel` | ✅ 100% Bao phủ |
| **Ghi nhận Nhận hàng & Cập nhật Kho**| `FR-017`, `FR-018` | `UC-014` | `POST /purchase-orders/:id/receive` | ✅ 100% Bao phủ |

---

## 7. Kết Luận

Tài liệu Tổng quan Thiết kế API này xác lập một bộ tiêu chuẩn giao tiếp chặt chẽ, an toàn và nhất quán cho toàn bộ hệ thống. Với cấu trúc Uniform Envelope và ma trận RBAC rõ ràng, đội ngũ phát triển Frontend có thể tự tin triển khai các màn hình nghiệp vụ mà không lo ngại về tính không đồng nhất của dữ liệu máy chủ.
