# Deployment & DevOps: Đóng Gói Container & Triển Khai Hệ Thống

---

## 1. Tổng Quan Kiến Trúc Đóng Gói (Containerization Architecture)

Hệ thống **DSS AI Purchase** được container hóa 100% bằng **Docker & Docker Compose**, đóng gói 4 thành phần dịch vụ biệt lập vào một mạng nội bộ ảo (`dss-network`), bảo đảm khả năng khởi chạy "One-Click Run" trên bất kỳ máy trạm hoặc máy chủ nào:

```mermaid
graph TB
    subgraph HostMachine ["MÁY TRẠM / MÁY CHỦ CỤC BỘ (HOST OS)"]
        User["Người Dùng / Trình Duyệt"]
        
        subgraph DockerCompose ["Docker Compose Environment (dss-network)"]
            FE["Container: dss-frontend<br/>React + Vite (Nginx)<br/>Port: 3000"]
            BE["Container: dss-backend<br/>Node.js + Express + Prisma<br/>Port: 5000"]
            AI["Container: dss-ai-service<br/>Python + FastAPI<br/>Port: 8000"]
            DB[("Container: dss-postgres<br/>PostgreSQL 14+<br/>Port: 5432")]
            
            Volume[("Named Volume: dss_postgres_data<br/>Lưu trữ dữ liệu bền vững")]
        end
    end

    User -- "http://localhost:3000" --> FE
    User -- "http://localhost:5000/api (Direct)" --> BE
    User -- "http://localhost:8000/docs (Swagger)" --> AI
    FE -- "http://backend:5000/api/v1 (Proxy)" --> BE
    BE -- "postgresql://postgres:...@postgres:5432/dss_db" --> DB
    BE -- "http://ai-service:8000/api/v1/forecast" --> AI
    DB --- Volume
```

---

## 2. Kịch Bản Khởi Tạo Hoàn Chỉnh (`docker-compose.yml`)

Kịch bản dưới đây định nghĩa đầy đủ 4 containers, cấu hình phụ thuộc khởi động theo thứ tự (Healthcheck Dependency) và gắn volume dữ liệu:

```yaml
version: '3.8'

services:
  # ---------------------------------------------------------------------------
  # 1. CƠ SỞ DỮ LIỆU POSTGRESQL
  # ---------------------------------------------------------------------------
  postgres:
    image: postgres:14-alpine
    container_name: dss-postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: dss_secure_password_2026
      POSTGRES_DB: dss_ai_purchase_db
    ports:
      - "5432:5432"
    volumes:
      - dss_postgres_data:/var/lib/postgresql/data
    networks:
      - dss-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d dss_ai_purchase_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  # ---------------------------------------------------------------------------
  # 2. DỊCH VỤ AI DỰ BÁO NHU CẦU (PYTHON FASTAPI)
  # ---------------------------------------------------------------------------
  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
    container_name: dss-ai-service
    restart: always
    environment:
      PORT: 8000
      HOST: 0.0.0.0
    ports:
      - "8000:8000"
    networks:
      - dss-network
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 3

  # ---------------------------------------------------------------------------
  # 3. CORE BACKEND API (NODE.JS + EXPRESS + PRISMA)
  # ---------------------------------------------------------------------------
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: dss-backend
    restart: always
    environment:
      PORT: 5000
      DATABASE_URL: "postgresql://postgres:dss_secure_password_2026@postgres:5432/dss_ai_purchase_db?schema=public"
      AI_SERVICE_URL: "http://ai-service:8000"
      JWT_SECRET: "dss_super_secret_jwt_key_graduation_2026"
      JWT_EXPIRES_IN: "8h"
      CORS_ORIGIN: "http://localhost:3000"
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
      ai-service:
        condition: service_healthy
    networks:
      - dss-network

  # ---------------------------------------------------------------------------
  # 4. FRONTEND CLIENT (REACT 18 + VITE + TAILWINDCSS)
  # ---------------------------------------------------------------------------
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: dss-frontend
    restart: always
    environment:
      VITE_API_BASE_URL: "http://localhost:5000/api/v1"
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - dss-network

networks:
  dss-network:
    driver: bridge

volumes:
  dss_postgres_data:
    driver: local
```

---

## 3. Dockerfile Cho Từng Thành Phần

### 3.1. Backend Dockerfile (`backend/Dockerfile`)

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Cài đặt thư viện phụ thuộc
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Sinh Prisma Client và build TypeScript sang JavaScript
COPY . .
RUN npx prisma generate
RUN npm run build

# Giai đoạn thực thi (Production stage)
FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000

# Chạy migration và khởi động server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/api/server.js"]
```

---

### 3.2. AI Service Dockerfile (`ai-service/Dockerfile`)

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Cài đặt curl để kiểm tra healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Cài đặt dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy mã nguồn ứng dụng
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

### 3.3. Frontend Dockerfile (`frontend/Dockerfile`)

```dockerfile
# Giai đoạn Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Giai đoạn Serve bằng Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

*Cấu hình Nginx (`frontend/nginx.conf`) hỗ trợ định tuyến SPA:*
```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

---

## 4. Quản Lý Cấu Hình & Biến Môi Trường (Environment Variables)

### 4.1. File `.env` Của Backend (`backend/.env`)

```ini
# Cấu hình cổng kết nối
PORT=5000
NODE_ENV=production

# Cấu hình kết nối Cơ sở dữ liệu PostgreSQL
DATABASE_URL="postgresql://postgres:dss_secure_password_2026@postgres:5432/dss_ai_purchase_db?schema=public"

# Cấu hình URL gọi sang Python AI Service
AI_SERVICE_URL="http://ai-service:8000"

# Cấu hình bảo mật JWT
JWT_SECRET="dss_super_secret_jwt_key_graduation_2026"
JWT_EXPIRES_IN="8h"

# Cấu hình CORS
CORS_ORIGIN="http://localhost:3000"
```

### 4.2. File `.env` Của Frontend (`frontend/.env`)

```ini
# URL gốc của Backend REST API
VITE_API_BASE_URL="http://localhost:5000/api/v1"
```

### 4.3. File `.env` Của AI Service (`ai-service/.env`)

```ini
PORT=8000
HOST="0.0.0.0"
LOG_LEVEL="info"
```

---

## 5. Quy Trình Vận Hành & Khởi Chạy Hệ Thống (Operations Guide)

### 5.1. Khởi Chạy Toàn Bộ Hệ Thống Lần Đầu Tiên

Chỉ với 2 bước lệnh từ thư mục gốc của dự án:

```bash
# Bước 1: Khởi dựng và chạy toàn bộ 4 containers ngầm
docker-compose up --build -d

# Bước 2: Nạp dữ liệu tài khoản Admin và trọng số mặc định ban đầu
docker-compose exec backend npx prisma db seed
```

### 5.2. Kiểm Tra Trạng Thái Vận Hành

Sau khi khởi chạy thành công, truy cập các địa chỉ:
* **Giao diện Web Frontend:** `http://localhost:3000`
* **Tài liệu API Backend:** `http://localhost:5000/api/v1/health`
* **Giao diện Swagger Test Thuật Toán AI:** `http://localhost:8000/docs`
* **Cơ sở dữ liệu PostgreSQL:** `localhost:5432` (User: `postgres`, DB: `dss_ai_purchase_db`)

### 5.3. Quy Trình Sao Lưu Dữ Liệu (Backup & Restore)

Cho cửa hàng bán lẻ đơn lẻ, việc sao lưu định kỳ có thể thực hiện đơn giản qua lệnh `pg_dump`:

```bash
# Sao lưu cơ sở dữ liệu ra file SQL
docker-compose exec -T postgres pg_dump -U postgres dss_ai_purchase_db > backup_$(date +%Y%m%d).sql

# Phục hồi dữ liệu từ file backup
cat backup_20260904.sql | docker-compose exec -T postgres psql -U postgres dss_ai_purchase_db
```

---

## 6. Kết Luận

Giải pháp đóng gói bằng **Docker Compose** khép lại toàn bộ vòng đời thiết kế kiến trúc hệ thống, mang đến tính ổn định, dễ dàng bàn giao, kiểm thử và vận hành cho giải pháp **Hệ Thống Hỗ Trợ Ra Quyết Định Mua Hàng Tích Hợp AI**.
