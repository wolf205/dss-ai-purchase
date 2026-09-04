# Use Case Specification: UC-003 - Nạp Dữ Liệu Bán Hàng & Tồn Kho

---

## 1. Basic Information

* **Use Case ID:** `UC-003`
* **Use Case Name:** Nạp dữ liệu bán hàng & tồn kho (Sales & Inventory Data Ingestion)
* **Primary Actor:** `Purchasing Staff`
* **Supporting Actor:** `System Admin`
* **Goal:** Người dùng muốn nạp dữ liệu lịch sử bán hàng theo ngày hoặc dữ liệu kiểm kê tồn kho thực tế vào hệ thống (thông qua tệp tin Excel/CSV hoặc form nhập liệu nhanh) nhằm cung cấp dữ liệu đầu vào chính xác cho mô hình dự báo AI và thuật toán phân tích tồn kho.
* **Trigger:** 
  * Định kỳ hàng ngày/hàng tuần, nhân viên xuất file báo cáo bán hàng từ phần mềm thu ngân (POS) và truy cập màn hình "Nạp dữ liệu" để import vào hệ thống.
  * Định kỳ kiểm kho (hoặc khi khởi tạo hệ thống ban đầu), nhân viên nạp file ảnh chụp tồn kho thực tế trên kệ.
  * Nhân viên hoặc Quản trị viên cần nhập bù/điều chỉnh thủ công số lượng bán hoặc tồn kho của một vài mặt hàng phát sinh đột xuất qua form.

---

## 2. Preconditions

1. Người dùng (`Purchasing Staff` hoặc `System Admin`) đã đăng nhập thành công vào hệ thống.
2. Danh mục sản phẩm (`UC-001`) đã tồn tại trên hệ thống để kiểm tra tính hợp lệ của mã SKU.
3. Tệp tin import (nếu dùng) có định dạng hợp lệ (.xlsx, .xls, hoặc .csv) theo cấu trúc mẫu của hệ thống.

---

## 3. Postconditions

### 3.1. Thành công (Success End Condition):
* **Nếu nạp Lịch sử bán hàng:** Dữ liệu bán hàng theo ngày (Mã SKU, Ngày bán, Số lượng bán, Doanh thu) được lưu vào bảng lịch sử giao dịch; hệ thống cập nhật số ngày dữ liệu tích lũy ($N_{days}$) để phân tầng xử lý (`COLD_START`, `BASIC_FORECAST`, `AI_READY`).
* **Nếu nạp Tồn kho kiểm kê:** Số lượng tồn kho thực tế ($\text{On-Hand}$) của các sản phẩm tương ứng được cập nhật giá trị mới nhất.
* Hệ thống ghi nhận lịch sử lần nạp (Thời gian, Người nạp, Loại dữ liệu, Tên file, Số dòng thành công, Số dòng lỗi).
* Hiển thị thông báo thành công kèm nút bấm nhanh chuyển sang màn hình phân tích/khuyến nghị.

### 3.2. Thất bại (Failure End Condition):
* Toàn bộ dữ liệu của tệp tin bị lỗi không được ghi vào cơ sở dữ liệu (đảm bảo tính toàn vẹn giao dịch All-or-Nothing); hệ thống hiển thị bảng chi tiết các dòng bị lỗi (số dòng, mã SKU, nguyên nhân lỗi) để người dùng sửa đổi.

---

## 4. Main Success Flow (Nạp dữ liệu hàng loạt qua file Excel/CSV)

| Step | Actor (Purchasing Staff / Admin) | System |
| :---: | :--- | :--- |
| **1** | Truy cập màn hình "Nạp dữ liệu bán hàng & tồn kho". | Hiển thị giao diện nạp dữ liệu gồm: Chọn loại dữ liệu (Lịch sử bán hàng / Tồn kho kiểm kê), Khu vực tải file, Bảng xem trước dữ liệu (Preview), Tab form nhập tay và Lịch sử các lần import trước. |
| **2** | Chọn loại dữ liệu muốn nạp:<br>- **Lựa chọn 1 (Mặc định):** *Lịch sử bán hàng (Sales History)*.<br>- **Lựa chọn 2:** *Tồn kho kiểm kê thực tế (Inventory Snapshot)*. | Cập nhật cấu trúc mẫu và hướng dẫn kiểm tra tương ứng với loại dữ liệu đã chọn. |
| **3** | Kéo-thả hoặc bấm chọn tệp tin dữ liệu (.xlsx, .csv) từ máy tính. | Đọc cấu trúc tệp tin, kiểm tra sơ bộ định dạng file và hiển thị tên file, dung lượng. |
| **4** | Nhấn nút "Kiểm tra dữ liệu" (Validate Data). | Thực hiện kiểm tra tính hợp lệ toàn bộ các dòng trong file (Validation):<br>- **Nếu nạp Bán hàng:** Cột bắt buộc gồm `SKU`, `Date`, `Quantity_Sold` (cột `Revenue` tùy chọn; nếu thiếu cột này, hệ thống tự động tính $\text{Revenue} = \text{Quantity\_Sold} \times \text{Giá bán niêm yết}$ từ `UC-001`).<br>- **Nếu nạp Tồn kho:** Cột bắt buộc gồm `SKU`, `Stock_On_Hand`.<br>- Kiểm tra Mã SKU có tồn tại trong Danh mục sản phẩm (`UC-001`) không.<br>- Kiểm tra định dạng ngày tháng hợp lệ (`YYYY-MM-DD` hoặc `DD/MM/YYYY`).<br>- Kiểm tra các giá trị số lượng phải là số nguyên $\ge 0$. |
| **5** | | Hiển thị bảng Xem trước dữ liệu (Data Preview) kèm thống kê tổng quan: Tổng số dòng, Số dòng hợp lệ (màu xanh), Số dòng lỗi (màu đỏ kèm chi tiết lỗi). |
| **6** | Kiểm tra thông tin xem trước và nhấn nút "Xác nhận nạp dữ liệu". | Thực hiện giao dịch lưu dữ liệu vào hệ thống:<br>- Ghi nhận lịch sử bán hàng hoặc cập nhật tồn kho $\text{On-Hand}$.<br>- Cập nhật số ngày lịch sử $N_{days}$ của SKU.<br>- Lưu log lịch sử import. |
| **7** | | Hiển thị thông báo thành công: *"Nạp dữ liệu thành công [X] dòng vào hệ thống"*, cập nhật bảng Lịch sử nạp và hiển thị gợi ý *"Bạn có thể bấm [Chạy lại phân tích] để cập nhật kết quả dự báo mới nhất"*. |

---

## 5. Alternative Flows

### A1. Nhập liệu nhanh thủ công qua Form giao diện
* **A1.1.** Tại màn hình nạp dữ liệu, người dùng chuyển sang tab "Nhập liệu thủ công".
* **A1.2.** Người dùng chọn loại cập nhật: *"Ghi nhận lượng bán ngày"* hoặc *"Điều chỉnh tồn kho kiểm kê"*.
* **A1.3.** Người dùng chọn **Sản phẩm (SKU)**, chọn **Ngày ghi nhận**, và nhập **Số lượng** $\ge 0 \rightarrow$ Nhấn "Lưu bản ghi".
* **A1.4.** Hệ thống kiểm tra hợp lệ $\rightarrow$ Lưu bản ghi vào cơ sở dữ liệu $\rightarrow$ Cập nhật tồn kho/lịch sử bán tức thời $\rightarrow$ Hiển thị thông báo *"Cập nhật dữ liệu thành công"*.

### A2. Tải tệp tin mẫu (Download Template)
* **A2.1.** Người dùng chọn loại dữ liệu và nhấn nút "Tải file mẫu Excel" hoặc "Tải file mẫu CSV".
* **A2.2.** Hệ thống tạo và tải về máy tính file mẫu chuẩn tương ứng chứa các cột bắt buộc và 2-3 dòng dữ liệu ví dụ minh họa.

### A3. Xử lý ghi đè dữ liệu bán hàng trùng ngày (Overwriting Duplicate Date Records)
* **A3.1.** Nếu tệp tin nạp bán hàng chứa bản ghi của SKU X vào ngày Y mà trong hệ thống đã có sẵn dữ liệu của ngày Y:
* **A3.2.** Hệ thống hiển thị cảnh báo: *"Phát hiện [N] bản ghi trùng ngày với dữ liệu đã có. Bạn có muốn ghi đè dữ liệu cũ bằng số liệu mới trong file không?"*
* **A3.3.** Người dùng chọn "Đồng ý ghi đè" (hoặc "Bỏ qua các dòng trùng").
* **A3.4.** Hệ thống thực hiện cập nhật theo đúng lựa chọn của người dùng.

---

## 6. Exception Flows

### E1. Tệp tin sai định dạng hoặc vượt dung lượng (Invalid File Format / Size)
* **E1.1.** Tại Bước 3 của Main Flow, người dùng chọn file không phải đuôi `.xlsx, .xls, .csv` hoặc dung lượng vượt quá giới hạn ($> 10\text{ MB}$).
* **E1.2.** Hệ thống từ chối nhận file và hiển thị cảnh báo lỗi: *"Định dạng file không được hỗ trợ hoặc dung lượng vượt quá 10MB. Vui lòng chọn file Excel hoặc CSV hợp lệ."*
* **E1.3.** Người dùng chọn lại file khác.

### E2. Tệp tin chứa dòng lỗi dữ liệu (Batch Validation Failure)
* **E2.1.** Tại Bước 4 của Main Flow, hệ thống phát hiện các lỗi:
  * Mã SKU trong file không tồn tại trong danh mục hệ thống.
  * Định dạng ngày tháng bị sai hoặc để trống.
  * Số lượng bán hoặc tồn kho là số âm, chứa chữ cái hoặc ký tự đặc biệt.
* **E2.2.** Hệ thống hiển thị bảng danh sách lỗi chi tiết (Số thứ tự dòng, Cột bị lỗi, Giá trị sai, Hướng dẫn sửa) và **vô hiệu hóa nút "Xác nhận nạp dữ liệu"**.
* **E2.3.** Người dùng tải file về chỉnh sửa lại các dòng lỗi theo hướng dẫn và tiến hành upload lại từ Bước 3.

### E3. Mất kết nối trong quá trình nạp dữ liệu (Transaction Failure)
* **E3.1.** Tại Bước 6 của Main Flow, xảy ra sự cố gián đoạn mạng hoặc lỗi máy chủ cơ sở dữ liệu.
* **E3.2.** Hệ thống tự động rollback toàn bộ giao dịch (không lưu dở dang một phần file để tránh sai lệch dữ liệu) và hiển thị thông báo lỗi: *"Quá trình nạp dữ liệu bị gián đoạn. Không có dữ liệu nào được lưu. Vui lòng thử lại sau."*

---

## 7. Business Rules Applied (Quy Tắc Nghiệp Vụ Áp Dụng)

* **BR-001 (Vị trí tồn kho & On-Hand):** Số lượng tồn kho nạp từ file kiểm kê được ghi nhận trực tiếp thành tồn kho thực tế $\text{On-Hand}$ mới nhất của cửa hàng.
* **BR-006 (Phân tầng dữ liệu dự báo):** Dữ liệu chuỗi thời gian bán hàng nạp vào là căn cứ để hệ thống đếm số ngày lịch sử tích lũy ($N_{days}$):
  * $N_{days} < 14$: Gán trạng thái `COLD_START`.
  * $14 \le N_{days} < 30$: Gán trạng thái `BASIC_FORECAST` (kích hoạt SMA-7).
  * $N_{days} \ge 30$: Gán trạng thái `AI_READY` (kích hoạt Machine Learning).
* **BR-008 (Kích hoạt phân tích):** Nạp dữ liệu mới thành công là một trong các trigger làm mới dữ liệu đầu vào cho quy trình dự báo và gợi ý mua hàng.
* **BR-009 (Tính doanh thu bán hàng):** Nếu tệp tin nạp không chứa sẵn cột Doanh thu (Revenue), hệ thống tự động suy diễn $\text{Revenue} = \text{Quantity\_Sold} \times \text{Selling Price}$ dựa trên `Giá bán niêm yết` đã khai báo trong danh mục sản phẩm (`UC-001`).

---

## 8. Related Requirements (Yêu Cầu Chức Năng Liên Quan)

* **FR-004:** Nạp dữ liệu lịch sử bán hàng và dữ liệu tồn kho hàng loạt thông qua tệp tin Excel/CSV.
* **FR-005:** Form nhập liệu nhanh để người dùng cập nhật hoặc điều chỉnh thủ công dữ liệu bán hàng và tồn kho trên giao diện.
* **FR-006:** Kiểm tra tính hợp lệ (validation) của dữ liệu đầu vào khi import file hoặc nhập form (thiếu trường, sai định dạng, số âm, trùng mã SKU).
