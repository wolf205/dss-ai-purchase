# API Endpoints Specification: Đặc Tả Chi Tiết Từng Endpoint

---

## NHÓM 1: XÁC THỰC & QUẢN TRỊ TÀI KHOẢN (AUTH & USERS)

### 1.1. `POST /api/v1/auth/login`
* **Mô tả:** Xác thực tài khoản người dùng và cấp JWT Bearer Token (`UC-015`, `FR-031`).
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
* **Error Response (`401 Unauthorized`):**
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

---

### 1.2. `GET /api/v1/auth/me`
* **Mô tả:** Lấy thông tin tài khoản đang đăng nhập từ token (`UC-015`).
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
      "isActive": true
    },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 1.3. `POST /api/v1/auth/change-password`
* **Mô tả:** Người dùng tự đổi mật khẩu cá nhân (`UC-015`).
* **Quyền hạn:** Authenticated (`ADMIN`, `STAFF`).
* **Request Body:**
  ```json
  {
    "oldPassword": "CurrentPassword@123",
    "newPassword": "NewSecurePassword@456"
  }
  ```
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

---

### 1.4. `GET /api/v1/users`
* **Mô tả:** Quản trị viên xem danh sách toàn bộ tài khoản người dùng (`UC-016`, `FR-032`).
* **Quyền hạn:** Chỉ dành cho `ADMIN`.
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
        "lastLoginAt": "2026-09-04T08:30:00.000Z",
        "createdAt": "2026-09-01T00:00:00.000Z"
      }
    ],
    "meta": { "page": 1, "limit": 20, "totalItems": 3, "totalPages": 1 },
    "timestamp": "2026-09-04T09:00:00.000Z"
  }
  ```

---

### 1.5. `POST /api/v1/users`
* **Mô tả:** Quản trị viên tạo mới một tài khoản người dùng (`UC-016`, `FR-032`).
* **Quyền hạn:** Chỉ dành cho `ADMIN`.
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
* **Error Response (`409 Conflict`):**
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

### 1.6. `PATCH /api/v1/users/:id/status`
* **Mô tả:** Khóa hoặc kích hoạt lại tài khoản người dùng (`UC-016`).
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
      "id": "b0000000-0000-0000-0000-000000000003",
      "isActive": false,
      "message": "Đã vô hiệu hóa tài khoản thành công."
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
  * `page` (number, default: 1)
  * `limit` (number, default: 20)
  * `search` (string, tìm theo mã SKU hoặc tên sản phẩm)
  * `category` (string, lọc theo ngành hàng)
  * `isActive` (boolean, mặc định: true)
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
        "isActive": true
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

### 3.4. `GET & PUT /api/v1/config/supplier-weights`
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

## NHÓM 6: KHUYẾN NGHỊ MUA HÀNG THÔNG MINH (RECOMMENDATIONS)

### 6.1. `GET /api/v1/recommendations`
* **Mô tả:** Lấy danh sách sản phẩm cần mua kèm đối tác tối ưu và thẻ giải thích minh bạch (`UC-010`, `FR-021` $\rightarrow$ `FR-025`).
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
* **Mô tả:** Tạo đơn mua hàng mới (Trạng thái ban đầu: `DRAFT`) (`UC-012`, `FR-026`, `FR-028`). Hỗ trợ tạo từ danh sách khuyến nghị hoặc tự tạo.
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

### 7.2. `POST /api/v1/purchase-orders/:id/confirm`
* **Mô tả:** Xác nhận chốt đơn mua hàng: Khóa đơn sang `ORDERED` và tự động tăng $\text{On-Order}$ (`UC-012`, `FR-029`, `BR-025`).
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

### 7.3. `GET /api/v1/purchase-orders`
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

### 7.4. `POST /api/v1/purchase-orders/:id/cancel`
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

### 7.5. `POST /api/v1/purchase-orders/:id/receive`
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

## 8. Kết Luận

Tài liệu Đặc tả Chi tiết Endpoints này cung cấp bản thiết kế chính xác, hoàn chỉnh cho toàn bộ 32 API endpoints của hệ thống. Mọi luồng dữ liệu đều được kiểm soát bởi Zod Schemas và RBAC Guards, bảo đảm an ninh và độ ổn định cao nhất khi đưa vào lập trình thực tế.
