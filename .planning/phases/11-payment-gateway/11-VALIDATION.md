# 11-VALIDATION: Payment Gateway Verification

## Mục tiêu (Goal)
Xác nhận hệ thống thanh toán ZaloPay (Mock Gateway) và Ví hoạt động ổn định, bảo mật và đáp ứng đầy đủ yêu cầu PAY-01, PAY-02, PAY-03.

## Tiêu chí chấp nhận (Acceptance Criteria)

### 1. Hạ tầng Cơ sở dữ liệu (PAY-01)
- [ ] Bảng `Wallet` và `Transaction` đã được tạo và liên kết đúng với `User`.
- [ ] Bảng `Booking` có thêm trường `paymentStatus`.

### 2. Giao diện Thanh toán (PAY-02)
- [ ] Hành khách có thể xem thông tin thanh toán chuyến đi và chọn thanh toán điện tử.
- [ ] Hệ thống có Dashboard để Admin xem lịch sử giao dịch (nạp/rút).

### 3. Luồng Giao dịch & ZaloPay Sandbox (PAY-03)
- [ ] Hệ thống có khả năng gọi ZaloPay API tạo đơn hàng và trả về `order_url`.
- [ ] Chuyển hướng người dùng thành công sang trang thanh toán giả lập của ZaloPay.
- [ ] ZaloPay gửi Callback về Backend thành công (sử dụng ngrok).
- [ ] Backend xác thực chính xác mã MAC (HMAC-SHA256) từ Callback.
- [ ] Trạng thái Transaction chuyển sang `SUCCESS` và Booking chuyển thành `PAID` sau khi nhận Callback hợp lệ.

## Kịch bản kiểm thử (Test Cases)

| ID | Kịch bản | Mong đợi |
|---|---|---|
| TC-11-01 | Prisma Validate | Schema được validate thành công không có lỗi. |
| TC-11-02 | Tạo đơn hàng (Mock) | Gọi API `/api/payments/create` trả về link ZaloPay. |
| TC-11-03 | Xác thực MAC giả mạo | Gửi POST request Callback với MAC sai -> Server từ chối. |
| TC-11-04 | Thanh toán thành công | Thanh toán trên ZaloPay Sandbox -> Callback trả về Server -> Cập nhật DB. |

## Công cụ kiểm tra
- **ZaloPay Sandbox Dashboard**: Kiểm tra lịch sử giao dịch.
- **ngrok**: Tạo public URL cho máy local nhận Webhook.
- **Postman**: Mô phỏng các request tạo đơn và giả lập callback.
- **Prisma Studio**: Xem biến động dữ liệu của `Wallet` và `Transaction`.