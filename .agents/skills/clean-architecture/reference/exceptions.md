# Clean Architecture — Kiến trúc Two-Tier Exception

Hệ thống phân tách lỗi nghiêm ngặt thành 2 cấp độ, cấm lẫn lộn trách nhiệm giữa các tầng.

---

## 1. Cấp độ 1: Domain Exceptions (`backend/src/domain/exceptions/`)

- **Bản chất:** Đại diện cho vi phạm quy tắc bất biến nghiệp vụ cốt lõi (Business Invariants).
- **Quy tắc bắt buộc:**
  - Kế thừa từ class cơ sở `DomainException`.
  - Chỉ chứa: `message: string`, `code: string = 'BUSINESS_RULE_VIOLATION'`, `details?: any`.
  - **TUYỆT ĐỐI KHÔNG CHỨA HTTP STATUS CODE** (không `400`, `404`, `422`, không property `statusCode`).
  - Chỉ được ném ra từ Domain Entities, Value Objects hoặc Domain Services khi một quy tắc toán học/kinh doanh bị vi phạm.
- **Ví dụ các ngoại lệ chuẩn:**
  - `InvalidOrderStateException` (ví dụ: chuyển từ `RECEIVED` về `DRAFT`)
  - `InvalidWeightDistributionException` (tổng trọng số nhà cung cấp $\neq 1.0$)
  - `OutOfStockException`
  - `InvalidLeadTimeException`

---

## 2. Cấp độ 2: Application Exceptions (`backend/src/application/exceptions/`)

- **Bản chất:** Đại diện cho các lỗi điều phối luồng ứng dụng, tra cứu tài nguyên hoặc kiểm soát phiên làm việc.
- **Quy tắc bắt buộc:**
  - Kế thừa từ class cơ sở `ApplicationException`.
  - Không chứa mã HTTP trực tiếp trong định nghĩa class.
- **Các ngoại lệ chuẩn của tầng:**
  - `EntityNotFoundException` (Code: `RESOURCE_NOT_FOUND`)
  - `DuplicateResourceException` (Code: `DUPLICATE_RESOURCE`)
  - `ValidationException` (Code: `VALIDATION_ERROR`)
  - `UnauthorizedException` (Code: `INVALID_CREDENTIALS` hoặc `TOKEN_EXPIRED`)
  - `ForbiddenException` (Code: `FORBIDDEN`)

---

## 3. Ánh xạ Ngoại lệ sang HTTP (Presentation Layer Exclusive)

Tệp `backend/src/api/middlewares/errorMiddleware.ts` là **NƠI DUY NHẤT** trong toàn bộ hệ thống được phép biết về mã trạng thái HTTP:

| Loại Ngoại Lệ | Error Code | HTTP Status Code | Ghi chú |
| :--- | :--- | :--- | :--- |
| `EntityNotFoundException` | `RESOURCE_NOT_FOUND` | **404 Not Found** | Không tìm thấy bản ghi |
| `DuplicateResourceException` | `DUPLICATE_RESOURCE` | **409 Conflict** | Trùng lặp SKU, username, PO code |
| `UnauthorizedException` | `INVALID_CREDENTIALS` / `TOKEN_EXPIRED` | **401 Unauthorized** | Sai mật khẩu hoặc token hết hạn |
| `ForbiddenException` | `FORBIDDEN` | **403 Forbidden** | Không đủ quyền hạn |
| `ValidationException` / `ZodError` | `VALIDATION_ERROR` | **400 Bad Request** | Lỗi định dạng payload vào |
| `DomainException` | `BUSINESS_RULE_VIOLATION` | **422 Unprocessable Entity** | Vi phạm logic toán học/nghiệp vụ |
| Ngoại lệ không xác định (`Error`) | `INTERNAL_SERVER_ERROR` | **500 Internal Server Error** | Lỗi crash hệ thống |

---

## 4. Định dạng Envelope Phản hồi Lỗi Chuẩn

Mọi phản hồi lỗi gửi về cho Client bắt buộc tuân thủ Envelope quy định tại `docs/06-api-design/endpoints-spec.md`:

```json
{
  "success": false,
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "Không thể hủy đơn hàng đã ở trạng thái ĐÃ NHẬN HÀNG.",
    "details": {
      "orderId": "PO-20260904-0001",
      "currentState": "RECEIVED"
    }
  },
  "timestamp": "2026-09-07T09:00:00.000Z"
}
```
