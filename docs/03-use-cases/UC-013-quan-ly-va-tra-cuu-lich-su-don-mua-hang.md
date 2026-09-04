# Use Case Specification: UC-013 - Quản Lý & Tra Cứu Lịch Sử Đơn Mua Hàng

---

## 1. Basic Information

* **Use Case ID:** `UC-013`
* **Use Case Name:** Quản lý & tra cứu lịch sử đơn mua hàng (Purchase Order Tracking & Management)
* **Primary Actor:** `Purchasing Staff`
* **Supporting Actor:** `System Admin` (Xem và giám sát - Read-only)
* **Goal:** Người dùng muốn tra cứu, tìm kiếm, lọc danh sách toàn bộ các đơn mua hàng theo mã đơn, nhà cung cấp, khoảng thời gian tạo đơn, hoặc trạng thái vòng đời (`DRAFT`, `ORDERED`, `RECEIVED`, `CANCELLED`); phát hiện kịp thời các đơn hàng đang chờ giao bị quá hạn (Overdue PO); xem chi tiết nội dung từng đơn; tiếp tục chỉnh sửa/xác nhận các đơn nháp (`DRAFT`); hủy đơn hàng đang chờ giao (`ORDERED`) kèm lý do và tự động hoàn trả số lượng $\text{On-Order}$ cũng như kích hoạt lại gợi ý mua hàng thay thế; hoặc chuyển nhanh sang màn hình nhận hàng (`UC-014`).
* **Trigger:** Người dùng truy cập màn hình "Quản lý đơn mua hàng" từ thanh điều hướng chính của hệ thống.

---

## 2. Preconditions

1. Người dùng (`Purchasing Staff` hoặc `System Admin`) đã đăng nhập thành công vào hệ thống.

---

## 3. Postconditions

### 3.1. Thành công (Success End Condition):
* Hệ thống hiển thị Bảng danh sách đơn mua hàng kèm bộ lọc đa tiêu chí (Mã PO, Nhà cung cấp, Trạng thái, Khung thời gian, Đơn hàng quá hạn).
* Người dùng có thể:
  * Xem chi tiết đầy đủ thông tin một đơn hàng (Thông tin NCC, Ngày đặt, Ngày hẹn giao, Bảng chi tiết SKU, Tổng tiền, Lịch sử thay đổi trạng thái).
  * Phát hiện ngay các đơn hàng trễ giao qua nhãn cảnh báo đỏ: ⚠️ **`QUÁ HẠN ([N] ngày)`**.
  * Tiếp tục chỉnh sửa hoặc bấm "Xác nhận đặt hàng" đối với đơn `DRAFT` (chuyển sang `ORDERED` và tăng $\text{On-Order}$).
  * Xóa bỏ hoàn toàn đơn hàng `DRAFT`.
  * Hủy đơn hàng đang chờ giao `ORDERED` (chuyển sang `CANCELLED`, tự động giảm trừ hoàn trả $\text{On-Order}$, và tự động kích hoạt `UC-011` để đưa SKU trở lại danh sách khuyến nghị mua thay thế).
  * Chuyển nhanh sang màn hình Nhận hàng (`UC-014`) đối với đơn `ORDERED`.
  * Xuất tệp tin PDF/Excel hoặc in phiếu mua hàng (`FR-027`).

### 3.2. Thất bại (Failure End Condition):
* Không thể tải dữ liệu đơn hàng do lỗi cơ sở dữ liệu; hệ thống hiển thị thông báo lỗi và nút "Thử lại".

---

## 4. Main Success Flow (Tra cứu & Xem chi tiết đơn mua hàng)

| Step | Actor (Purchasing Staff / Admin) | System |
| :---: | :--- | :--- |
| **1** | Truy cập màn hình "Quản lý đơn mua hàng". | Truy vấn danh sách toàn bộ đơn mua hàng trong hệ thống, sắp xếp mặc định theo Ngày tạo đơn mới nhất lên đầu. |
| **2** | | Hiển thị giao diện Quản lý đơn mua hàng gồm:<br>- **Thanh thống kê tổng quan:** Số đơn DRAFT, Số đơn đang chờ giao ORDERED, Số đơn Quá hạn giao (màu đỏ), Số đơn đã nhận RECEIVED, Số đơn đã hủy CANCELLED.<br>- **Bộ lọc đa năng:** Ô tìm kiếm mã PO/NCC, Dropdown Trạng thái, Bộ chọn khoảng ngày, Thẻ lọc nhanh *"Đơn hàng quá hạn"*.<br>- **Bảng danh sách đơn hàng:** Mã PO, Nhà cung cấp, Ngày tạo, Ngày hẹn giao, Tổng số SKU, Tổng tiền, Nhãn trạng thái màu trực quan (kèm cờ `QUÁ HẠN` nếu $\text{Today} > \text{Promised Date}$ và đơn chưa nhận), Cột thao tác.<br>- **Nút bấm:** "Tạo đơn mua mới" (`UC-012`). |
| **3** | Nhập từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái/thời gian/quá hạn. | Hệ thống lọc tức thời và cập nhật lại danh sách đơn hàng thỏa mãn. |
| **4** | Click vào một mã đơn hàng bất kỳ để xem chi tiết. | Hiển thị màn hình/modal Chi tiết đơn mua hàng với đầy đủ thông tin: Thông tin chung, Bảng danh sách sản phẩm, Thành tiền, Trạng thái hiện tại và các nút hành động phù hợp với trạng thái của đơn. |

---

## 5. Alternative Flows

### A1. Hủy đơn hàng đang chờ giao (`ORDERED` $\rightarrow$ `CANCELLED`)
* **A1.1.** Tại màn hình chi tiết của một đơn hàng đang ở trạng thái `ORDERED`, người dùng nhấn nút **"Hủy đơn hàng"**.
* **A1.2.** Hệ thống hiển thị hộp thoại xác nhận hủy đơn:
  * Bắt buộc người dùng nhập **Lý do hủy đơn** (ví dụ: *"Nhà cung cấp hết hàng"*, *"Thay đổi kế hoạch kinh doanh"*...).
  * Cảnh báo: *"Sau khi hủy, trạng thái đơn sẽ chuyển thành CANCELLED, hệ thống sẽ tự động hoàn trả trừ [N] số lượng hàng đang chờ về (On-Order) và tự động đưa các sản phẩm bị thiếu trở lại danh sách khuyến nghị mua hàng."*
* **A1.3.** Người dùng nhập lý do và nhấn "Xác nhận hủy đơn".
* **A1.4.** Hệ thống thực hiện giao dịch cập nhật:
  1. Chuyển trạng thái đơn sang `CANCELLED`, ghi nhận thời gian hủy, người hủy và lý do hủy.
  2. Tự động giảm trừ số lượng hàng đang chờ về: $\text{On-Order} -= Q_{ordered}$ cho toàn bộ các SKU có trong đơn (`BR-001`).
  3. Tự động kích hoạt chạy ngầm `UC-011` để cập nhật lại $\text{IP}$ và sinh lại khuyến nghị cho các SKU vừa bị hủy.
  4. Khóa vĩnh viễn đơn hàng này (Terminal State).
* **A1.5.** Hệ thống hiển thị thông báo: *"Đã hủy đơn hàng [PO-Code] thành công, hoàn trả On-Order và cập nhật lại khuyến nghị mua hàng."*

### A2. Chỉnh sửa và xác nhận đơn hàng Nháp (`DRAFT` $\rightarrow$ `ORDERED`)
* **A2.1.** Người dùng mở một đơn hàng đang ở trạng thái `DRAFT` và nhấn "Chỉnh sửa đơn hàng".
* **A2.2.** Hệ thống mở form chỉnh sửa cho phép thêm/sửa/xóa dòng sản phẩm, điều chỉnh số lượng hoặc đơn giá (`UC-012`).
* **A2.3.** Người dùng nhấn "Xác nhận đặt hàng" $\rightarrow$ Hệ thống chuyển trạng thái đơn sang `ORDERED`, tăng $\text{On-Order} += Q_{ordered}$ và khóa đơn theo `BR-025`.

### A3. Xóa bỏ đơn hàng Nháp (`DRAFT`)
* **A3.1.** Người dùng nhấn nút "Xóa đơn" tại dòng đơn hàng có trạng thái `DRAFT`.
* **A3.2.** Hệ thống hiển thị popup xác nhận xóa $\rightarrow$ Người dùng nhấn "Đồng ý".
* **A3.3.** Hệ thống xóa bản ghi đơn nháp khỏi cơ sở dữ liệu và làm mới lại danh sách (do đơn DRAFT chưa cộng $\text{On-Order}$ nên không ảnh hưởng đến số liệu tồn kho).

### A4. Điều hướng sang ghi nhận Nhận hàng (`UC-014`)
* **A4.1.** Tại dòng của một đơn hàng đang ở trạng thái `ORDERED` (hoặc trong màn hình chi tiết đơn), người dùng nhấn nút hành động nhanh **"Nhận hàng"**.
* **A4.2.** Hệ thống chuyển tiếp trực tiếp sang màn hình `UC-014: Ghi nhận nhận hàng & Cập nhật tồn kho` với đầy đủ thông tin mã PO và danh sách sản phẩm đã được điền sẵn.

---

## 6. Exception Flows

### E1. Cố gắng hủy hoặc sửa đơn hàng đã hoàn tất (`RECEIVED` / `CANCELLED`)
* **E1.1.** Người dùng cố gắng thực hiện hành động chỉnh sửa hoặc hủy trên một đơn hàng đã có trạng thái `RECEIVED` hoặc `CANCELLED`.
* **E1.2.** Hệ thống vô hiệu hóa các nút chỉnh sửa/hủy và hiển thị thông báo: *"Đơn hàng đã ở trạng thái đóng cuối cùng ([RECEIVED/CANCELLED]). Không thể chỉnh sửa hoặc thay đổi trạng thái."*

### E2. Không tìm thấy đơn hàng nào thỏa mãn bộ lọc (Empty Filter Results)
* **E2.1.** Người dùng tìm kiếm với từ khóa hoặc bộ lọc không khớp với bất kỳ đơn hàng nào.
* **E2.2.** Hệ thống hiển thị thông báo: *"Không tìm thấy đơn mua hàng nào phù hợp với điều kiện tìm kiếm"* kèm nút "Xóa bộ lọc".

---

## 7. Business Rules Applied (Quy Tắc Nghiệp Vụ Áp Dụng)

* **BR-001 (Hoàn trả On-Order khi hủy đơn):** Khi đơn hàng `ORDERED` bị chuyển sang `CANCELLED`, hệ thống tự động giảm trừ $\text{On-Order} -= Q_{ordered}$ để giải phóng tồn kho ảo, giúp các lần phân tích sau phản ánh đúng thực tế.
* **BR-017 (Máy trạng thái đơn mua hàng):** Quản lý và lọc danh sách đơn theo 4 trạng thái chuẩn: `DRAFT` $\rightarrow$ `ORDERED` $\rightarrow$ `RECEIVED` / `CANCELLED`.
* **BR-024 (Định dạng mã PO):** Quản lý và tìm kiếm theo định dạng mã đơn duy nhất `PO-YYYYMMDD-XXXX`.
* **BR-025 (Máy trạng thái & Khóa đơn hàng):**
  * `DRAFT`: Cho phép sửa, xóa, hoặc xác nhận thành `ORDERED`.
  * `ORDERED`: Khóa sửa đổi danh mục/số lượng; cho phép Hủy (`CANCELLED`) hoặc Nhận hàng (`RECEIVED`).
  * `RECEIVED` & `CANCELLED`: Trạng thái đóng cuối cùng (Terminal States) — Chỉ đọc (Read-only), không cho phép sửa đổi hay hoàn tác.

---

## 8. Related Requirements (Yêu Cầu Chức Năng Liên Quan)

* **FR-030:** Hệ thống lưu trữ và hiển thị danh sách lịch sử các Đơn mua hàng theo máy trạng thái 4 cấp: `DRAFT` $\rightarrow$ `ORDERED` $\rightarrow$ `RECEIVED` / `CANCELLED` (hỗ trợ lọc theo mã PO, nhà cung cấp, khoảng thời gian và trạng thái đơn).

