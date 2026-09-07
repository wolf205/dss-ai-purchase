# Verification Gate — Cổng Nghiệm thu Cơ học Bắt buộc

Trước khi báo cáo hoàn thành bất kỳ task nào, Agent **BẮT BUỘC** phải tự chạy toàn bộ các lệnh dưới đây và báo cáo kết quả:

---

## 1. Quét Vi phạm Ranh giới Clean Architecture (Architecture Boundary Scan)

Chạy kiểm tra tĩnh để phát hiện mọi vi phạm chiều phụ thuộc:

```bash
# 1. Kiểm tra Domain Purity: Phải trả về 0 kết quả (Không chứa express, prisma, statusCode, res.status)
git grep -i -E "(express|prisma|@prisma|statusCode|res\.status)" backend/src/domain/

# 2. Kiểm tra Application Purity: Phải trả về 0 kết quả (Không chứa express, prisma, res.status)
git grep -i -E "(express|prisma|@prisma|res\.status)" backend/src/application/

# 3. Kiểm tra Presentation Boundary: Không được thực thi truy vấn Prisma trực tiếp trong Controllers
git grep -i -E "(prisma\.[a-z]+\.(find|create|update|delete))" backend/src/api/
```

> **Tiêu chuẩn nghiệm thu:** Toàn bộ các lệnh grep trên **BẮT BUỘC PHẢI TRẢ VỀ RỖNG (0 MATCHES)**. Nếu có bất kỳ kết quả nào, task bị coi là thất bại và phải refactor ngay lập tức.

---

## 2. Kiểm tra Biên dịch TypeScript Khắt khe (Strict Compilation)

```bash
# Kiểm tra TypeScript Backend
cd backend && npm run build

# Kiểm tra TypeScript & Lint Frontend
cd ../frontend && npm run build && npm run lint
```

> **Tiêu chuẩn nghiệm thu:** Mã thoát `0`, không có cảnh báo hoặc lỗi biên dịch TypeScript (`tsc --noEmit`).

---

## 3. Chạy Toàn bộ Test Suite Tự động (Automated Tests)

```bash
# Chạy Unit & Integration tests Backend (Jest)
cd backend && npm test

# Chạy Unit tests AI Service (Pytest)
cd ../ai-service && pytest
```

> **Tiêu chuẩn nghiệm thu:** 100% test suites và test cases phải chuyển sang màu xanh (PASS). Không chấp nhận bỏ qua (`skip`), tắt test hoặc giả mạo kết quả.
