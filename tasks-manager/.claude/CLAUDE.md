# CLAUDE.md — CoRide / Tasks Manager

> File này là **bộ nhớ chính** của AI. Đọc kỹ trước khi làm bất cứ điều gì trong project.
> Cập nhật file này mỗi khi có thay đổi kiến trúc hoặc quyết định kỹ thuật quan trọng.

---

## 1. Tổng quan dự án

**Tên:** CoRide — Nền tảng chia sẻ hành trình di chuyển (Carpooling)
**Loại:** Ứng dụng Web + Mobile
**Thị trường:** Nội địa Việt Nam (Hà Nội, TP.HCM và liên tỉnh)

**Vấn đề giải quyết:**
- Lãng phí chỗ ngồi trên phương tiện cá nhân (xe 4–5 chỗ chỉ chở 1–2 người)
- Chi phí di chuyển cao cho người dùng cá nhân
- Thiếu niềm tin khi đi chung xe với người lạ

**Module hiện tại:** `tasks-manager` — quản lý công việc nội bộ của team vận hành CoRide

---

## 2. Đối tượng người dùng

| Nhóm           | Mô tả                                                               |
|----------------|---------------------------------------------------------------------|
| **Tài xế**     | Có xe cá nhân, di chuyển lộ trình cố định, muốn chia sẻ chi phí   |
| **Hành khách** | Cần di chuyển, muốn tiết kiệm hơn taxi/xe công nghệ               |
| **Admin**      | Vận hành nền tảng, duyệt tài xế, xử lý vi phạm, giám sát hệ thống |

---

## 3. Chức năng hệ thống (Feature Map)

```
CoRide
├── Auth & Profile
│   ├── Đăng ký: email / số điện thoại / Google OAuth
│   ├── Xác minh tài xế: CCCD + bằng lái xe (bắt buộc trước khi đăng chuyến)
│   └── Hồ sơ: điểm đánh giá, lịch sử chuyến, mức xác minh
│
├── Chuyến đi
│   ├── Tài xế: tạo chuyến (điểm đi, điểm đến, giờ, số chỗ, giá/chỗ)
│   ├── Hành khách: tìm chuyến (PostGIS bán kính 2km), lọc giờ/giá/chỗ
│   └── Google Maps API: tính khoảng cách, thời gian, hiển thị lộ trình
│
├── Đặt chỗ
│   ├── Hành khách xem chi tiết → chọn số ghế → gửi yêu cầu
│   └── Tài xế xác nhận / từ chối → thông báo đẩy cho hành khách
│
├── Realtime (Socket.io + Redis Pub/Sub)
│   ├── Chat: nhắn tin trong app sau khi đặt chỗ được xác nhận
│   └── Tracking: tài xế emit GPS mỗi 5 giây → hành khách xem realtime
│
├── Thanh toán
│   ├── Tự tính: số chỗ × giá tài xế đăng
│   ├── Cổng: VNPay, MoMo
│   └── Dự phòng: ghi nhận thanh toán tiền mặt
│
├── Đánh giá & Tin cậy
│   ├── Sau chuyến: cả hai phía đánh giá 1–5 sao + nhận xét
│   ├── Điểm trung bình hiển thị công khai trên hồ sơ
│   └── Báo cáo vi phạm → admin xử lý
│
└── Admin Panel
    ├── Thống kê: số chuyến, người dùng, doanh thu
    ├── Duyệt hồ sơ xác minh tài xế
    └── Khoá tài khoản vi phạm
```

---

## 4. Kiến trúc hệ thống

```
                    ┌─────────────────────────────────┐
                    │         CLIENT LAYER             │
                    │  Next.js 14 (Web)                │
                    │  React Native (Android & iOS)    │
                    └──────────────┬──────────────────┘
                                   │ REST API + Socket.io
                    ┌──────────────▼──────────────────┐
                    │         BACKEND LAYER            │
                    │  Node.js + Express.js (TS)       │
                    │  Socket.io (realtime)            │
                    └──────┬───────────────┬──────────┘
                           │               │
            ┌──────────────▼──┐   ┌────────▼───────────┐
            │   PostgreSQL    │   │       Redis         │
            │   + PostGIS     │   │  Cache + Session    │
            │   (primary DB)  │   │  + Pub/Sub          │
            └─────────────────┘   └────────────────────┘
```

**External Services:**

| Service                   | Dùng cho                                  |
|---------------------------|-------------------------------------------|
| Google Maps API           | Bản đồ, tìm đường, geocoding             |
| Firebase Cloud Messaging  | Push notification (mobile)               |
| VNPay / MoMo              | Thanh toán nội địa                       |
| Resend                    | Email giao dịch (xác nhận, nhắc lịch)   |
| Cloudflare R2             | Lưu ảnh đại diện, tài liệu xác minh     |

---

## 5. Tech Stack chi tiết

### Frontend — Web
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **State:** React Query (server state) + Zustand (client state)
- **Maps:** Google Maps JavaScript API / react-google-maps

### Frontend — Mobile
- **Framework:** React Native
- **Navigation:** Expo Router hoặc React Navigation
- **Maps:** react-native-maps

> Web và Mobile dùng **chung toàn bộ API** từ backend, không có logic riêng.

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js (TypeScript)
- **Realtime:** Socket.io
- **Auth:** JWT — access token (15 phút) + refresh token (30 ngày) lưu trong Redis
- **Validation:** Zod hoặc Joi
- **ORM:** Prisma hoặc TypeORM

### Database
- **Primary:** PostgreSQL 15 + extension **PostGIS** (xử lý dữ liệu địa lý)
- **Cache / Session:** Redis 7
- **Storage:** Cloudflare R2 (file tĩnh)

### DevOps
- **Container:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Deploy:** (cập nhật sau)

---

## 6. Điểm kỹ thuật quan trọng — PHẢI NẮM

### PostGIS — Thuật toán matching lộ trình

Đây là phần phức tạp nhất. **Không so sánh địa chỉ văn bản.**

```sql
-- Tọa độ GPS lưu dạng GEOMETRY(POINT, 4326)
-- Tìm chuyến trong bán kính 2km từ điểm đón của hành khách
SELECT trips.*
FROM trips
WHERE
  ST_DWithin(
    trips.pickup_point::geography,
    ST_MakePoint(:passenger_lng, :passenger_lat)::geography,
    2000  -- 2000 meters
  )
  AND ST_DWithin(
    trips.dropoff_point::geography,
    ST_MakePoint(:passenger_dropoff_lng, :passenger_dropoff_lat)::geography,
    2000
  )
  AND trips.departure_time BETWEEN :start AND :end
  AND trips.available_seats >= :requested_seats
  AND trips.status = 'active';
```

### Realtime Tracking — Socket.io + Redis Pub/Sub

```
Tài xế app → emit('location', {lat, lng}) mỗi 5 giây
    → Socket.io server → publish vào Redis channel "trip:{tripId}"
        → Tất cả server instances subscribe → forward đến hành khách trong room
```

Dùng Redis Pub/Sub để đảm bảo hoạt động đúng khi scale nhiều server instance.

### JWT Strategy

```
Access Token:  15 phút  → lưu trong memory (không localStorage)
Refresh Token: 30 ngày  → lưu trong Redis, có thể revoke
```

---

## 7. Phạm vi phiên bản 1

- Chỉ hỗ trợ **đặt trước** (không on-demand)
- Thị trường **nội địa Việt Nam**
- Chưa có: group carpool (nhiều điểm đón), on-demand, quốc tế

---

## 8. Nguyên tắc làm việc

### Không được phép
- Hardcode API key, JWT secret, password → dùng biến môi trường
- Hard delete dữ liệu → dùng `deleted_at` (soft delete)
- Merge thẳng vào `main` không qua PR
- Bỏ qua lỗi với `catch(e) {}` rỗng
- Dùng `any` trong TypeScript
- Query địa lý bằng string matching → phải dùng PostGIS

### Bắt buộc
- Mọi endpoint phải có authentication + ownership check
- Coordinate lưu dạng `GEOMETRY(POINT, 4326)` — không dùng `FLOAT lat, FLOAT lng` riêng lẻ
- Rate limiting trên: `/auth/login`, `/auth/register`, `/auth/refresh`
- Mọi file upload phải kiểm tra MIME type + giới hạn kích thước

---

## 9. Biến môi trường bắt buộc

Xem `.env.example` để biết danh sách đầy đủ:

```env
# App
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/coride

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_ACCESS_SECRET=...          # Tối thiểu 32 ký tự
JWT_REFRESH_SECRET=...         # Khác với access secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Google
GOOGLE_MAPS_API_KEY=...
GOOGLE_CLIENT_ID=...           # OAuth

# Storage
CLOUDFLARE_R2_BUCKET=...
CLOUDFLARE_R2_ACCESS_KEY=...
CLOUDFLARE_R2_SECRET_KEY=...

# Payment
VNPAY_TMN_CODE=...
VNPAY_HASH_SECRET=...
MOMO_PARTNER_CODE=...
MOMO_ACCESS_KEY=...

# Email
RESEND_API_KEY=...

# Firebase (Push Notification)
FIREBASE_SERVER_KEY=...
```

---

## 10. Quick Reference

| Tác vụ              | Command                  |
|---------------------|--------------------------|
| Chạy development    | `npm run dev`            |
| Chạy tests          | `npm test`               |
| Lint                | `npm run lint`           |
| Build production    | `npm run build`          |
| DB migration        | `npm run db:migrate`     |
| DB seed             | `npm run db:seed`        |
| API docs (Swagger)  | http://localhost:3000/api/docs |
