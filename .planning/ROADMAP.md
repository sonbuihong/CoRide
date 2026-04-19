# ROADMAP: CoRide

## Proposed Roadmap (Milestone v1.2)

**3 phases** | **8 requirements mapped** | Realtime & Payment Focus

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 10 | Realtime Core | Thiết lập hệ thống Notification & liên lạc liên tục giữa Driver/Pass. | REAL-01, REAL-02, REAL-03 | 2 |
| 11 | Payment Gateway | Thiết kế luồng Ví/Thanh toán. Tích hợp cổng thử nghiệm Sandbox. | PAY-01, PAY-02, PAY-03 | 2 |
| 12 | Driver Mobile App | Port core functionality của Driver ra React Native app để cài trên đt. | MOBILE-01, MOBILE-02 | 1 |

### Phase Details

**Phase 10: Notification & Realtime Core**
Goal: Phát triển một websocket server độc lập hoặc module chung để mọi thay đổi trạng thái của chuyến đi (đặt chỗ, hủy) đều được push trực tiếp lên thiết bị của tài xế và hành khách ngay tắp lự.
Requirements: REAL-01, REAL-02, REAL-03
**Plans:** 3 plans
Plans:
- [ ] 10-01-PLAN.md — Hạ tầng Socket.IO & Thông báo thời gian thực
- [ ] 10-02-PLAN.md — Hệ thống Tin nhắn: Data & API
- [ ] 10-03-PLAN.md — Hệ thống Tin nhắn: Realtime & Giao diện
Success criteria:
1. Khi Passenger nhấn Đặt Chuyến, màn hình của Driver nhận được Toast/chuông mà không cần tải lại trang.
2. Có tính năng gửi tin nhắn text giữa 2 thiết bị liên quan đến cùng 1 mã chuyến đi.

**Phase 11: Transaction & Payment Gateway**
Goal: Từ nền tảng free (không kiểm soát tiền) trở thành nền tảng có Transaction flow (Mock Gateway ZaloPay/MoMo) đủ dùng bảo vệ DATN.
Requirements: PAY-01, PAY-02, PAY-03
**Plans:** 3 plans
Plans:
- [ ] 11-01-PLAN.md — Hệ thống Ví & Giao dịch (Database & Core)
- [ ] 11-02-PLAN.md — Tích hợp Cổng thanh toán ZaloPay (Backend Integration)
- [ ] 11-03-PLAN.md — Giao diện Thanh toán & Dashboard Admin
Success criteria:
1. Passenger chọn thanh toán điện tử, hệ thống đẩy sang trang giả lập thanh toán, sau khi thanh toán đổi status -> Đã Trả (PAID).
2. Tồn tại Dashboard lịch sử nạp/rút hoặc giao dịch dành cho Admin.

**Phase 12: Mobile MVP (Driver App) - Optional**
Goal: Xây dựng App cho thiết bị di động bằng React Native. Đồ án sẽ trở nên "xịn" hơn rất nhiều nếu có app Native thay vì chỉ trình duyệt Web.
Requirements: MOBILE-01, MOBILE-02
Success criteria:
1. Đăng nhập thành công trên điện thoại thật/giả lập. Hiển thị thông báo (Phase 10) lên màn hình Mobile.

---
*(Phần Roadmap cũ Milestone v1.1 - Open Source Maps Component đã hoàn thành và lưu trữ)*
