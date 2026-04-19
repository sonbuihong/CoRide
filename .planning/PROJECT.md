# PROJECT: CoRide

## Tầm nhìn (Vision)
CoRide là một nền tảng đi chung xe (Carpooling) hiện đại, hướng tới việc tối ưu hóa chi phí di chuyển và giảm thiểu ùn tắc giao thông. Dự án tập trung vào việc kết nối những người đi cùng lộ trình một cách an toàn, thuận tiện và hiệu quả.

## Đối tượng người dùng (Target Audience)
- **Sinh viên:** Tiết kiệm chi phí đi lại giữa nhà và trường học.
- **Nhân viên văn phòng:** Tìm bạn đồng hành đi làm hàng ngày để giảm căng thẳng và chi phí.
- **Người dùng đại chúng:** Bất kỳ ai có nhu cầu di chuyển liên tỉnh hoặc trong thành phố với chi phí tối ưu.

## Giá trị cốt lõi (Core Values)
- **Tiết kiệm:** Giảm chi phí xăng xe, phí cầu đường.
- **Cộng đồng:** Xây dựng mạng lưới kết nối tin cậy.
- **Môi trường:** Giảm lượng khí thải bằng cách tối ưu hóa số lượng xe lưu thông.
- **Vận hành đột phá (Zero-cost Operation):** Thay thế các dịch vụ trả phí đắt đỏ bằng giải pháp Mã nguồn mở 100% (OSRM, Leaflet, Nominatim) giúp duy trì hệ thống độc lập và miễn phí.

## Phạm vi Prototype (Initial Scope)
1. Xác thực người dùng (Đăng ký/Đăng nhập).
2. Quản lý hồ sơ cá nhân.
3. Đăng chuyến đi (Dành cho tài xế).
4. Tìm kiếm và đặt chỗ (Dành cho hành khách).
5. Bản đồ hiển thị lộ trình & Autocomplete địa chỉ (Đã hoàn thành - 100% Open Source).
6. Hệ thống thông báo thời gian thực & Chat.
7. Cổng thanh toán (Payment Gateway / Mock Payment).
8. Ứng dụng Di động dành cho Tài xế (Driver Mobile App - Optional).

## Current Milestone: v1.2 Realtime & Payment Gateway

**Goal:** Bước qua giai đoạn CRUD cơ bản và Bản đồ, tiến tới việc biến CoRide thành một nền tảng "sống" bằng WebSocket (Realtime) và có lưu thông dòng tiền. Đây là bước nhảy vọt quan trọng nhất cho Đồ án Tốt nghiệp.

**Target features:**
- Khởi tạo Socket Server và kết nối phía Client để push Notification/Chat.
- Xây dựng DB Schema cho Giao dịch (Transaction) và làm Mock Cổng Thanh toán điện tử.
- Bắt đầu nghiên cứu tích hợp Mobile App (React Native) cho Tài xế (nếu đồ án yêu cầu).

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
