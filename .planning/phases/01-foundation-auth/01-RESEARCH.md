# Giai đoạn 1: Nền tảng & Xác thực - Nghiên cứu

**Ngày nghiên cứu:** 2024-05-22
**Lĩnh vực:** Monorepo Architecture, JWT Authentication, Prisma ORM
**Độ tin cậy:** HIGH

## Tóm tắt (Summary)

Nghiên cứu này tập trung vào việc thiết lập một kiến trúc Monorepo vững chắc cho dự án CoRide, tích hợp Express (Backend), Next.js (Web), và Expo (Mobile). Chúng tôi đề xuất sử dụng **Turborepo** để quản lý build pipeline và chia sẻ code hiệu quả giữa các ứng dụng. Hệ thống xác thực sẽ sử dụng **JWT (Access & Refresh Tokens)** với chiến lược xoay vòng (rotation) để đảm bảo bảo mật tối đa, đồng thời giải quyết các thách thức về tương thích giữa môi trường Trình duyệt (Web) và Native (Mobile).

**Khuyến nghị chính:** Sử dụng cấu trúc Monorepo với các package dùng chung (`packages/database`, `packages/shared`) để đảm bảo tính đồng nhất về kiểu dữ liệu (Type-safety) và logic kiểm tra (Validation). Sử dụng thư viện `jose` cho các thao tác JWT trên Backend và `jwt-decode` cho Frontend.

---

## Cấu trúc Monorepo tiêu chuẩn (Standard Stack)

### Core Stack
| Thư viện | Phiên bản | Mục đích | Tại sao chọn |
|----------|-----------|---------|--------------|
| Turborepo | ^1.13.0 | Quản lý Monorepo | Hiệu năng build cao, caching thông minh. [VERIFIED: turborepo.dev] |
| Express | ^5.2.1 | Backend API | Nhẹ, linh hoạt, hỗ trợ async/await mặc định trong v5. [VERIFIED: expressjs.com] |
| Next.js | ^14.2.0 | Web Frontend | SEO tốt, App Router mạnh mẽ, tích hợp tốt với React 18. [VERIFIED: nextjs.org] |
| Expo | ^50.0.0+ | Mobile App | Phát triển nhanh, thư viện native phong phú (SecureStore). [VERIFIED: expo.dev] |
| Prisma | ^5.22.0 | ORM Database | Type-safety tuyệt vời, dễ dàng quản lý migrations. [VERIFIED: prisma.io] |
| Zod | ^3.23.0 | Validation | Khai báo schema một lần, dùng được cho cả TS types và Runtime validation. [VERIFIED: zod.dev] |

### Supporting Libraries
| Thư viện | Mục đích | Khi nào dùng |
|----------|---------|--------------|
| `jose` | Xử lý JWT | Ký và xác thực token trên Backend (Cross-runtime). [VERIFIED: github.com/panva/jose] |
| `jwt-decode` | Đọc JWT | Lấy thông tin user từ token trên Web/Mobile (Không cần secret). [VERIFIED: npmjs.com/jwt-decode] |
| `bcrypt` | Hash mật khẩu | Lưu trữ mật khẩu an toàn trong Database. [VERIFIED: npmjs.com/bcrypt] |
| `cookie-parser` | Đọc cookies | Xử lý Refresh Token lưu trong HttpOnly cookie trên Express. [VERIFIED: expressjs.com] |
| `expo-secure-store` | Lưu trữ Mobile | Lưu Access/Refresh Token an toàn trên iOS/Android. [VERIFIED: docs.expo.dev] |

**Cài đặt (Root):**
```bash
npm install turbo --save-dev
```

---

## Kiến trúc hệ thống (Architecture Patterns)

### Cấu trúc thư mục tối ưu
```text
CoRide/
├── apps/                   # Ứng dụng chính (Deployable)
│   ├── backend/            # Express.js API
│   ├── web/                # Next.js App
│   └── mobile/             # Expo (React Native)
├── packages/               # Thư viện dùng chung (Internal)
│   ├── database/           # Prisma client, schema, migrations
│   ├── shared/             # Zod schemas, common types, utils
│   ├── ui/                 # Shared UI components (nếu cần)
│   └── config/             # Shared eslint/tsconfig
├── package.json            # Root configuration
└── turbo.json              # Turborepo pipeline
```

### Thiết lập Prisma Shared Package
Để chia sẻ Prisma Client hiệu quả, cần đặt `output` cụ thể trong `schema.prisma` để tránh xung đột bundle:
```prisma
// packages/database/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/client"
}
```
Sau đó, export một Singleton instance từ `packages/database/src/index.ts` để sử dụng ở `backend` và `web`. [CITED: prisma.io/docs/guides/other/monorepos]

### Anti-Patterns cần tránh
- **Duplicate Schemas:** Định nghĩa Zod schema riêng rẽ ở backend và frontend dẫn đến sai lệch dữ liệu.
- **Storing Secrets in LocalStorage:** Lưu JWT trong LocalStorage trên Web (dễ bị tấn công XSS).
- **Hardcoding API URLs:** Không sử dụng biến môi trường cho endpoint API giữa các môi trường dev/staging/prod.

---

## Thiết kế Database (Prisma Schema)

Các thực thể cốt lõi cho ứng dụng Carpooling:

### 1. Thực thể User
Lưu trữ thông tin người dùng và vai trò.
```prisma
model User {
  id            Int       @id @default(autoincrement())
  email         String    @unique
  password      String    // Hash với bcrypt
  firstName     String?
  lastName      String?
  phone         String?
  avatarUrl     String?
  role          Role      @default(PASSENGER)
  rating        Float     @default(0)
  ridesCreated  Ride[]    @relation("DriverRides")
  bookings      Booking[]
  reviewsGiven  Review[]  @relation("Reviewer")
  reviewsReceived Review[] @relation("Reviewee")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum Role {
  DRIVER
  PASSENGER
  ADMIN
}
```

### 2. Thực thể Ride
Thông tin về chuyến đi do tài xế đăng.
```prisma
model Ride {
  id              Int       @id @default(autoincrement())
  driverId        Int
  driver          User      @relation("DriverRides", fields: [driverId], references: [id])
  origin          String
  destination     String
  departureTime   DateTime
  availableSeats  Int
  price           Float
  status          RideStatus @default(PENDING)
  bookings        Booking[]
  reviews         Review[]
  createdAt       DateTime  @default(now())
}

enum RideStatus {
  PENDING
  ONGOING
  COMPLETED
  CANCELLED
}
```

### 3. Thực thể Booking & Review
```prisma
model Booking {
  id            Int           @id @default(autoincrement())
  rideId        Int
  ride          Ride          @relation(fields: [rideId], references: [id])
  passengerId   Int
  passenger     User          @relation(fields: [passengerId], references: [id])
  seats         Int
  status        BookingStatus @default(PENDING)
  createdAt     DateTime      @default(now())
}

model Review {
  id            Int      @id @default(autoincrement())
  rideId        Int
  ride          Ride     @relation(fields: [rideId], references: [id])
  reviewerId    Int
  reviewer      User     @relation("Reviewer", fields: [reviewerId], references: [id])
  revieweeId    Int
  reviewee      User     @relation("Reviewee", fields: [revieweeId], references: [id])
  rating        Int      // 1-5
  comment       String?
  createdAt     DateTime @default(now())
}
```

---

## Quy trình xác thực JWT an toàn

### Chiến lược Access & Refresh Tokens
| Loại Token | Thời hạn | Lưu trữ (Web) | Lưu trữ (Mobile) | Mục đích |
|------------|----------|---------------|------------------|----------|
| **Access Token** | 15 phút | In-memory | SecureStore | Gửi kèm mọi request (Authorization header) |
| **Refresh Token** | 7 ngày | HttpOnly Cookie | SecureStore | Dùng để lấy Access Token mới khi hết hạn |

### Quy trình Refresh Token Rotation
1. Khi người dùng login, Backend trả về cả 2 token.
2. Web nhận `refreshToken` qua `Set-Cookie` header (HttpOnly, Secure, SameSite=Strict).
3. Mobile nhận cả 2 qua JSON body và lưu vào `SecureStore`.
4. Khi Access Token hết hạn (401), Client gọi `/api/auth/refresh`.
5. Backend xác thực Refresh Token cũ, **hủy bỏ nó** (nếu dùng blacklist/session table) và trả về **cặp token mới**. [ASSUMED: Chiến lược này ngăn chặn reuse attack].

### Express Auth Middleware (Example)
```typescript
import { jwtVerify } from 'jose';

export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
```

---

## Kiểm tra tính tương thích (Compatibility)

### Thách thức giữa Web và Mobile
- **Crypto API:** Thư viện `jose` yêu cầu Web Crypto API. Trên Expo, cần polyfill bằng `expo-standard-web-crypto` nếu muốn chạy logic "Sign/Verify" trên client (Không khuyến khích). [VERIFIED: github.com/panva/jose/docs/runtimes.md]
- **Cookie Handling:** Expo không tự động gửi HttpOnly cookies như trình duyệt. Giải pháp: Mobile sẽ gửi Refresh Token qua Request Body hoặc Header thay vì Cookie.
- **JWT Decoding:** Thư viện `jwt-decode` hoạt động hoàn hảo trên cả 3 nền tảng (Node, Browser, React Native) vì nó không yêu cầu crypto module.

### Đề xuất thư viện đồng nhất
- **Backend:** `jose` (Ký và xác thực).
- **Web/Mobile:** `jwt-decode` (Chỉ để đọc payload hiển thị UI).
- **API Client:** `axios` với interceptors để xử lý tự động việc refresh token khi gặp lỗi 401.

---

## Runtime State Inventory
*(Chỉ dành cho rename/migration - Bỏ qua cho giai đoạn Greenfield này)*

---

## Các lỗi thường gặp (Common Pitfalls)

### 1. Prisma Client Bundling trong Monorepo
**Vấn đề:** Khi `apps/web` import `@repo/db`, Prisma có thể bị lỗi không tìm thấy engine binary.
**Giải pháp:** Luôn sử dụng `custom output` trong Prisma schema và thêm `@prisma/client` vào `external` list của bundler nếu cần.

### 2. CORS & Cookies
**Vấn đề:** Cookies không được gửi từ Web tới API nếu domain khác nhau (ví dụ: `localhost:3000` vs `localhost:3001`).
**Giải pháp:** Cấu hình `cors` trên Express với `credentials: true` và `origin: "http://localhost:3000"`.

### 3. Mobile Token Persistence
**Vấn đề:** Token bị mất khi tắt app nếu chỉ lưu trong biến state.
**Giải pháp:** Bắt buộc sử dụng `expo-secure-store` thay vì `AsyncStorage` để đảm bảo an toàn cho token.

---

## Bảng giả định (Assumptions Log)

| # | Giả định | Phần | Rủi ro nếu sai |
|---|----------|------|---------------|
| A1 | Dự án sẽ sử dụng PostgreSQL làm Database chính. | Prisma Setup | Phải đổi Prisma provider và migrate lại data. |
| A2 | Sử dụng JWT HS256 (Symmetric) cho đơn giản giai đoạn đầu. | Auth Logic | Cần đổi sang RS256 (Asymmetric) nếu yêu cầu bảo mật cao hơn trong tương lai. |
| A3 | Web và Mobile sẽ kết nối trực tiếp đến cùng một Express API. | Auth Strategy | Cần cấu hình CORS phức tạp hơn nếu domain khác nhau hoàn toàn. |

---

## Environment Availability

| Phụ thuộc | Yêu cầu bởi | Sẵn sàng | Phiên bản | Fallback |
|-----------|-------------|----------|-----------|----------|
| Node.js | Toàn bộ dự án | ✓ | v20.x | — |
| PostgreSQL | Database | ✓ | v15+ | Docker container |
| npm/npx | Package Manager| ✓ | v10+ | — |
| Expo CLI | Mobile Development| ✓ | v50+ | — |

---

## Security Domain (ASVS Categories)

| ASVS Category | Áp dụng | Giải pháp tiêu chuẩn |
|---------------|---------|---------------------|
| V2 Authentication | Có | JWT (Access + Refresh) với Rotation. |
| V3 Session Management | Có | Stateless JWT, Refresh Token lưu trong DB để có thể revoke. |
| V5 Input Validation | Có | Sử dụng **Zod** cho mọi API endpoint. |
| V6 Cryptography | Có | Bcrypt cho hashing, Jose cho JWT signing. |

---

## Nguồn tham khảo (Sources)

### Sơ cấp (HIGH confidence)
- [Official Prisma Monorepo Guide](https://www.prisma.io/docs/guides/other/monorepos) - Cách thiết lập database package.
- [Turborepo Documentation](https://turbo.build/repo/docs) - Cấu trúc monorepo chuẩn.
- [Express 5.0 Release Notes](https://expressjs.com/en/5x/api.html) - Hỗ trợ async middleware.

### Thứ cấp (MEDIUM confidence)
- [Auth0 Blog: JWT Refresh Token Flow](https://auth0.com/blog/refresh-tokens-what-are-they-and-why-use-them/) - Quy trình xoay vòng token.
- [Expo SecureStore Docs](https://docs.expo.dev/versions/latest/sdk/securestore/) - Lưu trữ dữ liệu an toàn trên Mobile.
