# Business Problem: Hệ Thống Hỗ Trợ Ra Quyết Định Mua Hàng Tích Hợp AI

---

## 1. Business Context (Bối cảnh nghiệp vụ)

Trong mô hình kinh doanh **cửa hàng bán lẻ đơn lẻ (Single Retail Store)**, hoạt động mua hàng (Procurement / Purchasing) giữ vai trò quyết định trực tiếp đến doanh thu hàng ngày và hiệu quả quay vòng vốn. Cửa hàng bán lẻ có đặc thù:
* Danh mục mặt hàng đa dạng (nhiều mã SKU với tốc độ bán khác nhau).
* Diện tích trưng bày tại quầy kệ và khu vực lưu trữ hàng phụ tại cửa hàng có giới hạn.
* Sức mua biến động liên tục theo ngày trong tuần (cuối tuần cao điểm), thời điểm trong tháng (đầu tháng/kỳ nhận lương), các dịp lễ tết và tính chất mùa vụ.

Quy trình mua hàng cho cửa hàng đòi hỏi phải trả lời chính xác 4 câu hỏi cốt lõi:
1. **Mua mặt hàng nào?** (What to buy)
2. **Mua vào thời điểm nào?** (When to buy)
3. **Mua với số lượng bao nhiêu?** (How much to buy)
4. **Mua từ nhà cung cấp nào?** (From which supplier)

Để đưa ra quyết định mua hàng tối ưu, quá trình này cần kết hợp liên tục các nguồn dữ liệu:
* **Dữ liệu bán hàng trong quá khứ:** Doanh số bán lẻ theo ngày/tuần/tháng, tính chu kỳ và xu hướng tăng giảm của từng mặt hàng.
* **Dữ liệu tồn kho hiện tại:** Số lượng tồn khả dụng tại quầy và kho phụ, các ngưỡng an toàn để tránh đứt hàng (Safety Stock, Reorder Point).
* **Dữ liệu dự báo nhu cầu tương lai:** Lượng bán ước tính trong chu kỳ bán hàng tiếp theo.
* **Dữ liệu hiệu suất nhà cung cấp (Supplier Performance):** Thời gian giao hàng thực tế (Lead Time), tỷ lệ giao hàng đúng hạn, chất lượng hàng hóa, giá nhập và số lượng đặt hàng tối thiểu (MOQ).

---

## 2. Current Problem (Những khó khăn hiện tại)

Tại các cửa hàng bán lẻ hiện nay, quá trình ra quyết định mua hàng thường đối mặt với các khó khăn nghiệp vụ sau:

1. **Ra quyết định phụ thuộc nặng nề vào cảm tính và kinh nghiệm:**
   * Việc đặt hàng thường dựa trên ước lượng bằng mắt của nhân viên hoặc thói quen nhập hàng cũ, thiếu các mô hình phân tích số liệu khoa học.
   * Rất khó phát hiện kịp thời các xu hướng thay đổi sức mua (ví dụ: một sản phẩm đang bán chậm đột nhiên tăng mạnh nhu cầu hoặc ngược lại).

2. **Dữ liệu phân tán và xử lý thủ công, tốn nhiều thời gian:**
   * Dữ liệu bán hàng, số liệu tồn kho và thông tin liên hệ nhà cung cấp thường nằm trên các sổ sách, file Excel hoặc phần mềm bán hàng đơn giản.
   * Nhân viên mất nhiều thời gian rà soát từng mặt hàng thủ công để tìm ra sản phẩm nào sắp hết để lên danh sách đặt hàng.

3. **Thiếu công cụ dự báo và cảnh báo rủi ro tồn kho tự động:**
   * Không có công cụ tính toán tự động điểm đặt hàng lại và dự báo lượng bán cho những ngày tới.
   * Thường chỉ nhận ra hết hàng khi khách hàng đến mua mà không có hàng trên kệ.

4. **Đánh giá nhà cung cấp thiếu tính hệ thống:**
   * Thường chỉ chọn nhà cung cấp quen thuộc hoặc dựa trên giá niêm yết mà không có số liệu theo dõi xem nhà cung cấp đó có hay giao trễ, giao thiếu hay hàng bị lỗi/hỏng hóc hay không.

---

## 3. Problem Impact (Tác động & Hậu quả)

Những hạn chế trong việc ra quyết định mua hàng tại cửa hàng bán lẻ dẫn đến các tổn thất cụ thể:

* **Tình trạng thiếu hàng / đứt hàng trên kệ (Stockout):** Mất doanh thu ngay tại thời điểm khách mua, giảm sự hài lòng của khách hàng và khiến khách chuyển sang mua tại cửa hàng đối thủ.
* **Tình trạng tồn kho dư thừa (Overstocking):**
  * Giam vốn kinh doanh trong các mặt hàng bán chậm, làm suy giảm dòng tiền lưu động.
  * Chiếm dụng diện tích quầy kệ và kho lưu trữ vốn đã hạn chế của cửa hàng.
  * Tăng rủi ro hàng hóa bị cận date, hết hạn sử dụng, hư hỏng hoặc lỗi thời.
* **Lựa chọn nhà cung cấp kém phù hợp:** Nhà cung cấp giao hàng trễ khiến cửa hàng không kịp có hàng bán trong các dịp cao điểm, hoặc nhận hàng kém chất lượng gây ảnh hưởng uy tín cửa hàng.
* **Tốn thời gian vận hành & sai sót thủ công:** Nhân viên mua hàng mất nhiều công sức rà soát tồn kho thủ công, dễ dẫn đến sai sót và nhầm lẫn số lượng khi lên danh sách đặt hàng.

---

## 4. Target Users (Đối tượng người dùng mục tiêu)

Hệ thống được thiết kế tinh gọn, tập trung vào 2 vai trò người dùng trong mô hình cửa hàng bán lẻ:

1. **Nhân viên mua hàng (Purchasing Staff) - Người dùng nghiệp vụ chính:**
   * *Nhiệm vụ nghiệp vụ:*
     * Theo dõi tình trạng tồn kho và nhu cầu hàng hóa của cửa hàng.
     * Tiếp nhận và phân tích các dự báo, khuyến nghị mua hàng do AI đưa ra.
     * So sánh và đánh giá các phương án nhà cung cấp.
     * Điều chỉnh thông tin (nếu cần) và **trực tiếp xác nhận tạo Phiếu đề xuất mua hàng (Purchase Proposal)** hoàn tất để tiến hành nhập hàng.

2. **Quản trị viên hệ thống (Admin):**
   * *Nhiệm vụ:*
     * Quản lý tài khoản và phân quyền người dùng.
     * Quản lý cấu hình danh mục hàng hóa, nhà cung cấp và các tham số vận hành chung của hệ thống.

---

## 5. Desired Outcome (Mục tiêu kỳ vọng sau giải pháp)

Sau khi đưa hệ thống hỗ trợ ra quyết định mua hàng vào sử dụng, cửa hàng bán lẻ kỳ vọng đạt được 3 mục tiêu trọng tâm:

1. **Cảnh báo sớm nguy cơ hết hàng & dự báo nhu cầu chính xác:**
   * Dự báo khoa học lượng hàng cần mua trong chu kỳ tới dựa trên dữ liệu bán hàng lịch sử và yếu tố chu kỳ/mùa vụ.
   * Cảnh báo kịp thời các mặt hàng sắp chạm ngưỡng an toàn để chủ động đặt hàng trước khi đứt hàng trên kệ.

2. **Cân bằng tồn kho, giảm ứ đọng & hạn chế hàng cận date:**
   * Đặt đúng số lượng cần thiết, tránh mua quá nhiều gây đọng vốn và chiếm diện tích kho quầy.
   * Hạn chế tối đa nguy cơ hàng bị quá hạn, hỏng hóc hoặc lỗi thời.

3. **Chấm điểm & gợi ý nhà cung cấp tối ưu:**
   * Tự động tổng hợp và chấm điểm lịch sử giao hàng (độ đúng hạn, tỷ lệ hàng lỗi, giá nhập, MOQ) để gợi ý nhà cung cấp phù hợp nhất cho từng mặt hàng.

4. **Tiết kiệm thời gian & nâng cao năng suất nghiệp vụ:**
   * Tự động hóa toàn bộ khâu tính toán số liệu và đề xuất phương án mua hàng kèm lý do giải thích minh bạch (Explainable Insights), giúp nhân viên mua hàng hoàn thành việc lập kế hoạch nhanh chóng và chính xác.

---

## 6. Solution Boundary (Phạm vi & Ranh giới giải pháp)

* **Bản chất hệ thống:** Là **Decision Support System (DSS)** - Hệ thống hỗ trợ ra quyết định, không phải hệ thống tự động hóa thay thế con người.
* **Luồng vận hành cốt lõi:**
  $$\text{Dữ liệu bán lẻ \& Tồn kho} \longrightarrow \text{Phân tích \& Dự báo (AI)} \longrightarrow \text{Khuyến nghị mua hàng} \longrightarrow \text{Nhân viên xem xét, điều chỉnh \& Xác nhận lập phiếu đề xuất}$$
* **Kết quả đầu ra của hệ thống (Output):**
  * Các biểu đồ phân tích xu hướng và dự báo nhu cầu bán hàng.
  * Bảng khuyến nghị mua hàng (mặt hàng, số lượng gợi ý, thời điểm gợi ý, nhà cung cấp gợi ý kèm lý giải).
  * Phiếu đề xuất mua hàng (Purchase Proposal) được tạo sau khi nhân viên mua hàng kiểm tra và xác nhận.
* **Giới hạn ngoài phạm vi (Out-of-Scope):**
  * ❌ **KHÔNG** tự động đặt hàng hoặc tự động thanh toán tiền với nhà cung cấp mà không có sự xác nhận của nhân viên mua hàng.
  * ❌ **KHÔNG** quản lý chuỗi nhiều chi nhánh phức tạp (giữ phạm vi ở mô hình 1 cửa hàng bán lẻ đơn lẻ).
  * ❌ **KHÔNG** thay thế toàn bộ phần mềm bán hàng POS hay phân hệ kế toán tài chính chuyên sâu.

