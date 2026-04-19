# REQUIREMENTS: CoRide

## Milestone v1.2 Requirements (Sắp Tới)

### Giao Tiếp Thời Gian Thực (Realtime & Notifications)
- [ ] **REAL-01**: Tích hợp Socket.IO Server vào Backend (chia module socket riêng biệt). Thiết kế event logic cho việc PUSH Notification.
- [ ] **REAL-02**: Tích hợp Socket Client lên Frontend Next.js. Hiển thị Toast Notification (hoặc chuông thông báo) mỗi khi Chuyến đi bị Đặt/Hủy.
- [ ] **REAL-03**: (Optional) Tính năng Chat cơ bản giữa Tài xế và Hành khách trong ngữ cảnh của một Chuyến đi.

### Thanh toán & Giao dịch (Payments & Transactions)
- [ ] **PAY-01**: Thiết kế Schema cho bảng `Transaction` (Giao dịch), `Wallet` (Ví - nếu có) trong Prisma.
- [ ] **PAY-02**: Xây dựng UI thanh toán giỏ hàng/chuyến đi (Checkout UI).
- [ ] **PAY-03**: Tích hợp Mock Payment Gateway (ZaloPay/MoMo Sandbox) tạo luồng Redirect từ Frontend -> Cổng thanh toán -> Return URL cập nhật trạng thái Transaction & Booking.

### Nền tảng Di động (Mobile App MVP)
- [ ] **MOBILE-01**: Khởi tạo project React Native (Expo) cho App Tài xế (Driver App).
- [ ] **MOBILE-02**: Code UI Đăng nhập & Hiển thị Lịch trình của tài xế trên Mobile.

---

## Validated / Đã Hoàn Thành (Milestone v1.1)

### Bản Đồ Mã Nguồn Mở (Open Source Maps Integration)
- [x] **MAP-01**: Tích hợp Leaflet.js thành công thay thế Google Maps.
- [x] **MAP-02**: Sử dụng Nominatim API cho LocationAutocomplete (Gợi ý địa chỉ free).
- [x] **MAP-03**: Sử dụng OSRM để tính khoảng cách và dự kiến thời gian di chuyển (Directions API thay thế).
- [x] **BIZ-01**: Tích hợp Bản đồ thành công vào luồng Đăng Chuyến Đi của Tài xế.

## Out of Scope
- Tự động thay đổi giá dựa trên thuật toán quá phức tạp.
- Định vị tài xế Live GPS Tracking khi xe chạy (Cần hệ thống Tracking độc lập, tốn nhiều Resource, lưu lại cho v2.0).
