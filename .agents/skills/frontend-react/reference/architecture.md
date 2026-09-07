# Frontend React — Kiến trúc Feature-Based

Được quy định chi tiết tại `docs/05-architecture/frontend-architecture.md`.

---

## 1. Cấu trúc Thư mục Chuẩn

```
frontend/src/
├── app/                           # Cấu hình cấp app: Router, Providers, Root Layout
├── assets/                        # Hình ảnh, icons tĩnh
├── components/                    # UI Components dùng chung (Button, Modal, Table, Input)
├── features/                      # CẤU TRÚC THEO CHỨC NĂNG NGHIỆP VỤ
│   ├── auth/                      # Đăng nhập, quản lý phiên
│   ├── inventory/                 # Bảng tồn kho, cảnh báo 5 cấp, chi tiết SKU 360°
│   ├── orders/                    # Lập PO, danh sách PO, nhận hàng, hủy đơn
│   ├── analytics/                 # Ma trận 9 ô ABC-XYZ, dự báo nhu cầu bán lẻ
│   └── master-data/               # Danh mục sản phẩm, nhà cung cấp, import Excel
├── hooks/                         # Custom hooks toàn cục
├── services/                      # Axios client cấu hình chuẩn, Interceptors
├── types/                         # Types TypeScript dùng chung
└── utils/                         # Hàm tiện ích (format tiền tệ VND, format ngày giờ)
```

---

## 2. Quy ước trong Từng Feature

Mỗi thư mục trong `src/features/<feature-name>/` tuân thủ cấu trúc khép kín:
```
features/<feature>/
├── api/                           # TanStack Query hooks (useProductsQuery, useCreateOrderMutation)
├── components/                    # Components riêng của feature
├── pages/                         # Trang hiển thị chính
├── types/                         # Types DTO riêng của feature
└── index.ts                       # Barrel export các thành phần public
```

---

## 3. Quản lý State & Gọi API

1. **Server State:** Dùng **TanStack Query (React Query) v5**.
   - Không lưu dữ liệu API vào state toàn cục nếu không cần thiết.
   - Cache Invalidation tự động sau mutations (`queryClient.invalidateQueries`).
2. **Client State:** Dùng React Context hoặc custom hooks nội bộ cho UI state (modal open/close, active tab).
3. **Axios Client Envelope:**
   - Tự động bóc tách envelope `{ success, data, error, meta }` trả về từ Backend.
   - Interceptor tự động gắn Bearer JWT token từ `localStorage`.
   - Bắt lỗi HTTP và hiển thị Toast tiếng Việt tương ứng.
