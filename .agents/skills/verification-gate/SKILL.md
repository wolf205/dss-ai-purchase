---
name: verification-gate
description: Cổng nghiệm thu cơ học bắt buộc trước khi bàn giao task. Quét vi phạm ranh giới Clean Architecture (git grep), kiểm tra biên dịch nghiêm ngặt TypeScript, chạy toàn bộ test suite tự động (Jest + Pytest). Sử dụng ở bước Verify hoặc trước khi báo cáo hoàn thành bất kỳ tác vụ nào.
user-invocable: true
---

# Verification Gate — Mục lục `.agents/skills/verification-gate/`

- [`mechanical-checks.md`](reference/mechanical-checks.md) — Chi tiết 3 bước nghiệm thu cơ học bắt buộc: Lệnh grep quét Domain/Application Purity (tiêu chuẩn 0 matches), lệnh build Docker/tsc, và lệnh chạy Jest/Pytest. **Đọc khi**: hoàn thành code hoặc chạy bước `verify` trong quy trình task.
