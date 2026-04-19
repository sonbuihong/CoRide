# 10-RESEARCH: Realtime Core & Socket.IO

## Tóm tắt (Summary)
Phase 10 yêu cầu hệ thống phải chuyển tải được tín hiệu lập tức từ một máy người dùng (Hành khách đặt xe) sang một máy người dùng khác (Tài xế). Nút thắt lớn nhất chính là khả năng truyền tải dữ liệu hai chiều mà không cần reload trang. 
Công nghệ được lựa chọn: **Socket.IO** (khả năng fallback over HTTP dễ dàng, hỗ trợ connection room, dễ scaling hơn WebSocket thuần).

## Vấn đề 1: Setup Socket trong Express & Next.js Monorepo

### Kiến trúc Backend (Express)
Hiện tại `server.ts` thiết lập `app.listen(port)`. Do Socket.IO cần bám vào một HTTP Server gốc, bắt buộc ta phải bọc `app` của Express bằng `http.createServer(app)`.
Lộ trình kiến trúc Back-end:
1. Chia một file singleton là `src/shared/socket/socket.ts` chứa instance của Socket.
2. Khởi tạo `socketInit(server)` ở trong `server.ts`.
3. Bất cứ Controller/Service nào (vd: BookingService) đều gọi `getIO().to(userId).emit(...)` để gửi thông báo. Lợi ích: Tách biệt hoàn toàn tầng Web Socket và tầng REST.

### Kiến trúc Frontend (Next.js App Router)
Next.js có Server Component (SSR/RSC) và Client Component. Socket.IO Client CHỈ ĐƯỢC PHÉP chạy ở Client Component.
Lộ trình kiến trúc Front-end:
1. Tạo một file `socket-provider.tsx` sử dụng Context API (có `"use client"`).
2. Bao bọc Layout gốc của Next.js (hoặc Layout dành cho người đã đăng nhập) bởi `<SocketProvider>`.
3. Bất cứ Component nào cần dữ liệu realtime sẽ sử dụng `const { socket } = useSocket()`.

## Vấn đề 2: Xác thực & Bảo mật (Authentication)
*Làm sao để biết kết nối ẩn danh là của user nào?*
1. Truyển JWT Access Token từ Frontend (localStorage/cookies) lên khi gọi `io.connect({ auth: { token } })`.
2. Phía Backend gắn middleware cho Socket `io.use()` để giải mã JWT Token. 
3. Nếu Token hợp lệ, gắn `socket.data.userId = decoded.userId` và tiến hành gắn user đó vào một Room đặc thù: `socket.join(decoded.userId)`.
> *Mẹo nhỏ về Room:* Bằng cách cho thiết bị join vào đúng Room có ID là `userId`, khi Server muốn gửi notification cho user A, nó chỉ việc gọi lệnh: `io.to('USER_ID_CUA_A').emit('notification', metadata)`. Vô cùng dễ dàng, giải quyết được việc 1 người dùng đăng nhập trên 2 điện thoại cùng lúc vẫn nhận đủ thông báo.

## Validation Architecture (RESOLVED)
- [x] Backend: Thử nghiệm bằng cách viết 1 đoạn script hoặc Postman test cắm qua ws:// để xem có pass qua tầng JWT không.
- [x] Frontend: F12 console log xem sau khi login, chữ `[Socket] Connected` có hiện lên không.

## Open Questions (RESOLVED)
1. **Làm thế nào để scale Socket.IO nếu có hàng ngàn user?** -> Đã nghiên cứu về Redis Adapter, tuy nhiên với quy mô đồ án tốt nghiệp, một instance đơn lẻ là đủ. Nếu cần mở rộng, sẽ bổ sung Redis sau.
2. **Xử lý ngắt kết nối đột ngột?** -> Socket.IO có cơ chế tự động reconnect (kết nối lại) mặc định, phối hợp với `socket-provider.tsx` để duy trì trạng thái.
