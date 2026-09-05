# =============================================================================
# Giai đoạn 1: Build (Biên dịch TypeScript và chuẩn bị asset)
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Cài đặt openssl và libc6-compat cho Prisma trên Alpine
RUN apk add --no-cache openssl libc6-compat

# Cài đặt toàn bộ dependencies (bao gồm devDependencies để compile)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --no-audit --no-fund

# Biến môi trường build-time để parse schema không bị lỗi thiếu DATABASE_URL (Bug 1)
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dss_ai_purchase_db?schema=public"

# Sinh Prisma Client
RUN npx prisma generate

# Copy toàn bộ mã nguồn và biên dịch TypeScript sang JavaScript (bao gồm cả build seed)
COPY . .
RUN npm run build

# =============================================================================
# Giai đoạn 2: Tách biệt production dependencies sạch (Bug 4)
# =============================================================================
FROM node:20-alpine AS prod-deps

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev --no-audit --no-fund

# Copy generated prisma client từ stage builder sang
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# =============================================================================
# Giai đoạn 3: Thực thi (Production runtime tối ưu dung lượng)
# =============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Cài đặt openssl và libc6-compat cho runtime
RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production

# Copy production node_modules và build artifacts (Bug 4)
COPY --from=prod-deps /app/package*.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000

# Khởi động an toàn: migrate deploy, seed an toàn không chặn server, exec node (Bug 3)
CMD ["sh", "-c", "npx prisma migrate deploy && (node dist/prisma/seed.js || echo '⚠️ Seed already applied or skipped.') && exec node dist/api/server.js"]
