# Use Case Specification: UC-006 - Xem Chi Tiết Phân Tích Sản Phẩm (Product 360°)

---

## 1. Basic Information

* **Use Case ID:** `UC-006`
* **Use Case Name:** Xem chi tiết phân tích sản phẩm (Product 360° View & Deep Dive Analysis)
* **Primary Actor:** `Purchasing Staff`
* **Supporting Actor:** `System Admin` (Truy cập xem và giám sát - Read-only)
* **Goal:** Người dùng muốn xem bức tranh toàn cảnh 360 độ về một sản phẩm (SKU) cụ thể, bao gồm: Thông tin định danh, Tình trạng tồn kho thời gian thực ($\text{On-Hand}, \text{On-Order}, \text{IP}, \text{SS}, \text{ROP}, \text{DoS}$), Phân loại chiến lược ABC-XYZ, Biểu đồ xu hướng bán hàng lịch sử kết hợp đường dự báo AI chu kỳ tới, và Bảng so sánh các nhà cung cấp đang phân phối, từ đó đưa ra quyết định mua hàng chính xác nhất.
* **Trigger:** Người dùng click vào tên hoặc mã SKU của một sản phẩm từ bất kỳ màn hình nào trong hệ thống (Dashboard tồn kho `UC-004`, Ma trận ABC-XYZ `UC-005`, Dự báo AI `UC-007`, Khuyến nghị mua hàng `UC-010`, hoặc Lịch sử đơn hàng `UC-013`).

---

## 2. Preconditions

1. Người dùng (`Purchasing Staff` hoặc `System Admin`) đã đăng nhập thành công vào hệ thống.
2. Sản phẩm được chọn tồn tại trong cơ sở dữ liệu hệ thống.

---

## 3. Postconditions

### 3.1. Thành công (Success End Condition):
* Hệ thống hiển thị giao diện Chi tiết sản phẩm 360° gồm 4 khối thông tin chuyên sâu:
  1. **Khối 1 (Tổng quan & Tồn kho):** Thông tin SKU, Tên, ĐVT, Ngành hàng, Giá vốn, $\text{On-Hand}, \text{On-Order}, \text{IP}, \text{SS}, \text{ROP}, \text{DoS}$, Thanh đo mức tồn kho trực quan và Nhãn rủi ro hiện tại.
  2. **Khối 2 (Phân loại Chiến lược):** Nhóm ABC (Doanh thu), Nhóm XYZ ($CV$), Nhóm kết hợp (ví dụ: `AX`) kèm hướng dẫn chiến lược quản trị tồn kho.
  3. **Khối 3 (Biểu đồ Lịch sử & Dự báo AI):** Biểu đồ kết hợp chuỗi thời gian bán hàng quá khứ (30 ngày) và đường dự báo tương lai (7, 14 hoặc 30 ngày tới), chỉ số sai số WAPE/MAE và cờ trạng thái thuật toán.
  4. **Khối 4 (Bảng so sánh Nhà cung cấp):** Bảng so sánh toàn bộ các đối tác đang phân phối SKU này (Đơn giá $P_{supplier}$, MOQ, Pack Size, Lead time $LT_{supplier}$, Điểm $Score_{NCC}$, nhãn gợi ý NCC tối ưu và nút *"Đặt từ NCC này"* tại từng dòng).
* Nếu sản phẩm đang hoạt động (`IsActive = true`): Hiển thị nút "Đặt hàng ngay (Tối ưu)" và các nút đặt hàng theo từng NCC.
* Nếu sản phẩm đã vô hiệu hóa (`IsActive = false`): Hiển thị ở chế độ lưu trữ (Archived View) kèm banner thông báo *"Sản phẩm đã ngừng kinh doanh"* và ẩn toàn bộ nút đặt hàng.

### 3.2. Thất bại (Failure End Condition):
* Sản phẩm không tồn tại; hệ thống hiển thị thông báo lỗi và nút quay lại danh sách.

---

## 4. Main Success Flow (Xem chi tiết phân tích sản phẩm 360°)

| Step | Actor (Purchasing Staff / Admin) | System |
| :---: | :--- | :--- |
| **1** | Click vào mã SKU hoặc tên sản phẩm từ danh sách bất kỳ. | Tiếp nhận yêu cầu xem chi tiết cho mã SKU đã chọn. |
| **2** | | Thực hiện truy vấn và tính toán đồng thời các nguồn dữ liệu của SKU:<br>1. Truy vấn Master Data sản phẩm (`UC-001`).<br>2. Tính toán các chỉ số tồn kho thời gian thực: $\text{IP}, \text{SS}_{final}, \text{ROP}, \text{DoS}$, Trạng thái rủi ro (`BR-001` $\rightarrow$ `BR-005`).<br>3. Truy vấn phân loại ABC-XYZ và hệ số $CV$ (`BR-009` $\rightarrow$ `BR-011`).<br>4. Lấy chuỗi dữ liệu bán hàng 30 ngày và kết quả dự báo AI mới nhất (7, 14, 30 ngày) kèm WAPE/MAE (`BR-006` $\rightarrow$ `BR-008`).<br>5. Truy vấn danh sách nhà cung cấp phân phối SKU này, tính điểm $Score_{NCC}$ và xác định NCC tối ưu (`BR-012`, `BR-016`). |
| **3** | | Hiển thị màn hình "Chi tiết sản phẩm 360°" với bố cục khoa học gồm 4 khối thông tin (Tồn kho, Phân loại ABC-XYZ, Biểu đồ Dự báo AI, Bảng so sánh Nhà cung cấp) và nút hành động "Đặt hàng ngay". |
| **4** | Đánh giá toàn diện các góc nhìn dữ liệu của sản phẩm. | |

---

## 5. Alternative Flows

### A1. Thay đổi khung thời gian dự báo trên biểu đồ
* **A1.1.** Tại Khối Biểu đồ Dự báo AI, người dùng chuyển đổi giữa các tab: **7 ngày**, **14 ngày** hoặc **30 ngày tới**.
* **A1.2.** Hệ thống cập nhật lại đường vẽ dự báo tương lai và tổng lượng cầu dự kiến $\text{Forecasted Demand}_T$ tương ứng trên biểu đồ.

### A2. Đặt hàng trực tiếp từ Nhà cung cấp tối ưu (Gợi ý bởi AI)
* **A2.1.** Người dùng nhấn nút **"Đặt hàng ngay (Tối ưu)"** trên góc phải màn hình.
* **A2.2.** Hệ thống chuyển tiếp sang màn hình `UC-012: Lập đơn mua hàng`, tự động điền sẵn SKU này, số lượng đề xuất $Q_{suggested}$ (đã làm tròn theo MOQ/Pack Size) và Nhà cung cấp tối ưu nhất.

### A3. Đặt hàng từ một Nhà cung cấp cụ thể trong Bảng so sánh (Khối 4)
* **A3.1.** Tại Bảng so sánh Nhà cung cấp (Khối 4), người dùng nhấn nút **"Đặt từ NCC này"** tại dòng của nhà cung cấp mong muốn.
* **A3.2.** Hệ thống chuyển tiếp sang `UC-012: Lập đơn mua hàng` với SKU này, số lượng $Q_{suggested}$ được làm tròn theo MOQ/Pack Size của **đúng Nhà cung cấp đã chọn** đó.

### A4. Xem sản phẩm đã ngừng kinh doanh (Archived View)
* **A4.1.** Người dùng mở chi tiết một sản phẩm có `IsActive = false` (từ lịch sử đơn hàng cũ).
* **A4.2.** Hệ thống hiển thị toàn bộ thông số định danh và lịch sử bán hàng quá khứ.
* **A4.3.** Hệ thống hiển thị Banner cảnh báo màu xám: *"Sản phẩm này đã ngừng kinh doanh (Vô hiệu hóa)"* và ẩn toàn bộ nút đặt hàng.

### A5. Quay lại màn hình trước đó
* **A5.1.** Người dùng nhấn nút "Quay lại" (Back button) hoặc click vào thanh điều hướng Breadcrumb.
* **A5.2.** Hệ thống đưa người dùng trở lại đúng vị trí màn hình và bộ lọc danh sách trước đó.

---

## 6. Exception Flows

### E1. Sản phẩm chưa có nhà cung cấp nào phân phối (No Supplier)
* **E1.1.** Tại Bước 2 của Main Flow, hệ thống phát hiện SKU này chưa được gán với bất kỳ nhà cung cấp nào trong `UC-002`.
* **E1.2.** Tại Khối 4 (Nhà cung cấp), hệ thống hiển thị cảnh báo màu vàng `NO_SUPPLIER` (theo `BR-022`) kèm thông báo: *"Sản phẩm chưa có nhà cung cấp phân phối. Vui lòng liên hệ Admin để bổ sung đối tác trước khi tạo đơn mua."*

### E2. Sản phẩm mới ở trạng thái Cold Start (< 14 ngày dữ liệu)
* **E2.1.** Hệ thống phát hiện sản phẩm có $N_{days} < 14$ ngày bán.
* **E2.2.** Tại Khối 3 (Dự báo), hệ thống hiển thị nhãn `COLD_START`, hiển thị số lượng bán kỳ vọng $D_{expected}$ (do nhân viên nhập từ `UC-008`), và giải thích: *"Chưa đủ 14 ngày dữ liệu để chạy mô hình chuỗi thời gian tự động"*.

---

## 7. Business Rules Applied (Quy Tắc Nghiệp Vụ Áp Dụng)

* **BR-001 $\rightarrow$ BR-005 (Chỉ số Tồn kho & Rủi ro):** Tính $\text{IP}, \text{SS}, \text{ROP}, \text{DoS}$ và gán 1 trong 5 cấp độ rủi ro.
* **BR-006 $\rightarrow$ BR-008 (Dự báo AI & Độ tin cậy):** Hiển thị chuỗi thời gian bán hàng, đường dự báo 7/14/30 ngày, chỉ số WAPE, MAE và nhãn trạng thái Fallback SMA-7.
* **BR-009 $\rightarrow$ BR-011 (Phân loại ABC-XYZ):** Hiển thị nhóm Pareto (A/B/C), nhóm biến động (X/Y/Z) và hướng dẫn chiến lược tồn kho.
* **BR-012 $\rightarrow$ BR-013 (Đánh giá NCC):** Tính và so sánh 4 điểm thành phần ($S_{price}, S_{otif}, S_{quality}, S_{leadtime}$) và $Score_{NCC}$ của các đối tác phân phối.
* **BR-014 & BR-016 (Khuyến nghị mua & Chọn NCC tối ưu):** Xác định NCC tối ưu và số lượng đặt mua đề xuất $Q_{suggested}$.
* **BR-021 (Sản phẩm vô hiệu hóa):** Hiển thị ở chế độ lưu trữ (Archived view), ẩn chức năng đặt hàng mới.
* **BR-022 (Sản phẩm chưa có NCC):** Gắn cờ cảnh báo `NO_SUPPLIER`.
* **BR-023 (Hàng tồn bất động):** Hiển thị cảnh báo `DEAD_STOCK` nếu 30 ngày bán $= 0$.

---

## 8. Related Requirements (Yêu Cầu Chức Năng Liên Quan)

* **FR-007:** Hiển thị số lượng tồn kho khả dụng hiện tại.
* **FR-009:** Phân loại sản phẩm theo ma trận kết hợp ABC - XYZ Analysis.
* **FR-012:** Phân tích chuỗi thời gian lịch sử bán hàng theo ngày.
* **FR-014:** Trực quan hóa kết quả dự báo nhu cầu dưới dạng biểu đồ xu hướng.
* **FR-019 & FR-020:** Thông tin đánh giá và xếp hạng hiệu suất nhà cung cấp phân phối.
