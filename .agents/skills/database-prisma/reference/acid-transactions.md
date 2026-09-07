# Database & Prisma — Giao dịch ACID & Bảo toàn Vị trí Tồn kho

## 1. Nguyên tắc Giao dịch ACID Bắt buộc (`BR-018`)

1. **Điều kiện bắt buộc bọc Transaction:**
   - Mọi tác vụ ghi (Insert, Update, Delete) liên quan từ **2 bảng trở lên**.
   - Mọi thao tác thay đổi trạng thái đơn mua hàng kèm biến động tồn kho hoặc ghi nhận lịch sử (`order_history`).
   - Tác vụ nạp file dữ liệu bán hàng/tồn kho hàng loạt (Bulk Import).
2. **Cơ chế Triển khai:**
   - Sử dụng `prisma.$transaction` hoặc trừu tượng hóa qua `IUnitOfWork` tại tầng Application.
   - Không thực thi các câu lệnh ghi rời rạc mà không có transaction bao bọc.

---

## 2. Công thức Bất biến Vị trí Tồn kho (`BR-001`)

$$\text{Inventory Position } (IP) = \text{On-Hand} + \text{On-Order}$$

Trong đó:
- $\text{On-Hand}$: Số lượng hàng thực tế đang có sẵn trong kho.
- $\text{On-Order}$: Số lượng hàng đang trong các đơn mua đã đặt nhà cung cấp nhưng chưa nhập kho (`status = ORDERED`).

### Luồng Biến động khi Chuyển Trạng thái Đơn Mua Hàng (`BR-025`):
1. **Tạo đơn mới (`DRAFT`):** Chưa ảnh hưởng đến $IP$ hay $\text{On-Order}$.
2. **Xác nhận đặt hàng (`DRAFT` $\rightarrow$ `ORDERED`):**
   - Tăng $\text{On-Order}$ tương ứng với số lượng đặt.
   - Vị trí tồn kho $IP$ tăng tương ứng để chống việc hệ thống tiếp tục đề xuất mua trùng lặp ở lần tính toán tiếp theo.
3. **Nhận hàng vào kho (`ORDERED` $\rightarrow$ `RECEIVED`):**
   - Trong cùng 1 transaction nguyên tử:
     - Giảm $\text{On-Order}$ theo số lượng đã đặt.
     - Tăng $\text{On-Hand}$ theo số lượng thực tế kiểm nhận.
     - Ghi nhận `goods_receipts` và bản ghi biến động tồn kho `inventory_transactions`.
4. **Hủy đơn hàng (`ORDERED` $\rightarrow$ `CANCELLED`):**
   - Giảm $\text{On-Order}$ theo số lượng đơn bị hủy.
   - $IP$ giảm trở lại trạng thái trước khi đặt.

---

## 3. Chống Race Condition & Khóa Giao dịch

Khi thực hiện nhận hàng hoặc điều chỉnh kho, sử dụng khóa dòng hoặc câu lệnh cập nhật số học nguyên tử của Prisma:
```typescript
await tx.inventory.update({
  where: { productId },
  data: {
    onHand: { increment: receivedQuantity },
    onOrder: { decrement: orderedQuantity }
  }
});
```
Tuyệt đối không đọc giá trị ra bộ nhớ, tự cộng trừ trong JavaScript rồi gán ngược lại nếu không có cơ chế khóa lạc quan/bi quan.
