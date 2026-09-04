# Functional Requirements (Yêu Cầu Chức Năng)

Tài liệu này xác định các yêu cầu chức năng của **Hệ thống hỗ trợ ra quyết định mua hàng tích hợp AI**, được ánh xạ trực tiếp từ tài liệu *Scope Definition*.

---

## Nhóm 1: Quản lý Danh mục & Tiếp nhận Dữ liệu Đầu vào (Data Management & Ingestion)

* **FR-001:** Hệ thống cho phép Quản trị viên (Admin) và Nhân viên mua hàng xem, thêm mới, chỉnh sửa và vô hiệu hóa thông tin danh mục sản phẩm (mã SKU, tên sản phẩm, đơn vị tính, ngành hàng, giá vốn tham chiếu).
* **FR-002:** Hệ thống cho phép người dùng xem, thêm mới, chỉnh sửa và vô hiệu hóa thông tin nhà cung cấp (tên nhà cung cấp, thông tin liên hệ, danh mục sản phẩm cung cấp, giá nhập, MOQ - số lượng đặt hàng tối thiểu, Lead time cam kết).
* **FR-003:** Hệ thống cho phép người dùng cấu hình các tham số ngưỡng tồn kho cơ bản cho từng sản phẩm (Tồn kho an toàn tối thiểu, Lead time dự kiến).
* **FR-004:** Hệ thống cho phép người dùng nạp dữ liệu lịch sử bán hàng và dữ liệu tồn kho hàng loạt thông qua tệp tin định dạng Excel/CSV.
* **FR-005:** Hệ thống hỗ trợ form nhập liệu nhanh để người dùng cập nhật hoặc điều chỉnh thủ công dữ liệu bán hàng và tồn kho trực tiếp trên giao diện.
* **FR-006:** Hệ thống phải kiểm tra tính hợp lệ (validation) của dữ liệu đầu vào khi import file hoặc nhập form (báo lỗi nếu thiếu trường bắt buộc, sai định dạng ngày tháng, số âm hoặc trùng lặp mã SKU).

---

## Nhóm 2: Phân tích Tồn kho & Phân loại Sản phẩm (Inventory Analysis & ABC Classification)

* **FR-007:** Hệ thống hiển thị bảng và biểu đồ theo dõi số lượng tồn kho khả dụng hiện tại của toàn bộ danh mục sản phẩm.
* **FR-008:** Hệ thống tự động tính toán Tồn kho an toàn (Safety Stock) và Điểm đặt hàng lại (Reorder Point - ROP) cho từng sản phẩm theo quy tắc nghiệp vụ.
* **FR-009:** Hệ thống tự động phân loại danh mục sản phẩm theo ma trận kết hợp **ABC - XYZ Analysis** (dựa trên doanh số bán hàng và hệ số biến thiên nhu cầu $CV$).
* **FR-010:** Hệ thống tự động phát hiện và phân loại trạng thái rủi ro tồn kho của từng sản phẩm theo 5 cấp độ: `OUT_OF_STOCK`, `CRITICAL`, `WARNING`, `NORMAL`, `OVERSTOCK`.
* **FR-011:** Hệ thống tự động phát hiện và cảnh báo các sản phẩm tồn kho bất động (`DEAD_STOCK` - không bán được trong 30 ngày liên tục).

---

## Nhóm 3: Dự báo Nhu cầu Bán hàng (Demand Forecasting)

* **FR-012:** Hệ thống phân tích dữ liệu chuỗi thời gian lịch sử bán hàng theo ngày/tuần của từng sản phẩm.
* **FR-013:** Hệ thống áp dụng mô hình phân tích/AI để dự báo số lượng tiêu thụ dự kiến của sản phẩm theo các khung thời gian linh hoạt: **7 ngày, 14 ngày hoặc 30 ngày tới**.
* **FR-014:** Hệ thống trực quan hóa kết quả dự báo nhu cầu dưới dạng biểu đồ xu hướng (đường xu hướng tiêu thụ quá khứ kết hợp khoảng dự báo tương lai).
* **FR-015:** Hệ thống hiển thị chỉ số đánh giá sai số (WAPE, MAE) và tự động kích hoạt cơ chế Fallback về Trung bình trượt (SMA-7) khi sai số $\text{WAPE} > 40\%$.
* **FR-016:** Đối với các sản phẩm mới chưa đủ 14 ngày dữ liệu (Cold start), hệ thống hiển thị thông báo *"Chưa đủ dữ liệu lịch sử"* và cho phép nhân viên mua hàng chủ động nhập số lượng dự kiến theo kinh nghiệm.

---

## Nhóm 4: Đánh giá & Xếp hạng Hiệu suất Nhà Cung Cấp (Supplier Evaluation)

* **FR-017:** Hệ thống cung cấp màn hình để nhân viên mua hàng ghi nhận kết quả nhận hàng thực tế từ nhà cung cấp (chọn đơn hàng, ngày nhận thực tế, số lượng giao tới $Q_{delivered}$, số lượng hàng lỗi $Q_{defective}$).
* **FR-018:** Hệ thống tự động cộng số lượng thực nhập kho đạt chuẩn ($Q_{accepted} = Q_{delivered} - Q_{defective}$) vào tồn kho $\text{On-Hand}$, đồng thời giải phóng lượng $\text{On-Order}$ tương ứng ngay sau khi xác nhận nhận hàng.
* **FR-019:** Hệ thống tự động tính toán điểm hiệu suất tổng hợp của từng nhà cung cấp trên 10 lần giao gần nhất dựa trên 4 tiêu chí: $S_{otif}$ (Đúng hạn & Đủ hàng), $S_{quality}$ (Chất lượng), $S_{price}$ (Đơn giá cạnh tranh), $S_{leadtime}$ (Tốc độ giao).
* **FR-020:** Hệ thống hiển thị bảng xếp hạng và báo cáo chi tiết lịch sử hiệu suất của từng nhà cung cấp kèm lịch sử các đợt giao hàng.

---

## Nhóm 5: Khuyến nghị Mua hàng Thông minh (Explainable Purchase Recommendations)

* **FR-021:** Hệ thống tự động phân tích và hiển thị danh sách khuyến nghị mua hàng ngay khi người dùng truy cập màn hình Khuyến nghị mua hàng.
* **FR-022:** Hệ thống cung cấp nút *"Chạy lại phân tích"* để người dùng chủ động yêu cầu hệ thống tính toán lại danh sách khuyến nghị sau khi có cập nhật mới về dữ liệu bán hàng, tồn kho hoặc nhà cung cấp.
* **FR-023:** Mỗi mục khuyến nghị mua hàng phải bao gồm đầy đủ các thông tin: Sản phẩm cần mua, Phân nhóm ABC-XYZ, Số lượng đề xuất mua ($Q_{suggested}$ đã tính đến $\text{On-Order}$ và làm tròn theo MOQ/Pack Size), Thời điểm nên đặt hàng, Nhà cung cấp tối ưu được gợi ý.
* **FR-024:** Hệ thống hiển thị thông tin giải thích minh bạch lý do khuyến nghị (Explainable Insights) cho từng sản phẩm (ví dụ: số ngày tồn kho còn lại DoS, mức chạm ROP, nhu cầu dự báo chu kỳ tới, căn cứ lựa chọn nhà cung cấp).
* **FR-025:** Hệ thống tự động loại trừ các sản phẩm đã vô hiệu hóa (`IsActive = false`) và sản phẩm tồn bất động (`DEAD_STOCK`) khỏi danh sách khuyến nghị mua hàng.

---

## Nhóm 6: Lập & Quản lý Đơn Mua Hàng (Purchase Order Management)

* **FR-026:** Hệ thống cho phép nhân viên mua hàng chọn các sản phẩm từ danh sách khuyến nghị để tạo Đơn mua hàng (trạng thái ban đầu: `DRAFT`).
* **FR-027:** Hệ thống cho phép nhân viên mua hàng chỉnh sửa số lượng mua thực tế hoặc chọn đổi nhà cung cấp khác theo đánh giá cá nhân trước khi chốt đơn.
* **FR-028:** Hệ thống cho phép nhân viên mua hàng thêm các sản phẩm ngoài danh sách khuyến nghị vào đơn mua hàng nếu có nhu cầu phát sinh.
* **FR-029:** Hệ thống cho phép nhân viên mua hàng trực tiếp bấm xác nhận hoàn tất để chuyển trạng thái đơn sang `ORDERED` (khóa đơn và tự động tăng lượng $\text{On-Order}$ của sản phẩm).
* **FR-030:** Hệ thống lưu trữ và hiển thị danh sách lịch sử các Đơn mua hàng theo máy trạng thái 4 cấp: `DRAFT` $\rightarrow$ `ORDERED` $\rightarrow$ `RECEIVED` / `CANCELLED`.

---

## Nhóm 7: Quản trị Hệ thống & Phân quyền (System Administration & Configuration)

* **FR-031:** Hệ thống cung cấp chức năng đăng nhập, đăng xuất và quản lý phiên làm việc an toàn cho người dùng.
* **FR-032:** Hệ thống cung cấp màn hình quản lý tài khoản người dùng đơn giản cho Admin (xem danh sách, tạo tài khoản mới, cập nhật thông tin, đổi mật khẩu, kích hoạt/khóa tài khoản và gán vai trò Staff hoặc Admin).
* **FR-033:** Hệ thống phân quyền truy cập theo 2 vai trò:
  * **Admin:** Toàn quyền quản lý tài khoản, danh mục, cấu hình tham số và hệ thống.
  * **Purchasing Staff:** Thực hiện toàn bộ nghiệp vụ xem báo cáo, dự báo, khuyến nghị, lập phiếu đề xuất và ghi nhận nhận hàng.
* **FR-034:** Hệ thống cho phép Quản trị viên (Admin) tùy chỉnh tỷ trọng (trọng số %) của các tiêu chí đánh giá nhà cung cấp (Giá, Giao đúng hạn, Chất lượng, Lead Time).

