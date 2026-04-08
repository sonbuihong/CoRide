# Phase 2: User Profile & Ride Core - Research

**Researched:** 2026-04-08
**Domain:** User Profile Management, Ride Management, File Upload, Search
**Confidence:** HIGH

## Summary

Giai đoạn 2 tập trung vào việc hoàn thiện hồ sơ người dùng và các tính năng cốt lõi của ứng dụng đi chung xe: Đăng chuyến đi và Tìm kiếm chuyến đi. Chúng ta sẽ triển khai khả năng tải ảnh đại diện lên Cloudinary, cập nhật thông tin cá nhân (Họ tên, SĐT, Bio), và xây dựng luồng CRUD cho Chuyến đi (Ride).

**Primary recommendation:** Sử dụng `Multer` kết hợp với `Cloudinary` để xử lý tải ảnh đại diện do tính đơn giản và khả năng tối ưu hóa ảnh tự động. Đối với việc tìm kiếm chuyến đi, bắt đầu bằng tìm kiếm chuỗi ký tự (String matching) cơ bản trong Prisma trước khi nâng cấp lên Maps API ở Giai đoạn 3.

## Standard Stack

### Backend (Express)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `multer` | 2.1.1 | Xử lý `multipart/form-data` | Thư viện chuẩn nhất cho Express để nhận file. [VERIFIED: npm registry] |
| `cloudinary` | 2.9.0 | Lưu trữ và tối ưu hóa hình ảnh | Cung cấp CDN miễn phí và API mạnh mẽ cho prototype. [VERIFIED: npm registry] |
| `multer-storage-cloudinary` | 4.0.0 | Tích hợp Multer với Cloudinary | Giúp tải thẳng file từ stream lên Cloudinary mà không cần lưu tạm ở server. [VERIFIED: npm registry] |
| `zod` | 3.24.2 | Validation dữ liệu | Đã có sẵn trong project, giúp đồng bộ schema giữa FE và BE. [CITED: codebase] |

### Frontend (Next.js)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| `react-hook-form` | 7.54.2 | Quản lý Form | Đã có sẵn, dùng cho form cập nhật hồ sơ và đăng chuyến đi. [CITED: codebase] |
| `date-fns` | ^3.0.0 | Xử lý thời gian | Cần thiết để format và validate `departureTime`. [ASSUMED] |
| `lucide-react` | 1.7.0 | Icons | Icons cho UI (Xe, Lịch, Map pin, User). [CITED: codebase] |

**Installation:**
```bash
# Backend
cd apps/backend
npm install multer cloudinary multer-storage-cloudinary
npm install -D @types/multer

# Shared (cho các schema mới)
cd packages/shared
npm install date-fns
```

## Architecture Patterns

### Recommended Project Structure
```
apps/backend/src/
├── config/
│   └── cloudinary.ts    # Cấu hình Cloudinary
├── controllers/
│   ├── ride.controller.ts
│   └── user.controller.ts (cập nhật)
├── routes/
│   ├── ride.routes.ts
│   └── user.routes.ts (cập nhật)
└── services/
    ├── ride.service.ts
    └── user.service.ts (cập nhật)

packages/shared/src/
├── ride.schema.ts      # Zod schema cho Ride
└── user.schema.ts      # Zod schema cho Profile update
```

### Pattern 1: Middleware Upload
**What:** Sử dụng Multer làm middleware trước khi vào controller.
**When to use:** Khi endpoint cần nhận file (e.g. `PATCH /api/users/profile`).
**Example:**
```typescript
// Source: Cloudinary docs & Multer best practices
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'coride/avatars',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  } as any,
});

export const upload = multer({ storage: storage });
```

### Anti-Patterns to Avoid
- **Lưu file trực tiếp trên ổ cứng server:** Gây khó khăn khi scale (Docker) và tốn dung lượng. Sử dụng Cloud Storage ngay từ đầu.
- **Để Logic Search quá phức tạp ở Database level:** Với MVP, hãy giữ logic tìm kiếm đơn giản (insensitive string match). Tránh viết Raw SQL nếu Prisma có thể đáp ứng.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Xử lý ảnh (Resize/Crop) | Custom Sharp logic | Cloudinary Transformation | Cloudinary xử lý ở Cloud qua URL, giảm tải cho server. |
| Date Picking | Custom Calendar | Shadcn-ui Calendar | Đã được tối ưu hóa accessibility và trải nghiệm người dùng. |
| Form Validation | If-else checks | Zod | Đảm bảo Type-safety và đồng bộ FE-BE. |

## Common Pitfalls

### Pitfall 1: Timezone Mismatch
**What goes wrong:** Người dùng đăng chuyến đi lúc 8:00 sáng nhưng hệ thống lưu theo UTC hoặc server timezone khác, dẫn đến sai lệch khi hiển thị.
**How to avoid:** Luôn gửi thời gian từ FE dưới dạng ISO 8601 String. BE lưu vào DB dưới dạng UTC. FE khi hiển thị sẽ format theo timezone của trình duyệt.
**Warning signs:** Chuyến đi hiển thị lệch vài giờ so với lúc tạo.

### Pitfall 2: Multer File Type Bypass
**What goes wrong:** Người dùng upload file script hoặc file quá lớn gây crash.
**How to avoid:** Thiết lập `limits` (e.g. 5MB) và `fileFilter` trong cấu hình Multer.

## Code Examples

### Ride Creation Schema (Zod)
```typescript
// Source: Project standard
export const createRideSchema = z.object({
  origin: z.string().min(2, "Điểm đi không được để trống"),
  destination: z.string().min(2, "Điểm đến không được để trống"),
  departureTime: z.string().refine((val) => {
    const date = new Date(val);
    return date > new Date();
  }, "Thời gian khởi hành phải ở tương lai"),
  availableSeats: z.number().int().min(1, "Phải có ít nhất 1 ghế trống"),
  pricePerSeat: z.number().min(0, "Giá không được âm"),
  description: z.string().optional(),
});
```

### Basic Ride Search (Prisma)
```typescript
// Source: Prisma Docs
const rides = await prisma.ride.findMany({
  where: {
    origin: { contains: query.origin, mode: 'insensitive' },
    destination: { contains: query.destination, mode: 'insensitive' },
    departureTime: {
      gte: new Date(query.date), // Ngày bắt đầu
      lt: new Date(new Date(query.date).setDate(new Date(query.date).getDate() + 1)) // Ngày kết thúc
    },
    availableSeats: { gte: 1 },
    status: 'SCHEDULED'
  },
  include: { driver: true }
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Local Storage | Cloud Storage (Cloudinary) | 2020+ | Dễ dàng quản lý ảnh, CDN nhanh hơn. |
| String Query | Prisma Type-safe Query | Recent | Tránh SQL Injection, IDE gợi ý code tốt. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Cloudinary là lựa chọn tốt nhất | Standard Stack | Nếu user không muốn dùng 3rd party service. |
| A2 | Tìm kiếm chuỗi là đủ cho Phase 2 | Architecture | Có thể không chính xác nếu người dùng nhập tên địa danh khác nhau (e.g. "TP.HCM" vs "Sài Gòn"). |

## Open Questions

1. **Xác thực Số điện thoại:** Có cần gửi OTP qua SMS không?
   - Hiện tại: Chỉ validate định dạng bằng Regex để giảm chi phí/độ phức tạp.
   - Giai đoạn sau: Cân nhắc tích hợp Twilio/Firebase Auth.
2. **Autocomplete Địa chỉ:** Có nên đưa một phần vào Phase 2 không?
   - Kiến nghị: Giữ nguyên ở Phase 3 để tập trung vào CRUD và Upload trong Phase 2.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | v22.14.0 | — |
| PostgreSQL | Database | ✓ | v18 | — |
| Docker | DB Hosting | ✓ | 29.1.2 | — |
| Cloudinary Account | Image Upload | ✗ | — | Cần đăng ký và cung cấp ENV vars |

**Missing dependencies with no fallback:**
- **Cloudinary API Key/Secret:** Cần có để thực hiện tính năng upload. Nếu không có, tính năng upload sẽ bị lỗi runtime.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest |
| Config file | `apps/backend/jest.config.js` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROF-01 | Cập nhật hồ sơ thành công | Integration | `npm test tests/profile.test.ts` | ❌ Wave 0 |
| UPLD-01 | Tải ảnh đại diện thành công | Integration | `npm test tests/upload.test.ts` | ❌ Wave 0 |
| RIDE-01 | Tạo chuyến đi với dữ liệu hợp lệ | Unit/Int | `npm test tests/ride.test.ts` | ❌ Wave 0 |
| SRCH-01 | Tìm kiếm chuyến đi theo điểm đi/đến | Integration | `npm test tests/search.test.ts` | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] `apps/backend/src/tests/profile.test.ts`
- [ ] `apps/backend/src/tests/ride.test.ts`
- [ ] Cloudinary mock cho testing.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | Yes | Zod validation cho mọi API input. |
| V12 File Upload | Yes | Giới hạn loại file (images), dung lượng (5MB), và quét malware (Cloudinary handle). |
| V4 Access Control | Yes | `authMiddleware` bảo vệ các route cá nhân/tài xế. |

### Known Threat Patterns for Node/Express

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Insecure File Upload | Tampering | Sử dụng whitelist extension, không thực thi file từ thư mục upload. |
| Unauthorized Access | Information Disclosure | Middleware kiểm tra JWT và quyền sở hữu tài nguyên (Ride/Profile). |

## Sources

### Primary (HIGH confidence)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration) - Image upload best practices
- [Multer GitHub](https://github.com/expressjs/multer) - Handling multipart/form-data
- [Prisma Filter API](https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting) - Search and filtering

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Libraries are industry standards.
- Architecture: HIGH - Follows existing project patterns.
- Pitfalls: MEDIUM - Timezone can be tricky depending on deployment.

**Research date:** 2026-04-08
**Valid until:** 2026-05-08
