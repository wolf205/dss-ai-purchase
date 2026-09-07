---
name: frontend-react
description: Kiến trúc Frontend React 18, Vite, TypeScript, cấu trúc theo Feature-based, tích hợp TailwindCSS, TanStack Query, Apache ECharts, bảng màu 5 cấp độ rủi ro tồn kho, và các biểu đồ chuyên biệt (Ma trận 9 ô ABC-XYZ, dải mây dự báo). Sử dụng khi làm việc trên frontend/, tạo component, page, hook, hoặc vẽ biểu đồ ECharts.
user-invocable: false
---

# Frontend React — Mục lục `.agents/skills/frontend-react/`

- [`architecture.md`](reference/architecture.md) — Cấu trúc Feature-based (`src/features/{inventory, orders, analytics, master-data, auth}`), quản lý state server với TanStack Query, Axios client envelope wrapper, và react-router-dom. **Đọc khi**: thêm màn hình mới, tạo hook API hoặc kết nối routing.
- [`echarts-palette.md`](reference/echarts-palette.md) — Bảng mã màu chuẩn 5 cấp độ rủi ro tồn kho (`OUT_OF_STOCK`, `CRITICAL_LOW`, `LOW`, `NORMAL`, `OVERSTOCK`), cấu hình biểu đồ Heatmap Ma trận 9 ô ABC-XYZ và biểu đồ dải mây tin cậy 95% bằng Apache ECharts. **Đọc khi**: lập trình biểu đồ hoặc hiển thị trạng thái cảnh báo.
