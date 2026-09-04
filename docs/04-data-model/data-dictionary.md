# Data Dictionary: Từ Điển Dữ Liệu Chi Tiết (Data Dictionary)

---

## 1. Danh Mục Các Kiểu Dữ Liệu Liệt Kê (ENUM Definitions)

Hệ thống chuẩn hóa các trường trạng thái, phân loại và vai trò bằng các kiểu dữ liệu liệt kê (ENUMs) nhằm đảm bảo tính toàn vẹn và ngăn chặn giá trị không hợp lệ:

| Tên ENUM | Các Giá Trị Hợp Lệ | Mô Tả Nghiệp Vụ & Quy Tắc Áp Dụng |
| :--- | :--- | :--- |
| **`UserRole`** | `ADMIN`, `STAFF` | Phân quyền truy cập người dùng theo RBAC (`FR-033`, `UC-015`, `UC-016`). |
| **`RiskLevel`** | `OUT_OF_STOCK`, `CRITICAL`, `WARNING`, `NORMAL`, `OVERSTOCK` | 5 cấp độ rủi ro tồn kho đánh giá theo thứ tự ưu tiên (`BR-002`, `FR-010`). |
| **`MaturityTier`** | `COLD_START`, `BASIC_FORECAST`, `AI_READY` | 3 cấp độ trưởng thành dữ liệu của sản phẩm theo số ngày $N_{days}$ (`BR-006`, `BR-020`). |
| **`POStatus`** | `DRAFT`, `ORDERED`, `RECEIVED`, `CANCELLED` | 4 trạng thái tuần tự của Đơn mua hàng theo máy trạng thái chuẩn (`BR-017`, `FR-030`). |
| **`ABCClass`** | `A`, `B`, `C` | Phân loại sản phẩm theo doanh thu tích lũy: A ($\le 80\%$), B ($80-95\%$), C ($> 95\%$) (`BR-009`). |
| **`XYZClass`** | `X`, `Y`, `Z` | Phân loại theo hệ số biến động nhu cầu $CV$: X ($\le 0.5$), Y ($0.5-1.0$), Z ($> 1.0$) (`BR-010`). |
| **`ABCXYZSegment`** | `AX`, `AY`, `AZ`, `BX`, `BY`, `BZ`, `CX`, `CY`, `CZ` | 9 phân nhóm ma trận kết hợp định hướng chiến lược dự trữ (`BR-011`, `FR-009`). |
| **`AlgorithmType`** | `AI_MODEL`, `FALLBACK_SMA7`, `BASIC_SMA7`, `COLD_START_ESTIMATE` | Thuật toán sinh dự báo nhu cầu đang áp dụng cho sản phẩm (`BR-006`, `BR-007`). |
| **`ImportType`** | `SALES_HISTORY`, `INVENTORY_SNAPSHOT` | Loại dữ liệu nạp hàng loạt từ tệp Excel/CSV (`FR-004`, `UC-003`). |
| **`ImportStatus`** | `SUCCESS`, `FAILED`, `PARTIAL` | Kết quả xử lý phiên nạp dữ liệu (`UC-003`). |
| **`SupplierStatusTag`** | `NEW_SUPPLIER`, `ACTIVE` | Nhãn phân loại đối tác (NCC mới $< 3$ lần giao gắn nhãn `NEW_SUPPLIER`) (`BR-013`). |
| **`RecommendationStatus`** | `PENDING`, `ORDERED`, `DISMISSED` | Trạng thái xử lý của khuyến nghị mua hàng (`UC-010`). |

---

## 2. Đặc Tả Chi Tiết Các Bảng Dữ Liệu (Table Specifications)

---

### DOMAIN 1: MASTER DATA (DỮ LIỆU DANH MỤC CỐT LÕI)

#### 1. Bảng `products` (Danh Mục Sản Phẩm)
* **Mô tả nghiệp vụ:** Lưu trữ thông tin định danh hàng hóa, giá vốn tham chiếu, giá bán niêm yết và các tham số cấu hình tồn kho an toàn cơ bản của cửa hàng.
* **Khóa chính (PK):** `sku`
* **Khóa ngoại (FK):** Không có.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc (Constraints) | Mô Tả Nghiệp Vụ & Quy Tắc Ánh Xạ |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `sku` | `VARCHAR(50)` | NO | Không | PRIMARY KEY | Mã SKU định danh duy nhất của sản phẩm (`FR-001`, `UC-001`). Ví dụ: `MILK-TH-180`. |
| `name` | `VARCHAR(255)`| NO | Không | NOT NULL | Tên thương phẩm hiển thị đầy đủ (`FR-001`). |
| `category` | `VARCHAR(100)`| NO | Không | NOT NULL | Phân loại ngành hàng (ví dụ: `Sữa & Bơ sữa`, `Bánh kẹo`, `Gia vị`). |
| `unit` | `VARCHAR(50)` | NO | Không | NOT NULL | Đơn vị tính cơ sở bán lẻ (`Hộp`, `Lon`, `Chai`, `Gói`). |
| `cost_price` | `DECIMAL(15,2)`| NO | Không | `CHECK (cost_price > 0)` | Giá vốn tham chiếu đơn vị dùng để tính biên lợi nhuận và dự toán chi phí mua hàng. |
| `selling_price` | `DECIMAL(15,2)`| NO | Không | `CHECK (selling_price > 0)` | Giá bán lẻ niêm yết tại quầy, dùng để tính Doanh thu phục vụ phân loại ma trận ABC (`BR-009`). |
| `default_lead_time`| `INTEGER` | NO | `1` | `CHECK (default_lead_time >= 1)` | Thời gian giao hàng mặc định (tính theo ngày) khi chưa xác định được NCC cụ thể (`BR-003`). |
| `min_safety_stock` | `INTEGER` | NO | `0` | `CHECK (min_safety_stock >= 0)` | Mức sàn an toàn tối thiểu do con người cài đặt, đóng vai trò chặn dưới: $\text{SS}_{final} = \max(\text{SS}_{stat}, \text{MinSS})$ (`BR-003`). |
| `is_active` | `BOOLEAN` | NO | `TRUE` | NOT NULL | Trạng thái kinh doanh: Nếu `FALSE`, loại trừ hoàn toàn khỏi cảnh báo, dự báo AI và khuyến nghị mua (`BR-021`, `UC-001`). |
| `created_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | NOT NULL | Thời điểm khởi tạo bản ghi sản phẩm. |
| `updated_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | NOT NULL | Thời điểm cập nhật thông tin gần nhất. |

---

#### 2. Bảng `suppliers` (Danh Mục Nhà Cung Cấp)
* **Mô tả nghiệp vụ:** Quản lý thông tin định danh, liên hệ và trạng thái hợp tác của các đối tác phân phối hàng hóa cho cửa hàng.
* **Khóa chính (PK):** `id`
* **Khóa ngoại (FK):** Không có.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc (Constraints) | Mô Tả Nghiệp Vụ & Quy Tắc Ánh Xạ |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | NO | Auto | PRIMARY KEY | Khóa chính tự tăng định danh duy nhất nhà cung cấp trong hệ thống. |
| `code` | `VARCHAR(50)` | NO | Không | UNIQUE, NOT NULL | Mã nhà cung cấp rút gọn (ví dụ: `SUP-VINAMILK`, `SUP-TH-TRUE-MILK`) (`FR-002`, `UC-002`). |
| `name` | `VARCHAR(255)`| NO | Không | UNIQUE, NOT NULL | Tên pháp lý hoặc tên thương mại của đối tác. |
| `phone` | `VARCHAR(20)` | NO | Không | NOT NULL | Số điện thoại liên hệ chính thức dùng để gửi đơn đặt hàng. |
| `email` | `VARCHAR(100)`| YES | NULL | Không | Địa chỉ email gửi phiếu đặt hàng PO. |
| `address` | `TEXT` | YES | NULL | Không | Địa chỉ kho xuất hàng hoặc văn phòng giao dịch của đối tác. |
| `status_tag` | `SupplierStatusTag`| NO | `'NEW_SUPPLIER'` | NOT NULL | Nhãn đối tác: `NEW_SUPPLIER` nếu giao dưới 3 đơn; `ACTIVE` nếu đã có đủ dữ liệu đánh giá (`BR-013`). |
| `is_active` | `BOOLEAN` | NO | `TRUE` | NOT NULL | Trạng thái hợp tác: Nếu `FALSE`, không gợi ý mua và không cho phép chọn khi tạo đơn mới (`UC-002`). |
| `created_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | NOT NULL | Thời điểm tạo bản ghi. |
| `updated_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | NOT NULL | Thời điểm cập nhật gần nhất. |

---

#### 3. Bảng `product_suppliers` (Bảng Giá & Điều Kiện Phân Phối)
* **Mô tả nghiệp vụ:** Bảng quan hệ Nhiều - Nhiều (N:M) lưu trữ chính sách thương mại giữa Sản phẩm và Nhà cung cấp: đơn giá nhập, quy cách đóng gói, số lượng đặt tối thiểu và thời gian giao hàng cam kết.
* **Khóa chính (PK):** `id`
* **Khóa ngoại (FK):**
  * `product_sku` $\rightarrow$ `products.sku` (ON DELETE RESTRICT)
  * `supplier_id` $\rightarrow$ `suppliers.id` (ON DELETE RESTRICT)
* **Ràng buộc duy nhất:** `UNIQUE (product_sku, supplier_id)`

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc (Constraints) | Mô Tả Nghiệp Vụ & Quy Tắc Ánh Xạ |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | NO | Auto | PRIMARY KEY | Khóa chính tự tăng. |
| `product_sku` | `VARCHAR(50)` | NO | Không | FK, NOT NULL | Mã sản phẩm liên kết (`products.sku`). |
| `supplier_id` | `BIGINT` | NO | Không | FK, NOT NULL | Khóa định danh nhà cung cấp liên kết (`suppliers.id`). |
| `purchase_price` | `DECIMAL(15,2)`| NO | Không | `CHECK (purchase_price > 0)` | Đơn giá nhập thỏa thuận ($P_{supplier}$), dùng tính điểm giá $S_{price}$ và gợi ý NCC (`BR-012`, `BR-016`). |
| `moq` | `INTEGER` | NO | `1` | `CHECK (moq >= 1)` | Số lượng đặt hàng tối thiểu (Minimum Order Quantity) của đối tác (`BR-014`). |
| `pack_size` | `INTEGER` | NO | `1` | `CHECK (pack_size >= 1)` | Quy cách đóng gói (số lẻ theo Thùng/Lốc/Hộp), dùng làm tròn lượng mua đề xuất $Q_{suggested}$ (`BR-014`). |
| `committed_lead_time`| `INTEGER`| NO | `1` | `CHECK (committed_lead_time >= 1)` | Thời gian giao hàng cam kết ($LT_{supplier}$ tính bằng ngày) dùng tính ROP và điểm tốc độ (`BR-004`, `BR-012`). |
| `is_preferred` | `BOOLEAN` | NO | `FALSE` | NOT NULL | Cờ đánh dấu NCC được cửa hàng ưu tiên thỏa thuận ban đầu. |
| `created_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | NOT NULL | Thời điểm thiết lập liên kết. |
| `updated_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | NOT NULL | Thời điểm cập nhật giá hoặc chính sách. |

---

### DOMAIN 2: INVENTORY & SALES INGESTION (TỒN KHO & NẠP DỮ LIỆU)

#### 4. Bảng `inventory` (Tồn Kho & Chỉ Số An Toàn)
* **Mô tả nghiệp vụ:** Lưu trữ số lượng tồn thực tế khả dụng, số lượng hàng đang chờ về từ các đơn PO đã chốt, và lưu cache các chỉ số an toàn tính toán thời gian thực theo từng SKU.
* **Khóa chính (PK):** `product_sku`
* **Khóa ngoại (FK):** `product_sku` $\rightarrow$ `products.sku` (ON DELETE CASCADE)

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc (Constraints) | Mô Tả Nghiệp Vụ & Quy Tắc Ánh Xạ |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `product_sku` | `VARCHAR(50)` | NO | Không | PK, FK | Mã SKU sản phẩm định danh hàng tồn kho. |
| `on_hand` | `INTEGER` | NO | `0` | `CHECK (on_hand >= 0)` | Số lượng hàng thực tế đang có sẵn trên quầy kệ và kho phụ (`FR-007`). |
| `on_order` | `INTEGER` | NO | `0` | `CHECK (on_order >= 0)` | Tổng số lượng sản phẩm trong các đơn mua hàng có trạng thái `ORDERED` (`BR-001`, `BR-026`). |
| `calculated_ip` | `INTEGER` | NO | `0` | GENERATED / NOT NULL | Vị trí tồn kho: $\text{IP} = \text{On-Hand} + \text{On-Order}$ giúp loại trừ đặt trùng lặp (`BR-001`). |
| `safety_stock` | `INTEGER` | NO | `0` | `CHECK (safety_stock >= 0)` | Mức tồn kho an toàn tính toán: $\lceil 1.65 \times \sigma_d \times \sqrt{L} \rceil$ (`BR-003`, `FR-008`). |
| `reorder_point` | `INTEGER` | NO | `0` | `CHECK (reorder_point >= 0)` | Điểm đặt hàng lại: $\text{ROP} = \lceil (D_{avg} \times L) + \text{SS} \rceil$ (`BR-004`, `FR-008`). |
| `max_stock` | `INTEGER` | NO | `0` | `CHECK (max_stock >= 0)` | Mức tồn kho tối đa: $\text{Max Stock} = \text{ROP} + \lceil D_{avg} \times 30 \rceil$ cảnh báo đọng vốn (`BR-004`). |
| `days_of_supply` | `DECIMAL(7,1)` | NO | `0.0` | `CHECK (days_of_supply >= 0)` | Số ngày bán còn lại: $\text{DoS} = \text{On-Hand} / D_{avg}$; nếu hàng bất động gán $999$ (`BR-005`). |
| `risk_level` | `RiskLevel` | NO | `'NORMAL'` | NOT NULL | Phân loại 5 cấp độ rủi ro tồn kho: `OUT_OF_STOCK`, `CRITICAL`, `WARNING`, `NORMAL`, `OVERSTOCK` (`BR-002`). |
| `is_dead_stock` | `BOOLEAN` | NO | `FALSE` | NOT NULL | Cờ cảnh báo hàng tồn bất động: $\text{On-Hand} > 0$ nhưng 30 ngày không bán được chiếc nào (`BR-023`, `FR-011`). |
| `last_stocktake_date`| `TIMESTAMPTZ`| YES | NULL | Không | Thời điểm kiểm kê hoặc điều chỉnh số lượng thực tế gần nhất. |
| `updated_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | NOT NULL | Thời điểm cập nhật số liệu tồn kho gần nhất. |

---

#### 5. Bảng `inventory_snapshots` (Nhật Ký Kiểm Kê & Điều Chỉnh Kho)
* **Mô tả nghiệp vụ:** Lưu vết mọi thao tác điều chỉnh tồn kho thủ công hoặc kết quả từ các phiên kiểm kê hàng hóa định kỳ (`UC-003`).
* **Khóa chính (PK):** `id`
* **Khóa ngoại (FK):**
  * `product_sku` $\rightarrow$ `products.sku`
  * `adjusted_by` $\rightarrow$ `users.id`

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc (Constraints) | Mô Tả Nghiệp Vụ & Quy Tắc Ánh Xạ |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | NO | Auto | PRIMARY KEY | Khóa chính tự tăng. |
| `product_sku` | `VARCHAR(50)` | NO | Không | FK, NOT NULL | Mã sản phẩm được điều chỉnh tồn kho. |
| `snapshot_date` | `DATE` | NO | `CURRENT_DATE` | NOT NULL | Ngày thực hiện điều chỉnh hoặc kiểm kê. |
| `previous_on_hand`| `INTEGER` | NO | Không | `CHECK (previous_on_hand >= 0)` | Số lượng tồn khả dụng trước khi điều chỉnh. |
| `new_on_hand` | `INTEGER` | NO | Không | `CHECK (new_on_hand >= 0)` | Số lượng tồn khả dụng mới sau kiểm kê thực tế. |
| `adjustment_quantity`| `INTEGER`| NO | Không | NOT NULL | Số lượng chênh lệch: $= \text{new\_on\_hand} - \text{previous\_on\_hand}$. |
| `reason` | `TEXT` | YES | NULL | Không | Lý do điều chỉnh (Kiểm kê định kỳ, Hàng hỏng vỡ, Bù sai sót...). |
| `adjusted_by` | `UUID` | YES | NULL | FK | Định danh người dùng thực hiện thao tác kiểm kê (`users.id`). |
| `created_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | NOT NULL | Thời điểm tạo bản ghi log. |

---

#### 6. Bảng `sales_history` (Lịch Sử Giao Dịch Bán Hàng)
* **Mô tả nghiệp vụ:** Dữ liệu chuỗi thời gian bán lẻ theo ngày của từng sản phẩm, đóng vai trò đầu vào cốt lõi cho mô hình AI dự báo nhu cầu và phân tích ma trận ABC-XYZ.
* **Khóa chính (PK):** `id`
* **Khóa ngoại (FK):**
  * `product_sku` $\rightarrow$ `products.sku` (ON DELETE RESTRICT)
  * `import_batch_id` $\rightarrow$ `data_import_logs.id` (ON DELETE SET NULL)
* **Ràng buộc duy nhất:** `UNIQUE (product_sku, sale_date)` (Chống trùng lặp ngày bán, hỗ trợ Upsert khi import lại)

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc (Constraints) | Mô Tả Nghiệp Vụ & Quy Tắc Ánh Xạ |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | NO | Auto | PRIMARY KEY | Khóa chính tự tăng. |
| `product_sku` | `VARCHAR(50)` | NO | Không | FK, NOT NULL | Mã sản phẩm ghi nhận doanh số bán lẻ (`FR-004`, `UC-003`). |
| `sale_date` | `DATE` | NO | Không | NOT NULL | Ngày phát sinh giao dịch bán lẻ. |
| `quantity_sold` | `INTEGER` | NO | Không | `CHECK (quantity_sold >= 0)` | Số lượng bán ra trong ngày ($y_i$), không được âm (`FR-006`). |
| `revenue` | `DECIMAL(15,2)`| NO | Không | `CHECK (revenue >= 0)` | Tổng doanh thu bán trong ngày ($= \text{quantity\_sold} \times \text{selling\_price}$) (`BR-009`). |
| `source` | `VARCHAR(30)` | NO | `'IMPORT_EXCEL'` | NOT NULL | Nguồn dữ liệu: `IMPORT_EXCEL`, `IMPORT_CSV`, `MANUAL_ENTRY`. |
| `import_batch_id`| `UUID` | YES | NULL | FK | Liên kết đến phiên import tệp nếu được nạp từ file. |
| `created_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | NOT NULL | Thời điểm lưu bản ghi. |

---

#### 7. Bảng `data_import_logs` (Nhật Ký Nạp Dữ Liệu Hàng Loạt)
* **Mô tả nghiệp vụ:** Lưu vết thông tin lịch sử các lần người dùng nạp dữ liệu bán hàng hoặc tồn kho qua tệp tin Excel/CSV (`FR-004`, `UC-003`).
* **Khóa chính (PK):** `id`
* **Khóa ngoại (FK):** `imported_by` $\rightarrow$ `users.id`

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc (Constraints) | Mô Tả Nghiệp Vụ & Quy Tắc Ánh Xạ |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | PRIMARY KEY | Định danh duy nhất mẻ import. |
| `import_type` | `ImportType` | NO | Không | NOT NULL | Loại dữ liệu nạp: `SALES_HISTORY` hoặc `INVENTORY_SNAPSHOT`. |
| `file_name` | `VARCHAR(255)`| NO | Không | NOT NULL | Tên tệp tin gốc do người dùng tải lên (ví dụ: `BaoCaoBanHang_Thang8.xlsx`). |
| `file_size_bytes`| `BIGINT` | NO | Không | `CHECK (file_size_bytes > 0)` | Dung lượng tệp tin (tối đa 10MB theo `UC-003`). |
| `total_rows` | `INTEGER` | NO | `0` | `CHECK (total_rows >= 0)` | Tổng số dòng dữ liệu đọc được từ tệp. |
| `successful_rows`| `INTEGER` | NO | `0` | `CHECK (successful_rows >= 0)` | Số dòng dữ liệu hợp lệ được lưu thành công. |
| `failed_rows` | `INTEGER` | NO | `0` | `CHECK (failed_rows >= 0)` | Số dòng bị phát hiện lỗi nghiệp vụ. |
| `status` | `ImportStatus`| NO | Không | NOT NULL | Trạng thái phiên nạp: `SUCCESS`, `FAILED`, `PARTIAL`. |
| `error_details` | `JSONB` | YES | NULL | Không | Mảng chi tiết các dòng lỗi: `[{"row": 15, "sku": "ABC", "error": "Mã SKU không tồn tại"}]`. |
| `imported_by` | `UUID` | YES | NULL | FK | Người dùng thực hiện thao tác nạp tệp. |
| `created_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | NOT NULL | Thời điểm thực hiện nạp tệp. |

---

### DOMAIN 3: DEMAND FORECASTING & DSS ANALYTICS (DỰ BÁO NHU CẦU & PHÂN TÍCH)

#### 8. Bảng `cold_start_inputs` (Dữ Liệu Sản Phẩm Mới Cold Start)
* **Mô tả nghiệp vụ:** Lưu trữ sản lượng tiêu thụ dự kiến ngày ($D_{expected}$) do nhân viên mua hàng chủ động nhập theo kinh nghiệm cho các sản phẩm mới chưa đủ 14 ngày dữ liệu lịch sử (`BR-006`, `BR-020`, `UC-008`).
* **Khóa chính (PK):** `product_sku`
* **Khóa ngoại (FK):**
  * `product_sku` $\rightarrow$ `products.sku` (ON DELETE CASCADE)
  * `updated_by` $\rightarrow$ `users.id`

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc (Constraints) | Mô Tả Nghiệp Vụ & Quy Tắc Ánh Xạ |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `product_sku` | `VARCHAR(50)` | NO | Không | PK, FK | Mã SKU sản phẩm mới ở giai đoạn Cold Start. |
| `history_days_count`| `INTEGER` | NO | `0` | `CHECK (history_days_count >= 0)` | Số ngày dữ liệu bán hàng đã tích lũy thực tế ($N_{days}$). |
| `expected_daily_sales`| `INTEGER`| NO | Không | `CHECK (expected_daily_sales >= 0)`| Số lượng bán ước tính trung bình mỗi ngày ($D_{expected}$) do nhân viên nhập (`UC-008`). |
| `notes` | `TEXT` | YES | NULL | Không | Ghi chú căn cứ ước lượng (sản phẩm tương đương, đánh giá nhà cung cấp...). |
| `updated_by` | `UUID` | YES | NULL | FK | Người dùng thực hiện nhập ước tính. |
| `updated_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | NOT NULL | Thời điểm cập nhật giá trị gần nhất. |

---

#### 9. Bảng `demand_forecasts` (Kết Quả Dự Báo Nhu Cầu Chuỗi Thời Gian)
* **Mô tả nghiệp vụ:** Lưu trữ kết quả đầu ra của mô hình phân tích dự báo AI / Fallback SMA-7 theo các khung thời gian kế hoạch $T \in \{7, 14, 30\}$ ngày, các chỉ số độ chính xác và dữ liệu dải mây biến động tin cậy.
* **Khóa chính (PK):** `id`
* **Khóa ngoại (FK):** `product_sku` $\rightarrow$ `products.sku` (ON DELETE CASCADE)
* **Ràng buộc duy nhất:** `UNIQUE (product_sku, forecast_date, horizon_days)`

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc (Constraints) | Mô Tả Nghiệp Vụ & Quy Tắc Ánh Xạ |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | NO | Auto | PRIMARY KEY | Khóa chính tự tăng. |
| `product_sku` | `VARCHAR(50)` | NO | Không | FK, NOT NULL | Mã sản phẩm được dự báo (`FR-012`, `UC-007`). |
| `forecast_date` | `DATE` | NO | `CURRENT_DATE` | NOT NULL | Ngày thực thi chạy mô hình dự báo. |
| `horizon_days` | `INTEGER` | NO | `14` | `CHECK (horizon_days IN (7, 14, 30))` | Khung thời gian kế hoạch dự báo ($T \in \{7, 14, 30\}$ ngày) (`FR-013`, `BR-008`). |
| `forecasted_demand`| `INTEGER` | NO | Không | `CHECK (forecasted_demand >= 0)` | Tổng lượng cầu dự báo chu kỳ: $\lceil \sum_{t=1}^T \max(0, \hat{y}_t) \rceil$ (`BR-008`). |
| `daily_avg_demand` | `DECIMAL(10,2)`| NO | Không | `CHECK (daily_avg_demand >= 0)` | Nhu cầu trung bình ngày: $D_{avg} = \text{forecasted\_demand} / T$ (`BR-008`). |
| `wape` | `DECIMAL(5,2)` | YES | NULL | `CHECK (wape >= 0)` | Chỉ số sai số WAPE (%). Nếu $\text{WAPE} > 40\%$, tự động kích hoạt Fallback SMA-7 (`BR-007`). |
| `mae` | `DECIMAL(10,2)`| YES | NULL | `CHECK (mae >= 0)` | Sai số tuyệt đối trung bình MAE (chiếc) dùng vẽ dải mây tin cậy (`BR-007`, `UC-007`). |
| `algorithm_used` | `AlgorithmType`| NO | Không | NOT NULL | Thuật toán sinh dự báo: `AI_MODEL`, `FALLBACK_SMA7`, `BASIC_SMA7`, `COLD_START_ESTIMATE`. |
| `is_fallback` | `BOOLEAN` | NO | `FALSE` | NOT NULL | Cờ đánh dấu dự báo có phải kết quả Fallback do AI sai số lớn không (`BR-007`). |
| `forecast_points` | `JSONB` | NO | Không | NOT NULL | Mảng chuỗi điểm dự báo chi tiết theo ngày kèm dải tin cậy (Xem cấu trúc JSON bên dưới). |
| `created_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | NOT NULL | Thời điểm hoàn tất tính toán dự báo. |

> **Cấu trúc JSONB trường `forecast_points`:**
> ```json
> [
>   {
>     "date": "2026-09-05",
>     "predicted": 12,
>     "lower_bound": 8,
>     "upper_bound": 16
>   },
>   {
>     "date": "2026-09-06",
>     "predicted": 15,
>     "lower_bound": 11,
>     "upper_bound": 19
>   }
> ]
> ```

---

#### 10. Bảng `abc_xyz_analysis` (Phân Loại Ma Trận ABC - XYZ)
* **Mô tả nghiệp vụ:** Lưu kết quả phân loại sản phẩm định kỳ dựa trên quy luật Pareto (Doanh thu đóng góp A/B/C) và mức độ ổn định nhu cầu (Hệ số biến thiên $CV$ tương ứng X/Y/Z) trong 30 ngày gần nhất (`BR-009`, `BR-010`, `BR-011`, `FR-009`, `UC-005`).
* **Khóa chính (PK):** `id`
* **Khóa ngoại (FK):** `product_sku` $\rightarrow$ `products.sku` (ON DELETE CASCADE)
* **Ràng buộc duy nhất:** `UNIQUE (product_sku, analysis_date)`

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc (Constraints) | Mô Tả Nghiệp Vụ & Quy Tắc Ánh Xạ |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | NO | Auto | PRIMARY KEY | Khóa chính tự tăng. |
| `product_sku` | `VARCHAR(50)` | NO | Không | FK, NOT NULL | Mã sản phẩm được phân loại ma trận. |
| `analysis_date` | `DATE` | NO | `CURRENT_DATE` | NOT NULL | Ngày thực hiện chạy phân tích. |
| `window_days` | `INTEGER` | NO | `30` | `CHECK (window_days = 30)` | Cửa sổ dữ liệu đánh giá (cố định 30 ngày gần nhất theo `DEC-009`). |
| `total_revenue` | `DECIMAL(15,2)`| NO | Không | `CHECK (total_revenue >= 0)` | Tổng doanh thu tiêu thụ 30 ngày: $\sum (\text{Quantity} \times \text{Selling Price})$. |
| `revenue_pct` | `DECIMAL(5,2)` | NO | Không | `CHECK (revenue_pct >= 0 AND revenue_pct <= 100)` | Tỷ trọng % doanh thu của SKU so với tổng doanh thu toàn cửa hàng. |
| `cumulative_revenue_pct`| `DECIMAL(5,2)`| NO | Không | `CHECK (cumulative_revenue_pct >= 0 AND cumulative_revenue_pct <= 100)` | Tỷ lệ phần trăm doanh thu tích lũy sau khi sắp xếp giảm dần (`BR-009`). |
| `abc_class` | `ABCClass` | NO | Không | NOT NULL | Nhóm ABC: `A` ($\le 80\%$), `B` ($80-95\%$), `C` ($> 95\%$) (`BR-009`). |
| `daily_sales_mean`| `DECIMAL(10,2)`| NO | Không | `CHECK (daily_sales_mean >= 0)` | Lượng bán trung bình ngày $\mu_d$ trong 30 ngày (`BR-010`). |
| `daily_sales_std_dev`| `DECIMAL(10,2)`| NO | Không | `CHECK (daily_sales_std_dev >= 0)` | Độ lệch chuẩn lượng bán ngày $\sigma_d$ trong 30 ngày (`BR-003`, `BR-010`). |
| `coefficient_of_variation`| `DECIMAL(7,3)`| NO | Không | `CHECK (coefficient_of_variation >= 0)` | Hệ số biến thiên $CV = \sigma_d / \mu_d$ (`BR-010`). |
| `xyz_class` | `XYZClass` | NO | Không | NOT NULL | Nhóm XYZ: `X` ($CV \le 0.5$), `Y` ($0.5 < CV \le 1.0$), `Z` ($CV > 1.0$) (`BR-010`). |
| `abc_xyz_segment` | `ABCXYZSegment`| NO | Không | NOT NULL | Nhóm kết hợp ma trận 9 ô: `AX`, `AY`, `AZ`, `BX`, `BY`, `BZ`, `CX`, `CY`, `CZ` (`BR-011`). |
| `created_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | NOT NULL | Thời điểm lưu bản ghi phân tích. |

---

### DOMAIN 4: PROCUREMENT & EVALUATION (MUA HÀNG & ĐÁNH GIÁ NCC)

#### 11. Bảng `supplier_evaluation_weights` (Cấu Hình Trọng Số Đánh Giá NCC)
* **Mô tả nghiệp vụ:** Lưu trữ bộ 4 trọng số tiêu chí đánh giá hiệu suất nhà cung cấp do Admin quản trị. Toàn hệ thống chỉ duy trì 1 bản ghi cấu hình hiện hành (`id = 1`) và áp dụng ràng buộc tổng bằng đúng 100% (`FR-034`, `BR-013`, `UC-017`).
* **Khóa chính (PK):** `id`
* **Khóa ngoại (FK):** `updated_by` $\rightarrow$ `users.id`

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc (Constraints) | Mô Tả Nghiệp Vụ & Quy Tắc Ánh Xạ |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | `INTEGER` | NO | `1` | PRIMARY KEY, `CHECK (id = 1)` | Khóa chính đơn cố định đảm bảo mô hình Single Configuration Record. |
| `weight_otif` | `DECIMAL(5,2)` | NO | `35.00` | `CHECK (weight_otif >= 0)` | Trọng số tiêu chí Giao đúng hạn & đủ lượng $w_{otif}$ (Mặc định 35%). |
| `weight_quality`| `DECIMAL(5,2)` | NO | `30.00` | `CHECK (weight_quality >= 0)` | Trọng số tiêu chí Chất lượng hàng hóa $w_{quality}$ (Mặc định 30%). |
| `weight_price` | `DECIMAL(5,2)` | NO | `20.00` | `CHECK (weight_price >= 0)` | Trọng số tiêu chí Đơn giá cạnh tranh $w_{price}$ (Mặc định 20%). |
| `weight_leadtime`| `DECIMAL(5,2)`| NO | `15.00` | `CHECK (weight_leadtime >= 0)` | Trọng số tiêu chí Tốc độ giao hàng $w_{leadtime}$ (Mặc định 15%). |
| `updated_by` | `UUID` | YES | NULL | FK | Quản trị viên (`System Admin`) thực hiện điều chỉnh cấu hình. |
| `updated_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | NOT NULL | Thời điểm lưu cấu hình gần nhất. |

> **Ràng buộc kiểm tra bắt buộc (Table Check Constraint):**
> `CONSTRAINT check_sum_100 CHECK ((weight_otif + weight_quality + weight_price + weight_leadtime) = 100.00)`

---

#### 12. Bảng `supplier_evaluations` (Đánh Giá & Xếp Hạng Hiệu Suất NCC)
* **Mô tả nghiệp vụ:** Lưu kết quả chấm điểm hiệu suất của từng nhà cung cấp trên 10 lần giao hàng gần nhất theo 4 tiêu chí chuẩn hóa và điểm tổng hợp $Score_{NCC}$ (`FR-019`, `FR-020`, `BR-012`, `BR-013`, `UC-009`).
* **Khóa chính (PK):** `id`
* **Khóa ngoại (FK):** `supplier_id` $\rightarrow$ `suppliers.id` (ON DELETE CASCADE)
* **Ràng buộc duy nhất:** `UNIQUE (supplier_id, evaluation_date)`

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc (Constraints) | Mô Tả Nghiệp Vụ & Quy Tắc Ánh Xạ |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | NO | Auto | PRIMARY KEY | Khóa chính tự tăng. |
| `supplier_id` | `BIGINT` | NO | Không | FK, NOT NULL | Khóa định danh nhà cung cấp được chấm điểm. |
| `evaluation_date`| `DATE` | NO | `CURRENT_DATE` | NOT NULL | Ngày thực hiện chấm điểm và xếp hạng. |
| `delivery_count_analyzed`| `INTEGER`| NO | `0` | `CHECK (delivery_count_analyzed >= 0)` | Số lượng đợt giao hàng thực tế đưa vào tính toán (tối đa 10 đợt gần nhất theo `DEC-014`). |
| `price_score` | `DECIMAL(5,2)` | NO | Không | `CHECK (price_score >= 0 AND price_score <= 100)` | Điểm đơn giá: $S_{price} = (P_{min} / P_{supplier}) \times 100$ (`BR-012`). |
| `otif_score` | `DECIMAL(5,2)` | NO | Không | `CHECK (otif_score >= 0 AND otif_score <= 100)` | Điểm đúng hạn & đủ lượng: $S_{otif} = (\sum \text{OTIF}_k / N) \times 100$ (`BR-012`). |
| `quality_score`| `DECIMAL(5,2)` | NO | Không | `CHECK (quality_score >= 0 AND quality_score <= 100)` | Điểm chất lượng: $S_{quality} = (1 - \sum Q_{defective} / \sum Q_{delivered}) \times 100$ (`BR-012`). |
| `lead_time_score`| `DECIMAL(5,2)`| NO | Không | `CHECK (lead_time_score >= 0 AND lead_time_score <= 100)`| Điểm tốc độ giao: $S_{leadtime} = (LT_{min} / LT_{supplier}) \times 100$ (`BR-012`). |
| `total_score` | `DECIMAL(5,2)` | NO | Không | `CHECK (total_score >= 0 AND total_score <= 100)` | Điểm hiệu suất tổng hợp $Score_{NCC} = \sum (w_i \times S_i)$ (`BR-013`). |
| `rank` | `INTEGER` | YES | NULL | `CHECK (rank >= 1)` | Thứ hạng của nhà cung cấp trong toàn bộ danh mục đối tác. |
| `is_new_supplier`| `BOOLEAN` | NO | `FALSE` | NOT NULL | Cờ đánh dấu đối tác mới có dưới 3 lần giao hàng (`DEC-014`). |
| `created_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | NOT NULL | Thời điểm tính toán điểm. |

---

#### 13. Bảng `purchase_recommendations` (Khuyến Nghị Mua Hàng Thông Minh)
* **Mô tả nghiệp vụ:** Lưu trữ các đề xuất mua hàng do hệ thống DSS tự động tính toán cho các sản phẩm chạm ngưỡng cần đặt ($\text{IP} \le \text{ROP}$), bao gồm số lượng đề xuất $Q_{suggested}$ đã tính MOQ/Pack Size, đối tác tối ưu và lý giải minh bạch Explainable Insights (`FR-021` $\rightarrow$ `FR-025`, `BR-014`, `BR-015`, `BR-016`, `UC-010`).
* **Khóa chính (PK):** `id`
* **Khóa ngoại (FK):**
  * `product_sku` $\rightarrow$ `products.sku` (ON DELETE CASCADE)
  * `recommended_supplier_id` $\rightarrow$ `suppliers.id` (ON DELETE SET NULL)

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc (Constraints) | Mô Tả Nghiệp Vụ & Quy Tắc Ánh Xạ |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | NO | Auto | PRIMARY KEY | Khóa chính tự tăng. |
| `product_sku` | `VARCHAR(50)` | NO | Không | FK, NOT NULL | Mã SKU sản phẩm được khuyến nghị mua. |
| `recommended_supplier_id`| `BIGINT`| YES | NULL | FK | Nhà cung cấp tối ưu nhất do hệ thống gợi ý theo $Score_{NCC}$ (NULL nếu `NO_SUPPLIER`) (`BR-016`, `BR-022`). |
| `horizon_days` | `INTEGER` | NO | `14` | `CHECK (horizon_days IN (7, 14, 30))` | Khung thời gian kế hoạch dự báo áp dụng để sinh đề xuất. |
| `on_hand_at_eval`| `INTEGER` | NO | Không | NOT NULL | Số lượng tồn kho $\text{On-Hand}$ tại thời điểm tính toán. |
| `on_order_at_eval`| `INTEGER`| NO | Không | NOT NULL | Số lượng hàng chờ về $\text{On-Order}$ tại thời điểm tính toán. |
| `forecasted_demand`| `INTEGER` | NO | Không | NOT NULL | Lượng cầu dự báo chu kỳ tới ($\text{Forecasted Demand}_T$). |
| `safety_stock` | `INTEGER` | NO | Không | NOT NULL | Mức tồn an toàn áp dụng tại thời điểm đánh giá. |
| `raw_shortage` | `INTEGER` | NO | Không | NOT NULL | Lượng thiếu hụt thô: $Q_{raw} = \text{Demand} + \text{SS} - (\text{On-Hand} + \text{On-Order})$ (`BR-014`). |
| `suggested_quantity`| `INTEGER` | NO | Không | `CHECK (suggested_quantity >= 0)` | Lượng mua đề xuất đã làm tròn theo MOQ và Pack Size: $Q_{suggested}$ (`BR-014`). |
| `suggested_order_date`| `DATE` | NO | Không | NOT NULL | Ngày đặt hàng tối ưu (Hôm nay nếu $\text{IP} \le \text{ROP}$) (`BR-015`). |
| `estimated_unit_price`| `DECIMAL(15,2)`| YES| NULL | `CHECK (estimated_unit_price > 0)` | Đơn giá mua dự kiến từ nhà cung cấp được gợi ý. |
| `estimated_total_cost`| `DECIMAL(15,2)`| YES| NULL | `CHECK (estimated_total_cost >= 0)`| Tổng chi phí dự kiến: $= Q_{suggested} \times \text{estimated\_unit\_price}$. |
| `urgency_level` | `RiskLevel` | NO | Không | NOT NULL | Mức độ khẩn cấp (`OUT_OF_STOCK`, `CRITICAL`, `WARNING`). |
| `explanation_summary`| `TEXT` | NO | Không | NOT NULL | Đoạn văn tự nhiên tóm tắt lý do gợi ý phục vụ người dùng đọc nhanh (`BR-016`, `NFR-005`). |
| `explanation_factors`| `JSONB` | NO | Không | NOT NULL | Chi tiết các yếu tố định lượng phục vụ hiển thị thẻ giải thích (Xem JSON Schema bên dưới). |
| `status` | `RecommendationStatus`| NO | `'PENDING'` | NOT NULL | Trạng thái khuyến nghị: `PENDING` (chờ xử lý), `ORDERED` (đã tạo đơn PO), `DISMISSED` (bỏ qua). |
| `created_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | NOT NULL | Thời điểm sinh khuyến nghị mua. |

> **Cấu trúc JSONB trường `explanation_factors`:**
> ```json
> {
>   "days_of_supply": 2.1,
>   "inventory_position": 14,
>   "reorder_point": 35,
>   "safety_stock": 10,
>   "forecasted_demand": 45,
>   "on_order": 0,
>   "raw_shortage": 41,
>   "moq_applied": 24,
>   "pack_size_applied": 12,
>   "supplier_score": 92.5,
>   "supplier_otif": 98.0,
>   "supplier_lead_time": 2,
>   "reason_text": "Tồn kho chỉ còn đủ bán trong 2.1 ngày, thấp hơn ROP (35). Đã làm tròn lên 48 chiếc (4 thùng) theo quy cách đóng gói của NCC."
> }
> ```

---

#### 14. Bảng `purchase_orders` (Đơn Mua Hàng Master)
* **Mô tả nghiệp vụ:** Lưu trữ thông tin chung của Đơn mua hàng (PO), quản lý vòng đời đơn theo máy trạng thái 4 cấp nghiêm ngặt (`FR-026` $\rightarrow$ `FR-030`, `BR-017`, `BR-024`, `BR-025`, `UC-012`, `UC-013`).
* **Khóa chính (PK):** `id`
* **Khóa ngoại (FK):**
  * `supplier_id` $\rightarrow$ `suppliers.id` (ON DELETE RESTRICT)
  * `created_by` $\rightarrow$ `users.id`
  * `confirmed_by` $\rightarrow$ `users.id`
  * `cancelled_by` $\rightarrow$ `users.id`
* **Ràng buộc duy nhất:** `UNIQUE (po_code)`

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc (Constraints) | Mô Tả Nghiệp Vụ & Quy Tắc Ánh Xạ |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | NO | Auto | PRIMARY KEY | Khóa chính tự tăng. |
| `po_code` | `VARCHAR(50)` | NO | Không | UNIQUE, NOT NULL | Mã đơn mua sinh tự động theo quy tắc: `PO-YYYYMMDD-XXXX` (`BR-024`). |
| `supplier_id` | `BIGINT` | NO | Không | FK, NOT NULL | Nhà cung cấp được lựa chọn để đặt hàng (`suppliers.id`). |
| `status` | `POStatus` | NO | `'DRAFT'` | NOT NULL | Máy trạng thái: `DRAFT` $\rightarrow$ `ORDERED` $\rightarrow$ `RECEIVED` / `CANCELLED` (`BR-017`). |
| `order_date` | `DATE` | NO | `CURRENT_DATE` | NOT NULL | Ngày lập hoặc ngày chính thức chốt đặt hàng (`UC-012`). |
| `promised_delivery_date`| `DATE` | NO | Không | NOT NULL | Ngày hẹn giao hàng cam kết: Mặc định $= \text{Order Date} + LT_{supplier}$ (`BR-026`). |
| `actual_delivery_date`| `DATE` | YES | NULL | Không | Ngày đối tác thực tế giao hàng đến cửa hàng (cập nhật khi `RECEIVED`). |
| `total_amount` | `DECIMAL(15,2)`| NO | `0.00` | `CHECK (total_amount >= 0)` | Tổng giá trị đơn mua hàng (bằng tổng thành tiền các dòng chi tiết). |
| `notes` | `TEXT` | YES | NULL | Không | Ghi chú dặn dò đối tác (giao giờ hành chính, gọi trước khi giao...). |
| `created_by` | `UUID` | NO | Không | FK, NOT NULL | Nhân viên mua hàng tạo đơn nháp (`users.id`). |
| `confirmed_by` | `UUID` | YES | NULL | FK | Nhân viên xác nhận chốt đơn chuyển sang `ORDERED` (`UC-012`). |
| `confirmed_at` | `TIMESTAMPTZ` | YES | NULL | Không | Thời điểm xác nhận chốt đơn (thời điểm tăng $\text{On-Order}$). |
| `cancelled_by` | `UUID` | YES | NULL | FK | Người dùng thực hiện thao tác hủy đơn (`UC-013`). |
| `cancelled_at` | `TIMESTAMPTZ` | YES | NULL | Không | Thời điểm hủy đơn. |
| `cancellation_reason`| `TEXT` | YES | NULL | Không | Lý do hủy đơn đặt hàng. |
| `created_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | NOT NULL | Thời điểm khởi tạo bản ghi. |
| `updated_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | NOT NULL | Thời điểm cập nhật trạng thái gần nhất. |

---

#### 15. Bảng `purchase_order_items` (Chi Tiết Mặt Hàng Trong Đơn PO)
* **Mô tả nghiệp vụ:** Lưu trữ chi tiết từng dòng hàng trong đơn mua, số lượng đặt, đơn giá thỏa thuận, và số lượng thực nhận khi nghiệm thu (`UC-012`, `UC-014`).
* **Khóa chính (PK):** `id`
* **Khóa ngoại (FK):**
  * `order_id` $\rightarrow$ `purchase_orders.id` (ON DELETE CASCADE)
  * `product_sku` $\rightarrow$ `products.sku` (ON DELETE RESTRICT)
* **Ràng buộc duy nhất:** `UNIQUE (order_id, product_sku)` (Không đặt trùng sản phẩm trong 1 đơn)

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc (Constraints) | Mô Tả Nghiệp Vụ & Quy Tắc Ánh Xạ |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | NO | Auto | PRIMARY KEY | Khóa chính tự tăng. |
| `order_id` | `BIGINT` | NO | Không | FK, NOT NULL | Liên kết đến đơn mua hàng Master (`purchase_orders.id`). |
| `product_sku` | `VARCHAR(50)` | NO | Không | FK, NOT NULL | Mã sản phẩm được đặt mua (`products.sku`). |
| `ordered_quantity` | `INTEGER` | NO | Không | `CHECK (ordered_quantity > 0)` | Số lượng đặt mua chính thức ($Q_{ordered}$) (`FR-027`, `UC-012`). |
| `unit_price` | `DECIMAL(15,2)`| NO | Không | `CHECK (unit_price > 0)` | Đơn giá mua thỏa thuận cho mỗi đơn vị sản phẩm. |
| `total_price` | `DECIMAL(15,2)`| NO | Không | `CHECK (total_price > 0)` | Thành tiền dòng: $= \text{ordered\_quantity} \times \text{unit\_price}$. |
| `delivered_quantity`| `INTEGER` | YES | `0` | `CHECK (delivered_quantity >= 0)` | Số lượng đối tác thực tế giao đến ($Q_{delivered}$) ghi nhận tại `UC-014`. |
| `defective_quantity`| `INTEGER` | YES | `0` | `CHECK (defective_quantity >= 0)` | Số lượng hàng lỗi, hỏng, méo vỡ bị từ chối ($Q_{defective}$) (`BR-018`). |
| `accepted_quantity` | `INTEGER` | YES | `0` | `CHECK (accepted_quantity >= 0)` | Số lượng hàng đạt chuẩn thực tế nhập kho: $Q_{accepted} = Q_{delivered} - Q_{defective}$ (`BR-018`). |
| `created_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | NOT NULL | Thời điểm thêm dòng hàng vào đơn. |

> **Ràng buộc kiểm tra số lượng nhận hàng hợp lệ:**
> `CONSTRAINT check_defect_not_exceed_delivered CHECK (defective_quantity <= delivered_quantity)`

---

#### 16. Bảng `delivery_history` (Nhật Ký Nhận Hàng & Đánh Giá OTIF)
* **Mô tả nghiệp vụ:** Lưu vết chi tiết từng lần đối tác giao hàng thực tế tới cửa hàng, làm căn cứ nguồn dữ liệu bất biến để tính toán 4 điểm hiệu suất nhà cung cấp ($S_{price}, S_{otif}, S_{quality}, S_{leadtime}$) theo `BR-012`, `BR-019`, `UC-014`.
* **Khóa chính (PK):** `id`
* **Khóa ngoại (FK):**
  * `order_id` $\rightarrow$ `purchase_orders.id` (ON DELETE RESTRICT)
  * `supplier_id` $\rightarrow$ `suppliers.id` (ON DELETE RESTRICT)
  * `received_by` $\rightarrow$ `users.id`

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc (Constraints) | Mô Tả Nghiệp Vụ & Quy Tắc Ánh Xạ |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | NO | Auto | PRIMARY KEY | Khóa chính tự tăng. |
| `order_id` | `BIGINT` | NO | Không | FK, NOT NULL | Đơn mua hàng được nghiệm thu nhận hàng (`purchase_orders.id`). |
| `supplier_id` | `BIGINT` | NO | Không | FK, NOT NULL | Nhà cung cấp thực hiện giao hàng (`suppliers.id`). |
| `promised_date` | `DATE` | NO | Không | NOT NULL | Ngày hẹn giao cam kết ban đầu trong đơn hàng (`BR-026`). |
| `actual_delivery_date`| `DATE` | NO | `CURRENT_DATE` | NOT NULL | Ngày thực tế nhận hàng tại cửa hàng (`UC-014`). |
| `total_ordered_quantity`| `INTEGER`| NO | Không | `CHECK (total_ordered_quantity > 0)` | Tổng số lượng sản phẩm đặt mua trong đơn. |
| `total_delivered_quantity`| `INTEGER`| NO | Không | `CHECK (total_delivered_quantity >= 0)`| Tổng số lượng sản phẩm thực tế nhà cung cấp mang đến ($Q_{delivered}$). |
| `total_defective_quantity`| `INTEGER`| NO | `0` | `CHECK (total_defective_quantity >= 0)`| Tổng số lượng sản phẩm bị lỗi hỏng, vỡ, cận hạn sử dụng ($Q_{defective}$). |
| `total_accepted_quantity` | `INTEGER`| NO | Không | `CHECK (total_accepted_quantity >= 0)` | Tổng số lượng thực nhập kho: $= \text{delivered} - \text{defective}$ (`BR-018`). |
| `lead_time_days` | `INTEGER` | NO | Không | `CHECK (lead_time_days >= 0)` | Thời gian giao hàng thực tế: $= \text{actual\_delivery\_date} - \text{order\_date}$. |
| `is_on_time` | `BOOLEAN` | NO | Không | NOT NULL | Cờ đúng hạn: $= (\text{actual\_delivery\_date} \le \text{promised\_date})$ (`BR-012`). |
| `is_in_full` | `BOOLEAN` | NO | Không | NOT NULL | Cờ đủ số lượng: $= (\text{total\_delivered\_quantity} \ge \text{total\_ordered\_quantity})$ (`BR-012`). |
| `is_otif` | `BOOLEAN` | NO | Không | NOT NULL | Cờ đạt chuẩn OTIF: $= (\text{is\_on\_time} \land \text{is\_in\_full})$ (`BR-012`, `BR-019`). |
| `notes` | `TEXT` | YES | NULL | Không | Biên bản nhận hàng / ghi chú tình trạng kiện hàng. |
| `received_by` | `UUID` | NO | Không | FK, NOT NULL | Nhân viên mua hàng thực hiện kiểm đếm và nhận hàng (`users.id`). |
| `received_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | NOT NULL | Thời điểm hoàn tất giao dịch nhận hàng. |

---

### DOMAIN 5: SECURITY & AUDIT (BẢO MẬT & KIỂM TOÁN HỆ THỐNG)

#### 17. Bảng `users` (Tài Khoản Người Dùng & Phân Quyền)
* **Mô tả nghiệp vụ:** Lưu trữ thông tin tài khoản đăng nhập, mật khẩu băm bảo mật và vai trò của người dùng theo mô hình kiểm soát truy cập dựa trên vai trò RBAC (`FR-031`, `FR-032`, `FR-033`, `NFR-009`, `UC-015`, `UC-016`).
* **Khóa chính (PK):** `id`
* **Khóa ngoại (FK):** Không có.
* **Ràng buộc duy nhất:** `UNIQUE (username)`, `UNIQUE (email)`

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc (Constraints) | Mô Tả Nghiệp Vụ & Quy Tắc Ánh Xạ |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | PRIMARY KEY | Định danh duy nhất của người dùng. |
| `username` | `VARCHAR(50)` | NO | Không | UNIQUE, NOT NULL | Tên đăng nhập tài khoản (chữ cái, số, không dấu). |
| `password_hash` | `VARCHAR(255)`| NO | Không | NOT NULL | Mật khẩu được băm an toàn 1 chiều bằng thuật toán bcrypt (`NFR-009`). |
| `full_name` | `VARCHAR(100)`| NO | Không | NOT NULL | Họ và tên hiển thị của người dùng. |
| `email` | `VARCHAR(100)`| NO | Không | UNIQUE, NOT NULL | Địa chỉ email để khôi phục mật khẩu hoặc nhận thông báo. |
| `role` | `UserRole` | NO | `'STAFF'` | NOT NULL | Vai trò truy cập: `ADMIN` (toàn quyền) hoặc `STAFF` (nghiệp vụ mua hàng) (`FR-033`). |
| `is_active` | `BOOLEAN` | NO | `TRUE` | NOT NULL | Trạng thái tài khoản: Nếu `FALSE`, khóa đăng nhập và thu hồi phiên (`UC-016`). |
| `must_change_password`| `BOOLEAN` | NO | `TRUE` | NOT NULL | Cờ bắt buộc đổi mật khẩu trong lần đăng nhập đầu tiên sau khi tạo mới / reset. |
| `last_login_at` | `TIMESTAMPTZ` | YES | NULL | Không | Thời điểm đăng nhập thành công gần nhất (`UC-015`). |
| `created_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | NOT NULL | Thời điểm tạo tài khoản. |
| `updated_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | NOT NULL | Thời điểm cập nhật thông tin tài khoản. |

---

#### 18. Bảng `audit_logs` (Nhật Ký Kiểm Toán Thao Tác Hệ Thống)
* **Mô tả nghiệp vụ:** Lưu vết toàn bộ các hành vi quản trị nhạy cảm hoặc can thiệp dữ liệu quan trọng phục vụ đối soát an ninh (`NFR-010`, `UC-016`, `UC-017`).
* **Khóa chính (PK):** `id`
* **Khóa ngoại (FK):** `user_id` $\rightarrow$ `users.id` (ON DELETE SET NULL)

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc (Constraints) | Mô Tả Nghiệp Vụ & Quy Tắc Ánh Xạ |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | NO | Auto | PRIMARY KEY | Khóa chính tự tăng. |
| `user_id` | `UUID` | YES | NULL | FK | Người dùng thực hiện thao tác (NULL nếu do hệ thống chạy ngầm). |
| `action` | `VARCHAR(100)`| NO | Không | NOT NULL | Hành động: `USER_CREATE`, `USER_LOCK`, `WEIGHTS_UPDATE`, `PO_CANCEL`, `PRODUCT_DEACTIVATE`... |
| `entity_name` | `VARCHAR(50)` | NO | Không | NOT NULL | Tên bảng dữ liệu bị tác động (ví dụ: `supplier_evaluation_weights`, `users`). |
| `entity_id` | `VARCHAR(100)`| YES | NULL | Không | Khóa định danh của bản ghi bị tác động. |
| `old_values` | `JSONB` | YES | NULL | Không | Snapshot trạng thái dữ liệu trước khi chỉnh sửa. |
| `new_values` | `JSONB` | YES | NULL | Không | Snapshot trạng thái dữ liệu mới sau khi chỉnh sửa. |
| `ip_address` | `VARCHAR(45)` | YES | NULL | Không | Địa chỉ IP máy trạm của người dùng. |
| `created_at` | `TIMESTAMPTZ` | NO | `CURRENT_TIMESTAMP` | NOT NULL | Thời điểm phát sinh hành vi kiểm toán. |

---

## 3. Tổng Hợp Ràng Buộc Nghiệp Vụ Nâng Cao (Cross-Table Integrity Constraints)

1. **Ràng buộc Tính Hợp Lệ Của Tồn Kho Khi Cập Nhật (`BR-001`, `BR-018`):**
   * $\text{On-Hand}$ và $\text{On-Order}$ không bao giờ được nhận giá trị âm (`CHECK >= 0`).
   * Khi hủy đơn mua hàng (`UC-013`), lượng $\text{On-Order}$ chỉ giảm đúng bằng số lượng sản phẩm của đơn hàng đó.
2. **Ràng buộc Tính Toàn Vẹn Số Lượng Nhận Hàng (`BR-018`):**
   * Số lượng hàng lỗi không được phép vượt quá số lượng hàng thực giao: $Q_{defective} \le Q_{delivered}$.
   * Số lượng hàng thực nhập kho đạt chuẩn được xác định bằng công thức tất định: $Q_{accepted} = Q_{delivered} - Q_{defective}$.
3. **Ràng buộc Bộ Trọng Số Đánh Giá NCC (`BR-013`, `UC-017`):**
   * Tổng 4 trọng số thành phần bắt buộc phải bằng chính xác 100%: $w_{otif} + w_{quality} + w_{price} + w_{leadtime} = 100.00$.
4. **Ràng buộc Trạng Thái Bất Biến Của Đơn Hàng Hoàn Tất (`BR-025`):**
   * Các đơn hàng khi đã chuyển sang trạng thái `RECEIVED` hoặc `CANCELLED` là trạng thái kết thúc (Terminal States), không thể bị xóa hoặc sửa đổi dữ liệu dòng hàng.
