# Use Case Specification: UC-007 - Xem Dự Báo Nhu Cầu Bán Lẻ

---

## 1. Basic Information

* **Use Case ID:** `UC-007`
* **Use Case Name:** Xem dự báo nhu cầu bán lẻ (Retail Demand Forecasting)
* **Primary Actor:** `Purchasing Staff`
* **Supporting Actor:** `System Admin` (Truy cập xem và giám sát - Read-only)
* **Goal:** Người dùng muốn xem phân tích chuỗi thời gian lịch sử bán hàng và kết quả dự báo nhu cầu tiêu thụ trong tương lai (theo các khung thời gian linh hoạt: 7 ngày, 14 ngày hoặc 30 ngày tới), đánh giá chỉ số độ chính xác của mô hình (WAPE, MAE), dải mây biến động tin cậy (Confidence Band), và nắm rõ trạng thái thuật toán đang phục vụ (`AI_FORECAST`, `FALLBACK_SMA7`, `BASIC_FORECAST`, `COLD_START`) để có cơ sở vững chắc trước khi ra quyết định mua hàng.
* **Trigger:** Người dùng truy cập màn hình "Dự báo nhu cầu" từ thanh điều hướng chính của hệ thống.

---

## 2. Preconditions

1. Người dùng (`Purchasing Staff` hoặc `System Admin`) đã đăng nhập thành công vào hệ thống.
2. Danh mục sản phẩm (`UC-001`) đã tồn tại trên hệ thống và có các sản phẩm đang hoạt động (`IsActive = true`).
3. Hệ thống đã có dữ liệu bán hàng lịch sử được nạp từ `UC-003`.

---

## 3. Postconditions

### 3.1. Thành công (Success End Condition):
* Hệ thống tải nhanh ($< 1$ giây) kết quả phân tích đã được tính toán sẵn và trực quan hóa:
  * **Khu vực 1 (Bộ lọc & Bảng danh sách SKU):** Danh sách toàn bộ sản phẩm kèm Tổng cầu dự báo chu kỳ tới ($\text{Forecasted Demand}_T$), Nhu cầu trung bình ngày ($D_{avg}$), Chỉ số sai số WAPE (%), MAE (chiếc), và Nhãn trạng thái thuật toán minh bạch.
  * **Khu vực 2 (Biểu đồ Chuỗi thời gian trực quan):** Biểu đồ kết hợp đường xu hướng bán hàng quá khứ (30 ngày) và đường dự báo tương lai (7, 14 hoặc 30 ngày) bao bọc bởi **Dải mây biến động tin cậy (Shaded Confidence Band: $[\max(0, \hat{y}_t - 1.65 \times \text{MAE}) \leftrightarrow \hat{y}_t + 1.65 \times \text{MAE}]$)**.
  * **Khu vực 3 (Thẻ giải thích thuật toán - Explainability Card):** Nêu rõ cơ chế dự báo đang áp dụng (Mô hình AI học xu hướng/ngày trong tuần, hay Fallback trung bình trượt SMA-7).
* Người dùng có thể chuyển đổi linh hoạt giữa các khung thời gian (7/14/30 ngày) và lọc nhanh các sản phẩm có độ tin cậy thấp hoặc Cold Start.

### 3.2. Thất bại (Failure End Condition):
* Không thể tải dữ liệu dự báo do lỗi kết nối cơ sở dữ liệu; hệ thống hiển thị thông báo lỗi và nút "Thử lại".

---

## 4. Main Success Flow (Xem dự báo nhu cầu)

| Step | Actor (Purchasing Staff / Admin) | System |
| :---: | :--- | :--- |
| **1** | Truy cập màn hình "Dự báo nhu cầu". | Mặc định chọn khung thời gian dự báo **14 ngày tới** ($T = 14$). |
| **2** | | Truy vấn nhanh kết quả dự báo đã tính sẵn mới nhất của tất cả sản phẩm đang hoạt động (`IsActive = true`). |
| **3** | | Thực hiện tổng hợp và đánh giá chất lượng mô hình cho từng SKU:<br>1. Tính tổng cầu dự báo $\text{Forecasted Demand}_T = \lceil \sum_{t=1}^T \max(0, \hat{y}_t) \rceil$ và $D_{avg} = \text{Forecasted Demand}_T / T$ (`BR-008`).<br>2. Tính sai số $\text{WAPE} = \frac{\sum \|y_i - \hat{y}_i\|}{\sum y_i} \times 100\%$ và $\text{MAE} = \frac{1}{n}\sum \|y_i - \hat{y}_i\|$ (`BR-007`).<br>3. Kiểm tra điều kiện Fallback (`BR-007`): Nếu $\text{WAPE} > 40\%$, tự động chuyển sang dùng kết quả SMA-7 và gán nhãn `FALLBACK_SMA7`.<br>4. Xác định nhãn phân tầng (`BR-006`): `AI_FORECAST` ($\ge 30$ ngày & $\text{WAPE} \le 40\%$), `BASIC_FORECAST` (14-29 ngày, SMA-7), hoặc `COLD_START` (< 14 ngày). |
| **4** | | Hiển thị giao diện Dự báo gồm Biểu đồ chuỗi thời gian (kèm dải mây biến động tin cậy) và Bảng tổng hợp dự báo của toàn bộ danh mục sản phẩm. |
| **5** | Chọn một sản phẩm cụ thể từ bảng danh sách để phân tích. | Hệ thống làm mới Biểu đồ chuỗi thời gian và Thẻ giải thích thuật toán tương ứng với sản phẩm vừa chọn. |

---

## 5. Alternative Flows

### A1. Chuyển đổi khung thời gian dự báo (7 ngày / 14 ngày / 30 ngày)
* **A1.1.** Người dùng chuyển đổi lựa chọn khung thời gian trên thanh công cụ: **7 ngày**, **14 ngày** (mặc định), hoặc **30 ngày**.
* **A1.2.** Hệ thống tính toán lại tổng lượng cầu dự kiến $\text{Forecasted Demand}_T$ và nhu cầu ngày $D_{avg}$ cho toàn bộ danh sách.
* **A1.3.** Hệ thống cập nhật lại độ dài đường dự báo tương lai và dải mây biến động trên biểu đồ.

### A2. Lọc danh sách theo Trạng thái thuật toán & Cảnh báo độ tin cậy
* **A2.1.** Người dùng chọn bộ lọc trạng thái:
  * `AI_FORECAST`: Xem các sản phẩm mô hình AI chạy chuẩn xác (WAPE $\le 40\%$).
  * `FALLBACK_SMA7`: Lọc các sản phẩm AI bị nhiễu đã tự động chuyển sang Trung bình trượt SMA-7 an toàn.
  * `COLD_START`: Lọc các sản phẩm mới chưa đủ 14 ngày dữ liệu.
* **A2.2.** Hệ thống cập nhật bảng danh sách chỉ hiển thị các sản phẩm thỏa mãn điều kiện lọc.

### A3. Điều hướng sang màn hình Nhập lượng bán dự kiến cho SP Cold Start (`UC-008`)
* **A3.1.** Khi lọc thấy sản phẩm ở trạng thái `COLD_START` chưa có mức bán kỳ vọng, người dùng nhấn nút "Nhập lượng bán dự kiến".
* **A3.2.** Hệ thống chuyển tiếp sang màn hình `UC-008: Nhập lượng bán dự kiến cho sản phẩm mới`.

### A4. Điều hướng sang màn hình Chi tiết sản phẩm 360° (`UC-006`)
* **A4.1.** Người dùng click vào tên hoặc mã SKU tại bảng dự báo.
* **A4.2.** Hệ thống chuyển sang màn hình `UC-006` để xem toàn cảnh tồn kho, ABC-XYZ và nhà cung cấp.

---

## 6. Exception Flows

### E1. Hệ thống chưa có dữ liệu lịch sử bán hàng (Empty Data State)
* **E1.1.** Tại Bước 2 của Main Flow, hệ thống kiểm tra không có bất kỳ bản ghi bán hàng nào trong cơ sở dữ liệu.
* **E1.2.** Hệ thống hiển thị màn hình thông báo: *"Chưa có dữ liệu lịch sử bán hàng để chạy dự báo. Vui lòng nạp dữ liệu bán hàng từ file Excel/CSV."* kèm nút bấm chuyển nhanh đến `UC-003`.

### E2. Sản phẩm bị đứt hàng dài ngày hoặc không có người mua (Dead Stock)
* **E2.1.** Sản phẩm có lượng bán 30 ngày $= 0$.
* **E2.2.** Hệ thống hiển thị đường dự báo nằm ngang bằng $0$ ($\hat{y}_t = 0$), gắn nhãn cảnh báo `DEAD_STOCK` (theo `BR-023`), và ghi chú: *"Sản phẩm không có giao dịch bán trong 30 ngày qua"*.

---

## 7. Business Rules Applied (Quy Tắc Nghiệp Vụ Áp Dụng)

* **BR-006 (Phân tầng dữ liệu dự báo):**
  * $N_{days} < 14$: Trạng thái `COLD_START` (Cho phép nhập tay $D_{expected}$ tại `UC-008`).
  * $14 \le N_{days} < 30$: Trạng thái `BASIC_FORECAST` (Chạy tự động Trung bình trượt 7 ngày SMA-7).
  * $N_{days} \ge 30$: Trạng thái `AI_READY` (Chạy mô hình Machine Learning).
* **BR-007 (Đánh giá sai số & Cơ chế Fallback):**
  * Đánh giá chất lượng bằng chỉ số WAPE (%) và MAE (chiếc).
  * Nếu $\text{WAPE} \le 40\% \rightarrow$ Áp dụng kết quả AI (`AI_FORECAST`).
  * Nếu $\text{WAPE} > 40\% \rightarrow$ Tự động Fallback về SMA-7 (`FALLBACK_SMA7`) kèm cờ cảnh báo độ tin cậy.
* **BR-008 (Tổng cầu dự báo $T$ ngày & $D_{avg}$):**
  * $\text{Forecasted Demand}_T = \lceil \sum_{t=1}^T \max(0, \hat{y}_t) \rceil$ với $T \in \{7, 14, 30\}$.
  * $D_{avg} = \text{Forecasted Demand}_T / T$ (Làm tròn và loại bỏ số âm).
* **BR-020 (Vòng đời sản phẩm):** Tự động chuyển cấp độ xử lý khi số ngày dữ liệu tích lũy tăng lên.
* **BR-021 (Sản phẩm vô hiệu hóa):** Loại trừ sản phẩm `IsActive = false` khỏi màn hình dự báo.
* **BR-023 (Hàng tồn bất động):** Gán $\text{Forecasted Demand} = 0$ và nhãn `DEAD_STOCK` cho sản phẩm 30 ngày bán $= 0$.

---

## 8. Related Requirements (Yêu Cầu Chức Năng Liên Quan)

* **FR-012:** Phân tích dữ liệu chuỗi thời gian lịch sử bán hàng theo ngày/tuần của từng sản phẩm.
* **FR-013:** Dự báo số lượng tiêu thụ dự kiến của sản phẩm theo các khung thời gian linh hoạt: 7 ngày, 14 ngày hoặc 30 ngày tới.
* **FR-014:** Trực quan hóa kết quả dự báo nhu cầu dưới dạng biểu đồ xu hướng (quá khứ kết hợp tương lai).
* **FR-015:** Hiển thị chỉ số đánh giá sai số (WAPE, MAE), dải mây biến động tin cậy và tự động kích hoạt cơ chế Fallback về SMA-7 khi sai số $\text{WAPE} > 40\%$.
