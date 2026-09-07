# Database & Prisma — Quy chuẩn Schema & 18 Bảng Chuẩn 3NF

## 1. Danh sách 18 Bảng Chuẩn hóa (Physical Schema)

Hệ thống được thiết kế theo chuẩn 3NF quy định tại `docs/04-data-model/physical-schema.sql`:

1. **Nhóm Master Data:** `categories`, `products`, `suppliers`, `supplier_products` (bảng giá theo SKU, MOQ, Pack size, Lead time).
2. **Nhóm Tồn kho & Giao dịch:** `inventories`, `inventory_transactions`, `daily_inventory_snapshots`.
3. **Nhóm Bán hàng:** `sales_orders`, `sales_order_items`.
4. **Nhóm Mua hàng (Procurement):** `purchase_orders`, `purchase_order_items`, `goods_receipts`, `goods_receipt_items`.
5. **Nhóm Phân tích & AI DSS:** `dss_recommendations`, `demand_forecasts`, `abc_xyz_classifications`, `supplier_evaluations`.
6. **Nhóm Quản trị & Người dùng:** `users`, `system_configs` (chứa trọng số đánh giá nhà cung cấp).

---

## 2. Quy chuẩn Đặt tên & Kiểu dữ liệu

1. **Đặt tên trong Cơ sở dữ liệu:**
   - Tên bảng: Số nhiều, chữ thường, phân cách gạch dưới (`snake_case`) — ví dụ: `purchase_order_items`.
   - Tên cột: Chữ thường, phân cách gạch dưới (`snake_case`) — ví dụ: `unit_price`, `committed_lead_time`.
   - Khóa chính: `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`.
   - Khóa ngoại: Tên bảng số ít kèm `_id` — ví dụ: `product_id`, `supplier_id`.
2. **Quy chuẩn Ánh xạ trong Prisma (`schema.prisma`):**
   - Model name: `PascalCase` (`PurchaseOrderItem`).
   - Field name: `camelCase` có ánh xạ `@map("snake_case")`:
     ```prisma
     unitPrice Decimal @map("unit_price") @db.Decimal(15, 2)
     ```
   - Table name: Ánh xạ `@map("table_name")`:
     ```prisma
     @@map("purchase_order_items")
     ```
3. **Kiểu tiền tệ & Số thập phân:**
   - Giá tiền, đơn giá, doanh thu bắt buộc dùng `@db.Decimal(15, 2)`, không dùng kiểu `Float` hay `Int` để tránh sai số dấu phẩy động.
   - Số lượng đóng gói, số lượng tồn kho dùng `@db.Integer` (trừ trường hợp sản phẩm cân đo quy định riêng).

---

## 3. Quy trình Migration An toàn

1. **Phát triển cục bộ:**
   ```bash
   npx prisma migrate dev --name <ten_migration_mo_ta_ro_rang>
   ```
2. **CẤM tuyệt đối:**
   - Không chạy `prisma db push --force-reset` trên môi trường chứa dữ liệu thật.
   - Không sửa trực tiếp file migration SQL đã apply lên các máy khác mà không thảo luận kế hoạch đồng bộ.
