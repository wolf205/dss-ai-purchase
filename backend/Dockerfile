FROM node:20-alpine AS builder

WORKDIR /app

# Cài đặt openssl và libc6-compat cho Prisma trên Alpine
RUN apk add --no-cache openssl libc6-compat

# Cài đặt thư viện phụ thuộc
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --no-audit --no-fund

# Sinh Prisma Client và build TypeScript sang JavaScript
COPY . .
RUN npx prisma generate
RUN npm run build

# Giai đoạn thực thi (Production stage)
FROM node:20-alpine AS runner
WORKDIR /app

# Cài đặt openssl cho runtime
RUN apk add --no-cache openssl libc6-compat

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 5000

# Chạy migration, nạp seed data và khởi động server
CMD ["sh", "-c", "npx prisma migrate deploy && npm run prisma:seed && node dist/api/server.js"]
