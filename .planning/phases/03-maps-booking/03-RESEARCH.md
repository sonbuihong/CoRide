# Phase 3: Maps & Booking - Research

**Researched:** 2026-04-09
**Domain:** Google Maps Platform integration & Booking System Design
**Confidence:** HIGH

## Summary

Giai đoạn 3 tập trung vào hai trụ cột chính: tích hợp bản đồ (Google Maps Platform) và xây dựng hệ thống đặt chỗ (Booking System). Việc tích hợp bản đồ sẽ giúp người dùng nhập địa chỉ chính xác qua Autocomplete và xem lộ trình trực quan. Hệ thống đặt chỗ sẽ quản lý vòng đời của một yêu cầu đi nhờ xe, từ lúc hành khách gửi yêu cầu đến khi tài xế phê duyệt hoặc từ chối, đồng thời đảm bảo tính toàn vẹn của dữ liệu về số ghế trống.

**Primary recommendation:** Sử dụng **Google Maps Platform** để có dữ liệu địa điểm chính xác nhất tại Việt Nam. Triển khai logic đặt chỗ sử dụng **Prisma Transaction** để tránh tranh chấp dữ liệu (race conditions) khi nhiều người cùng đặt những chỗ cuối cùng.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @react-google-maps/api | ^2.20.8 | Maps UI for React | Wrapper chuẩn cho Google Maps JS API, dễ sử dụng với React/Next.js. [VERIFIED: npm registry] |
| use-places-autocomplete | ^4.0.1 | Address Autocomplete | Nhẹ, tối ưu cho custom UI (shadcn) và hỗ trợ Session Token tiết kiệm chi phí. [VERIFIED: npm registry] |
| zod | ^4.3.6 | Data Validation | Thư viện validation mạnh mẽ nhất hiện nay, đã được sử dụng trong dự án. [VERIFIED: npm registry] |
| date-fns | ^4.1.0 | Date manipulation | Xử lý thời gian khởi hành, ETA chính xác. [VERIFIED: npm registry] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| axios | ^1.14.0 | API Communication | Đã có sẵn trong dự án, dùng để gọi Backend API. [VERIFIED: code/package.json] |
| lucide-react | ^0.471.0 | Icons | Đã có sẵn, dùng để hiển thị các chỉ báo trạng thái booking. [VERIFIED: code/package.json] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Google Maps | Mapbox | Mapbox rẻ hơn và UI tùy biến tốt hơn, nhưng dữ liệu địa điểm (POI) và địa chỉ tại Việt Nam kém chính xác hơn Google. [ASSUMED] |
| Google Maps | Goong/Vietmap | Dữ liệu Việt Nam cực tốt nhưng chi phí có thể cao và hệ sinh thái thư viện React không phong phú bằng. [ASSUMED] |

**Installation:**
```bash
# Frontend (apps/web)
npm install @react-google-maps/api use-places-autocomplete date-fns
npm install -D @types/google.maps

# Backend (apps/backend & packages/shared)
npm install date-fns
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── booking/        # UI đặt chỗ, danh sách yêu cầu
│   └── maps/           # Google Map, Autocomplete input
├── services/
│   └── booking.service.ts # Logic xử lý trạng thái, transaction ghế
├── routes/
│   └── booking.routes.ts # API endpoints cho đặt chỗ
└── lib/
    └── maps-loader.ts  # Singleton/Provider để load Google Maps script
```

### Pattern 1: Booking State Machine (Máy trạng thái đặt chỗ)
**What:** Quản lý vòng đời booking qua các trạng thái cố định.
**When to use:** Bắt buộc cho mọi logic đặt chỗ để tránh trạng thái không hợp lệ.
- `PENDING`: Mặc định khi khách đặt.
- `CONFIRMED`: Tài xế đã duyệt -> Trừ ghế trong `Ride`.
- `REJECTED`: Tài xế từ chối -> Không đổi số ghế.
- `CANCELLED`: Khách/Tài xế hủy. Nếu đã `CONFIRMED` thì phải hoàn lại ghế.

### Pattern 2: Atomic Seat Updates (Cập nhật ghế nguyên tử)
**What:** Sử dụng Prisma `$transaction` để đảm bảo không bị "overbooking".
**Example:**
```typescript
// Source: https://www.prisma.io/docs/concepts/components/prisma-client/transactions
await prisma.$transaction(async (tx) => {
  const ride = await tx.ride.findUnique({ where: { id: rideId } });
  if (ride.availableSeats < requestedSeats) throw new Error("Hết ghế");
  
  await tx.ride.update({
    where: { id: rideId },
    data: { availableSeats: { decrement: requestedSeats } }
  });
  
  return await tx.booking.update({ ... });
});
```

### Anti-Patterns to Avoid
- **Client-side seat calculation:** Không bao giờ tin tưởng số ghế tính toán ở Frontend. Luôn re-check ở Backend trong transaction.
- **Hardcoding API Keys:** Không commit API Key bản đồ lên Git. Sử dụng `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Address Suggestions | Custom Search | Google Places Autocomplete | Dữ liệu Google vượt trội, hỗ trợ lỗi chính tả và ngôn ngữ địa phương. |
| Distance/Route Calculation | Math formulas | Directions API | Tính toán quãng đường thực tế theo đường bộ (không phải đường chim bay), bao gồm cả ETA. |
| Transaction Lock | Custom Mutex | Prisma $transaction | Xử lý concurrency ở mức database, an toàn và hiệu năng cao. |

## Common Pitfalls

### Pitfall 1: Google Maps Cost Spike
**What goes wrong:** Chi phí tăng vọt do gọi Autocomplete quá nhiều lần (mỗi phím bấm 1 request).
**Why it happens:** Không sử dụng Session Token hoặc Debounce.
**How to avoid:** Sử dụng `use-places-autocomplete` (đã tích hợp session) và `debounce` 300ms.
**Warning signs:** Billing dashboard của Google Cloud tăng nhanh bất thường.

### Pitfall 2: Race Conditions in Last Seats
**What goes wrong:** Hai người cùng đặt 1 chỗ cuối cùng thành công (Overbooking).
**Why it happens:** Kiểm tra số ghế và cập nhật số ghế không nằm trong cùng một transaction.
**How to avoid:** Sử dụng `tx.ride.update` với điều kiện `availableSeats >= seats` hoặc dùng transaction như ví dụ trên.

## Code Examples

### Google Maps integration with Directions
```typescript
// Source: https://visgl.github.io/react-google-maps/ (Standard pattern)
import { GoogleMap, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';

const RideRouteMap = ({ origin, destination }) => {
  const [response, setResponse] = useState(null);

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
      <DirectionsService
        options={{ origin, destination, travelMode: 'DRIVING' }}
        callback={(res) => { if (res.status === 'OK') setResponse(res); }}
      />
      {response && <DirectionsRenderer directions={response} />}
    </GoogleMap>
  );
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| manual lat/lng | Place IDs | 2023 | Place ID bền vững hơn, hỗ trợ update dữ liệu tự động từ Google. |
| polling for status | Webhooks/Sockets | - | (Sẽ triển khai ở GĐ 4 cho thông báo thời gian thực). |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Google Maps free credit ($200) đủ cho phát triển. | Summary | Chi phí phát sinh sớm cho khách hàng. |
| A2 | Mapbox kém chính xác hơn Google tại VN. | Alternatives | Trải nghiệm người dùng giảm nếu Mapbox thực tế tốt hơn. |
| A3 | Zod v4 ổn định và nên được dùng để đồng bộ. | Standard Stack | Lỗi tương thích nếu dự án muốn giữ v3. |

## Open Questions

1. **Lưu trữ tọa độ hay String địa chỉ?**
   - Hiện tại Schema lưu `String`. Có nên thêm `originLat`, `originLng` để hiển thị bản đồ nhanh hơn mà không cần Geocoding lại?
   - Recommendation: Nên thêm vào model `Ride` khi triển khai GĐ 3.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | 22.14.0 | — |
| npm | Package Manager | ✓ | 11.4.2 | — |
| Google Maps API Key | Maps Feature | ✗ | — | Cần đăng ký Google Cloud Console |

**Missing dependencies with no fallback:**
- **Google Maps API Key**: Bắt buộc để chạy tính năng bản đồ. Planner cần có task hướng dẫn thiết lập `.env`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + Supertest |
| Config file | code/apps/backend/jest.config.js |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BOOK-01 | Tạo yêu cầu đặt chỗ thành công | integration | `npx jest booking.test.ts` | ❌ Wave 0 |
| BOOK-02 | Tài xế phê duyệt booking (trừ ghế) | integration | `npx jest booking.test.ts` | ❌ Wave 0 |
| BOOK-03 | Không cho phép đặt quá số ghế trống | unit | `npx jest booking.test.ts` | ❌ Wave 0 |
| MAPS-01 | Autocomplete trả về danh sách địa chỉ | E2E/Manual | - | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] `code/apps/backend/src/tests/booking.test.ts` — covers booking logic
- [ ] `code/packages/shared/src/booking.schema.ts` — shared validation schemas

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | yes | Middleware kiểm tra quyền sở hữu (Tài xế của chuyến đi mới được duyệt booking). |
| V5 Input Validation | yes | `zod` schema để chặn dữ liệu rác (âm số ghế, địa chỉ trống). |

### Known Threat Patterns for Node.js/Express

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Overbooking (Race Condition) | Integrity | Database Transaction (Prisma). |
| Unauthorized Approval | Elevation of Privilege | Check `req.user.id === ride.driverId`. |
| API Key Exposure | Information Disclosure | Use `.env` and restricted API Keys in Google Console. |

## Sources

### Primary (HIGH confidence)
- [Official Google Maps JS SDK] - Check Autocomplete & Directions.
- [Prisma Docs - Transactions] - Verified for seat consistency.
- [npm registry] - Verified versions for `@react-google-maps/api`, `zod`, `axios`.

### Secondary (MEDIUM confidence)
- [WebSearch: Google vs Mapbox Vietnam] - Cônfirming Google's data superiority in VN.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified via npm and current project usage.
- Architecture: HIGH - Industry standard state machine for bookings.
- Pitfalls: MEDIUM - Depends on actual usage volume and Google's pricing changes.

**Research date:** 2026-04-09
**Valid until:** 2026-05-09
