# Use Case Specification: UC-009 - Xem Đánh Giá & Xếp Hạng Nhà Cung Cấp

---

## 1. Basic Information

* **Use Case ID:** `UC-009`
* **Use Case Name:** Xem đánh giá & xếp hạng nhà cung cấp (Supplier Performance Evaluation & Ranking)
* **Primary Actor:** `Purchasing Staff`
* **Supporting Actor:** `System Admin` (Truy cập xem và giám sát - Read-only)
* **Goal:** Người dùng muốn tra cứu bảng xếp hạng hiệu suất tổng hợp ($Score_{NCC}$) của toàn bộ các nhà cung cấp, kiểm tra chi tiết 4 điểm thành phần ($S_{price}, S_{otif}, S_{quality}, S_{leadtime}$) tính trên 10 lần giao hàng gần nhất, và xem nhật ký lịch sử các đợt giao hàng thực tế (ngày hẹn, ngày giao, số lượng đặt, số lượng giao, số lượng lỗi) để có cơ sở khách quan khi lựa chọn đối tác đặt mua hàng hoặc đàm phán hợp đồng.
* **Trigger:** Người dùng truy cập màn hình "Đánh giá nhà cung cấp" từ thanh điều hướng chính của hệ thống.

---

## 2. Preconditions

1. Người dùng (`Purchasing Staff` hoặc `System Admin`) đã đăng nhập thành công vào hệ thống.
2. Danh mục nhà cung cấp (`UC-002`) đã tồn tại trên hệ thống và có ít nhất 1 nhà cung cấp đang hoạt động (`IsActive = true`).

---

## 3. Postconditions

### 3.1. Thành công (Success End Condition):
* Hệ thống tính toán và trực quan hóa:
  * **Bảng xếp hạng Hiệu suất Nhà cung cấp:** Sắp xếp theo điểm tổng hợp $Score_{NCC}$ từ cao xuống thấp, hiển thị đầy đủ: Tên NCC, Điểm tổng hợp $Score_{NCC}$, Điểm Đơn giá ($S_{price}$), Điểm Giao đúng hạn & đủ lượng ($S_{otif}$), Điểm Chất lượng ($S_{quality}$), Điểm Tốc độ giao ($S_{leadtime}$), Xếp loại (Xuất sắc, Tốt, Trung bình, Cần cải thiện) và Nhãn `NEW_SUPPLIER` (nếu có).
  * **Biểu đồ So sánh Đa chiều (Radar / Bar Chart):** Trực quan hóa 4 tiêu chí của các nhà cung cấp hàng đầu.
  * **Báo cáo Nhật ký Giao hàng (Delivery History Log):** Bảng chi tiết 10 lần giao hàng gần nhất của từng đối tác (Mã đơn, Ngày hẹn, Ngày thực giao, Đạt OTIF hay không, $Q_{ordered}, Q_{delivered}, Q_{defective}, Q_{accepted}$).
* Người dùng có thể lọc theo nhóm xếp loại hoặc click xem hồ sơ chi tiết của từng đối tác.

### 3.2. Thất bại (Failure End Condition):
* Không thể tải dữ liệu đánh giá do lỗi kết nối cơ sở dữ liệu; hệ thống hiển thị thông báo lỗi và nút "Thử lại".

---

## 4. Main Success Flow (Xem bảng xếp hạng & báo cáo hiệu suất NCC)

| Step | Actor (Purchasing Staff / Admin) | System |
| :---: | :--- | :--- |
| **1** | Truy cập màn hình "Đánh giá & Xếp hạng nhà cung cấp". | Truy vấn danh sách nhà cung cấp đang hoạt động (`IsActive = true`), bảng giá sản phẩm (`UC-002`), bộ trọng số hệ thống (`UC-017`), và dữ liệu lịch sử 10 lần giao gần nhất từ bảng `DeliveryHistory` (`UC-014`). |
| **2** | | Thực hiện tính toán hiệu suất cho từng Nhà cung cấp:<br>1. **Tính 4 điểm thành phần (thang điểm 100) (`BR-012`):**<br>- $S_{price}(i) = \frac{1}{M}\sum_{j=1}^M \frac{P_{min}(j)}{P_{supplier}(i, j)} \times 100$ (Trung bình cộng điểm giá các SKU đối tác phân phối).<br>- $S_{otif} = (\sum_{k=1}^N \text{OTIF}_k / N) \times 100$ (Tính trên $N \le 10$ lần giao gần nhất).<br>- $S_{quality} = (1 - \sum Q_{defective} / \sum Q_{delivered}) \times 100$.<br>- $S_{leadtime}(i) = \frac{1}{M}\sum_{j=1}^M \frac{LT_{min}(j)}{LT_{supplier}(i, j)} \times 100$ (Trung bình cộng điểm tốc độ giao các SKU).<br>2. **Tính Điểm tổng hợp $Score_{NCC}$ (`BR-013`):**<br>- Với NCC thông thường ($N \ge 3$ lần giao): $Score_{NCC} = 0.35 S_{otif} + 0.30 S_{quality} + 0.20 S_{price} + 0.15 S_{leadtime}$.<br>- Với NCC mới ($N < 3$ lần giao): Gán nhãn `NEW_SUPPLIER`, chuẩn hóa thang 100: $Score_{NEW} = \frac{0.20 S_{price} + 0.15 S_{leadtime}}{0.35}$.<br>3. Sắp xếp danh sách nhà cung cấp theo $Score_{NCC}$ giảm dần. |
| **3** | | Hiển thị giao diện Đánh giá gồm 2 phần:<br>- **Phần 1 (Bảng xếp hạng tổng thể & Biểu đồ so sánh):** Bảng xếp hạng toàn bộ NCC kèm cột điểm tổng hợp, 4 điểm thành phần và nhãn xếp loại.<br>- **Phần 2 (Chi tiết hồ sơ NCC được chọn):** Thông tin chi tiết 4 tiêu chí và bảng nhật ký 10 lần giao hàng gần nhất của nhà cung cấp đứng đầu danh sách. |
| **4** | Chọn một nhà cung cấp khác từ bảng xếp hạng để xem chi tiết. | Hệ thống làm mới Phần 2 hiển thị chi tiết 4 điểm thành phần và nhật ký giao hàng của nhà cung cấp vừa chọn. |

---

## 5. Alternative Flows

### A1. Xem chi tiết Nhật ký 10 lần giao hàng gần nhất
* **A1.1.** Tại phần chi tiết của NCC được chọn, người dùng xem bảng "Lịch sử giao hàng thực tế".
* **A1.2.** Bảng hiển thị từng đợt giao: Mã đơn hàng, Ngày hẹn giao, Ngày giao thực tế, Trạng thái Đúng hạn (Có/Không), Số lượng đặt ($Q_{ordered}$), Số lượng thực giao ($Q_{delivered}$), Số lượng hàng lỗi ($Q_{defective}$), Số lượng thực nhập ($Q_{accepted}$), và Đạt OTIF (Có/Không).

### A2. Lọc danh sách theo Nhóm xếp loại
* **A2.1.** Người dùng chọn bộ lọc xếp loại:
  * *Xuất sắc ($Score_{NCC} \ge 85$)*: Đối tác chiến lược ưu tiên đặt hàng.
  * *Tốt ($70 \le Score_{NCC} < 85$)*: Đối tác đáng tin cậy.
  * *Cần cải thiện ($Score_{NCC} < 70$)*: Đối tác thường xuyên trễ hạn hoặc có tỷ lệ lỗi cao.
  * *Nhà cung cấp mới (`NEW_SUPPLIER`)*: Đối tác có dưới 3 lần giao hàng.
* **A2.2.** Hệ thống cập nhật bảng xếp hạng chỉ hiển thị các đối tác thỏa mãn điều kiện lọc.

### A3. Điều hướng sang màn hình Cấu hình trọng số đánh giá NCC (`UC-017`)
* **A3.1.** Người dùng với vai trò `System Admin` nhấn nút "Cấu hình trọng số tiêu chí".
* **A3.2.** Hệ thống chuyển tiếp sang `UC-017: Cấu hình trọng số đánh giá nhà cung cấp` để tùy chỉnh lại tỷ lệ % của 4 tiêu chí.

---

## 6. Exception Flows

### E1. Nhà cung cấp mới chưa có lịch sử giao hàng (< 3 lần giao)
* **E1.1.** Nhà cung cấp mới ký hợp đồng hoặc chỉ mới giao 1-2 đơn hàng.
* **E1.2.** Hệ thống hiển thị nhãn nổi bật `NEW_SUPPLIER` (theo `BR-013`), hiển thị điểm chuẩn hóa $Score_{NEW}$, hiển thị $S_{price}$ và $S_{leadtime}$ dựa trên bảng giá/cam kết đã biết, hiển thị điểm OTIF/Chất lượng là `N/A` kèm ghi chú: *"Cần tối thiểu 3 lần giao hàng để tính đầy đủ 4 tiêu chí hiệu suất"*.

### E2. Chưa có nhà cung cấp nào trong hệ thống (Empty State)
* **E2.1.** Hệ thống kiểm tra không có nhà cung cấp nào đang hoạt động.
* **E2.2.** Hiển thị màn hình thông báo: *"Chưa có dữ liệu nhà cung cấp. Vui lòng thêm nhà cung cấp mới."* kèm nút chuyển sang `UC-002`.

---

## 7. Business Rules Applied (Quy Tắc Nghiệp Vụ Áp Dụng)

* **BR-012 (Công thức 4 điểm thành phần thang điểm 100):**
  * $S_{price}(i) = \frac{1}{M}\sum_{j=1}^M \frac{P_{min}(j)}{P_{supplier}(i, j)} \times 100$ (Đơn giá rẻ nhất được 100 điểm).
  * $S_{otif} = (\sum \text{OTIF}_k / N) \times 100$ (Đúng hạn $\le$ Promised Date VÀ Đủ lượng $Q_{delivered} \ge Q_{ordered}$).
  * $S_{quality} = (1 - \sum Q_{defective} / \sum Q_{delivered}) \times 100$.
  * $S_{leadtime}(i) = \frac{1}{M}\sum_{j=1}^M \frac{LT_{min}(j)}{LT_{supplier}(i, j)} \times 100$ (Giao nhanh nhất được 100 điểm).
* **BR-013 (Điểm tổng hợp & Trọng số mặc định):**
  * $Score_{NCC} = 0.35 S_{otif} + 0.30 S_{quality} + 0.20 S_{price} + 0.15 S_{leadtime}$ (Tính trên 10 lần giao gần nhất).
  * NCC mới (< 3 lần giao) gắn nhãn `NEW_SUPPLIER` và chuẩn hóa $Score_{NEW} = \frac{w_{price} S_{price} + w_{leadtime} S_{leadtime}}{w_{price} + w_{leadtime}}$.
* **BR-019 (Log lịch sử giao hàng):** Dữ liệu được ghi nhận tự động từ `DeliveryHistory` mỗi khi hoàn tất nhận hàng tại `UC-014`.
* **BR-021 (Vô hiệu hóa đối tác):** Loại trừ nhà cung cấp có `IsActive = false` khỏi bảng xếp hạng.

---

## 8. Related Requirements (Yêu Cầu Chức Năng Liên Quan)

* **FR-019:** Hệ thống tự động tính toán điểm hiệu suất tổng hợp của từng nhà cung cấp trên 10 lần giao gần nhất dựa trên 4 tiêu chí: $S_{otif}$ (Đúng hạn & Đủ hàng), $S_{quality}$ (Chất lượng), $S_{price}$ (Đơn vị giá cạnh tranh), $S_{leadtime}$ (Tốc độ giao).
* **FR-020:** Hệ thống hiển thị bảng xếp hạng và báo cáo chi tiết lịch sử hiệu suất của từng nhà cung cấp kèm lịch sử các đợt giao hàng.
