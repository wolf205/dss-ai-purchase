# Hệ Thống Hỗ Trợ Ra Quyết Định Mua Hàng Tích Hợp AI (DSS AI Purchase)

Hệ thống hỗ trợ ra quyết định mua hàng bán lẻ tích hợp Trí tuệ Nhân tạo (**Decision Support System - Human-in-the-loop**) dành cho cửa hàng bán lẻ quy mô độc lập (< 1.000 SKU). Hệ thống phân tích lịch sử bán hàng, dự báo nhu cầu tương lai, cảnh báo rủi ro tồn kho 5 cấp độ và đề xuất số lượng mua hàng tối ưu có giải trình minh bạch (Explainable Recommendations).

---

## 1. CÔNG NGHỆ ÁP DỤNG (TECH STACK)

* **Backend:** Node.js 20+ + Express + TypeScript + **Clean Architecture** + **Prisma ORM** + Zod.
* **Frontend:** React 18 + Vite + TypeScript + **Feature-Based Architecture** + **TailwindCSS** + **TanStack Query** + **Apache ECharts**.
* **AI Service:** Python 3.10+ + **FastAPI** (Mô hình **Stateless Pure Compute Engine**, dự báo Holt-Winters, SMA-7 Fallback, WAPE/MAE, dải mây tin cậy 95%).
* **Database:** PostgreSQL 16+ (18 bảng chuẩn hóa 3NF, kiểm soát toàn vẹn giao dịch ACID).
* **DevOps:** Docker Compose (mạng nội bộ `dss-network`).

---

## 2. CẤU TRÚC TÀI LIỆU DỰ ÁN (`/docs`)

Toàn bộ đặc tả hệ thống đã được phân tích và chuẩn hóa hoàn chỉnh:

* [`docs/01-business/`](docs/01-business/): Bài toán kinh doanh, ranh giới phạm vi (Scope & Out-of-scope).
* [`docs/02-requirements/`](docs/02-requirements/): 34 Yêu cầu chức năng (FR), 26 Quy tắc nghiệp vụ (BR), 13 Yêu cầu phi chức năng (NFR).
* [`docs/03-use-cases/`](docs/03-use-cases/): Mô hình Actor và 17 tài liệu Use Case chi tiết (`UC-001` đến `UC-017`).
* [`docs/04-data-model/`](docs/04-data-model/): Sơ đồ ERD, Từ điển dữ liệu 18 bảng, File DDL `physical-schema.sql` và Luồng giao dịch nguyên tử ACID.
* [`docs/05-architecture/`](docs/05-architecture/): Kiến trúc tổng thể C4, Backend Clean Arch, Frontend Feature-based, AI Service Stateless và Cấu hình Docker Compose.
* [`docs/06-api-design/`](docs/06-api-design/): Chuẩn REST Uniform Envelope, Đặc tả 32 Endpoints, Hợp đồng giao tiếp AI nội bộ và `openapi.yaml`.
* [`docs/07-implementation-plan/`](docs/07-implementation-plan/): Lộ trình triển khai 7 giai đoạn (Phase 0 -> Phase 6), ma trận phụ thuộc, tiêu chuẩn nghiệm thu DoD.
* [`GEMINI.md`](GEMINI.md): Chỉ dẫn hệ thống tĩnh (Static Directives) & Bảng điều hướng tài liệu chuẩn dành cho AI Agent.

---

## 3. HƯỚNG DẪN KHỞI CHẠY TRÊN MÁY MỚI (VỚI DOCKER)

Khi clone dự án về máy tính đã cài đặt sẵn Docker và Git:

### Bước 1: Clone repository
```bash
git clone <URL_REPOSITORY_CUA_BAN>
cd dss-ai-purchase
```

### Bước 2: Chuẩn bị môi trường
Dự án sẽ được triển khai theo lộ trình 7 giai đoạn trong [`docs/07-implementation-plan/phase-details.md`](docs/07-implementation-plan/phase-details.md). Bắt đầu từ **Phase 0** để khởi tạo cấu trúc code và dịch vụ Docker.
