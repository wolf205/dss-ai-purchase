# Scope Definition: Hệ Thống Hỗ Trợ Ra Quyết Định Mua Hàng Tích Hợp AI

---

## 1. In Scope (Phạm vi nghiệp vụ trong hệ thống)

Dựa trên tài liệu *Business Problem*, hệ thống tập trung giải quyết các nhóm nghiệp vụ cốt lõi hỗ trợ nhân viên mua hàng của cửa hàng bán lẻ:

### 1.1. Quản lý dữ liệu danh mục & Tiếp nhận dữ liệu đầu vào
* Quản lý danh mục sản phẩm/hàng hóa (mã SKU, tên sản phẩm, đơn vị tính, nhóm ngành hàng, giá vốn tham chiếu).
* Quản lý thông tin nhà cung cấp (thông tin liên hệ, danh mục mặt hàng cung cấp, chính sách MOQ, giá nhập).
* Thiết lập các tham số ngưỡng an toàn (Safety Stock, Lead time dự kiến) theo từng mặt hàng.
* Cho phép cấu hình bộ trọng số đánh giá nhà cung cấp (Giá cả, Tỷ lệ giao đúng hạn, Tỷ lệ chất lượng, Thời gian giao hàng) với giá trị mặc định chuẩn và quyền tùy chỉnh thuộc về Admin.
* Hỗ trợ nạp dữ liệu lịch sử bán hàng và tồn kho linh hoạt thông qua:
  * Import dữ liệu hàng loạt từ file Excel/CSV.
  * Form nhập liệu/điều chỉnh nhanh trực tiếp trên giao diện.

### 1.2. Phân tích tồn kho & Phân loại sản phẩm (Inventory & ABC Analysis)
* Theo dõi và trực quan hóa số lượng tồn kho khả dụng tại cửa hàng theo thời gian thực.
* Tự động tính toán các chỉ số tồn kho thiết yếu (Tồn kho an toàn - Safety Stock, Điểm đặt hàng lại - Reorder Point).
* Phân loại danh mục hàng hóa theo phương pháp **ABC Analysis** (dựa trên tỷ trọng doanh số/giá trị tiêu thụ) và tốc độ bán để xác định các mặt hàng trọng điểm cần ưu tiên kiểm soát nguồn cung.
* Cảnh báo sớm các mặt hàng có nguy cơ đứt hàng (chạm hoặc dưới điểm đặt hàng lại) hoặc tồn kho quá mức (bán chậm, ứ đọng diện tích).

### 1.3. Dự báo nhu cầu bán hàng (Demand Forecasting)
* Phân tích chuỗi thời gian lịch sử bán hàng theo ngày/tuần.
* Ứng dụng mô hình phân tích/AI để dự báo lượng tiêu thụ dự kiến của từng sản phẩm linh hoạt theo các khung thời gian: **7 ngày, 14 ngày hoặc 30 ngày tới**.
* Nhận diện xu hướng tiêu thụ (tăng trưởng, suy giảm, chu kỳ ngày cuối tuần/dịp đặc biệt).

### 1.4. Đánh giá & Xếp hạng hiệu suất nhà cung cấp (Supplier Evaluation)
* Màn hình đơn giản để nhân viên ghi nhận kết quả khi nhận hàng (ngày nhận hàng thực tế, số lượng thực nhận, số lượng hàng lỗi/đổi trả nếu có).
* Khi nhân viên xác nhận nhận hàng, hệ thống tự động cộng số lượng thực nhận vào số lượng tồn kho khả dụng của sản phẩm (tạo chu trình dữ liệu khép kín).
* Tự động tổng hợp và chấm điểm hiệu suất nhà cung cấp dựa trên bộ trọng số đánh giá đa tiêu chí:
  * Thời gian giao hàng thực tế so với cam kết (Lead Time compliance).
  * Tỷ lệ giao hàng đúng hẹn và đủ số lượng (OTIF - On-Time In-Full).
  * Chất lượng hàng hóa (tỷ lệ hàng lỗi/hỏng hóc).
  * Mức giá và điều kiện số lượng đặt hàng tối thiểu (MOQ).

### 1.5. Khuyến nghị mua hàng thông minh (Explainable Purchase Recommendations)
* Tự động phân tích và hiển thị danh sách khuyến nghị ngay khi nhân viên truy cập màn hình, kèm nút *'Chạy lại phân tích'* khi có dữ liệu mới.
* Tổng hợp dữ liệu đa chiều (tồn kho hiện tại, lượng dự báo, phân loại ABC, lead time, MOQ, điểm nhà cung cấp) để đưa ra các đề xuất:
  * Gợi ý mặt hàng cần mua (ưu tiên nhóm hàng trọng điểm A).
  * Gợi ý thời điểm nên đặt hàng.
  * Gợi ý số lượng đặt hàng tối ưu.
  * Gợi ý nhà cung cấp phù hợp nhất dựa trên bảng điểm hiệu suất.
* Cung cấp lý giải minh bạch cho từng khuyến nghị (Explainable Insights: nêu rõ lý do tại sao cần mua, tại sao chọn nhà cung cấp này).

### 1.6. Lập & Quản lý Phiếu đề xuất mua hàng (Purchase Proposal Management)
* Cho phép nhân viên mua hàng xem danh sách khuyến nghị, điều chỉnh số lượng hoặc chọn lại nhà cung cấp theo thực tế.
* Trực tiếp xác nhận tạo **Phiếu đề xuất mua hàng (Purchase Proposal)** hoàn tất trên hệ thống chứa đầy đủ thông tin mặt hàng, số lượng, đơn giá ước tính và nhà cung cấp đã chọn.
* Lưu trữ, tra cứu và xem trực tiếp lịch sử các phiếu đề xuất đã lập trên hệ thống (không phát sinh yêu cầu xuất file).

---

## 2. Out of Scope (Phạm vi ngoài hệ thống)

Để đảm bảo hệ thống tập trung đúng bài toán Decision Support và hoàn toàn khả thi trong đồ án tốt nghiệp, các nghiệp vụ sau **hoàn toàn nằm ngoài phạm vi**:

* ❌ **Tự động đặt hàng / Tự động thanh toán:** Hệ thống KHÔNG tự động kết nối API gửi đơn hàng, không tự ký hợp đồng điện tử và không thực hiện giao dịch tài chính/chuyển khoản với nhà cung cấp.
* ❌ **Quản lý bán hàng đầy đủ (POS):** Hệ thống KHÔNG bao gồm màn hình thu ngân, quét mã vạch bán lẻ tại quầy, in hóa đơn hay tích điểm khách hàng (chỉ tiếp nhận dữ liệu bán hàng đầu vào qua Import/Form).
* ❌ **Quản lý chuỗi đa chi nhánh:** Hệ thống KHÔNG giải quyết bài toán điều chuyển hàng liên kho giữa nhiều chi nhánh hoặc cân bằng cung ứng mạng lưới đa điểm.
* ❌ **Quản lý chi tiết theo số lô & hạn sử dụng (Batch / Expiry tracking):** Hệ thống quản lý tồn kho tập trung theo từng mã sản phẩm (SKU-level), không quản lý vị trí từng lô date chuyên sâu.
* ❌ **Hệ thống quản lý kho chuyên sâu (WMS):** Không quản lý vị trí chi tiết từng ô kệ trong kho, không điều phối đội ngũ bốc xếp hay chỉ định vị trí pallet.
* ❌ **Hệ thống kế toán & tài chính toàn diện:** Không quản lý sổ sách kế toán, định khoản thuế, bảng lương, hạch toán công nợ chuyên sâu của doanh nghiệp.
* ❌ **Quản lý logistics / vận tải đường dài:** Không quản lý phương tiện vận chuyển, lịch trình tài xế giao hàng.

---

## 3. Target Users & Responsibilities (Người dùng & Trách nhiệm)

| Nhóm người dùng | Vai trò | Trách nhiệm chính trong phạm vi hệ thống |
| :--- | :--- | :--- |
| **Nhân viên mua hàng** *(Purchasing Staff)* | Người dùng nghiệp vụ chính (Primary) | - Nạp và cập nhật dữ liệu bán hàng, tồn kho qua Excel/CSV hoặc Form.<br>- Theo dõi dashboard tồn kho, phân loại ABC và cảnh báo hết hàng/tồn ứ.<br>- Xem xét các phân tích dự báo nhu cầu (7/14/30 ngày) và khuyến nghị mua hàng từ AI.<br>- Ghi nhận kết quả nhận hàng thực tế để hệ thống cập nhật điểm nhà cung cấp.<br>- Đánh giá, điều chỉnh và trực tiếp xác nhận tạo Phiếu đề xuất mua hàng trên hệ thống. |
| **Quản trị viên** *(Admin)* | Người dùng quản trị (Secondary) | - Quản lý tài khoản người dùng và phân quyền truy cập.<br>- Quản lý cấu hình danh mục sản phẩm, nhà cung cấp, tham số ngưỡng tồn kho và tùy chỉnh trọng số chấm điểm nhà cung cấp. |

---

## 4. System Boundary (Ranh giới hệ thống)

Hệ thống tuân thủ mô hình vận hành 4 tầng rõ ràng:

```
[INPUT DATA] 
   │  (Import Excel/CSV, Form nhập liệu: Bán hàng, Tồn kho, Danh mục Sản phẩm & NCC, Kết quả nhận hàng)
   ▼
[SYSTEM PROCESSING]
   │  (Tính chỉ số tồn kho & ABC, AI Dự báo nhu cầu 7/14/30 ngày, Chấm điểm NCC theo trọng số, Sinh khuyến nghị kèm giải thích)
   ▼
[OUTPUT PRESENTATION]
   │  (Dashboard tồn kho & phân loại ABC, Biểu đồ dự báo, Bảng khuyến nghị mua hàng tự động hiển thị)
   ▼
[HUMAN DECISION]
   │  (Nhân viên mua hàng đánh giá, tinh chỉnh và trực tiếp xác nhận lập Phiếu đề xuất mua hàng lưu trên hệ thống)
```

### Chi tiết các tầng ranh giới:
1. **Dữ liệu tiếp nhận (Input):**
   * Danh mục sản phẩm & Nhà cung cấp.
   * Dữ liệu giao dịch bán hàng (ngày, mã SKU, số lượng bán).
   * Dữ liệu tồn kho hiện tại (tồn khả dụng, tồn an toàn).
   * Dữ liệu ghi nhận nhận hàng (ngày giao thực tế, số lượng thực nhận, số lượng lỗi).
2. **Xử lý bên trong hệ thống (System Processing):**
   * Tính toán mức tồn kho an toàn (Safety Stock) và điểm đặt hàng lại (Reorder Point).
   * Thực hiện phân loại sản phẩm theo ma trận ABC.
   * Chạy mô hình phân tích chuỗi thời gian / AI để dự báo nhu cầu tiêu thụ trong các khung 7/14/30 ngày.
   * Tính toán điểm đánh giá hiệu suất của từng nhà cung cấp theo trọng số cấu hình.
   * Kết hợp các yếu tố để sinh khuyến nghị mua hàng tối ưu kèm giải thích căn cứ số liệu.
3. **Kết quả đầu ra (Output):**
   * Trực quan hóa biểu đồ tồn kho, nhóm hàng ABC và dự báo xu hướng.
   * Danh sách các đề xuất mua hàng thông minh kèm giải thích căn cứ số liệu.
   * Phiếu đề xuất mua hàng (Purchase Proposal) được lưu trữ và tra cứu trực tiếp trên hệ thống.
4. **Quyết định của con người (Human Decision - Human-in-the-loop):**
   * Nhân viên mua hàng toàn quyền quyết định điều chỉnh số lượng, lựa chọn nhà cung cấp và xác nhận tạo phiếu đề xuất mua hàng.

---

## 5. Scope Constraints (Các giới hạn & Ràng buộc)

* **Giới hạn nghiệp vụ:** Phạm vi gói gọn cho **1 cửa hàng bán lẻ đơn lẻ**, tập trung tối đa vào bài toán cốt lõi: *Hỗ trợ quyết định mua hàng*.
* **Giới hạn dữ liệu:** Sử dụng dữ liệu chuỗi thời gian bán hàng và dữ liệu tồn kho dạng bảng có cấu trúc (Structured tabular time-series data).
* **Giới hạn AI:** AI đóng vai trò mô hình phân tích dự báo và tối ưu hóa khuyến nghị có tính giải thích (Explainable AI), không đóng vai trò tác tử tự quyết (Autonomous agent) can thiệp trực tiếp vào tài chính của doanh nghiệp.
* **Giới hạn thời gian & công sức:** Không sa đà vào việc xây dựng các module ERP rườm rà (POS bán hàng, Kế toán, Quản lý tài sản) nhằm đảm bảo đồ án hoàn thiện chất lượng cao và khả thi trong thời gian quy định.
