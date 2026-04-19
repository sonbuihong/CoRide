# Phase 11: Payment Gateway - Research

**Ngày nghiên cứu:** 20/04/2026
**Lĩnh vực:** Payment Integration, Transaction Flow, Wallet System
**Độ tin cậy:** HIGH

## Summary (Tóm tắt)

Giai đoạn này tập trung vào việc chuyển đổi CoRide từ một hệ thống quản lý chuyến đi đơn thuần sang một nền tảng có lưu thông dòng tiền (mặc dù là giả lập/sandbox). Mục tiêu cốt lõi là tích hợp thành công Cổng thanh toán ZaloPay (hoặc MoMo) để người dùng có thể thanh toán cho các chuyến đi của mình.

Chúng ta sẽ xây dựng một hệ thống Ví (Wallet) cơ bản cho người dùng và bảng Giao dịch (Transaction) để lưu vết toàn bộ biến động số dư. Quy trình thanh toán sẽ tuân thủ luồng Redirect tiêu chuẩn: Người dùng chọn thanh toán -> Server tạo đơn hàng tại Gateway -> Người dùng thanh toán tại trang của Gateway -> Gateway gọi Callback về Server để cập nhật trạng thái đơn hàng.

**Khuyến nghị chính:** Sử dụng **ZaloPay Sandbox** làm cổng thanh toán mặc định vì tài liệu rõ ràng và môi trường thử nghiệm dễ tiếp cận cho môi trường Đồ án Tốt nghiệp (DATN).

## Standard Stack (Công nghệ tiêu chuẩn)

### Core (Cốt lõi)
| Thư viện | Phiên bản | Mục đích | Tại sao sử dụng |
|---------|---------|---------|--------------|
| `crypto-js` | 4.2.0 | Tạo mã MAC/HMAC-SHA256 | Bắt buộc để ký số dữ liệu gửi sang ZaloPay/MoMo. [VERIFIED: npm registry] |
| `axios` | 1.15.1 | Gọi API sang Gateway | Thư viện HTTP Client tiêu chuẩn, ổn định. [VERIFIED: npm registry] |
| `moment` | 2.30.1 | Định dạng thời gian | ZaloPay yêu cầu mã giao dịch có format `yymmdd_xxx`. [VERIFIED: npm registry] |

### Supporting (Hỗ trợ)
| Thư viện | Phiên bản | Mục đích | Khi nào dùng |
|---------|---------|---------|--------------|
| `ngrok` | Lateest | Tạo Public URL cho Webhook | Cần thiết để nhận Callback từ ZaloPay về localhost khi phát triển. [ASSUMED] |
| `sonner` | 2.0.7 | Thông báo phía UI | Hiển thị trạng thái thanh toán ngay khi nhận được callback qua Socket. [VERIFIED: package.json] |

**Cài đặt:**
```bash
npm install crypto-js moment axios
```

## Architecture Patterns (Mẫu kiến trúc)

### Luồng Thanh toán (Payment Flow Pattern)
1. **Khởi tạo (Initiation):** Client gửi yêu cầu thanh toán (Booking ID) lên Backend.
2. **Tạo đơn (Order Creation):** Backend tính toán số tiền, tạo mã giao dịch (`app_trans_id`), lưu Transaction với trạng thái `PENDING`, gọi ZaloPay API lấy `order_url`.
3. **Chuyển hướng (Redirection):** Frontend nhận `order_url` và chuyển hướng người dùng sang trang thanh toán của ZaloPay.
4. **Xác nhận (Confirmation - Webhook):** ZaloPay gửi Callback (POST) về endpoint `/api/v1/payments/zalopay/callback`. Backend xác thực chữ ký (MAC), cập nhật Transaction thành `SUCCESS` và Booking thành `PAID`.
5. **Hoàn tất (Completion):** Frontend chuyển hướng người dùng về trang thành công (Return URL) và nhận thông báo realtime qua Socket.IO.

### Cấu trúc Database đề xuất (Data Model)
Dựa trên yêu cầu PAY-01, chúng ta cần mở rộng Prisma Schema:

```prisma
// Wallet lưu số dư của người dùng
model Wallet {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  balance   Float    @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  transactions Transaction[]
}

enum TransactionStatus {
  PENDING
  SUCCESS
  FAILED
}

enum TransactionType {
  DEPOSIT          // Nạp tiền
  WITHDRAWAL       // Rút tiền
  PAYMENT          // Thanh toán chuyến đi
  RECEIVE_PAYMENT  // Tài xế nhận tiền từ chuyến đi
  REFUND           // Hoàn tiền
}

// Lưu vết mọi biến động tiền tệ
model Transaction {
  id           String            @id @default(uuid())
  walletId     String
  wallet       Wallet            @relation(fields: [walletId], references: [id])
  amount       Float
  type         TransactionType
  status       TransactionStatus @default(PENDING)
  description  String?
  externalId   String?           @unique // Mã giao dịch bên thứ 3 (app_trans_id)
  bookingId    String?
  booking      Booking?          @relation(fields: [bookingId], references: [id])
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
}

// Cập nhật model Booking
model Booking {
  // ... existing fields
  paymentStatus PaymentStatus @default(UNPAID)
  transactions  Transaction[]
}

enum PaymentStatus {
  UNPAID
  PAID
  REFUNDED
}
```

## Don't Hand-Roll (Không tự xây dựng)

| Vấn đề | Đừng tự làm | Dùng thay thế | Tại sao |
|---------|-------------|-------------|-----|
| Mật mã học | Tự viết hàm băm SHA256 | `crypto-js` hoặc Node `crypto` | Tránh các lỗ hổng bảo mật nghiêm trọng trong việc triển khai thuật toán. |
| Tiền tệ | `Number.toString()` | `Intl.NumberFormat('vi-VN')` | Đảm bảo hiển thị đúng định dạng tiền tệ Việt Nam (đ). |
| Trang giả lập | Tự viết trang thanh toán | Sandbox của ZaloPay/MoMo | Phản ánh đúng trải nghiệm thực tế của người dùng. |

## Common Pitfalls (Bẫy thường gặp)

### Pitfall 1: Bỏ qua xác thực Callback (MAC Validation)
- **Gì:** Chấp nhận mọi request gửi đến endpoint Callback mà không kiểm tra chữ ký.
- **Tại sao:** Kẻ tấn công có thể giả mạo request của ZaloPay để đổi trạng thái đơn hàng thành đã thanh toán mà không cần trả tiền.
- **Phòng tránh:** Luôn tính toán lại MAC bằng `Key2` (ZaloPay) hoặc `SecretKey` (MoMo) và so sánh với MAC nhận được trong body. [CITED: docs.zalopay.vn]

### Pitfall 2: Localhost Callback
- **Gì:** Cung cấp `callback_url` là `localhost:5000/...`.
- **Tại sao:** Server của ZaloPay không thể truy cập vào máy local của bạn.
- **Phòng tránh:** Sử dụng **ngrok** hoặc **Cloudflare Tunnel** để public endpoint local ra internet.

### Pitfall 3: Race Condition khi cập nhật trạng thái
- **Gì:** ZaloPay có thể gửi Callback nhiều lần nếu Server không phản hồi kịp (timeout).
- **Tại sao:** Dẫn đến việc cộng tiền 2 lần hoặc chạy logic xử lý sau thanh toán nhiều lần.
- **Phòng tránh:** Kiểm tra trạng thái hiện tại của Transaction trước khi xử lý. Nếu đã `SUCCESS`, trả về thành công ngay lập tức cho Gateway.

## Code Examples (Ví dụ mã nguồn)

### Tạo chữ ký MAC cho ZaloPay (Node.js)
```typescript
// Source: https://docs.zalopay.vn/v2/start/
import CryptoJS from 'crypto-js';

const config = {
  app_id: "2553",
  key1: "9ph319p649f9364ph319p649f936",
};

const order = {
  app_id: config.app_id,
  app_trans_id: "240420_123456", // format: yymmdd_xxx
  app_user: "user123",
  app_time: Date.now(),
  amount: 50000,
  item: JSON.stringify([]),
  embed_data: JSON.stringify({}),
  description: "Thanh toán chuyến đi CoRide #123",
  bank_code: "zalopayapp",
};

// Chuỗi data để tạo MAC: app_id|app_trans_id|app_user|amount|app_time|embed_data|item
const data = `${order.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
const mac = CryptoJS.HmacSHA256(data, config.key1).toString();
```

## State of the Art (Công nghệ tiên tiến)

| Cách cũ | Cách hiện nay | Tác động |
|--------------|------------------|--------------|
| Dùng Iframe thanh toán | Chuyển hướng (Redirect) hoặc QR Dynamic | Bảo mật hơn, UX tốt hơn trên di động. |
| Chỉ dùng Return URL | Dùng Callback (IPN) | Đảm bảo tính nhất quán dữ liệu ngay cả khi người dùng tắt trình duyệt sau khi trả tiền. |

## Assumptions Log (Nhật ký giả định)

| # | Giả định | Section | Rủi ro nếu sai |
|---|-------|---------|---------------|
| A1 | Người dùng sẽ sử dụng VNĐ làm đơn vị tiền tệ duy nhất. | Data Model | Cần refactor nếu muốn hỗ trợ đa tiền tệ (USD). |
| A2 | Luồng thanh toán Sandbox không thay đổi API đột ngột. | Summary | Tốn thời gian cập nhật lại logic tạo MAC. |
| A3 | Admin chỉ cần dashboard xem lịch sử, chưa cần các thao tác hoàn tiền (Refund) phức tạp. | Summary | Thiếu tính năng nếu yêu cầu thực tế cao hơn. |

## Open Questions (RESOLVED)

1. **Có cần thiết phải xây dựng luồng Rút tiền (Withdrawal) thực tế không?**
   - Thực tế: Không thể rút tiền thật từ Sandbox.
   - Giải pháp: Admin có một nút "Phê duyệt rút tiền" để trừ số dư trong Ví và đánh dấu là đã hoàn thành (giả lập).

2. **Cách xử lý khi Gateway bị lỗi (Downtime)?**
   - Đề xuất: Cho phép người dùng chọn "Thanh toán tiền mặt" (CASH) như một phương án dự phòng.

## Environment Availability (Kiểm tra môi trường)

| Phụ thuộc | Yêu cầu bởi | Sẵn sàng | Phiên bản | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Database | ✓ | 16.0 | — |
| npm | Quản lý gói | ✓ | 10.x | — |
| ngrok | Webhook testing | ✗ | — | Cần cài đặt để test Callback |

## Validation Architecture (Kiến trúc kiểm chứng)

### Test Framework
| Thuộc tính | Giá trị |
|----------|-------|
| Framework | Jest |
| Config file | `apps/backend/jest.config.js` |
| Quick run | `npm test` |

### Phase Requirements → Test Map
| Req ID | Hành vi | Loại test | Lệnh tự động |
|--------|----------|-----------|-------------------|
| PAY-01 | Schema Wallet & Transaction phải tồn tại và liên kết đúng | Unit (Prisma) | `npx prisma validate` |
| PAY-03 | Callback từ ZaloPay phải cập nhật đúng trạng thái Transaction | Integration | `npm test tests/payment.test.ts` |

## Security Domain (Bảo mật)

### Applicable ASVS Categories (Tiêu chuẩn bảo mật)

| ASVS Category | Áp dụng | Kiểm soát tiêu chuẩn |
|---------------|---------|-----------------|
| V5 Input Validation | Có | Sử dụng Zod để validate dữ liệu từ Gateway Callback. |
| V6 Cryptography | Có | HMAC-SHA256 để xác thực tính toàn vẹn của giao dịch. |
| V13 API Security | Có | Đảm bảo endpoint Callback không bị lộ logic xử lý bên trong. |

### Known Threat Patterns (Mẫu đe dọa)

| Pattern | STRIDE | Biện pháp giảm thiểu |
|---------|--------|---------------------|
| Giả mạo Callback | Spoofing | Xác thực mã MAC (Key2) bắt buộc. |
| Sửa đổi số tiền | Tampering | Không lấy số tiền từ body callback để cập nhật ví, mà so sánh với số tiền trong Transaction đã lưu lúc tạo đơn. |

## Sources (Nguồn tham khảo)

### Primary (HIGH confidence)
- [ZaloPay Developer Docs](https://docs.zalopay.vn/) - Chi tiết luồng tích hợp và tạo MAC.
- [MoMo Developer Portal](https://developers.momo.vn/) - Tài liệu tham khảo luồng AIO.

### Secondary (MEDIUM confidence)
- [CryptoJS Documentation](https://cryptojs.gitbook.io/docs/) - Cách sử dụng HMAC-SHA256.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Các thư viện phổ biến và đã được kiểm chứng.
- Architecture: HIGH - Tuân thủ đúng luồng redirect chuẩn của các ví điện tử tại VN.
- Pitfalls: MEDIUM - Các vấn đề về ngrok và timeout phụ thuộc vào môi trường mạng.

**Ngày nghiên cứu:** 20/04/2026
**Hạn dùng:** 20/05/2026 (30 ngày)
