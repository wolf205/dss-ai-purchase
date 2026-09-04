# Use Case Specification: UC-012 - Lập & Xác Nhận Đơn Mua Hàng

---

## 1. Basic Information

* **Use Case ID:** `UC-012`
* **Use Case Name:** Lập & xác nhận đơn mua hàng (Purchase Order Creation & Confirmation)
* **Primary Actor:** `Purchasing Staff`
* **Supporting Actor:** `System Admin` (Xem và giám sát - Read-only)
* **Goal:** Nhân viên mua hàng muốn tạo một đơn mua hàng mới (chuyển tiếp tự động từ khuyến nghị mua `UC-010`, từ màn hình chi tiết sản phẩm `UC-004`/`UC-006`, hoặc tự lập thủ công), kiểm tra và điều chỉnh thông tin đối tác, danh mục hàng hóa (được lọc chính xác theo đối tác), số lượng đặt, đơn giá, lưu ở trạng thái Nháp (`DRAFT`) hoặc Xác nhận đặt hàng (`ORDERED`) để chính thức khóa đơn, gửi thông tin cho nhà cung cấp và tự động ghi tăng số lượng hàng đang chờ giao ($\text{On-Order}$) trong hệ thống.
* **Trigger:**
  * Được điều hướng tự động kèm dữ liệu điền sẵn từ `UC-010` (sau khi bấm tạo đơn) hoặc từ `UC-004`/`UC-006` (nút "Đặt hàng ngay").
  * Nhân viên chủ động bấm nút "Tạo đơn mua hàng mới" từ màn hình Quản lý đơn mua (`UC-013`).

---

## 2. Preconditions

1. Người dùng (`Purchasing Staff` hoặc `System Admin`) đã đăng nhập thành công vào hệ thống.
2. Nhà cung cấp được chọn đang ở trạng thái hoạt động (`IsActive = true`).
3. Các sản phẩm thêm vào đơn hàng thuộc danh mục phân phối của Nhà cung cấp đó (`UC-002`) và đang hoạt động (`IsActive = true`).

---

## 3. Postconditions

### 3.1. Thành công (Success End Condition):
* **Nếu chọn "Lưu nháp" (`DRAFT`):**
  * Đơn mua hàng được lưu vào cơ sở dữ liệu với mã đơn tự động sinh dạng `PO-YYYYMMDD-XXXX` (theo `BR-024`).
  * Trạng thái đơn là `DRAFT`.
  * Số lượng tồn kho $\text{On-Order}$ của các sản phẩm **CHƯA THAY ĐỔI**.
* **Nếu chọn "Xác nhận đặt hàng" (`ORDERED`):**
  * Trạng thái đơn chuyển sang `ORDERED`.
  * Hệ thống tự động tăng số lượng hàng đang chờ giao $\text{On-Order} += Q_{ordered}$ cho toàn bộ các SKU có trong đơn hàng (theo `BR-001`, `BR-026`).
  * Hệ thống **chính thức khóa đơn hàng** (không cho phép chỉnh sửa danh sách sản phẩm hoặc số lượng nữa theo `BR-025`).
  * Cung cấp chức năng Xuất phiếu đặt hàng ra file PDF/Excel để nhân viên gửi cho nhà cung cấp (`FR-027`).

### 3.2. Thất bại (Failure End Condition):
* Đơn hàng không được tạo; hệ thống hiển thị thông báo lỗi cụ thể (ví dụ: đơn hàng chưa có sản phẩm, số lượng $< 1$, ngày hẹn giao không hợp lệ).

---

## 4. Main Success Flow (Lập & Xác nhận đơn mua hàng chính thức)

| Step | Actor (Purchasing Staff) | System |
| :---: | :--- | :--- |
| **1** | Truy cập màn hình tạo đơn mua hàng (hoặc được chuyển tiếp từ `UC-010` / `UC-004` / `UC-006`). | Hiển thị form tạo đơn mua hàng:<br>- Tự động sinh **Mã đơn hàng** (dạng `PO-YYYYMMDD-XXXX` theo `BR-024`).<br>- Mặc định **Ngày tạo đơn** là ngày hiện tại.<br>- Nếu được chuyển tiếp từ `UC-010`: Tự động điền sẵn Nhà cung cấp, Ngày hẹn giao dự kiến ($\text{Promised Date} = \text{Order Date} + LT_{supplier}$ theo `BR-026`), và Bảng danh sách SKU kèm $Q_{suggested}$ và Đơn giá mua $P_{supplier}$.<br>- Nếu tạo mới thủ công: Hiển thị form trống cho người dùng chọn NCC và thêm SKU (dropdown chỉ lọc các SKU do NCC này phân phối). |
| **2** | Kiểm tra thông tin chung: Nhà cung cấp, Ngày hẹn giao, Ghi chú đơn hàng. | |
| **3** | Kiểm tra bảng chi tiết sản phẩm đặt mua: Mã SKU, Tên, ĐVT, Số lượng đặt ($Q_{ordered}$), Đơn giá mua, và Thành tiền từng dòng ($= Q_{ordered} \times P_{supplier}$). | Tự động tính toán lại Tổng số lượng mặt hàng và **Tổng giá trị đơn hàng** (Total Amount) mỗi khi có thay đổi. Hiển thị cảnh báo màu vàng (Soft Warning) nếu phát hiện số lượng nhỏ hơn MOQ hoặc chưa tròn Pack Size. |
| **4** | Nhấn nút **"Xác nhận đặt hàng (ORDERED)"**. | Hiển thị hộp thoại xác nhận: *"Bạn có chắc chắn muốn xác nhận đơn hàng [PO-Code] không? Sau khi xác nhận, đơn hàng sẽ được khóa và hệ thống sẽ tự động cập nhật số lượng hàng đang chờ về (On-Order)."* |
| **5** | Nhấn "Đồng ý xác nhận". | Thực hiện giao dịch lưu và cập nhật hệ thống:<br>1. Lưu đơn hàng với trạng thái `ORDERED`.<br>2. Cập nhật tăng $\text{On-Order} += Q_{ordered}$ cho toàn bộ SKU trong đơn (`BR-001`, `BR-026`).<br>3. Khóa chỉnh sửa đơn hàng (`BR-025`).<br>4. Ghi log lịch sử tạo đơn. |
| **6** | | Hiển thị thông báo thành công: *"Đã xác nhận đơn mua hàng [PO-Code] thành công!"*, hiển thị các nút chức năng: *"Xuất file PDF/Excel"*, *"In phiếu đặt hàng"*, và nút *"Quay về Quản lý đơn hàng"*. |

---

## 5. Alternative Flows

### A1. Lưu đơn hàng ở trạng thái Nháp (`DRAFT`)
* **A1.1.** Tại Bước 4 của Main Flow, người dùng chưa muốn gửi đơn ngay mà muốn lưu lại để kiểm tra thêm $\rightarrow$ Nhấn nút **"Lưu đơn nháp (DRAFT)"**.
* **A1.2.** Hệ thống kiểm tra tính hợp lệ cơ bản $\rightarrow$ Lưu đơn hàng với trạng thái `DRAFT` (chưa cộng $\text{On-Order}$).
* **A1.3.** Hệ thống hiển thị thông báo: *"Đã lưu đơn hàng nháp [PO-Code] thành công"*. Đơn hàng này có thể chỉnh sửa lại bất kỳ lúc nào tại `UC-013`.

### A2. Chỉnh sửa danh sách sản phẩm trong đơn (Thêm / Sửa / Xóa dòng)
* **A2.1.** Khi đơn hàng đang ở form tạo mới hoặc trạng thái `DRAFT`:
  * *Thêm sản phẩm:* Người dùng bấm "Thêm dòng", dropdown chỉ hiển thị danh sách các SKU mà Nhà cung cấp này có phân phối (từ `UC-002`), tự động điền đơn giá mặc định $P_{supplier}$.
  * *Sửa số lượng / Đơn giá:* Người dùng click vào ô để nhập lại số lượng hoặc điều chỉnh giá thương lượng. Nếu $Q_{ordered} < \text{MOQ}$, hệ thống hiển thị cảnh báo mềm (Soft Warning) nhưng vẫn cho phép tiếp tục.
  * *Xóa dòng:* Người dùng bấm biểu tượng thùng rác tại dòng sản phẩm muốn loại bỏ.
* **A2.2.** Hệ thống tự động cập nhật lại Thành tiền từng dòng và Tổng tiền đơn hàng tức thời.

### A3. Xuất phiếu đặt hàng ra file PDF / Excel hoặc In trực tiếp
* **A3.1.** Sau khi lưu đơn thành công (hoặc khi đang xem chi tiết đơn tại `UC-013`), người dùng bấm nút **"Xuất file PDF"** hoặc **"Xuất file Excel"**.
* **A3.2.** Hệ thống tạo tệp tin mẫu phiếu đặt mua hàng chuẩn (Purchase Order Template) gồm: Logo/Tên cửa hàng, Mã PO, Thông tin Nhà cung cấp, Ngày đặt, Ngày hẹn giao, Bảng chi tiết sản phẩm, Tổng tiền, và phần chữ ký người lập.
* **A3.3.** Trình duyệt tự động tải tệp tin về máy để người dùng gửi email/Zalo cho nhà cung cấp (`FR-027`).

---

## 6. Exception Flows

### E1. Đơn hàng chưa có sản phẩm nào (Empty Order Lines)
* **E1.1.** Người dùng nhấn "Xác nhận đặt hàng" hoặc "Lưu nháp" khi bảng danh sách sản phẩm chưa có dòng nào ($Count = 0$).
* **E1.2.** Hệ thống từ chối lưu và hiển thị cảnh báo lỗi: *"Đơn mua hàng phải có ít nhất 1 sản phẩm. Vui lòng thêm sản phẩm vào đơn."*

### E2. Số lượng đặt mua không hợp lệ
* **E2.1.** Người dùng nhập số lượng $Q_{ordered} \le 0$ hoặc để trống.
* **E2.2.** Hệ thống hiển thị cảnh báo tại ô nhập: *"Số lượng đặt mua phải là số nguyên lớn hơn 0."* và không cho phép xác nhận đơn.

### E3. Ngày hẹn giao hàng không hợp lệ (Invalid Promised Date)
* **E3.1.** Người dùng chọn Ngày hẹn giao trước Ngày tạo đơn ($\text{Promised Date} < \text{Order Date}$).
* **E3.2.** Hệ thống hiển thị cảnh báo: *"Ngày hẹn giao hàng dự kiến không thể trước ngày tạo đơn. Vui lòng chọn lại ngày hẹn giao."*

---

## 7. Business Rules Applied (Quy Tắc Nghiệp Vụ Áp Dụng)

* **BR-001 (Cập nhật On-Order khi xác nhận đơn):** Ngay khi đơn chuyển trạng thái sang `ORDERED`, hệ thống tự động cộng $\text{On-Order} += Q_{ordered}$, giúp vị trí tồn kho $\text{IP}$ tăng lên và chống gợi ý mua trùng lặp tại `UC-010`.
* **BR-017 (Máy trạng thái đơn mua hàng):** Quản lý vòng đời đơn theo các trạng thái chuẩn hóa: `DRAFT` $\rightarrow$ `ORDERED` $\rightarrow$ `RECEIVED` / `CANCELLED`.
* **BR-024 (Quy tắc sinh mã PO):** Mã đơn mua tự động sinh duy nhất có định dạng: `PO-YYYYMMDD-XXXX` (ví dụ: `PO-20260902-0001`).
* **BR-025 (Quy tắc khóa đơn hàng - Order Locking):**
  * `DRAFT`: Toàn quyền chỉnh sửa sản phẩm, số lượng, đơn giá hoặc xóa đơn nháp.
  * `ORDERED`: Khóa cứng không cho chỉnh sửa danh sách sản phẩm và số lượng để bảo toàn tính nhất quán kiểm toán và dữ liệu tồn kho.
* **BR-026 (Ngày hẹn giao hàng mặc định):** $\text{Promised Date} = \text{Order Date} + LT_{supplier}$ (cho phép người dùng tùy chỉnh tăng/giảm theo thỏa thuận thực tế).

---

## 8. Related Requirements (Yêu Cầu Chức Năng Liên Quan)

* **FR-026:** Hệ thống cho phép nhân viên mua hàng chọn các sản phẩm từ danh sách khuyến nghị để tạo Đơn mua hàng (trạng thái ban đầu: `DRAFT`).
* **FR-027:** Hệ thống cho phép nhân viên mua hàng chỉnh sửa số lượng mua thực tế hoặc chọn đổi nhà cung cấp khác theo đánh giá cá nhân trước khi chốt đơn.
* **FR-028:** Hệ thống cho phép nhân viên mua hàng thêm các sản phẩm ngoài danh sách khuyến nghị vào đơn mua hàng nếu có nhu cầu phát sinh.
* **FR-029:** Hệ thống cho phép nhân viên mua hàng trực tiếp bấm xác nhận hoàn tất để chuyển trạng thái đơn sang `ORDERED` (khóa đơn và tự động tăng lượng $\text{On-Order}$ của sản phẩm).

