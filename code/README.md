# CoRide Monorepo

Hệ thống đi chung xe (Carpooling) hiện đại.

## Cấu trúc dự án
- `apps/backend`: Express.js API.
- `apps/web`: Next.js Frontend.
- `apps/mobile`: Expo Mobile App.
- `packages/database`: Prisma schema & client.
- `packages/shared`: Code dùng chung (Schemas, Types).

## Yêu cầu hệ thống
- Node.js 20+
- Docker & Docker Compose

## Hướng dẫn cài đặt nhanh

### 1. Sử dụng Docker (Khuyên dùng)
```bash
docker compose up --build -d
```

### 2. Chạy Local (Phát triển)
1. Cài đặt dependencies:
   ```bash
   npm install
   ```
2. Cấu hình biến môi trường:
   Sao chép `.env.example` thành `.env` trong các thư mục tương ứng.
3. Chạy các ứng dụng:
   ```bash
   # Backend
   npm run dev:backend
   # Web
   npm run dev:web
   # Mobile
   npm run dev:mobile
```

## Kiểm thử
- **E2E Tests**: `cd apps/web && npx playwright test`
- **Unit Tests**: `npm run test`

## Tài liệu
Xem thêm trong thư mục `/docs`.
