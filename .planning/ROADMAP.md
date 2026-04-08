# ROADMAP: CoRide

Dự án được chia thành 6 giai đoạn phát triển chính để đảm bảo tính ổn định và tiến độ.

## Giai đoạn 1: Nền tảng & Xác thực (Foundation & Auth)
**Mục tiêu:** Thiết lập cấu trúc Monorepo, Database Schema và hệ thống xác thực hoàn chỉnh.
**Trạng thái:** [Đang thực hiện]
**Plans:** 3 plans
- [ ] 01-01-PLAN.md — Thiết lập Monorepo & Database Foundation.
- [ ] 01-02-PLAN.md — Triển khai Backend Auth Core (TDD).
- [ ] 01-03-PLAN.md — Xây dựng giao diện Web Auth UI (Tiếng Việt).

## Giai đoạn 2: Quản lý Hồ sơ & Chuyến đi (Profile & Ride Core)
- [ ] API cập nhật thông tin người dùng và tải ảnh đại diện.
- [ ] Triển khai API Đăng chuyến đi (Driver) với các trường dữ liệu đầy đủ.
- [ ] API Tìm kiếm chuyến đi (Passenger) dựa trên các bộ lọc cơ bản.
- [ ] UI cho trang cá nhân và trang tạo chuyến đi trên Web.

## Giai đoạn 3: Bản đồ & Tương tác (Maps & Booking)
- [ ] Tích hợp Google Maps API/Mapbox cho Autocomplete địa chỉ.
- [ ] API Đặt chỗ (Booking) và quản lý trạng thái đơn hàng (Chấp nhận/Từ chối).
- [ ] Hiển thị lộ trình (Route) trên bản đồ trong trang chi tiết chuyến đi.
- [ ] UI cho trang kết quả tìm kiếm và trang chi tiết chuyến đi.

## Giai đoạn 4: Thông báo & Đánh giá (Notifications & Reviews)
- [ ] Hệ thống thông báo thời gian thực (In-app) và email thông báo cơ bản.
- [ ] Triển khai API đánh giá và tính điểm Rating trung bình của người dùng.
- [ ] UI hiển thị danh sách đánh giá trong hồ sơ cá nhân.

## Giai đoạn 5: Phát triển Mobile (Mobile App Implementation)
- [ ] Thiết lập môi trường Expo và đồng bộ hóa logic với Backend.
- [ ] Xây dựng giao diện App cho các luồng chính: Tìm xe, Đăng xe, Hồ sơ.
- [ ] Tích hợp Push Notifications trên Mobile (sử dụng Expo Notifications/FCM).

## Giai đoạn 6: Hoàn thiện & Triển khai (Polish & Deployment)
- [ ] Kiểm thử toàn diện (E2E Testing) cho các luồng đặt xe và thanh toán.
- [ ] Tối ưu hóa hiệu năng và bảo mật (Rate limiting, Input Validation).
- [ ] Triển khai Backend (Vercel/DigitalOcean) và Frontend (Vercel/Amplify).
- [ ] Đóng gói và phát hành bản Beta.
