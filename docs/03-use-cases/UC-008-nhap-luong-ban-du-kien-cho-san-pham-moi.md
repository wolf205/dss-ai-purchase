# Use Case Specification: UC-008 - Nhập Lượng Bán Dự Kiến Cho Sản Phẩm Mới (Cold Start)

---

## 1. Basic Information

* **Use Case ID:** `UC-008`
* **Use Case Name:** Nhập lượng bán dự kiến cho sản phẩm mới (Cold Start Demand Initialization)
* **Primary Actor:** `Purchasing Staff`
* **Supporting Actor:** `System Admin` (Có quyền xem và hỗ trợ nhập)
* **Goal:** Nhân viên mua hàng muốn thiết lập hoặc điều chỉnh số lượng bán dự kiến trung bình mỗi ngày ($D_{expected}$) theo Đơn vị tính cơ bản cho các mặt hàng mới nhập về cửa hàng đang ở trạng thái `COLD_START` (< 14 ngày dữ liệu giao dịch), nhằm cung cấp dữ liệu cơ sở ban đầu để hệ thống tính toán Tồn kho an toàn tạm thời ($\text{SS} = \max(\lceil D_{expected} \times 2 \text{ ngày} \rceil, \text{Min Safety Stock})$), Điểm đặt hàng lại $\text{ROP}$, và sinh khuyến nghị mua hàng hợp lý trong giai đoạn đầu kinh doanh.
* **Trigger:**
  * Khi nhân viên vừa thêm mới một sản phẩm vào danh mục (`UC-001`).
  * Khi nhân viên phát hiện các sản phẩm mới trong danh sách cảnh báo `COLD_START` hoặc `CẦN_NHẬP_D_EXPECTED` tại màn hình Dự báo nhu cầu (`UC-007`) hoặc Danh mục sản phẩm.

---

## 2. Preconditions

1. Người dùng (`Purchasing Staff` hoặc `System Admin`) đã đăng nhập thành công vào hệ thống.
2. Sản phẩm tồn tại trên hệ thống, đang ở trạng thái hoạt động (`IsActive = true`) và có số ngày lịch sử giao dịch tích lũy $N_{days} < 14$ ngày.

---

## 3. Postconditions

### 3.1. Thành công (Success End Condition):
* Giá trị lượng bán dự kiến ngày ($D_{expected} > 0$) tính theo Đơn vị tính cơ bản (Lon, Chai, Hộp, Gói...) được lưu thành công cho sản phẩm; gỡ bỏ cờ cảnh báo `CẦN_NHẬP_D_EXPECTED`.
* Hệ thống tự động tính toán lại các chỉ số tồn kho ban đầu:
  * $\text{Safety Stock}_{initial} = \max(\lceil D_{expected} \times 2 \text{ ngày} \rceil, \text{Min Safety Stock})$.
  * $\text{ROP}_{initial} = \lceil (D_{expected} \times L) + \text{Safety Stock}_{initial} \rceil$.
  * Tổng cầu dự báo chu kỳ $T$ ngày: $\text{Forecasted Demand}_T = \lceil D_{expected} \times T \rceil$ với $T \in \{7, 14, 30\}$.
* Sản phẩm được đưa vào danh sách tính toán Khuyến nghị mua hàng (`UC-010`) dựa trên mức dự báo kỳ vọng này.
* Khi sản phẩm tích lũy đủ $N_{days} \ge 14$ ngày bán, hệ thống tự động gỡ nhãn `COLD_START` và chuyển sang tính tự động bằng thuật toán Trung bình trượt SMA-7 (`BASIC_FORECAST`).

### 3.2. Thất bại (Failure End Condition):
* Dữ liệu không thay đổi; hệ thống hiển thị thông báo lỗi (ví dụ: $D_{expected} \le 0$ hoặc sai định dạng số).

---

## 4. Main Success Flow (Nhập lượng bán dự kiến cho sản phẩm Cold Start)

| Step | Actor (Purchasing Staff) | System |
| :---: | :--- | :--- |
| **1** | Truy cập tab "Sản phẩm mới (Cold Start)" tại phân hệ Dự báo hoặc Quản lý danh mục. | Truy vấn danh sách tất cả các sản phẩm có số ngày dữ liệu $N_{days} < 14$ ngày. |
| **2** | | Hiển thị bảng danh sách các sản phẩm Cold Start gồm: Mã SKU, Tên sản phẩm, Đơn vị tính cơ bản (ĐVT), Ngành hàng, Số ngày bán đã tích lũy ($N_{days}$/14 ngày), Giá trị $D_{expected}$ hiện tại (nếu có, nếu chưa có hiển thị nhãn `CẦN_NHẬP_D_EXPECTED`), và Nút hành động "Thiết lập". |
| **3** | Chọn một sản phẩm và nhấn nút "Thiết lập lượng bán". | Hiển thị form/modal nhập liệu: Thông tin SKU, Tên sản phẩm, Đơn vị tính cơ bản (ví dụ: "Lon"), và Ô nhập **Số lượng bán dự kiến mỗi ngày ($D_{expected}$)** kèm đơn vị tính rõ ràng. |
| **4** | Nhập số lượng bán kỳ vọng mỗi ngày (ví dụ: $D_{expected} = 5$ lon/ngày) dựa trên kế hoạch kinh doanh $\rightarrow$ Nhấn "Lưu thiết lập". | Kiểm tra tính hợp lệ của dữ liệu (Validation):<br>- Kiểm tra $D_{expected}$ là số thực $> 0$. |
| **5** | | Thực hiện cập nhật vào cơ sở dữ liệu:<br>1. Lưu giá trị $D_{expected}$.<br>2. Tính toán lại $\text{SS}_{initial} = \max(\lceil D_{expected} \times 2 \rceil, \text{Min Safety Stock})$ (`BR-003`).<br>3. Tính toán $\text{ROP}_{initial} = \lceil D_{expected} \times L + \text{SS}_{initial} \rceil$ (`BR-004`).<br>4. Tính tổng cầu dự báo $\text{Forecasted Demand}_T = \lceil D_{expected} \times T \rceil$ (`BR-008`). |
| **6** | | Hiển thị thông báo thành công: *"Đã cập nhật lượng bán dự kiến cho sản phẩm [SKU]. Hệ thống đã đồng bộ các chỉ số tồn kho an toàn và gợi ý mua hàng."* và làm mới lại bảng danh sách. |

---

## 5. Alternative Flows

### A1. Cập nhật / Điều chỉnh lại $D_{expected}$
* **A1.1.** Trong quá trình theo dõi, nếu nhận thấy sức mua thực tế khác với dự kiến ban đầu, nhân viên mở lại sản phẩm Cold Start này.
* **A1.2.** Nhân viên sửa lại giá trị $D_{expected}$ mới (ví dụ: tăng từ 5 lên 8 lon/ngày) $\rightarrow$ Nhấn "Cập nhật".
* **A1.3.** Hệ thống kiểm tra hợp lệ $\rightarrow$ Lưu giá trị mới $\rightarrow$ Tự động tính toán lại SS, ROP và số lượng đề xuất mua $Q_{suggested}$ mới ngay lập tức.

### A2. Thiết lập nhanh $D_{expected}$ từ màn hình Dự báo AI (`UC-007`) hoặc Chi tiết sản phẩm (`UC-006`)
* **A2.1.** Khi đang xem màn hình `UC-007` hoặc `UC-006`, nếu gặp sản phẩm có nhãn `COLD_START`, nhân viên click vào nút "Nhập lượng bán dự kiến" trên thẻ cảnh báo.
* **A2.2.** Hệ thống mở popup nhập $D_{expected}$ ngay tại chỗ kèm Đơn vị tính cơ bản.
* **A2.3.** Nhân viên nhập giá trị $\rightarrow$ Nhấn "Lưu" $\rightarrow$ Màn hình hiện tại được làm mới với số liệu tính toán tức thời.

### A3. Tự động chuyển giao vòng đời sản phẩm (Automatic Lifecycle Graduation)
* **A3.1.** Sau khi nhân viên nạp file bán hàng định kỳ (`UC-003`), hệ thống kiểm tra sản phẩm đã tích lũy đủ $N_{days} = 14$ ngày.
* **A3.2.** Hệ thống tự động chuyển trạng thái sản phẩm từ `COLD_START` sang `BASIC_FORECAST` (theo `BR-020`).
* **A3.3.** Kể từ thời điểm này, hệ thống tự động tính toán nhu cầu bằng thuật toán Trung bình trượt 7 ngày (SMA-7), loại bỏ sản phẩm khỏi danh sách cần nhập tay $D_{expected}$.

---

## 6. Exception Flows

### E1. Giá trị nhập không hợp lệ (Invalid Input)
* **E1.1.** Tại Bước 4 của Main Flow, người dùng nhập $D_{expected} \le 0$, để trống hoặc nhập ký tự chữ.
* **E1.2.** Hệ thống hiển thị thông báo lỗi tại ô nhập: *"Lượng bán dự kiến mỗi ngày phải là số lớn hơn 0. Vui lòng kiểm tra lại."*
* **E1.3.** Người dùng nhập lại giá trị hợp lệ và tiếp tục từ Bước 4.

### E2. Sản phẩm đã đủ dữ liệu giao dịch ($\ge 14$ ngày)
* **E2.1.** Người dùng cố gắng mở form nhập $D_{expected}$ cho một sản phẩm đã có $N_{days} \ge 14$ ngày.
* **E2.2.** Hệ thống thông báo: *"Sản phẩm này đã tích lũy đủ [N] ngày dữ liệu và đang được tính toán tự động bằng thuật toán. Không cần nhập lượng bán thủ công nữa."* và khóa ô nhập liệu.

### E3. Sản phẩm mới chưa kịp nhập $D_{expected}$ (Uninitialized Fallback)
* **E3.1.** Sản phẩm mới tạo chưa được nhập $D_{expected}$ ($D_{expected} = 0$).
* **E3.2.** Hệ thống tự động dùng $\text{Min Safety Stock}$ (lấy từ `UC-001`) làm mức an toàn tạm thời $\text{SS}_{initial} = \text{Min Safety Stock}$, $\text{ROP}_{initial} = \text{Min Safety Stock}$, và gắn cờ cảnh báo `CẦN_NHẬP_D_EXPECTED` tại Dashboard và Khuyến nghị.

---

## 7. Business Rules Applied (Quy Tắc Nghiệp Vụ Áp Dụng)

* **BR-003 (Safety Stock cho Cold Start):** Với sản phẩm $< 14$ ngày: $\text{SS}_{initial} = \max(\lceil D_{expected} \times 2 \text{ ngày} \rceil, \text{Min Safety Stock})$.
* **BR-004 (ROP cho Cold Start):** $\text{ROP}_{initial} = \lceil D_{expected} \times L + \text{SS}_{initial} \rceil$.
* **BR-006 (Phân tầng dữ liệu):** $N_{days} < 14$ gán trạng thái `COLD_START` (sử dụng $D_{expected}$ do người dùng nhập).
* **BR-008 (Tổng cầu dự báo):** $\text{Forecasted Demand}_T = \lceil D_{expected} \times T \rceil$ với $T \in \{7, 14, 30\}$ và $D_{avg} = D_{expected}$.
* **BR-020 (Vòng đời chuyển giao):** Tự động chuyển cấp độ xử lý khi dữ liệu đạt $\ge 14$ ngày (`BASIC_FORECAST` / SMA-7) và $\ge 30$ ngày (`AI_READY`).

---

## 8. Related Requirements (Yêu Cầu Chức Năng Liên Quan)

* **FR-016:** Đối với các sản phẩm mới chưa đủ 14 ngày dữ liệu lịch sử để chạy mô hình AI (Cold start), hệ thống hiển thị thông báo *"Chưa đủ dữ liệu lịch sử"* và cho phép nhân viên mua hàng chủ động nhập số lượng dự kiến theo kinh nghiệm.
