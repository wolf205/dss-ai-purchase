# API Endpoints Specification: Đặc Tả Chi Tiết Từng Endpoint

---

## NHÓM 1: XÁC THỰC & QUẢN TRỊ TÀI KHOẢN (AUTH & USERS)

### 1.1. `POST /api/v1/auth/login`
* **Mô tả:** Xác thực tài khoản người dùng bằng tên đăng nhập (hoặc email) và mật khẩu; cấp JWT Bearer Token (`UC-015`, `FR-031`, `NFR-009`, `NFR-011`).
* **Quyền hạn:** Public (Không yêu cầu xác thực).
* **Request Body:**
  ```json
  {
    "username": "admin",
    "password": "SecurePassword@2026"
  }
  ```
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 28800,
      "user": {
        "id": "a0000000-0000-0000-0000-000000000001",
        "username": "admin",
        "fullName": "Quản Trị Viên Hệ Thống",
        "email": "admin@dss-purchase.local",
        "role": "ADMIN",
        "mustChangePassword": false
      }
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```
* **Error Response (`401 Unauthorized` — Sai thông tin đăng nhập):**
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_CREDENTIALS",
      "message": "Tên đăng nhập hoặc mật khẩu không chính xác."
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```
* **Error Response (`403 Forbidden` — Tài khoản bị khóa, `UC-015` E2, `BR-021`):**
  ```json
  {
    "success": false,
    "error": {
      "code": "ACCOUNT_LOCKED",
      "message": "Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ Quản trị viên hệ thống để được hỗ trợ."
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```
* **Error Response (`429 Too Many Requests` — Khóa brute-force sau 5 lần sai, `UC-015` E1.3, `NFR-004`):**
  ```json
  {
    "success": false,
    "error": {
      "code": "TOO_MANY_REQUESTS",
      "message": "Bạn đã nhập sai mật khẩu quá 5 lần liên tiếp. Vui lòng thử lại sau 15 phút."
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 1.2. `POST /api/v1/auth/logout`
* **Mô tả:** Đăng xuất an toàn và kết thúc phiên làm việc hiện tại (`UC-015` Luồng A3, `FR-031`).
* **Quyền hạn:** Authenticated (`ADMIN`, `STAFF`).
* **Headers:** `Authorization: Bearer <token>`
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Đăng xuất thành công."
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 1.3. `GET /api/v1/auth/me`
* **Mô tả:** Lấy thông tin tài khoản hiện hành từ JWT Bearer Token (`UC-015`, `FR-031`).
* **Quyền hạn:** Authenticated (`ADMIN`, `STAFF`).
* **Headers:** `Authorization: Bearer <token>`
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "a0000000-0000-0000-0000-000000000002",
      "username": "staff01",
      "fullName": "Nguyễn Văn A",
      "email": "staff01@dss-purchase.local",
      "role": "STAFF",
      "isActive": true,
      "mustChangePassword": false
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```
* **Error Response (`401 Unauthorized` — Token hết hạn hoặc không hợp lệ):**
  ```json
  {
    "success": false,
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Phiên làm việc đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại."
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 1.4. `POST /api/v1/auth/change-password`
* **Mô tả:** Người dùng tự đổi mật khẩu cá nhân hoặc đổi mật khẩu bắt buộc ở lần đăng nhập đầu tiên (`UC-015` Luồng A1, A2, `FR-031`).
* **Quyền hạn:** Authenticated (`ADMIN`, `STAFF`).
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
  ```json
  {
    "oldPassword": "CurrentPassword@123",
    "newPassword": "NewSecurePassword@456"
  }
  ```
  *Ràng buộc:* Mật khẩu mới phải có tối thiểu 8 ký tự, không trùng mật khẩu cũ.
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Đổi mật khẩu thành công. Vui lòng sử dụng mật khẩu mới cho các lần đăng nhập tiếp theo."
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```
* **Error Response (`400 Bad Request` — Mật khẩu không thỏa mãn ràng buộc):**
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Mật khẩu mới phải có ít nhất 8 ký tự và không được trùng với mật khẩu cũ."
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```
* **Error Response (`401 Unauthorized` — Mật khẩu cũ sai):**
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_CREDENTIALS",
      "message": "Mật khẩu hiện tại không chính xác."
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 1.5. `GET /api/v1/users`
* **Mô tả:** Quản trị viên xem danh sách toàn bộ tài khoản người dùng có phân trang và lọc (`UC-016`, `FR-032`).
* **Quyền hạn:** Chỉ dành cho `ADMIN`.
* **Headers:** `Authorization: Bearer <token>`
* **Query Parameters:**
  * `page` (number, default: 1)
  * `limit` (number, default: 20)
  * `role` (string: `ADMIN` | `STAFF`, optional)
  * `isActive` (boolean, optional)
  * `search` (string, tìm theo username, fullName, email)
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "a0000000-0000-0000-0000-000000000001",
        "username": "admin",
        "fullName": "Quản Trị Viên",
        "email": "admin@dss-purchase.local",
        "role": "ADMIN",
        "isActive": true,
        "mustChangePassword": false,
        "lastLoginAt": "2026-09-04T08:30:00.000Z",
        "createdAt": "2026-09-01T00:00:00.000Z"
      }
    ],
    "meta": { "page": 1, "limit": 20, "totalItems": 3, "totalPages": 1 },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```
* **Error Response (`403 Forbidden` — Nhân viên không có quyền truy cập):**
  ```json
  {
    "success": false,
    "error": {
      "code": "FORBIDDEN",
      "message": "Bạn không có quyền thực hiện chức năng này. Yêu cầu quyền: ADMIN"
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 1.6. `POST /api/v1/users`
* **Mô tả:** Quản trị viên tạo mới một tài khoản người dùng (`UC-016`, `FR-032`).
* **Quyền hạn:** Chỉ dành cho `ADMIN`.
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
  ```json
  {
    "username": "staff_kho",
    "password": "InitialPassword@123",
    "fullName": "Trần Thị B",
    "email": "tranthib@dss-purchase.local",
    "role": "STAFF"
  }
  ```
  *Ràng buộc:* Mật khẩu khởi tạo $\ge 8$ ký tự. Mặc định tài khoản tạo ra có `isActive: true` và `mustChangePassword: true`.
* **Success Response (`201 Created`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "b0000000-0000-0000-0000-000000000003",
      "username": "staff_kho",
      "fullName": "Trần Thị B",
      "email": "tranthib@dss-purchase.local",
      "role": "STAFF",
      "isActive": true,
      "mustChangePassword": true
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```
* **Error Response (`409 Conflict` — Trùng Username hoặc Email):**
  ```json
  {
    "success": false,
    "error": {
      "code": "DUPLICATE_RESOURCE",
      "message": "Tên đăng nhập hoặc email đã tồn tại trong hệ thống."
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 1.7. `GET /api/v1/users/:id`
* **Mô tả:** Xem thông tin chi tiết một tài khoản người dùng theo ID (`UC-016`, `FR-032`).
* **Quyền hạn:** Chỉ dành cho `ADMIN`.
* **Headers:** `Authorization: Bearer <token>`
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "b0000000-0000-0000-0000-000000000003",
      "username": "staff_kho",
      "fullName": "Trần Thị B",
      "email": "tranthib@dss-purchase.local",
      "role": "STAFF",
      "isActive": true,
      "mustChangePassword": true,
      "lastLoginAt": null,
      "createdAt": "2026-09-04T09:00:00.000Z",
      "updatedAt": "2026-09-04T09:00:00.000Z"
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```
* **Error Response (`404 Not Found`):**
  ```json
  {
    "success": false,
    "error": {
      "code": "RESOURCE_NOT_FOUND",
      "message": "Không tìm thấy người dùng với mã định danh đã cung cấp."
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 1.8. `PUT /api/v1/users/:id`
* **Mô tả:** Quản trị viên cập nhật thông tin cá nhân hoặc vai trò (`role`) của người dùng (`UC-016` Luồng A1, `FR-032`, `FR-033`).
* **Quyền hạn:** Chỉ dành cho `ADMIN`.
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
  ```json
  {
    "fullName": "Trần Thị B (Cập Nhật)",
    "email": "tranthib.new@dss-purchase.local",
    "role": "STAFF"
  }
  ```
  *(Ghi chú: Không cho phép sửa `username`. Hệ thống hỗ trợ cả `PUT` và `PATCH` cho endpoint này).*
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "b0000000-0000-0000-0000-000000000003",
      "username": "staff_kho",
      "fullName": "Trần Thị B (Cập Nhật)",
      "email": "tranthib.new@dss-purchase.local",
      "role": "STAFF",
      "isActive": true,
      "mustChangePassword": true,
      "updatedAt": "2026-09-04T10:00:00.000Z"
    },
    "timestamp": "2026-09-04T10:00:00.000Z"
  }
  ```
* **Error Response (`422 Unprocessable Entity` — Tự hạ quyền hoặc hạ quyền Admin duy nhất, `UC-016` E3, E4):**
  ```json
  {
    "success": false,
    "error": {
      "code": "BUSINESS_RULE_VIOLATION",
      "message": "Không thể tự hạ quyền quản trị của chính bạn hoặc hạ quyền tài khoản Quản trị viên duy nhất đang hoạt động."
    },
    "timestamp": "2026-09-04T10:00:00.000Z"
  }
  ```

---

### 1.9. `PATCH /api/v1/users/:id/status`
* **Mô tả:** Khóa hoặc kích hoạt lại tài khoản người dùng (`UC-016` Luồng A2, A3, `BR-021`).
* **Quyền hạn:** Chỉ dành cho `ADMIN`.
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
  ```json
  {
    "isActive": false
  }
  ```
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "b0000000-0000-0000-0000-000000000003",
      "isActive": false,
      "message": "Đã vô hiệu hóa tài khoản thành công."
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```
* **Error Response (`422 Unprocessable Entity` — Tự khóa tài khoản của mình, `UC-016` E3):**
  ```json
  {
    "success": false,
    "error": {
      "code": "BUSINESS_RULE_VIOLATION",
      "message": "Không thể tự khóa tài khoản quản trị của chính bạn."
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```
* **Error Response (`422 Unprocessable Entity` — Khóa tài khoản Admin duy nhất, `UC-016` E4):**
  ```json
  {
    "success": false,
    "error": {
      "code": "BUSINESS_RULE_VIOLATION",
      "message": "Không thể khóa tài khoản này vì đây là tài khoản Quản trị viên duy nhất đang hoạt động trong hệ thống."
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 1.10. `POST /api/v1/users/:id/reset-password`
* **Mô tả:** Quản trị viên đặt lại mật khẩu tạm thời cho nhân viên khi quên mật khẩu; tự động gán cờ `mustChangePassword: true` (`UC-016` Luồng A4, `FR-032`).
* **Quyền hạn:** Chỉ dành cho `ADMIN`.
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
  ```json
  {
    "newPassword": "TempPassword@2026"
  }
  ```
  *(Tùy chọn: Nếu không truyền `newPassword`, hệ thống tự động sinh một chuỗi mật khẩu ngẫu nhiên an toàn $\ge 10$ ký tự).*
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "b0000000-0000-0000-0000-000000000003",
      "username": "staff_kho",
      "mustChangePassword": true,
      "message": "Đã đặt lại mật khẩu cho tài khoản staff_kho thành công. Vui lòng gửi mật khẩu tạm thời này cho nhân viên."
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```
* **Error Response (`404 Not Found`):**
  ```json
  {
    "success": false,
    "error": {
      "code": "RESOURCE_NOT_FOUND",
      "message": "Không tìm thấy người dùng với mã định danh đã cung cấp."
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

## NHÓM 2: DANH MỤC SẢN PHẨM & NẠP DỮ LIỆU (PRODUCTS & INGESTION)

### 2.1. `GET /api/v1/products`
* **Mô tả:** Tra cứu danh mục sản phẩm của cửa hàng (`UC-001`, `FR-001`).
* **Quyền hạn:** Authenticated (`ADMIN`, `STAFF`).
* **Query Parameters:**
  * `page` (number, default: 1, min: 1)
  * `limit` (number, default: 20, min: 1, max: 100)
  * `search` (string, tìm kiếm theo mã SKU hoặc tên sản phẩm, tự động loại bỏ khoảng trắng thừa)
  * `category` (string, lọc theo ngành hàng)
  * `isActive` (string enum: `'true'` | `'false'` | `'all'`, mặc định: `'all'` trên màn hình Master Data `UC-001`; truyền `'true'` khi lọc sản phẩm đang kinh doanh để tạo đơn mua hàng hoặc phân tích tồn kho)
  * `sortBy` (string enum: `'sku'` | `'name'` | `'category'` | `'costPrice'` | `'sellingPrice'` | `'createdAt'`, mặc định: `'sku'`)
  * `sortOrder` (string enum: `'asc'` | `'desc'`, mặc định: `'asc'`)
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "sku": "MILK-VNM-180",
        "name": "Sữa tươi tiệt trùng Vinamilk 180ml",
        "category": "Sữa & Bơ sữa",
        "unit": "Hộp",
        "costPrice": 6500,
        "sellingPrice": 8500,
        "defaultLeadTime": 2,
        "minSafetyStock": 10,
        "isActive": true,
        "createdAt": "2026-09-01T08:00:00.000Z",
        "updatedAt": "2026-09-04T09:00:00.000Z"
      }
    ],
    "meta": { "page": 1, "limit": 20, "totalItems": 120, "totalPages": 6 },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 2.2. `POST /api/v1/products`
* **Mô tả:** Thêm mới sản phẩm vào danh mục Master Data (`UC-001`, `FR-001`, `FR-003`).
* **Quyền hạn:** Chỉ dành cho `ADMIN`.
* **Request Body:**
  ```json
  {
    "sku": "YOGURT-TH-100",
    "name": "Sữa chua ăn TH True Yogurt 100g",
    "category": "Sữa & Bơ sữa",
    "unit": "Hộp",
    "costPrice": 7000,
    "sellingPrice": 9500,
    "defaultLeadTime": 2,
    "minSafetyStock": 12
  }
  ```
* **Success Response (`201 Created`):**
  ```json
  {
    "success": true,
    "data": {
      "sku": "YOGURT-TH-100",
      "name": "Sữa chua ăn TH True Yogurt 100g",
      "category": "Sữa & Bơ sữa",
      "unit": "Hộp",
      "costPrice": 7000,
      "sellingPrice": 9500,
      "defaultLeadTime": 2,
      "minSafetyStock": 12,
      "isActive": true,
      "createdAt": "2026-09-04T09:00:00.000Z"
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```
* **Error Response (`422 Unprocessable Entity`):**
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Giá vốn và giá bán phải là số thực lớn hơn 0; Lead time tối thiểu 1 ngày."
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 2.3. `PATCH /api/v1/products/:sku/status`
* **Mô tả:** Vô hiệu hóa hoặc kích hoạt lại sản phẩm kinh doanh (`UC-001`, `BR-021`).
* **Quyền hạn:** Chỉ dành cho `ADMIN`.
* **Request Body:**
  ```json
  {
    "isActive": false
  }
  ```
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "sku": "YOGURT-TH-100",
      "isActive": false,
      "message": "Đã vô hiệu hóa sản phẩm. Sản phẩm sẽ bị loại trừ khỏi dự báo AI và khuyến nghị mua hàng."
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 2.4. `POST /api/v1/data-import/upload`
* **Mô tả:** Nạp tệp Excel/CSV lịch sử bán hàng hoặc tồn kho kiểm kê (`UC-003`, `FR-004`, `FR-006`).
* **Quyền hạn:** Authenticated (`ADMIN`, `STAFF`).
* **Content-Type:** `multipart/form-data`
* **Form Data:**
  * `file`: Tệp tin `.xlsx` hoặc `.csv` (Tối đa 10MB theo `NFR-003`).
  * `type`: `SALES_HISTORY` hoặc `INVENTORY_SNAPSHOT`.
  * `overwriteDuplicateDates`: `boolean` (mặc định `true` theo `UC-003`).
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "batchId": "c0000000-0000-0000-0000-000000000005",
      "fileName": "LichSuBanHang_Thang8.xlsx",
      "importType": "SALES_HISTORY",
      "totalRows": 1500,
      "successfulRows": 1500,
      "failedRows": 0,
      "status": "SUCCESS"
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```
* **Error Response (`400 Bad Request` - Batch Validation Failure):**
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Tệp tin chứa 2 dòng dữ liệu bị lỗi. Vui lòng sửa lại theo danh sách đính kèm.",
      "details": [
        { "row": 14, "field": "SKU", "issue": "Mã SKU 'UNKNOWN-999' không tồn tại trong danh mục." },
        { "row": 32, "field": "quantity_sold", "issue": "Số lượng bán là số âm (-5)." }
      ]
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 2.5. `GET /api/v1/data-import/templates/:type`
* **Mô tả:** Tải tệp tin Excel/CSV mẫu chuẩn để người dùng nhập liệu theo đúng cấu trúc cột (`UC-003`, `FR-004`).
* **Quyền hạn:** Authenticated (`ADMIN`, `STAFF`).
* **Path Parameters:**
  * `type` (string: `SALES_HISTORY` | `STOCK_INVENTORY`, bắt buộc).
* **Success Response (`200 OK`):**
  * Binary file stream (`.xlsx` hoặc `.csv`) kèm header:
    `Content-Disposition: attachment; filename="Mau_Nhap_Lieu_[TYPE].xlsx"`
    `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

---

## NHÓM 3: DANH MỤC NHÀ CUNG CẤP & ĐÁNH GIÁ (SUPPLIERS & EVALUATION)

### 3.1. `GET /api/v1/suppliers`
* **Mô tả:** Danh sách nhà cung cấp, thông tin liên hệ và nhãn trạng thái (`UC-002`, `FR-002`).
* **Quyền hạn:** Authenticated (`ADMIN`, `STAFF`).
* **Query Parameters:** `page`, `limit`, `search`, `statusTag`, `isActive`.
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "code": "SUP-VINAMILK",
        "name": "Công ty Cổ phần Sữa Việt Nam (Vinamilk)",
        "phone": "02854155555",
        "email": "contact@vinamilk.com.vn",
        "statusTag": "ACTIVE",
        "isActive": true,
        "productCount": 24
      }
    ],
    "meta": { "page": 1, "limit": 20, "totalItems": 15, "totalPages": 1 },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 3.2. `POST /api/v1/suppliers/:id/products`
* **Mô tả:** Thiết lập bảng giá và điều kiện cung ứng của NCC cho sản phẩm (`UC-002`).
* **Quyền hạn:** Chỉ dành cho `ADMIN`.
* **Request Body:**
  ```json
  {
    "productSku": "MILK-VNM-180",
    "purchasePrice": 6200,
    "moq": 24,
    "packSize": 12,
    "committedLeadTime": 2,
    "isPreferred": true
  }
  ```
* **Success Response (`201 Created`):**
  ```json
  {
    "success": true,
    "data": {
      "supplierId": 1,
      "productSku": "MILK-VNM-180",
      "purchasePrice": 6200,
      "moq": 24,
      "packSize": 12,
      "committedLeadTime": 2,
      "isPreferred": true
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 3.3. `GET /api/v1/suppliers/evaluations`
* **Mô tả:** Xem bảng xếp hạng và chi tiết 4 điểm thành phần của các nhà cung cấp (`UC-009`, `FR-019`, `FR-020`).
* **Quyền hạn:** Authenticated (`ADMIN`, `STAFF`).
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "supplierId": 1,
        "supplierCode": "SUP-VINAMILK",
        "supplierName": "Vinamilk",
        "deliveryCountAnalyzed": 10,
        "totalScore": 92.45,
        "rank": 1,
        "isNewSupplier": false,
        "scores": {
          "priceScore": 95.0,
          "otifScore": 90.0,
          "qualityScore": 98.5,
          "leadTimeScore": 85.0
        }
      }
    ],
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 3.4. `GET /api/v1/suppliers/:id/deliveries`
* **Mô tả:** Xem chi tiết lịch sử các lần giao hàng gần nhất của một nhà cung cấp cụ thể phục vụ kiểm tra OTIF, hàng lỗi và chất lượng (`UC-009`, `FR-020`).
* **Quyền hạn:** Authenticated (`ADMIN`, `STAFF`).
* **Path Parameters:**
  * `id` (integer, ID của nhà cung cấp).
* **Query Parameters:**
  * `limit` (number, mặc định: 10 lần giao gần nhất).
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 101,
        "poId": 501,
        "poCode": "PO-20260904-0001",
        "promisedDeliveryDate": "2026-09-06",
        "actualDeliveryDate": "2026-09-06",
        "leadTimeDays": 2,
        "totalOrderedQuantity": 72,
        "totalDeliveredQuantity": 72,
        "totalDefectiveQuantity": 2,
        "isOtif": true,
        "notes": "Hàng đủ số lượng, 2 hộp móp góc vỏ thùng",
        "createdAt": "2026-09-06T14:30:00.000Z"
      }
    ],
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 3.5. `GET & PUT /api/v1/config/supplier-weights`
* **Mô tả:** Xem hoặc cập nhật bộ 4 trọng số đánh giá NCC (`UC-017`, `FR-034`, `BR-013`).
* **Quyền hạn:** Chỉ dành cho `ADMIN`.
* **Request Body (cho `PUT`):**
  ```json
  {
    "weightOtif": 35.0,
    "weightQuality": 30.0,
    "weightPrice": 20.0,
    "weightLeadtime": 15.0
  }
  ```
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "weightOtif": 35.0,
      "weightQuality": 30.0,
      "weightPrice": 20.0,
      "weightLeadtime": 15.0,
      "message": "Đã lưu bộ trọng số và tự động tính toán lại điểm hiệu suất toàn bộ NCC."
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```
* **Error Response (`422 Unprocessable Entity` - Vi phạm tổng 100%):**
  ```json
  {
    "success": false,
    "error": {
      "code": "WEIGHT_SUM_INVALID",
      "message": "Tổng 4 trọng số phải bằng chính xác 100% (Hiện tại: 95%)."
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

## NHÓM 4: TỒN KHO & PHÂN TÍCH MA TRẬN ABC-XYZ (INVENTORY & ANALYTICS)

### 4.1. `GET /api/v1/inventory/dashboard`
* **Mô tả:** Lấy số liệu thống kê tổng quan KPI 5 cấp độ rủi ro tồn kho (`UC-004`, `FR-007`, `FR-010`).
* **Quyền hạn:** Authenticated (`ADMIN`, `STAFF`).
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "totalSku": 150,
      "kpiSummary": {
        "outOfStock": 3,
        "critical": 12,
        "warning": 25,
        "normal": 98,
        "overstock": 12,
        "deadStock": 5
      },
      "riskDistributionPct": {
        "safeRatio": 65.3,
        "atRiskRatio": 34.7
      }
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 4.2. `GET /api/v1/inventory/items`
* **Mô tả:** Lấy danh sách tồn kho chi tiết theo từng sản phẩm kèm chỉ số an toàn (`UC-004`, `FR-007`, `FR-008`).
* **Quyền hạn:** Authenticated (`ADMIN`, `STAFF`).
* **Query Parameters:** `page`, `limit`, `riskLevel`, `isDeadStock`, `category`, `search`.
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "sku": "MILK-VNM-180",
        "name": "Sữa tươi Vinamilk 180ml",
        "category": "Sữa & Bơ sữa",
        "onHand": 12,
        "onOrder": 0,
        "inventoryPosition": 12,
        "safetyStock": 15,
        "reorderPoint": 35,
        "maxStock": 125,
        "daysOfSupply": 2.4,
        "riskLevel": "CRITICAL",
        "isDeadStock": false
      }
    ],
    "meta": { "page": 1, "limit": 20, "totalItems": 12, "totalPages": 1 },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 4.3. `GET /api/v1/inventory/abc-xyz`
* **Mô tả:** Lấy dữ liệu phân tích ma trận 9 ô ABC-XYZ (`UC-005`, `FR-009`, `BR-009`, `BR-010`).
* **Quyền hạn:** Authenticated (`ADMIN`, `STAFF`).
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "matrix": {
        "AX": { "skuCount": 18, "revenuePct": 54.2 },
        "AY": { "skuCount": 12, "revenuePct": 21.0 },
        "AZ": { "skuCount": 5, "revenuePct": 4.8 },
        "BX": { "skuCount": 22, "revenuePct": 8.5 },
        "BY": { "skuCount": 15, "revenuePct": 4.5 },
        "BZ": { "skuCount": 8, "revenuePct": 2.0 },
        "CX": { "skuCount": 30, "revenuePct": 2.5 },
        "CY": { "skuCount": 25, "revenuePct": 1.5 },
        "CZ": { "skuCount": 15, "revenuePct": 1.0 }
      },
      "analysisDate": "2026-09-04"
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 4.4. `GET /api/v1/products/:sku/360`
* **Mô tả:** Toàn cảnh 360 độ về 1 sản phẩm: tồn kho, lịch sử bán 30 ngày, dự báo AI, bảng giá NCC (`UC-006`).
* **Quyền hạn:** Authenticated (`ADMIN`, `STAFF`).
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "sku": "MILK-VNM-180",
      "name": "Sữa tươi Vinamilk 180ml",
      "inventory": { "onHand": 12, "onOrder": 0, "ip": 12, "rop": 35, "ss": 15, "dos": 2.4, "riskLevel": "CRITICAL" },
      "classification": { "abcClass": "A", "xyzClass": "X", "segment": "AX", "cv": 0.28 },
      "suppliers": [
        { "supplierId": 1, "name": "Vinamilk", "purchasePrice": 6200, "moq": 24, "packSize": 12, "score": 92.5 }
      ]
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

## NHÓM 5: DỰ BÁO NHU CẦU BÁN HÀNG AI (DEMAND FORECASTING)

### 5.1. `GET /api/v1/forecasts`
* **Mô tả:** Danh sách tổng hợp kết quả dự báo nhu cầu toàn bộ sản phẩm (`UC-007`, `FR-012`, `FR-013`).
* **Quyền hạn:** Authenticated (`ADMIN`, `STAFF`).
* **Query Parameters:** `horizon` (7, 14, 30, mặc định: 14), `algorithm`, `isFallback`.
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "sku": "MILK-VNM-180",
        "name": "Sữa tươi Vinamilk 180ml",
        "horizonDays": 14,
        "forecastedDemand": 70,
        "dailyAvgDemand": 5.0,
        "wape": 14.5,
        "mae": 1.2,
        "algorithmUsed": "AI_MODEL",
        "isFallback": false
      }
    ],
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 5.2. `GET /api/v1/forecasts/:sku`
* **Mô tả:** Lấy chuỗi điểm dự báo theo ngày và dải mây tin cậy 95% để vẽ biểu đồ (`UC-007`, `FR-014`).
* **Quyền hạn:** Authenticated (`ADMIN`, `STAFF`).
* **Query Parameters:** `horizon` (7, 14, 30, mặc định: 14).
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "sku": "MILK-VNM-180",
      "horizonDays": 14,
      "forecastedDemand": 70,
      "dailyAvgDemand": 5.0,
      "wape": 14.5,
      "mae": 1.2,
      "algorithmUsed": "AI_MODEL",
      "isFallback": false,
      "points": [
        { "date": "2026-09-05", "predicted": 5, "lowerBound": 3, "upperBound": 7 },
        { "date": "2026-09-06", "predicted": 6, "lowerBound": 4, "upperBound": 8 }
      ]
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 5.3. `POST /api/v1/forecasts/cold-start`
* **Mô tả:** Nhập lượng bán dự kiến ngày ($D_{expected}$) cho sản phẩm mới Cold Start (`UC-008`, `FR-016`).
* **Quyền hạn:** `STAFF`.
* **Request Body:**
  ```json
  {
    "sku": "NEW-SNACK-OISHI",
    "expectedDailySales": 8,
    "notes": "Dựa trên doanh số tham khảo của dòng Snack Oishi vị tôm cũ"
  }
  ```
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "sku": "NEW-SNACK-OISHI",
      "expectedDailySales": 8,
      "calculatedSafetyStock": 16,
      "message": "Đã lưu lượng bán dự kiến. Hệ thống đã cập nhật tồn kho an toàn ban đầu."
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 5.4. `POST /api/v1/forecasts/generate`
* **Mô tả:** Kích hoạt tính toán dự báo AI theo chu kỳ (7, 14, 30 ngày) hoặc tính toán toàn bộ cho tất cả SKU (`UC-007`, `FR-012`, `FR-013`).
* **Quyền hạn:** `STAFF`, `ADMIN`.
* **Request Body:**
  ```json
  {
    "horizonDays": 14
  }
  ```
  *(Ghi chú: Nếu `horizonDays` = 0 hoặc bỏ trống, hệ thống sẽ chạy tính toán cho cả 3 khung 7, 14 và 30 ngày)*.
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "skusAnalyzed": 150,
      "horizonDays": 14,
      "aiModelCount": 138,
      "fallbackCount": 8,
      "coldStartCount": 4,
      "message": "Đã hoàn tất tính toán dự báo AI cho 150 SKU!"
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

## NHÓM 6: KHUYẾN NGHỊ MUA HÀNG THÔNG MINH (RECOMMENDATIONS)

### 6.1. `GET /api/v1/recommendations`
* **Mô tả:** Lấy danh sách sản phẩm cần mua kèm đối tác tối ưu, danh sách đối tác thay thế (Human Override) và thẻ giải thích minh bạch (`UC-010`, `FR-021` $\rightarrow$ `FR-025`).
* **Quyền hạn:** Authenticated (`ADMIN`, `STAFF`).
* **Query Parameters:** `horizon` (7, 14, 30, mặc định: 14), `urgencyLevel`, `category`.
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 101,
        "sku": "MILK-VNM-180",
        "productName": "Sữa tươi Vinamilk 180ml",
        "category": "Sữa & Bơ sữa",
        "onHand": 12,
        "onOrder": 0,
        "inventoryPosition": 12,
        "reorderPoint": 35,
        "daysOfSupply": 2.4,
        "urgencyLevel": "CRITICAL",
        "suggestedQuantity": 72,
        "suggestedOrderDate": "2026-09-04",
        "recommendedSupplier": {
          "supplierId": 1,
          "name": "Vinamilk",
          "unitPrice": 6200,
          "moq": 24,
          "packSize": 12,
          "score": 92.5,
          "otif": 90.0,
          "leadTime": 2
        },
        "alternativeSuppliers": [
          {
            "supplierId": 2,
            "name": "Đại Lý Phân Phối Sữa Miền Bắc",
            "unitPrice": 6350,
            "moq": 12,
            "packSize": 12,
            "score": 87.0,
            "otif": 85.0,
            "leadTime": 3
          }
        ],
        "estimatedTotalCost": 446400,
        "explanationSummary": "Tồn kho chỉ còn đủ bán trong 2.4 ngày (thấp hơn ROP 35). Đề xuất đặt 72 hộp (6 lốc) từ Vinamilk vì đối tác có điểm hiệu suất cao nhất (92.5) và giao trong 2 ngày.",
        "explanationFactors": {
          "rawShortage": 68,
          "moqApplied": 24,
          "packSizeApplied": 12
        }
      }
    ],
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 6.2. `POST /api/v1/recommendations/run-analysis`
* **Mô tả:** Kích hoạt chạy lại toàn bộ pipeline tính toán DSS on-demand trong thời gian $< 5$s (`UC-011`, `FR-022`, `NFR-002`).
* **Quyền hạn:** `STAFF`.
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "executionTimeMs": 2350,
      "skusAnalyzed": 150,
      "recommendationsCount": 18,
      "message": "Đã hoàn thành phân tích và cập nhật danh sách khuyến nghị mới nhất."
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

## NHÓM 7: ĐƠN MUA HÀNG & NHẬN HÀNG KHO (PURCHASE ORDERS & RECEIPT)

### 7.1. `POST /api/v1/purchase-orders`
* **Mô tả:** Tạo đơn mua hàng mới cho một nhà cung cấp cụ thể (Trạng thái ban đầu: `DRAFT`) (`UC-012`, `FR-026`, `FR-028`). Hỗ trợ tạo từ danh sách khuyến nghị hoặc tự tạo thủ công.
* **Quyền hạn:** `STAFF`.
* **Request Body:**
  ```json
  {
    "supplierId": 1,
    "promisedDeliveryDate": "2026-09-06",
    "notes": "Giao trước 17h, gọi cho thủ kho trước 30 phút",
    "items": [
      { "productSku": "MILK-VNM-180", "orderedQuantity": 72, "unitPrice": 6200 }
    ]
  }
  ```
* **Success Response (`201 Created`):**
  ```json
  {
    "success": true,
    "data": {
      "id": 501,
      "poCode": "PO-20260904-0001",
      "supplierId": 1,
      "status": "DRAFT",
      "orderDate": "2026-09-04",
      "promisedDeliveryDate": "2026-09-06",
      "totalAmount": 446400,
      "itemCount": 1
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 7.2. `POST /api/v1/purchase-orders/batch`
* **Mô tả:** Tạo đồng thời nhiều đơn mua hàng nháp (`DRAFT`) được gom nhóm tự động theo Nhà Cung Cấp từ màn hình Khuyến nghị mua hàng (`UC-010` A1, `UC-012`).
* **Quyền hạn:** `STAFF`.
* **Request Body:**
  ```json
  {
    "orders": [
      {
        "supplierId": 1,
        "promisedDeliveryDate": "2026-09-06",
        "notes": "Đơn gom tự động từ khuyến nghị mua hàng DSS",
        "items": [
          { "productSku": "MILK-VNM-180", "orderedQuantity": 72, "unitPrice": 6200 }
        ]
      },
      {
        "supplierId": 2,
        "promisedDeliveryDate": "2026-09-07",
        "notes": "Đơn gom tự động từ khuyến nghị mua hàng DSS",
        "items": [
          { "productSku": "TH-TRUE-1L", "orderedQuantity": 36, "unitPrice": 45000 }
        ]
      }
    ]
  }
  ```
* **Success Response (`201 Created`):**
  ```json
  {
    "success": true,
    "data": {
      "createdCount": 2,
      "orders": [
        {
          "id": 501,
          "poCode": "PO-20260904-0001",
          "supplierId": 1,
          "status": "DRAFT",
          "totalAmount": 446400,
          "itemCount": 1
        },
        {
          "id": 502,
          "poCode": "PO-20260904-0002",
          "supplierId": 2,
          "status": "DRAFT",
          "totalAmount": 1620000,
          "itemCount": 1
        }
      ],
      "message": "Đã tạo thành công 2 đơn mua hàng (DRAFT) gom nhóm theo nhà cung cấp."
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 7.3. `POST /api/v1/purchase-orders/:id/confirm`
* **Mô tả:** Xác nhận chốt đơn mua hàng: Khóa đơn sang `ORDERED` và tự động tăng tồn kho đang chờ về $\text{On-Order}$ (`UC-012`, `FR-029`, `BR-025`).
* **Quyền hạn:** `STAFF`.
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "id": 501,
      "poCode": "PO-20260904-0001",
      "status": "ORDERED",
      "confirmedAt": "2026-09-04T09:15:00.000Z",
      "message": "Đã xác nhận đặt hàng thành công. Số lượng hàng chờ về (On-Order) đã được cập nhật."
    },
    "timestamp": "2026-09-04T09:15:00.000Z"
  }
  ```
* **Error Response (`422 Unprocessable Entity` - Đơn đã chốt hoặc đã đóng):**
  ```json
  {
    "success": false,
    "error": {
      "code": "ORDER_LOCKED",
      "message": "Đơn hàng này không ở trạng thái DRAFT. Không thể xác nhận chốt đơn."
    },
    "timestamp": "2026-09-04T09:15:00.000Z"
  }
  ```

---

### 7.4. `GET /api/v1/purchase-orders`
* **Mô tả:** Tra cứu danh sách lịch sử đơn mua hàng theo 4 trạng thái (`UC-013`, `FR-030`).
* **Quyền hạn:** Authenticated (`ADMIN`, `STAFF`).
* **Query Parameters:** `page`, `limit`, `status` (`DRAFT`, `ORDERED`, `RECEIVED`, `CANCELLED`), `supplierId`, `fromDate`, `toDate`.
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 501,
        "poCode": "PO-20260904-0001",
        "supplierName": "Vinamilk",
        "status": "ORDERED",
        "orderDate": "2026-09-04",
        "promisedDeliveryDate": "2026-09-06",
        "totalAmount": 446400,
        "itemCount": 1
      }
    ],
    "meta": { "page": 1, "limit": 20, "totalItems": 45, "totalPages": 3 },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 7.5. `GET /api/v1/purchase-orders/:id/print`
* **Mô tả:** Lấy dữ liệu mẫu in Phiếu Đơn Mua Hàng (PO Printable Sheet) chuẩn hóa gửi cho nhà cung cấp (`UC-012` A3, `FR-027`).
* **Quyền hạn:** Authenticated (`ADMIN`, `STAFF`).
* **Path Parameters:** `id` (integer).
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "poCode": "PO-20260904-0001",
      "status": "ORDERED",
      "orderDate": "2026-09-04",
      "promisedDeliveryDate": "2026-09-06",
      "store": {
        "name": "Cửa Hàng Bán Lẻ Tiện Lợi SmartShop",
        "address": "123 Đường Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh",
        "phone": "02838999999",
        "purchaserName": "Nguyễn Văn A"
      },
      "supplier": {
        "name": "Công ty Cổ phần Sữa Việt Nam (Vinamilk)",
        "code": "SUP-VINAMILK",
        "phone": "02854155555",
        "email": "contact@vinamilk.com.vn"
      },
      "items": [
        {
          "sku": "MILK-VNM-180",
          "productName": "Sữa tươi tiệt trùng Vinamilk 180ml",
          "unit": "Hộp",
          "orderedQuantity": 72,
          "unitPrice": 6200,
          "amount": 446400
        }
      ],
      "totalAmount": 446400,
      "totalAmountInWords": "Bốn trăm bốn mươi sáu nghìn bốn trăm đồng chẵn.",
      "notes": "Giao trước 17h, gọi cho thủ kho trước 30 phút"
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 7.6. `POST /api/v1/purchase-orders/:id/cancel`
* **Mô tả:** Hủy đơn mua hàng (Nếu đang `ORDERED`, tự động giải phóng giảm trừ $\text{On-Order}$) (`UC-013`, `BR-017`).
* **Quyền hạn:** `STAFF`.
* **Request Body:**
  ```json
  {
    "reason": "Nhà cung cấp báo hết hàng đột xuất"
  }
  ```
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "id": 501,
      "poCode": "PO-20260904-0001",
      "status": "CANCELLED",
      "cancelledAt": "2026-09-04T10:00:00.000Z",
      "message": "Đã hủy đơn mua hàng. Lượng hàng On-Order đã được giải phóng."
    },
    "timestamp": "2026-09-04T10:00:00.000Z"
  }
  ```

---

### 7.7. `POST /api/v1/purchase-orders/:id/receive`
* **Mô tả:** Giao dịch nguyên tử nghiệm thu nhận hàng: Tăng $\text{On-Hand}$, giảm $\text{On-Order}$, đóng đơn `RECEIVED`, ghi log `delivery_history` (`UC-014`, `FR-017`, `FR-018`, `BR-018`, `BR-019`).
* **Quyền hạn:** `STAFF`.
* **Request Body:**
  ```json
  {
    "actualDeliveryDate": "2026-09-06",
    "notes": "Hàng đủ số lượng, có 2 hộp bị móp vỏ thùng bên ngoài",
    "items": [
      {
        "sku": "MILK-VNM-180",
        "deliveredQuantity": 72,
        "defectiveQuantity": 2
      }
    ]
  }
  ```
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "orderId": 501,
      "poCode": "PO-20260904-0001",
      "status": "RECEIVED",
      "totalDelivered": 72,
      "totalDefective": 2,
      "totalAccepted": 70,
      "isOtif": true,
      "message": "Đã ghi nhận nhận hàng thành công. Tồn kho thực tế (On-Hand) đã tăng thêm 70 đơn vị."
    },
    "timestamp": "2026-09-06T14:30:00.000Z"
  }
  ```
* **Error Response (`422 Unprocessable Entity` - Số lượng lỗi vượt quá thực giao):**
  ```json
  {
    "success": false,
    "error": {
      "code": "DEFECT_EXCEEDS_DELIVERED",
      "message": "Số lượng hàng lỗi (80) không thể lớn hơn số lượng thực giao (72)."
    },
    "timestamp": "2026-09-06T14:30:00.000Z"
  }
  ```

---

### 7.8. `GET /api/v1/purchase-orders/:id/receipt-note`
* **Mô tả:** Lấy dữ liệu mẫu in Phiếu Nhập Kho thực tế (Goods Receipt Note) sau khi đã nghiệm thu hàng (`UC-014` A3).
* **Quyền hạn:** Authenticated (`ADMIN`, `STAFF`).
* **Path Parameters:** `id` (integer).
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "receiptCode": "GRN-20260906-0501",
      "poCode": "PO-20260904-0001",
      "supplierName": "Công ty Cổ phần Sữa Việt Nam (Vinamilk)",
      "promisedDeliveryDate": "2026-09-06",
      "actualDeliveryDate": "2026-09-06",
      "receiverName": "Nguyễn Văn A",
      "isOtif": true,
      "items": [
        {
          "sku": "MILK-VNM-180",
          "productName": "Sữa tươi tiệt trùng Vinamilk 180ml",
          "unit": "Hộp",
          "orderedQuantity": 72,
          "deliveredQuantity": 72,
          "defectiveQuantity": 2,
          "acceptedQuantity": 70
        }
      ],
      "totalDelivered": 72,
      "totalDefective": 2,
      "totalAccepted": 70,
      "notes": "Hàng đủ số lượng, có 2 hộp bị móp vỏ thùng bên ngoài"
    },
    "timestamp": "2026-09-06T14:30:00.000Z"
  }
  ```

---

## 8. Kết Luận

Tài liệu Đặc tả Chi tiết Endpoints này cung cấp bản thiết kế chính xác, hoàn chỉnh cho toàn bộ 47 API endpoints của hệ thống. Mọi luồng dữ liệu đều được kiểm soát bởi Zod Schemas và RBAC Guards, bảo đảm an ninh, toàn vẹn giao dịch và trải nghiệm người dùng tối ưu.
