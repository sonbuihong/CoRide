# CÁC TRANG SAU KHI HÀNH KHÁCH ĐẶT CHỖ THÀNH CÔNG TRONG HỆ THỐNG CORIDE

## 1. Tổng quan luồng

Sau khi hành khách đặt chỗ thành công trong phân hệ Carpooling của CoRide, hệ thống nên tổ chức giao diện theo trạng thái của Booking thay vì tạo quá nhiều trang riêng biệt.

Luồng đề xuất:

```text
Đặt chỗ
   ↓
Chi tiết đặt chỗ
   ↓
Chờ tài xế xác nhận
   ↓
Đặt chỗ đã được xác nhận
   ↓
Theo dõi chuyến
   ↓
Chuyến đang diễn ra
   ↓
Hoàn thành chuyến
   ↓
Thanh toán
   ↓
Đánh giá
```

Các màn hình chính nên gồm:

1. My Bookings / Chuyến đi của tôi.
2. Booking Detail / Chi tiết đặt chỗ.
3. Chat / Trao đổi với tài xế.
4. Trip Tracking / Theo dõi chuyến.
5. Payment / Thanh toán.
6. Rating / Đánh giá chuyến đi.

Các trạng thái như `PENDING`, `CONFIRMED`, `DRIVER_ARRIVED`, `IN_PROGRESS`, `COMPLETED` không nhất thiết phải là các trang riêng mà có thể làm thay đổi nội dung của trang Booking Detail hoặc Trip Tracking.

---

## 2. Trang Chuyến đi của tôi - My Bookings

Đây là trang dùng để quản lý toàn bộ các Booking của hành khách.

Nên chia danh sách theo các nhóm:

```text
Sắp tới
Đang diễn ra
Đã hoàn thành
Đã hủy
```

Ví dụ:

```text
CHUYẾN ĐI CỦA TÔI

[ Sắp tới ] [ Đã hoàn thành ] [ Đã hủy ]

Phenikaa University → Cầu Giấy
15/08/2026 - 07:30
Trạng thái: Đã xác nhận

Hà Đông → Mỹ Đình
18/08/2026 - 08:00
Trạng thái: Đang chờ xác nhận
```

Khi người dùng chọn một Booking, hệ thống mở trang `Booking Detail`.

---

## 3. Trang Chi tiết đặt chỗ - Booking Detail

Đây là màn hình trung tâm của toàn bộ quy trình sau khi đặt chỗ.

Trang này nên hiển thị:

- Mã đặt chỗ.
- Trạng thái Booking.
- Điểm đón.
- Điểm đến.
- Thời gian khởi hành.
- Số ghế đã đặt.
- Giá mỗi ghế.
- Tổng tiền.
- Thông tin tài xế.
- Thông tin phương tiện.
- Biển số xe.
- Tuyến đường.
- Phương thức thanh toán.
- Các nút thao tác tương ứng với trạng thái hiện tại.

Ví dụ:

```text
CHI TIẾT ĐẶT CHỖ

Phenikaa University
        ↓
Cầu Giấy

15/08/2026 - 07:30

Số ghế: 2
Giá: 50.000đ / ghế
Tổng tiền: 100.000đ

Tài xế: Nguyễn Văn A
Đánh giá: 4.8

Phương tiện: Toyota Vios
Biển số: 30A-12345

Trạng thái: Đang chờ tài xế xác nhận
```

Trang này nên thay đổi nội dung theo trạng thái Booking thay vì tạo một page mới cho từng trạng thái.

---

## 4. Trạng thái Chờ tài xế xác nhận

Sau khi hành khách gửi yêu cầu đặt chỗ:

```text
Passenger tạo Booking
        ↓
PENDING
```

Tài xế có thể chuyển yêu cầu sang:

```text
CONFIRMED
```

hoặc:

```text
REJECTED / CANCELLED
```

Khi Booking đang ở trạng thái `PENDING`, Booking Detail có thể hiển thị:

```text
Đang chờ tài xế xác nhận

[ Hủy đặt chỗ ]
```

Có thể cho phép nhắn tin trước khi xác nhận, nhưng đối với phiên bản đơn giản của CoRide nên chỉ mở Chat sau khi tài xế đã xác nhận Booking.

---

## 5. Trạng thái Đặt chỗ đã được xác nhận

Khi tài xế chấp nhận:

```text
PENDING
   ↓
CONFIRMED
```

Hệ thống gửi thông báo cho hành khách:

```text
Tài xế đã xác nhận đặt chỗ của bạn.
```

Booking Detail chuyển sang hiển thị:

```text
ĐẶT CHỖ ĐÃ ĐƯỢC XÁC NHẬN

Tài xế: Nguyễn Văn A
Đánh giá: 4.8

Phương tiện: Toyota Vios
Biển số: 30A-12345

Thời gian: 07:30 - 15/08/2026
Điểm đón: Phenikaa University
Điểm đến: Cầu Giấy

[ Nhắn tin ]
[ Xem tuyến đường ]
[ Hủy chuyến ]
```

---

## 6. Trang Chat với tài xế

Sau khi Booking được xác nhận, hành khách có thể truy cập trang Chat.

Mục đích chính:

- Xác nhận vị trí đón.
- Thông báo thời gian đến.
- Trao đổi khi hành khách hoặc tài xế không tìm thấy nhau.
- Thống nhất vị trí đón nhỏ trong cùng khu vực.

Ví dụ:

```text
Nguyễn Văn A

Driver:
Mình sẽ đến cổng A nhé.

Passenger:
Vâng, khoảng mấy giờ anh tới ạ?

Driver:
Khoảng 7:25 nhé.
```

Chat không nên được dùng để tự ý thay đổi các thông tin nghiệp vụ chính như giá chuyến, số ghế, điểm đến chính hoặc trạng thái thanh toán.

---

## 7. Trang Theo dõi chuyến - Trip Tracking

Khi gần đến thời gian khởi hành, hành khách có thể mở màn hình Theo dõi chuyến.

Trang này có thể hiển thị:

- Bản đồ.
- Vị trí hoặc trạng thái của tài xế.
- Điểm đón.
- Khoảng cách tới điểm đón.
- Thời gian dự kiến tới nơi.
- Thông tin phương tiện.

Ví dụ:

```text
Tài xế đang đến điểm đón

Khoảng cách: 1.2 km
Dự kiến: 5 phút

Toyota Vios
30A-12345
```

Đối với đồ án CoRide, không nhất thiết phải triển khai tracking thời gian thực phức tạp như Grab. Có thể chỉ cần cập nhật các trạng thái:

```text
Tài xế chưa khởi hành
        ↓
Tài xế đang di chuyển
        ↓
Tài xế đã đến điểm đón
        ↓
Chuyến đang diễn ra
```

Socket.IO có thể được sử dụng để cập nhật trạng thái giữa tài xế và hành khách.

---

## 8. Trạng thái Tài xế đã đến điểm đón

Khi tài xế bấm:

```text
Đã đến điểm đón
```

hệ thống gửi Notification cho hành khách.

Ví dụ:

```text
TÀI XẾ ĐÃ ĐẾN

Toyota Vios
30A-12345

Điểm đón:
Cổng A - Phenikaa University

[ Nhắn tin tài xế ]
```

Không cần tạo một page riêng cho trạng thái này.

---

## 9. Trạng thái Chuyến đi đang diễn ra

Khi tài xế bấm:

```text
Bắt đầu chuyến
```

trạng thái chuyển thành:

```text
IN_PROGRESS
```

Hành khách có thể thấy:

```text
CHUYẾN ĐI ĐANG DIỄN RA

Phenikaa University
        ↓
Cầu Giấy

Đã đi: 4.2 km
Còn lại: 7.8 km
Dự kiến đến: 08:05

[ Xem tuyến đường ]
[ Báo cáo sự cố ]
```

---

## 10. Trạng thái Hoàn thành chuyến

Khi tài xế bấm:

```text
Hoàn thành chuyến
```

hệ thống cập nhật trạng thái:

```text
COMPLETED
```

Hành khách nhìn thấy:

```text
CHUYẾN ĐI ĐÃ HOÀN THÀNH

Phenikaa University
        ↓
Cầu Giấy

Khoảng cách: 12 km
Thời gian: 35 phút
Số ghế: 2

Tổng tiền: 100.000đ
```

Nếu chuyến chưa thanh toán, hệ thống chuyển hành khách sang bước thanh toán.

---

## 11. Trang Thanh toán - Payment

Trang Payment hiển thị thông tin tiền chuyến và phương thức thanh toán.

Ví dụ:

```text
THANH TOÁN

Tổng tiền: 100.000đ

Phương thức:
○ Ví CoRide
○ QR mô phỏng
○ Tiền mặt
```

### 11.1. Thanh toán bằng Ví CoRide

```text
Số dư hiện tại: 250.000đ
Số tiền thanh toán: 100.000đ
Số dư sau thanh toán: 150.000đ

[ Thanh toán ]
```

Sau khi thành công:

```text
Thanh toán thành công
```

### 11.2. Thanh toán bằng QR mô phỏng

Hệ thống hiển thị QR mô phỏng để phục vụ luồng nghiệp vụ của đồ án.

Sau khi xác nhận:

```text
Payment.status = SUCCESS
```

### 11.3. Thanh toán bằng tiền mặt

Nếu hành khách chọn tiền mặt, hệ thống lưu:

```text
paymentMethod = CASH
```

và cập nhật trạng thái thanh toán theo logic hệ thống.

---

## 12. Trang Đánh giá chuyến đi - Rating

Sau khi chuyến hoàn thành, hành khách có thể đánh giá tài xế.

Ví dụ:

```text
CHUYẾN ĐI CỦA BẠN THẾ NÀO?

Nguyễn Văn A

☆ ☆ ☆ ☆ ☆

Nhận xét:
[                              ]

[ Gửi đánh giá ]
```

Có thể cung cấp các tag nhanh:

```text
Đúng giờ
Lái xe an toàn
Thân thiện
Xe sạch
Dễ liên lạc
```

Trang này tương ứng với:

```text
UC25 - Đánh giá chuyến đi
```

---

## 13. Các trạng thái Booking đề xuất

```text
PENDING
CONFIRMED
DRIVER_ARRIVING
DRIVER_ARRIVED
IN_PROGRESS
COMPLETED
CANCELLED
```

| Trạng thái | Ý nghĩa |
|---|---|
| `PENDING` | Đang chờ tài xế xác nhận |
| `CONFIRMED` | Tài xế đã xác nhận |
| `DRIVER_ARRIVING` | Tài xế đang tới điểm đón |
| `DRIVER_ARRIVED` | Tài xế đã tới điểm đón |
| `IN_PROGRESS` | Chuyến đang diễn ra |
| `COMPLETED` | Chuyến đã hoàn thành |
| `CANCELLED` | Booking đã bị hủy |

---

## 14. Cấu trúc màn hình đề xuất

CoRide chỉ cần khoảng 6 màn hình chính:

| Màn hình | Chức năng |
|---|---|
| `My Bookings` | Hiển thị danh sách các Booking của hành khách |
| `Booking Detail` | Quản lý và hiển thị toàn bộ thông tin Booking |
| `Chat` | Trao đổi giữa hành khách và tài xế |
| `Trip Tracking` | Theo dõi trạng thái chuyến đi |
| `Payment` | Thực hiện thanh toán |
| `Rating` | Đánh giá sau chuyến đi |

Các trạng thái khác nhau sẽ làm thay đổi giao diện và các nút thao tác trong `Booking Detail` hoặc `Trip Tracking`.

---

## 15. Luồng giao diện hoàn chỉnh

```text
Tìm chuyến
    ↓
Chi tiết chuyến
    ↓
Đặt chỗ
    ↓
Booking Detail
    │
    ├── PENDING
    │      ↓
    │   Chờ tài xế
    │
    └── CONFIRMED
            ↓
          Chat
            ↓
       Trip Tracking
            ↓
     DRIVER_ARRIVED
            ↓
       IN_PROGRESS
            ↓
        COMPLETED
            ↓
         Payment
            ↓
          Rating
            ↓
       Booking History
```

---

## 16. Luồng theo vai trò hành khách

```text
Passenger
   ↓
Tìm chuyến
   ↓
Chọn chuyến
   ↓
Đặt chỗ
   ↓
Chờ xác nhận
   ↓
Nhận xác nhận từ Driver
   ↓
Chat / xem thông tin chuyến
   ↓
Chờ Driver tới
   ↓
Driver đã đến
   ↓
Bắt đầu chuyến
   ↓
Chuyến đang diễn ra
   ↓
Hoàn thành
   ↓
Thanh toán
   ↓
Đánh giá
```

---

## 17. Kết luận

Sau khi hành khách đặt chỗ thành công, CoRide nên sử dụng `Booking Detail` làm màn hình trung tâm và thay đổi nội dung theo trạng thái của Booking.

Cấu trúc gồm sáu màn hình chính:

```text
My Bookings
Booking Detail
Chat
Trip Tracking
Payment
Rating
```

Cách thiết kế này giúp giảm số lượng trang không cần thiết, dễ quản lý trạng thái Booking, giữ luồng nghiệp vụ rõ ràng và thuận tiện khi triển khai trên cả Web và Mobile.
