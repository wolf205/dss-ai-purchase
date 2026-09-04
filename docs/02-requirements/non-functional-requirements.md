# Non-Functional Requirements (Yêu Cầu Phi Chức Năng)

Tài liệu này xác định các tiêu chuẩn chất lượng, hiệu năng và ràng buộc kỹ thuật của **Hệ thống hỗ trợ ra quyết định mua hàng tích hợp AI**.

---

## 1. Hiệu năng & Khả năng đáp ứng (Performance & Responsiveness)

* **NFR-001 (Thời gian phản hồi giao diện):** Thời gian tải các màn hình tra cứu thông thường (Danh mục, Tồn kho, Lịch sử phiếu) không quá **2 giây** trong điều kiện mạng nội bộ/cục bộ bình thường.
* **NFR-002 (Thời gian chạy phân tích & dự báo):** Quá trình chạy mô hình dự báo nhu cầu và sinh danh sách khuyến nghị mua hàng cho tập dữ liệu quy mô cửa hàng bán lẻ (dưới 1.000 SKU) hoàn thành trong thời gian không quá **5 giây**.
* **NFR-003 (Thời gian xử lý nạp dữ liệu):** Thời gian xử lý kiểm tra và import tệp tin Excel/CSV (khoảng 5.000 dòng dữ liệu giao dịch) không quá **3 giây**.

---

## 2. Tính khả dụng & Trải nghiệm người dùng (Usability & User Experience)

* **NFR-004 (Giao diện trực quan & Rõ ràng):** Giao diện hệ thống cần trình bày thông tin số liệu dưới dạng bảng biểu và biểu đồ trực quan (charts), hỗ trợ nhân viên bán lẻ nhanh chóng nhận biết cảnh báo rủi ro qua màu sắc trực quan (ví dụ: đỏ cho cảnh báo hết hàng, vàng cho hàng sắp hết).
* **NFR-005 (Tính minh bạch & Giải thích được - Explainability):** Các gợi ý khuyến nghị mua hàng của AI bắt buộc phải hiển thị lý giải rõ ràng, mạch lạc bằng ngôn ngữ tự nhiên/số liệu minh chứng, không cung cấp kết quả dưới dạng "hộp đen" (Black-box).
* **NFR-006 (Thân thiện với thao tác nhập liệu):** Cung cấp cơ chế thông báo lỗi rõ ràng khi người dùng nhập sai định dạng hoặc thiếu trường bắt buộc, giúp người dùng dễ dàng sửa lỗi.

---

## 3. Độ tin cậy & Toàn vẹn dữ liệu (Reliability & Data Integrity)

* **NFR-007 (Tính toàn vẹn dữ liệu giao dịch):** Đảm bảo tính nhất quán dữ liệu (ACID) khi thực hiện các thao tác cập nhật tồn kho sau khi nhận hàng và lưu trữ phiếu đề xuất mua hàng.
* **NFR-008 (Tính chính xác của công thức tính toán):** Các thuật toán tính toán định lượng (Safety Stock, Reorder Point, ABC Analysis, Điểm hiệu suất nhà cung cấp) phải trả về kết quả số học chính xác tuyệt đối theo các quy tắc nghiệp vụ đã định nghĩa.

---

## 4. Bảo mật & Quản lý truy cập (Security & Access Control)

* **NFR-009 (Xác thực người dùng):** Mật khẩu tài khoản người dùng phải được mã hóa một chiều (Hashing) an toàn trước khi lưu trữ vào cơ sở dữ liệu.
* **NFR-010 (Phân quyền truy cập):** Hệ thống phải thực thi cơ chế kiểm soát truy cập dựa trên vai trò (Role-Based Access Control - RBAC), ngăn chặn người dùng Staff truy cập vào các chức năng quản trị tài khoản của Admin.
* **NFR-011 (Bảo vệ phiên làm việc):** Phiên đăng nhập (Session/Token) phải có cơ chế hết hạn hợp lý để bảo vệ hệ thống khi người dùng rời máy tính.

---

## 5. Khả năng bảo trì & Mở rộng (Maintainability & Extensibility)

* **NFR-012 (Kiến trúc phân tầng rõ ràng):** Mã nguồn hệ thống được tổ chức theo kiến trúc phân tầng module hóa, tách biệt giữa tầng xử lý giao diện, tầng nghiệp vụ tính toán/AI và tầng lưu trữ dữ liệu.
* **NFR-013 (Khả năng cắm rút mô hình dự báo):** Module phân tích và dự báo AI được thiết kế độc lập, cho phép dễ dàng hiệu chỉnh tham số hoặc thay thế/nâng cấp thuật toán dự báo mà không ảnh hưởng đến toàn bộ hệ thống.
