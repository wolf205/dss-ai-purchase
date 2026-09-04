# Frontend Architecture: Thiết Kế Kiến Trúc Feature-Based

---

## 1. Tổng Quan Kiến Trúc Frontend

Giao diện người dùng được xây dựng dưới dạng ứng dụng đơn trang **Single Page Application (SPA)** bằng **React 18 + Vite + TypeScript**, áp dụng phong cách kiến trúc **Feature-Based Architecture (Kiến trúc hướng tính năng)** và hệ thống tạo kiểu linh hoạt **TailwindCSS**.

Mục tiêu thiết kế kiến trúc Frontend:
1. **Tính độc lập theo tính năng (Feature Cohesion):** Mỗi module nghiệp vụ tự đóng gói mã nguồn (UI, API calls, Hooks, Types), giúp nhóm phát triển dễ dàng mở rộng, không làm xáo trộn các tính năng khác.
2. **Hiệu năng tải trang cực nhanh ($< 2$ giây theo `NFR-001`):** Sử dụng **TanStack Query** để lưu bộ nhớ đệm (Server State Caching), giảm thiểu tối đa các yêu cầu mạng dư thừa.
3. **Trực quan hóa dữ liệu AI mạnh mẽ (`NFR-004`, `FR-014`):** Sử dụng **Apache ECharts** để hiển thị biểu đồ chuỗi thời gian kết hợp dải mây biến động tin cậy (Confidence Interval Shaded Area) và ma trận tương tác 9 ô ABC-XYZ.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FEATURE-BASED ARCHITECTURE OVERVIEW                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. APP / SHELL LAYER                                                        │
│    • MainLayout (Sidebar, Top Navigation, User Badge, Notifications)        │
│    • AppRouter & Role-Based Route Guards (Admin vs Staff)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. FEATURES LAYER (Mỗi Feature là một module nghiệp vụ tự đóng gói)          │
│    ├── auth/            ├── inventory/         ├── recommendations/         │
│    ├── products/        ├── forecasting/       ├── purchase-orders/         │
│    └── suppliers/       └── goods-receipt/     └── system-config/           │
│    (Mỗi folder chứa: api/, components/, hooks/, types/)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. SHARED CORE LAYER                                                        │
│    • Design System: TailwindCSS Tokens, Reusable UI Components              │
│    • Data Fetching: TanStack Query (React Query) Client                     │
│    • Data Visualization: Apache ECharts Components                          │
│    • HTTP Client: Axios Instance với JWT Request Interceptor                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Cấu Trúc Thư Mục Dự Án Frontend (Project Tree Structure)

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/                        # Hình ảnh, biểu tượng SVG tĩnh
│   ├── components/                    # SHARED UI COMPONENTS (Dùng chung toàn app)
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Badge.tsx              # Badge trạng thái màu rủi ro tồn kho
│   │   │   ├── Card.tsx
│   │   │   └── Toast.tsx
│   │   └── charts/
│   │       ├── TimeSeriesForecastChart.tsx # Biểu đồ dự báo kèm dải tin cậy
│   │       └── AbcXyzMatrixChart.tsx       # Ma trận 9 ô ABC-XYZ tương tác
│   │
│   ├── features/                      # CÁC MODULE NGHIỆP VỤ TỰ ĐÓNG GÓI
│   │   ├── auth/                      # UC-015: Đăng nhập & Đổi mật khẩu
│   │   │   ├── api/authApi.ts
│   │   │   ├── components/LoginForm.tsx
│   │   │   └── hooks/useAuth.ts
│   │   ├── products/                  # UC-001: Quản lý danh mục sản phẩm
│   │   │   ├── api/productApi.ts
│   │   │   ├── components/ProductTable.tsx
│   │   │   ├── components/ProductModal.tsx
│   │   │   └── types/product.types.ts
│   │   ├── suppliers/                 # UC-002, UC-009: Danh mục & Bảng điểm NCC
│   │   │   ├── api/supplierApi.ts
│   │   │   ├── components/SupplierCard.tsx
│   │   │   └── components/ScoreBreakdownModal.tsx
│   │   ├── inventory/                 # UC-004, UC-005, UC-006: Dashboard & Ma trận
│   │   │   ├── api/inventoryApi.ts
│   │   │   ├── components/KpiRiskCards.tsx # 5 thẻ đếm cấp độ rủi ro
│   │   │   ├── components/InventoryTable.tsx
│   │   │   ├── components/AbcXyzGrid.tsx   # Grid 9 ô có thể click lọc
│   │   │   └── components/SkuDetail360View.tsx
│   │   ├── forecasting/               # UC-007, UC-008: Dự báo nhu cầu AI
│   │   │   ├── api/forecastApi.ts
│   │   │   ├── components/HorizonSelector.tsx # Chọn 7 / 14 / 30 ngày
│   │   │   ├── components/ForecastChartContainer.tsx
│   │   │   └── components/ColdStartInputModal.tsx
│   │   ├── recommendations/           # UC-010, UC-011: Khuyến nghị mua hàng
│   │   │   ├── api/recommendationApi.ts
│   │   │   ├── components/RecommendationTable.tsx
│   │   │   ├── components/ExplainableCard.tsx # Thẻ giải thích minh bạch
│   │   │   └── components/BatchGroupModal.tsx # Hộp thoại gom nhóm theo NCC
│   │   ├── purchase-orders/           # UC-012, UC-013: Lập đơn & Quản lý PO
│   │   │   ├── api/orderApi.ts
│   │   │   ├── components/OrderForm.tsx
│   │   │   └── components/OrderHistoryTable.tsx
│   │   ├── goods-receipt/             # UC-014: Ghi nhận nhận hàng kho
│   │   │   ├── api/receiptApi.ts
│   │   │   └── components/ReceiptModal.tsx
│   │   └── system-config/             # UC-016, UC-017: Quản trị tài khoản & Trọng số
│   │       ├── api/configApi.ts
│   │       ├── components/SupplierWeightSliders.tsx
│   │       └── components/UserManagementTable.tsx
│   │
│   ├── layouts/                       # GIAO DIỆN KHUNG (SHELL LAYOUTS)
│   │   ├── MainLayout.tsx             # Sidebar + Header + Breadcrumb + Content
│   │   ├── AuthLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Navbar.tsx
│   │
│   ├── lib/                           # THƯ VIỆN HỖ TRỢ KỸ THUẬT
│   │   ├── axios.ts                   # Axios Client với JWT Bearer Interceptor
│   │   ├── queryClient.ts             # Cấu hình TanStack Query
│   │   └── formatters.ts              # Format tiền tệ VNĐ, ngày tháng DD/MM/YYYY
│   │
│   ├── routes/                        # ĐỊNH TUYẾN & PHÂN QUYỀN
│   │   ├── AppRoutes.tsx
│   │   └── ProtectedRoute.tsx         # Route Guard chặn truy cập trái phép
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                      # TailwindCSS directives & custom classes
├── tailwind.config.js                 # Cấu hình bảng màu chuẩn hóa Design Tokens
├── vite.config.ts
├── package.json
└── tsconfig.json
```

---

## 3. Chiến Lược Quản Lý Trạng Thái (State Management Strategy)

Hệ thống phân tách rạch ròi giữa 2 loại trạng thái:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       STATE MANAGEMENT ARCHITECTURE                         │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ 1. SERVER STATE (Dữ liệu máy chủ)   │ 2. CLIENT / UI STATE (Trạng thái UI) │
│    Quản lý bởi: TanStack Query       │    Quản lý bởi: React State / Context│
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • Danh mục tồn kho & chỉ số ROP      │ • Thông tin User đăng nhập & JWT     │
│ • Danh sách khuyến nghị mua hàng     │ • Trạng thái đóng/mở Sidebar         │
│ • Dữ liệu biểu đồ dự báo chuỗi ngày  │ • Bộ lọc tìm kiếm đang chọn          │
│ • Lịch sử đơn mua hàng & NCC         │ • Trạng thái bật/tắt Modal form      │
│ -> Tự động Cache & Invalidation     │ -> Lưu cục bộ trên bộ nhớ Component  │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

### 3.1. Cơ Chế Làm Mới Dữ Liệu Bằng TanStack Query (Cache Invalidation Pipeline)

Khi nhân viên thực hiện các hành động làm thay đổi dữ liệu máy chủ (như bấm nút *"Chạy lại phân tích"* hoặc *"Xác nhận nhận hàng"*), TanStack Query sẽ lập tức vô hiệu hóa cache và tự động kéo dữ liệu mới nhất:

```typescript
// src/features/recommendations/hooks/useRunDSSPipeline.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { runDSSPipelineApi } from '../api/recommendationApi';

export function useRunDSSPipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runDSSPipelineApi,
    onSuccess: () => {
      // 1. Tự động vô hiệu hóa và cập nhật lại danh sách Khuyến nghị mua hàng
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });

      // 2. Tự động làm mới Dashboard Tồn kho (UC-004)
      queryClient.invalidateQueries({ queryKey: ['inventory', 'dashboard'] });

      // 3. Tự động làm mới Điểm số Nhà cung cấp (UC-009)
      queryClient.invalidateQueries({ queryKey: ['suppliers', 'scores'] });
    },
  });
}
```

---

## 4. Hệ Thống Thiết Kế Giao Diện Với TailwindCSS (Design Tokens)

Để đáp ứng tiêu chuẩn phi chức năng `NFR-004` (trực quan hóa cảnh báo qua màu sắc), bảng màu TailwindCSS được tùy chỉnh mở rộng để biểu diễn chính xác **5 Cấp độ rủi ro tồn kho** định nghĩa tại `BR-002`:

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Bảng màu trạng thái rủi ro tồn kho chuẩn hóa BR-002
        risk: {
          out_of_stock: '#DC2626', // Đỏ sẫm (Hết hàng - Out of Stock)
          critical: '#EA580C',     // Đỏ cam (Nguy cấp - Critical)
          warning: '#D97706',      // Vàng hổ phách (Cần đặt hàng - Warning)
          normal: '#16A34A',       // Xanh lá (An toàn - Normal)
          overstock: '#7C3AED',    // Tím (Tồn dư / Đọng vốn - Overstock)
          dead_stock: '#64748B',   // Xám tro (Hàng bất động - Dead Stock)
        },
        brand: {
          50: '#EFF6FF',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        }
      },
    },
  },
  plugins: [],
};
```

---

## 5. Trực Quan Hóa Dữ Liệu Bằng Apache ECharts (Data Visualization)

### 5.1. Biểu Đồ Chuỗi Thời Gian Kết Hợp Dải Mây Biến Động Tin Cậy (`UC-007`, `FR-014`)

Biểu đồ chuỗi thời gian thể hiện:
1. **Đường nét liền màu xanh:** Lượng bán hàng ngày trong 30 ngày quá khứ.
2. **Đường nét đứt màu đỏ cam:** Lượng tiêu thụ dự báo trong 14 ngày tới ($\hat{y}_t$).
3. **Dải mây mờ (Confidence Shaded Area):** Khoảng tin cậy $[\hat{y}_t - 1.65 \times \text{MAE} \leftrightarrow \hat{y}_t + 1.65 \times \text{MAE}]$.

```typescript
// src/components/charts/TimeSeriesForecastChart.tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';

interface ForecastChartProps {
  dates: string[];
  actualSales: (number | null)[];
  forecastSales: (number | null)[];
  lowerBounds: (number | null)[];
  upperBounds: (number | null)[];
}

export const TimeSeriesForecastChart: React.FC<ForecastChartProps> = ({
  dates,
  actualSales,
  forecastSales,
  lowerBounds,
  upperBounds,
}) => {
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Thực tế quá khứ', 'Dự báo AI', 'Dải tin cậy 95%'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: dates },
    yAxis: { type: 'value', name: 'Số lượng (Đơn vị)' },
    series: [
      // 1. Đường bán hàng quá khứ
      {
        name: 'Thực tế quá khứ',
        type: 'line',
        data: actualSales,
        itemStyle: { color: '#2563EB' },
        lineStyle: { width: 2 },
      },
      // 2. Dải tin cậy dưới (đóng vai trò nền tảng trong suốt)
      {
        name: 'Dải tin cậy 95%',
        type: 'line',
        data: lowerBounds,
        lineStyle: { opacity: 0 },
        stack: 'confidence-band',
        symbol: 'none',
      },
      // 3. Dải tin cậy trên (tạo màu mây che phủ giữa cận dưới và cận trên)
      {
        name: 'Khoảng biến động',
        type: 'line',
        data: upperBounds.map((val, idx) => (val && lowerBounds[idx] ? val - lowerBounds[idx]! : null)),
        lineStyle: { opacity: 0 },
        areaStyle: { color: 'rgba(234, 88, 12, 0.2)' }, // Màu cam nhạt mờ
        stack: 'confidence-band',
        symbol: 'none',
      },
      // 4. Đường dự báo tương lai
      {
        name: 'Dự báo AI',
        type: 'line',
        data: forecastSales,
        itemStyle: { color: '#EA580C' },
        lineStyle: { width: 2, type: 'dashed' },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '400px', width: '100%' }} />;
};
```

---

### 5.2. Ma Trận Tương Tác 9 Ô ABC - XYZ (`UC-005`, `FR-009`)

Giao diện ma trận ABC-XYZ cho phép người dùng click trực tiếp vào từng ô (ví dụ: click vào ô `AX`) để lọc danh sách sản phẩm tương ứng:

```typescript
// src/features/inventory/components/AbcXyzGrid.tsx
import React from 'react';

interface MatrixCellData {
  segment: string;
  skuCount: number;
  revenuePct: number;
}

interface AbcXyzGridProps {
  data: Record<string, MatrixCellData>;
  selectedSegment: string | null;
  onSelectSegment: (segment: string) => void;
}

export const AbcXyzGrid: React.FC<AbcXyzGridProps> = ({
  data,
  selectedSegment,
  onSelectSegment,
}) => {
  const rows = ['A', 'B', 'C'];
  const cols = ['X', 'Y', 'Z'];

  return (
    <div className="grid grid-cols-3 gap-3 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
      {rows.map((row) =>
        cols.map((col) => {
          const seg = `${row}${col}`;
          const cell = data[seg] || { skuCount: 0, revenuePct: 0 };
          const isSelected = selectedSegment === seg;

          return (
            <div
              key={seg}
              onClick={() => onSelectSegment(seg)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-brand-600 bg-blue-50 shadow-md ring-2 ring-brand-500'
                  : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-lg text-slate-800">{seg}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
                  {cell.skuCount} SKU
                </span>
              </div>
              <p className="text-xs text-slate-500">Đóng góp: {cell.revenuePct}% doanh thu</p>
            </div>
          );
        })
      )}
    </div>
  );
};
```

---

## 6. Định Tuyến & Kiểm Soát Truy Cập Dựa Trên Vai Trò (RBAC Route Guard)

Hệ thống bảo vệ các trang quản trị (Admin) bằng bộ lọc `ProtectedRoute`:

```typescript
// src/routes/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';

interface ProtectedRouteProps {
  allowedRoles?: ('ADMIN' | 'STAFF')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
```

---

## 7. Kết Luận

Kiến trúc Frontend **Feature-Based** kết hợp với **TailwindCSS** và **TanStack Query** mang lại trải nghiệm người dùng mượt mà, phản hồi tức thì dưới 2 giây và trực quan hóa trọn vẹn toàn bộ các insight hỗ trợ ra quyết định mua hàng một cách minh bạch nhất.
