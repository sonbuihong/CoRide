# CoRide Mobile MVP — chạy và nghiệm thu

## Chuẩn bị

1. Sao chép `.env.example` thành `.env`, điền API key Goong và Google Maps Android SDK.
2. Từ thư mục `code`, chạy hạ tầng bằng `docker compose up -d`.
3. Chạy `pnpm --filter @repo/mobile android` trên Android Emulator. `10.0.2.2` trong env trỏ về máy host.
4. Để thử realtime, dùng hai emulator hoặc một emulator cùng một thiết bị Android; đăng nhập một hành khách và một tài xế đã duyệt KYC.

## Ma trận nghiệm thu

- Xác thực: đăng ký, đăng nhập, mở lại app vẫn giữ phiên; refresh token được xoay vòng.
- Hai chế độ: chuyển Hành khách/Tài xế đúng tab; tài xế chưa duyệt KYC không thể bật Online.
- Offline: tắt mạng hiện cảnh báo; kết nối lại hiện trạng thái phục hồi.
- Đi chung xe: tài xế đăng chuyến; hành khách tìm và đặt ghế; tài xế chấp nhận/từ chối; hai phía nhận cập nhật realtime, chat, QR mô phỏng, ví/giao dịch và đánh giá sau hoàn tất.
- Gọi xe: hành khách chọn hai gợi ý Goong và loại xe; tài xế Online nhận cuốc; lifecycle `Đang đến` → `Trong chuyến` → `Chờ thanh toán`; GPS tài xế hiện trên bản đồ hành khách.
- Thanh toán: QR gọi xe chỉ mở ở trạng thái chờ thanh toán và chỉ hành khách được xác nhận; sau khoảng ba giây chuyến hoàn tất.
- Hủy chuyến: hành khách/tài xế thuộc chuyến được hủy trước lúc bắt đầu; người ngoài chuyến không thể thao tác.
- Thông báo: thông báo mới đến qua Socket.IO và có thể đánh dấu đã đọc.

## Kiểm tra trước bàn giao

```powershell
pnpm.cmd --filter @repo/shared build
pnpm.cmd --filter @repo/mobile typecheck
pnpm.cmd --filter @repo/mobile lint
pnpm.cmd --filter @repo/mobile build -- --platform android
pnpm.cmd --filter backend build
pnpm.cmd --filter backend test -- --runInBand src/tests/auth.test.ts src/tests/mobile-contract.test.ts
```

APK nội bộ: `eas build --platform android --profile preview`. Google Play App Bundle: profile `production`.
