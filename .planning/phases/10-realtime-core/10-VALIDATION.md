# 10-VALIDATION: Realtime Core Verification

## Mục tiêu (Goal)
Xác nhận hệ thống Realtime Core (Socket.IO) hoạt động ổn định, bảo mật và đáp ứng đầy đủ các yêu cầu nghiệp vụ về Thông báo (Notifications) và Trò chuyện (Chat).

## Tiêu chí chấp nhận (Acceptance Criteria)

### 1. Hạ tầng & Kết nối (Infrastructure)
- [ ] Backend khởi động không lỗi khi bọc bởi `http.createServer`.
- [ ] Frontend kết nối thành công tới Socket Server sau khi đăng nhập.
- [ ] Socket tự động ngắt kết nối khi người dùng đăng xuất hoặc đóng tab.
- [ ] Hệ thống xác thực JWT hoạt động: chỉ những kết nối có Token hợp lệ mới được chấp nhận.

### 2. Thông báo thời gian thực (Realtime Notifications)
- [ ] Khi một chuyến đi được đặt (Booking Created), tài xế liên quan nhận được thông báo ngay lập tức.
- [ ] Khi trạng thái chuyến đi thay đổi (Confirmed, Cancelled), hành khách nhận được thông báo ngay lập tức.
- [ ] Thông báo hiển thị dưới dạng Toast và cập nhật Badge unread trong Notification Center.

### 3. Trò chuyện (Chat)
- [ ] Tin nhắn được gửi từ người này sang người kia trong vòng < 500ms.
- [ ] Tin nhắn được lưu vào Database và có thể xem lại lịch sử sau khi F5 trang.
- [ ] Người dùng không thể gửi tin nhắn cho người không liên quan đến chuyến đi (Phòng chống giả mạo `senderId`).
- [ ] Người dùng không thể xem lịch sử chat của người khác.

## Kịch bản kiểm thử (Test Cases)

| ID | Kịch bản | Mong đợi |
|---|---|---|
| TC-10-01 | Kết nối Socket | Log backend hiện `user ... connected`, Frontend hiện trạng thái connected. |
| TC-10-02 | Thông báo đặt chuyến | Passenger đặt xe -> Driver nhận Toast thông báo tức thì. |
| TC-10-03 | Chat realtime | Tab A gửi -> Tab B hiện tin nhắn ngay lập tức (no reload). |
| TC-10-04 | Chat history | F5 trang -> Vẫn thấy nội dung chat cũ từ DB. |
| TC-10-05 | Bảo mật Socket | Thử kết nối socket mà không có JWT -> Server từ chối kết nối. |

## Công cụ kiểm tra
- **Frontend:** Chrome DevTools (Network -> WS tab).
- **Backend:** Logs console, Prisma Studio (kiểm tra bảng Message).
- **Manual:** Mở 2 trình duyệt khác nhau để mô phỏng 2 người dùng.
