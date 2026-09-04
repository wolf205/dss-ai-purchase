# Use Case Specification: UC-014 - Ghi Nhận Nhận Hàng & Cập Nhật Tồn Kho

---

## 1. Basic Information

* **Use Case ID:** `UC-014`
* **Use Case Name:** Ghi nhận nhận hàng & Cập nhật tồn kho (Goods Receipt & Stock Update)
* **Primary Actor:** `Purchasing Staff`
* **Supporting Actor:** `System Admin` (Xem và giám sát - Read-only)
* **Goal:** Nhân viên mua hàng muốn ghi nhận kết quả giao hàng thực tế từ nhà cung cấp cho một đơn mua hàng đang chờ giao (`ORDERED`), bao gồm: Ngày thực giao ($\text{Actual Delivery Date}$), Số lượng thực giao ($Q_{delivered}$), Số lượng hàng lỗi/hỏng ($Q_{defective}$), từ đó hệ thống tự động tính số lượng thực nhập kho đạt chuẩn ($Q_{accepted} = Q_{delivered} - Q_{defective}$), thực hiện giao dịch nguyên tử (Atomic Database Transaction): (1) Tăng tồn kho thực tế $\text{On-Hand} += Q_{accepted}$; (2) Giảm trừ giải phóng lượng hàng chờ về $\text{On-Order} = \max(0, \text{On-Order} - Q_{ordered})$; (3) Chuyển trạng thái đơn hàng sang `RECEIVED`; (4) Tự động ghi nhật ký vào bảng `DeliveryHistory` để phục vụ đánh giá hiệu suất NCC (`UC-009`).
* **Trigger:** Nhân viên kiểm đếm hàng thực tế do đối tác giao đến cửa hàng, mở hệ thống và bấm nút "Nhận hàng" từ danh sách đơn mua `UC-013` hoặc màn hình Chi tiết đơn hàng.

---

## 2. Preconditions

1. Người dùng (`Purchasing Staff` hoặc `System Admin`) đã đăng nhập thành công vào hệ thống.
2. Đơn mua hàng được chọn đang ở đúng trạng thái **`ORDERED`** (Đang chờ giao).

---

## 3. Postconditions

### 3.1. Thành công (Success End Condition):
* Hệ thống thực thi một giao dịch cơ sở dữ liệu nguyên tử (Atomic Transaction):
  1. **Cập nhật Tồn kho thực tế:** Tăng $\text{On-Hand} += Q_{accepted}$ (với $Q_{accepted} = Q_{delivered} - Q_{defective}$) cho từng sản phẩm trong đơn.
  2. **Giải phóng Hàng đang chờ giao:** Giảm trừ $\text{On-Order} = \max(0, \text{On-Order} - Q_{ordered})$ đảm bảo $\text{On-Order} \ge 0$ ngay cả khi đối tác giao dư hàng.
  3. **Đóng đơn hàng:** Chuyển trạng thái đơn hàng sang **`RECEIVED`** (Đã nhận hàng), ghi nhận thời gian nhận, người nhận và ghi chú nghiệm thu.
  4. **Ghi nhật ký hiệu suất:** Ghi nhận bản ghi mới vào bảng `DeliveryHistory` (PO ID, Supplier ID, Ngày hẹn, Ngày thực giao, $Q_{ordered}, Q_{delivered}, Q_{defective}, Q_{accepted}$, Đạt OTIF hay không).
  5. **Tự động làm mới hệ thống:** Tự động kích hoạt chạy ngầm `UC-011` để cập nhật lại Dashboard tồn kho `UC-004` và gỡ bỏ sản phẩm khỏi danh sách khuyến nghị mua `UC-010`.
* Hiển thị thông báo thành công và biên bản giao nhận hàng hóa.

### 3.2. Thất bại (Failure End Condition):
* Toàn bộ giao dịch bị hủy bỏ (Rollback $100\%$), số lượng $\text{On-Hand}$ và $\text{On-Order}$ giữ nguyên, đơn hàng vẫn ở trạng thái `ORDERED`; hệ thống hiển thị thông báo lỗi chi tiết.

---

## 4. Main Success Flow (Ghi nhận nhận hàng thực tế)

| Step | Actor (Purchasing Staff) | System |
| :---: | :--- | :--- |
| **1** | Bấm nút **"Nhận hàng"** tại đơn hàng `ORDERED` (từ `UC-013`). | Mở form/màn hình "Phiếu ghi nhận nhận hàng":<br>- Hiển thị Mã PO, Tên Nhà cung cấp, Ngày tạo đơn, Ngày hẹn giao ($\text{Promised Date}$).<br>- Mặc định **Ngày nhận hàng thực tế** ($\text{Actual Date}$) là ngày hôm nay.<br>- Bảng chi tiết sản phẩm: Mã SKU, Tên, ĐVT, Số lượng đặt ($Q_{ordered}$), Ô nhập Số lượng thực giao ($Q_{delivered}$, mặc định điền $= Q_{ordered}$), Ô nhập Số lượng lỗi/hỏng ($Q_{defective}$, mặc định điền $= 0$), và Cột Số lượng thực nhập ($Q_{accepted} = Q_{delivered} - Q_{defective}$). |
| **2** | Kiểm tra Ngày nhận hàng thực tế và nhập thông tin kiểm đếm thực tế cho từng dòng SKU:<br>- Nhập số lượng nhà cung cấp thực tế mang đến ($Q_{delivered}$).<br>- Nhập số lượng hàng bị móp méo, vỡ, hết hạn, không đạt chuẩn ($Q_{defective}$). | Tự động tính toán lại Số lượng thực nhập $Q_{accepted} = Q_{delivered} - Q_{defective}$ và đánh giá sơ bộ tiêu chí OTIF (Đúng hạn & Đủ lượng). |
| **3** | Nhập Ghi chú nhận hàng (nếu có) và nhấn nút **"Xác nhận nhận hàng & Nhập kho"**. | Hiển thị hộp thoại tóm tắt xác nhận nghiệm thu: Tổng số lượng đặt, Tổng số lượng thực nhập, Số lượng lỗi, Trạng thái giao hàng (Đúng hạn / Trễ hạn). |
| **4** | Nhấn "Xác nhận nhập kho". | Thực hiện Giao dịch nguyên tử (Atomic Database Transaction):<br>1. Cập nhật $\text{On-Hand} += Q_{accepted}$ cho từng SKU (`BR-001`).<br>2. Cập nhật $\text{On-Order} = \max(0, \text{On-Order} - Q_{ordered})$ cho từng SKU (`BR-001`).<br>3. Chuyển trạng thái đơn sang `RECEIVED` (`BR-025`).<br>4. Đánh giá cờ OTIF: $\text{OTIF} = 1$ nếu $\text{Actual Date} \le \text{Promised Date}$ VÀ $Q_{delivered} \ge Q_{ordered}$; ngược lại $\text{OTIF} = 0$ (`BR-012`).<br>5. Lưu bản ghi vào bảng `DeliveryHistory` (`BR-019`).<br>6. Tự động kích hoạt `UC-011` chạy ngầm. |
| **5** | | Hiển thị thông báo thành công: *"Đã ghi nhận nhận hàng cho đơn [PO-Code] và nhập kho [N] sản phẩm thành công!"* kèm nút *"In phiếu nhập kho"* hoặc *"Quay về Quản lý đơn hàng"*. |

---

## 5. Alternative Flows

### A1. Phím tắt "Nhận đủ 100% không lỗi" (Quick 1-Click Accept)
* **A1.1.** Tại Bước 2 của Main Flow, nếu kiểm đếm thấy đối tác giao đúng số lượng và không có hàng lỗi nào.
* **A1.2.** Người dùng nhấn nút **"Nhận đủ 100% chuẩn"** trên thanh công cụ.
* **A1.3.** Hệ thống tự động điền toàn bộ $Q_{delivered} = Q_{ordered}$ và $Q_{defective} = 0 \rightarrow Q_{accepted} = Q_{ordered}$ cho tất cả các dòng sản phẩm và chuyển thẳng đến Bước 3.

### A2. Ghi nhận giao hàng trễ hẹn hoặc thiếu hàng
* **A2.1.** Đối tác giao trễ hơn ngày hẹn ($\text{Actual Date} > \text{Promised Date}$) hoặc giao thiếu ($Q_{delivered} < Q_{ordered}$).
* **A2.2.** Người dùng nhập số liệu thực tế $\rightarrow$ Hệ thống tự động đánh dấu $\text{OTIF} = 0$ cho lần giao này và lưu vào `DeliveryHistory` (phục vụ trừ điểm $S_{otif}$ của NCC trong `UC-009`).
* **A2.3.** Số lượng hàng thiếu sẽ được giải phóng khỏi $\text{On-Order}$ và tự động kích hoạt `UC-011` để gợi ý mua bù nếu cần.

### A3. Xuất hoặc In Phiếu Nhập Kho (Goods Receipt Note)
* **A3.1.** Sau khi hoàn tất nhận hàng, người dùng bấm nút "In phiếu nhập kho" hoặc "Xuất file PDF".
* **A3.2.** Hệ thống tạo mẫu Phiếu nhập kho (Goods Receipt Note) thể hiện chi tiết: Mã PO, Người giao, Người nhận, Số lượng giao, Số lượng lỗi, Số lượng thực nhập và chữ ký thủ kho.

---

## 6. Exception Flows

### E1. Số lượng hàng lỗi lớn hơn số lượng thực giao ($Q_{defective} > Q_{delivered}$)
* **E1.1.** Tại Bước 2, người dùng nhập số lượng lỗi lớn hơn số lượng thực nhận.
* **E1.2.** Hệ thống hiển thị cảnh báo lỗi màu đỏ tại ô nhập: *"Số lượng hàng lỗi không thể lớn hơn số lượng thực giao. Vui lòng kiểm tra lại."* và không cho phép xác nhận.

### E2. Giá trị số lượng là số âm
* **E2.1.** Người dùng nhập $Q_{delivered} < 0$ hoặc $Q_{defective} < 0$.
* **E2.2.** Hệ thống báo lỗi: *"Số lượng phải là số nguyên không âm ($\ge 0$)."*

### E3. Đơn hàng không ở trạng thái `ORDERED`
* **E3.1.** Người dùng cố gắng mở form nhận hàng của một đơn hàng đang ở trạng thái `DRAFT`, `RECEIVED` hoặc `CANCELLED`.
* **E3.2.** Hệ thống từ chối mở form và thông báo: *"Chỉ có thể ghi nhận nhận hàng cho các đơn hàng đang ở trạng thái Đang chờ giao (ORDERED)."*

---

## 7. Business Rules Applied (Quy Tắc Nghiệp Vụ Áp Dụng)

* **BR-001 (Cập nhật tồn kho 2 chiều an toàn):**
  * Tăng tồn kho thực tế $\text{On-Hand} += Q_{accepted}$ (với $Q_{accepted} = Q_{delivered} - Q_{defective}$).
  * Giảm trừ lượng hàng chờ giao $\text{On-Order} = \max(0, \text{On-Order} - Q_{ordered})$.
* **BR-012 (Quy tắc đánh giá tiêu chí OTIF):**
  * $\text{OTIF} = 1$ (Đạt) khi thỏa mãn đồng thời: $\text{Actual Delivery Date} \le \text{Promised Delivery Date}$ VÀ $Q_{delivered} \ge Q_{ordered}$.
  * $\text{OTIF} = 0$ (Không đạt) nếu vi phạm một trong hai điều kiện trên.
* **BR-017 (Máy trạng thái đơn mua hàng):** Chuyển trạng thái đơn từ `ORDERED` sang `RECEIVED` sau khi nhận hàng.
* **BR-018 (Quy tắc nhận hàng & Cập nhật tồn kho nguyên tử):** Thực hiện trong 1 giao dịch cơ sở dữ liệu (Atomic Transaction): tăng On-Hand, giảm On-Order, cập nhật trạng thái đơn.
* **BR-019 (Ghi nhận nhật ký giao hàng):** Lưu bản ghi giao hàng vào bảng `DeliveryHistory` (nguồn dữ liệu phục vụ tính 4 điểm thành phần tại `UC-009`).
* **BR-025 (Khóa đơn hàng hoàn tất):** Chuyển trạng thái đơn sang `RECEIVED` và khóa vĩnh viễn (Terminal State).

---

## 8. Related Requirements (Yêu Cầu Chức Năng Liên Quan)

* **FR-017:** Hệ thống cung cấp màn hình để nhân viên mua hàng ghi nhận kết quả nhận hàng thực tế từ nhà cung cấp (chọn đơn hàng, ngày nhận thực tế, số lượng giao tới $Q_{delivered}$, số lượng hàng lỗi $Q_{defective}$).
* **FR-018:** Hệ thống tự động cộng số lượng thực nhập kho đạt chuẩn ($Q_{accepted} = Q_{delivered} - Q_{defective}$) vào tồn kho $\text{On-Hand}$, đồng thời giải phóng lượng $\text{On-Order}$ tương ứng ngay sau khi xác nhận nhận hàng.

