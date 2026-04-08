# Phase 4: Notifications & Reviews - Research

**Researched:** 2024-05-22
**Domain:** Real-time Notifications, Rating Systems, Prisma Extensions
**Confidence:** HIGH

## Summary

Giai đoạn 4 tập trung vào việc tăng cường tương tác và độ tin cậy của hệ thống CoRide thông qua hai module chính: **Thông báo (Notifications)** và **Đánh giá (Reviews)**. 

Hệ thống thông báo sẽ sử dụng **Server-Sent Events (SSE)** để cập nhật thời gian thực vì tính gọn nhẹ và dễ triển khai trong môi trường Monorepo/Express mà không cần thêm các thư viện phức tạp như Socket.io. 

Hệ thống đánh giá sẽ áp dụng cơ chế **Denormalization** thông qua **Prisma Client Extensions** để tự động tính toán và lưu trữ điểm tín nhiệm (`rating`) của người dùng, giúp tối ưu hiệu năng truy vấn và hỗ trợ sắp xếp/lọc trong tương lai.

**Primary recommendation:** Sử dụng SSE cho thông báo thời gian thực và Prisma Extensions để đồng bộ điểm đánh giá trung bình.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NOTIF-01 | Thiết kế Database model cho `Notification` | Xem mục Recommended Project Structure. |
| NOTIF-02 | Triển khai thông báo thời gian thực (SSE) | Xem Code Examples: SSE Server. |
| REVIEW-01 | Cập nhật Prisma Schema cho `Review` | Xem Code Examples: Prisma Extension. |
| REVIEW-02 | Tính toán điểm trung bình rating tự động | Xem Pattern 2: Prisma Client Extensions. |
| UI-01 | Menu thông báo trên Header | Xem Standard Stack: Shadcn/UI. |
| UI-02 | Form đánh giá sau khi kết thúc chuyến đi | Xem Standard Stack: Shadcn/UI. |
| SEC-01 | Phân quyền đánh giá (Confirmed participants) | Xem mục Security Domain. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Express SSE | Native | Real-time events | Lightweight, standard HTTP, built-in reconnection. |
| Prisma Client | ^5.22.0 | Database ORM | Support for Extensions and Transactions. |
| Shadcn/UI | Latest | UI Components | Pre-built accessible components (Dropdown, Dialog, Badge). |
| Lucide React | Latest | Icons | Standard icon library for the project. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| EventSource | Native | Client-side SSE | Standard browser API for receiving server events. |
| EventEmitter | Native | Backend Events | Decouple notification logic from services. |

**Installation:**
```bash
# Frontend
npx shadcn@latest add dropdown-menu dialog badge scroll-area avatar
```

## Architecture Patterns

### Recommended Project Structure
```
apps/backend/src/
├── services/
│   ├── notification.service.ts   # Quản lý gửi và lưu thông báo
│   └── review.service.ts         # Quản lý đánh giá và tính điểm
├── lib/
│   ├── sse-manager.ts            # Quản lý kết nối SSE
│   └── prisma-extension.ts       # Prisma Extension cho Ratings
└── routes/
    ├── notification.routes.ts
    └── review.routes.ts
```

### Pattern 1: Event-Driven Notifications
**What:** Sử dụng `EventEmitter` của Node.js để phát tín hiệu từ `BookingService` hoặc `RideService`. `NotificationService` sẽ lắng nghe và thực hiện lưu vào DB + đẩy qua SSE.
**Why:** Giúp code sạch, không làm phình to các service nghiệp vụ chính.

### Pattern 2: Prisma Client Extensions for Average Rating
**What:** Sử dụng middleware của Prisma để tự động hóa việc tính toán trung bình cộng mỗi khi một `Review` mới được tạo.
**Example:** [Xem Code Examples](#prisma-extension-for-ratings)

### Anti-Patterns to Avoid
- **Database Polling:** Đừng dùng `setInterval` để check thông báo mới từ database. Gây tải cao và độ trễ lớn.
- **Manual Rating Update:** Đừng cập nhật `User.rating` thủ công ở mọi nơi tạo review. Dễ gây sai sót và không nhất quán dữ liệu.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Real-time | Custom WebSocket protocol | SSE | Native, handles reconnects, lower overhead. |
| UI Components | Custom Star Rating | Radix/Shadcn based | Accessibility (a11y), responsive, consistent UI. |
| Aggregation | Raw SQL for ratings | Prisma Extension | Maintain type safety and centralize logic in TS. |

## Common Pitfalls

### Pitfall 1: SSE Connection Limits
**What goes wrong:** Trình duyệt giới hạn 6 kết nối HTTP/1.1 trên mỗi domain.
**Why it happens:** Nếu mở nhiều tab CoRide, các kết nối SSE có thể bị chặn.
**How to avoid:** Đảm bảo server chạy trên **HTTP/2** (recommended) hoặc hướng dẫn người dùng không mở quá nhiều tab.

### Pitfall 2: Race Conditions in Rating Update
**What goes wrong:** Hai người đánh giá cùng lúc dẫn đến điểm trung bình bị tính sai.
**How to avoid:** Sử dụng Prisma `$transaction` hoặc cơ chế `increment/decrement` nếu có thể, nhưng với Extensions và `_avg`, Prisma xử lý khá tốt.

## Code Examples

### SSE Server implementation
```typescript
// apps/backend/src/lib/sse-manager.ts
import { Response } from 'express';

class SSEManager {
  private connections = new Map<string, Response[]>();

  addConnection(userId: string, res: Response) {
    const userConnections = this.connections.get(userId) || [];
    this.connections.set(userId, [...userConnections, res]);
  }

  removeConnection(userId: string, res: Response) {
    const userConnections = this.connections.get(userId) || [];
    this.connections.set(userId, userConnections.filter(c => c !== res));
  }

  send(userId: string, data: any) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.forEach(res => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      });
    }
  }
}

export const sseManager = new SSEManager();
```

### Prisma Extension for Ratings
```typescript
// apps/backend/src/lib/prisma-extension.ts
import { PrismaClient } from '@prisma/client';

export const extendedPrisma = (prisma: PrismaClient) => prisma.$extends({
  query: {
    review: {
      async create({ args, query }) {
        const review = await query(args);
        
        // Calculate average rating
        const stats = await prisma.review.aggregate({
          where: { revieweeId: review.revieweeId },
          _avg: { rating: true }
        });

        // Update User rating
        await prisma.user.update({
          where: { id: review.revieweeId },
          data: { rating: stats._avg.rating || 0 }
        });

        return review;
      }
    }
  }
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Socket.io | SSE | 2022+ | Simpler, no extra deps, better native support. |
| Middlewares | Client Extensions | Prisma 4.7+ | More granular, type-safe, better performance. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Backend server will support HTTP/2 | Common Pitfalls | Connection limit of 6 might be hit on dev env. |
| A2 | Users only care about one-way notifications | Summary | If 2-way chat is needed later, SSE might need replacement. |

## Open Questions

1. **Mobile Support (Expo):** SSE trên Expo (React Native) có hoạt động ổn định không hay cần Polyfill?
   - Recommendation: Cần kiểm tra thư viện `react-native-eventsource`.
2. **Push Notifications:** Có cần tích hợp Firebase Cloud Messaging (FCM) ngay không?
   - Recommendation: Trong phạm vi DATN, SSE cho Web và Long Polling/SSE cho Mobile là đủ. FCM nên để sau.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Backend | ✓ | 20.x | — |
| Prisma | Database | ✓ | 5.22.0 | — |
| Next.js | Web UI | ✓ | 14.x | — |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | yes | Check `rideId` and `participantStatus` before allowing review. |
| V5 Input Validation | yes | Zod schema for `rating` (1-5) and `comment` length. |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Review Spamming | Tampering | Rate limiting + Auth check (only confirmed passengers). |
| Data Leakage | Info Disclosure | Ensure SSE only sends notifications to the correct `userId`. |

## Sources

### Primary (HIGH confidence)
- Prisma Docs - Client Extensions
- MDN Web Docs - Server-Sent Events

### Secondary (MEDIUM confidence)
- Shadcn/UI Component Documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - SSE and Prisma are mature.
- Architecture: HIGH - Event-driven is standard for notifications.
- Pitfalls: MEDIUM - HTTP/2 config depends on deployment.

**Research date:** 2024-05-22
**Valid until:** 2024-12-22
