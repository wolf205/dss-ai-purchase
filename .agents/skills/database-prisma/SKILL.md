---
name: database-prisma
description: Cấu hình cơ sở dữ liệu PostgreSQL 16+, Prisma ORM, quy tắc kiểm soát giao dịch ACID bắt buộc, bảo toàn công thức vị trí tồn kho IP, quy chuẩn DDL 18 bảng 3NF. Sử dụng khi viết truy vấn CSDL, sửa schema.prisma, viết migration, hoặc xử lý các tác vụ biến động tồn kho và đơn hàng.
user-invocable: false
---

# Database & Prisma — Mục lục `.agents/skills/database-prisma/`

- [`acid-transactions.md`](reference/acid-transactions.md) — Quy tắc bọc giao dịch ACID qua `prisma.$transaction`/`IUnitOfWork`, bảo toàn công thức $IP = \text{On-Hand} + \text{On-Order}$ (`BR-001`, `BR-018`), và phòng chống race condition khi nhận/hủy đơn hàng. **Đọc khi**: viết nghiệp vụ ghi nhiều bảng hoặc thay đổi số lượng tồn kho.
- [`schema-rules.md`](reference/schema-rules.md) — Cấu trúc 18 bảng chuẩn hóa 3NF (`physical-schema.sql`), quy tắc đặt tên cột `snake_case`, khóa ngoại, chỉ mục (indexes), và quy trình chạy Prisma Migration an toàn. **Đọc khi**: thêm/sửa model trong `schema.prisma` hoặc tạo migration.
