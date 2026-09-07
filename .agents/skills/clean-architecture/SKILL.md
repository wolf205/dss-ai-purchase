---
name: clean-architecture
description: Hợp đồng ranh giới Clean Architecture 4 tầng cho Backend (Domain, Application, Infrastructure, Presentation), ma trận import cấm phụ thuộc chéo, cấu trúc Two-Tier Exception và cơ chế Composition Root. Sử dụng khi viết hoặc refactor mã nguồn backend, thêm entity, use case, controller, repository hoặc xử lý lỗi.
user-invocable: false
---

# Clean Architecture — Mục lục `.agents/skills/clean-architecture/`

- [`boundaries.md`](reference/boundaries.md) — Hợp đồng ranh giới 4 tầng, ma trận phụ thuộc, nguyên tắc độc lập môi trường, và quy tắc Composition Root (Dependency Injection). **Đọc khi**: thêm tệp mới trong `backend/src/` hoặc kiểm tra lỗi import chéo.
- [`exceptions.md`](reference/exceptions.md) — Kiến trúc Two-Tier Exception (`DomainException` vs `ApplicationException`), bảng ánh xạ HTTP status code tại `errorMiddleware.ts`, và định dạng Envelope phản hồi lỗi chuẩn. **Đọc khi**: ném lỗi nghiệp vụ hoặc cấu hình xử lý ngoại lệ.
