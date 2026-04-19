# TECHNICAL REPORT: CoRide

## 1. Kiến trúc Hệ thống
CoRide được xây dựng theo mô hình **Monorepo** sử dụng Turborepo, bao gồm:
- **Backend**: RESTful API với Express.js, TypeScript và Prisma ORM.
- **Web**: Next.js (App Router) với Tailwind CSS và Shadcn UI.
- **Mobile**: React Native với Expo (Đang phát triển/Hoàn thiện).
- **Shared**: Chứa các Zod schemas, types và utils dùng chung cho cả Web, Mobile và Backend.

## 2. Công nghệ Cốt lõi
- **Database**: PostgreSQL để lưu trữ dữ liệu bền vững.
- **Caching**: Redis hỗ trợ caching và các dịch vụ thời gian thực.
- **Real-time**: Server-Sent Events (SSE) cho hệ thống thông báo tức thời.
- **Auth**: JSON Web Tokens (JWT) với cơ chế Access & Refresh tokens.
- **Testing**: Playwright cho E2E Testing, Jest cho Unit/Integration Testing.

## 3. Các tính năng đặc trưng
- **Address Autocomplete**: Tích hợp Google Places API.
- **Interactive Maps**: Hiển thị lộ trình và vị trí bằng Google Maps.
- **Clean Architecture**: Phân chia layer rõ ràng trong Backend (Controllers, Services, Middlewares).
- **Security**: Rate limiting, Helmet security headers, Input validation với Zod.

## 4. Docker & Deployment
Hệ thống sẵn sàng cho việc triển khai bằng Docker thông qua:
- Dockerfiles tối ưu hóa (multi-stage).
- Docker Compose cho môi trường phát triển và demo.
- GitHub Actions CI cho việc kiểm soát chất lượng mã nguồn tự động.
