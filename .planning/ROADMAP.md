# ROADMAP: CoRide

Dự án được chia thành 6 giai đoạn phát triển chính để đảm bảo tính ổn định và tiến độ.

## Giai đoạn 1: Nền tảng & Xác thực (Foundation & Auth)
**Mục tiêu:** Thiết lập cấu trúc Monorepo, Database Schema và hệ thống xác thực hoàn chỉnh.
**Trạng thái:** [Hoàn thành]
**Plans:** 3 plans
- [x] 01-01-PLAN.md — Thiết lập Monorepo & Database Foundation.
- [x] 01-02-PLAN.md — Triển khai Backend Auth Core (TDD).
- [x] 01-03-PLAN.md — Xây dựng giao diện Web Auth UI (Tiếng Việt).

## Giai đoạn 2: Quản lý Hồ sơ & Chuyến đi (Profile & Ride Core)
**Mục tiêu:** Hoàn thiện hồ sơ người dùng (avatar/bio) và triển khai luồng Đăng/Tìm kiếm chuyến đi.
**Trạng thái:** [Hoàn thành]
**Plans:** 5 plans
- [x] 02-01-PLAN.md — Thiết lập nền tảng dữ liệu (Prisma/Shared Schemas) & Cloudinary.
- [x] 02-02-PLAN.md — Triển khai API Quản lý hồ sơ & Tải ảnh đại diện (TDD).
- [x] 02-03-PLAN.md — Triển khai API Đăng và Tìm kiếm chuyến đi (TDD).
- [x] 02-04-PLAN.md — Xây dựng giao diện Quản lý hồ sơ (Web UI).
- [x] 02-05-PLAN.md — Xây dựng giao diện Đăng và Tìm kiếm chuyến đi (Web UI).

## Giai đoạn 3: Bản đồ & Tương tác (Maps & Booking)
**Mục tiêu:** Tích hợp Google Maps và hệ thống đặt chỗ thông minh với quản lý số ghế thời gian thực.
**Trạng thái:** [Đang thực hiện]
**Plans:** 5 plans
- [ ] 03-01-PLAN.md — Thiết lập Schema & Nền tảng Shared (Tọa độ + Booking).
- [ ] 03-02-PLAN.md — Triển khai API Đặt chỗ (Booking Core) với TDD & Transaction.
- [ ] 03-03-PLAN.md — Tích hợp Google Maps Autocomplete vào form Đăng chuyến đi.
- [ ] 03-04-PLAN.md — Hiển thị lộ trình trên bản đồ và giao diện Đặt chỗ cho Hành khách.
- [ ] 03-05-PLAN.md — Xây dựng giao diện Quản lý yêu cầu đặt chỗ cho Tài xế.

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
