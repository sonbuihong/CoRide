# CÁC TRANG PHÍA TÀI XẾ SAU KHI HÀNH KHÁCH MATCHING TRONG HỆ THỐNG CORIDE

## 1. Tổng quan

Sau khi hành khách được thuật toán matching ghép với một chuyến mà tài xế đã đăng, phía tài xế cần có các màn hình để:

- Xem chuyến đã đăng.
- Xem yêu cầu đặt chỗ.
- Xem mức độ phù hợp của hành khách.
- Xem vị trí điểm đón và điểm trả trên bản đồ.
- Xem độ lệch tuyến và thời gian tăng thêm.
- Chấp nhận hoặc từ chối Booking.
- Quản lý danh sách hành khách đã xác nhận.
- Chat với hành khách.
- Theo dõi và điều khiển chuyến đang diễn ra.
- Đón và trả nhiều hành khách theo thứ tự.

Luồng tổng thể đề xuất:

```text
Tài xế đã đăng chuyến
        ↓
Passenger tìm chuyến
        ↓
Matching Algorithm
        ↓
Passenger gửi Booking
        ↓
Driver nhận Booking Request
        ↓
Xem Booking Request Detail
        ↓
Xem bản đồ + MatchScore + Detour
        ↓
Accept / Reject
        ↓
Nếu Accept
        ↓
Booking = CONFIRMED
        ↓
Passenger List
        ↓
Chat
        ↓
Active Trip
        ↓
Đón khách
        ↓
Trả khách
        ↓
Complete Ride
```

---

## 2. Các màn hình chính phía tài xế

| Màn hình | Chức năng |
|---|---|
| `My Rides` | Danh sách các chuyến tài xế đã đăng |
| `Ride Detail` | Xem chi tiết chuyến và tuyến đường |
| `Booking Requests` | Xem danh sách yêu cầu đặt chỗ |
| `Booking Request Detail` | Xem chi tiết hành khách, matching và bản đồ |
| `Passenger List` | Xem danh sách khách đã xác nhận |
| `Chat` | Trao đổi với từng hành khách |
| `Active Trip` | Điều khiển chuyến đang diễn ra |

Nếu muốn giảm số màn hình, có thể gộp `Booking Requests` và `Passenger List` vào `Ride Detail`.

Khi đó CoRide chỉ cần khoảng 5 màn hình chính:

```text
1. My Rides
2. Ride Detail
3. Booking Request Detail
4. Chat
5. Active Trip
```

---

## 3. Trang Chuyến của tôi - My Rides

Đây là nơi tài xế quản lý các chuyến đã đăng.

Có thể chia theo trạng thái:

```text
Đang mở
Sắp diễn ra
Đang diễn ra
Đã hoàn thành
Đã hủy
```

Ví dụ:

```text
CHUYẾN CỦA TÔI

[ Đang mở ] [ Sắp tới ] [ Hoàn thành ]

Phenikaa University → Cầu Giấy

16/08/2026 - 07:30

Ghế còn:
2 / 3

Yêu cầu mới:
2

[ Xem chi tiết ]
```

Nếu có Booking mới, nên có badge:

```text
2 yêu cầu mới
```

Trang này không nhất thiết phải hiển thị bản đồ cho từng item vì sẽ làm giao diện nặng.

---

## 4. Trang Chi tiết chuyến - Ride Detail

Đây là màn hình trung tâm của tài xế sau khi đăng chuyến.

Trang này nên hiển thị:

- Điểm đi.
- Điểm đến.
- Ngày giờ.
- Phương tiện.
- Giá mỗi ghế.
- Tổng số ghế.
- Ghế còn lại.
- Trạng thái chuyến.
- Danh sách yêu cầu đang chờ.
- Danh sách hành khách đã xác nhận.
- Bản đồ tuyến đường mà tài xế đã đăng.

Ví dụ:

```text
CHI TIẾT CHUYẾN

Phenikaa University
        ↓
Cầu Giấy

16/08/2026 - 07:30

Toyota Vios
30A-12345

Giá:
50.000đ / ghế

Ghế:
2 / 3 còn trống

Trạng thái:
Đang mở nhận đặt chỗ
```

---

## 5. Bản đồ trong Ride Detail

Bản đồ ở `Ride Detail` nên là thành phần bắt buộc.

Bản đồ hiển thị:

- Điểm xuất phát của tài xế.
- Điểm đến của tài xế.
- Toàn bộ `routePolyline`.
- Có thể hiển thị các điểm đón/trả đã được xác nhận.

Ví dụ:

```text
┌──────────────────────────────────┐
│                                  │
│             BẢN ĐỒ               │
│                                  │
│  A ========================== B  │
│                                  │
└──────────────────────────────────┘

A: Phenikaa University
B: Cầu Giấy
```

Khi đã có hành khách:

```text
A ===== P1 ===== P2 ===== Q1 ===== B
        ↑        ↑        ↑
      đón 1    đón 2    trả 1
```

---

## 6. Trang Yêu cầu đặt chỗ - Booking Requests

Khi Passenger matching và gửi Booking, tài xế nhìn thấy danh sách yêu cầu.

Ví dụ:

```text
YÊU CẦU ĐẶT CHỖ

Nguyễn Văn B

Điểm đón:
Nguyễn Trãi

Điểm đến:
Cầu Giấy

Số ghế:
1

Thời gian dự kiến đón:
07:45

Matching Score:
92%

Loại:
Đón dọc đường

[ Xem chi tiết ]
```

Nếu có nhiều Passenger:

```text
1. Nguyễn Văn B      92%
2. Trần Văn C        87%
3. Lê Văn D          75%
```

Danh sách có thể được sắp xếp theo `MatchScore DESC`.

Không cần hiển thị bản đồ ở từng card. Bản đồ nên nằm trong trang chi tiết của từng yêu cầu.

---

## 7. Trang Chi tiết yêu cầu đặt chỗ - Booking Request Detail

Đây là một trong những màn hình quan trọng nhất phía tài xế.

### Thông tin hành khách

```text
Nguyễn Văn B
Đánh giá: 4.7
Số chuyến đã đi: 12
```

### Hành trình của Passenger

```text
Điểm đón:
Nguyễn Trãi

Điểm trả:
Cầu Giấy

Số ghế:
1
```

### Matching

```text
Mức độ phù hợp:
92%

Loại Matching:
ON_ROUTE
```

---

## 8. Bản đồ trong Booking Request Detail

Bản đồ ở màn hình này là bắt buộc vì tài xế cần nhìn trực tiếp xem Passenger nằm ở đâu trên tuyến.

Ví dụ:

```text
YÊU CẦU ĐẶT CHỖ

Nguyễn Văn B
Match: 92%

┌─────────────────────────────────┐
│                                 │
│           BẢN ĐỒ                │
│                                 │
│  A ======= P ======== Q ===== B │
│            ↑          ↑         │
│          Đón khách   Trả khách  │
│                                 │
└─────────────────────────────────┘
```

Trong đó:

```text
A = Driver Origin
B = Driver Destination
P = Passenger Pickup
Q = Passenger Dropoff
```

---

## 9. Các thông tin nên hiển thị dưới bản đồ

```text
Tuyến của bạn:
Phenikaa → Cầu Giấy

Khách muốn đi:
Nguyễn Trãi → Mỹ Đình

Điểm đón cách tuyến:
350 m

Điểm trả cách tuyến:
420 m

Độ lệch tuyến dự kiến:
0.8 km

Thời gian tăng thêm:
4 phút
```

Các nút:

```text
[ Từ chối ]

[ Chấp nhận ]
```

---

## 10. Sau khi tài xế chấp nhận Booking

Khi tài xế bấm `Chấp nhận`:

```text
Booking.status:
PENDING
   ↓
CONFIRMED
```

Đồng thời:

```text
Ride.availableSeats
=
Ride.availableSeats
-
Booking.seats
```

Ví dụ:

```text
3 ghế
-
1 ghế
=
2 ghế còn lại
```

Passenger nhận thông báo:

```text
Tài xế đã xác nhận đặt chỗ của bạn.
```

---

## 11. Trang Danh sách hành khách - Passenger List

Ví dụ:

```text
HÀNH KHÁCH

1. Nguyễn Văn B
   1 ghế
   Nguyễn Trãi → Cầu Giấy

2. Trần Văn C
   1 ghế
   Hà Đông → Mỹ Đình
```

Tài xế có thể chọn từng Passenger để:

- Xem chi tiết Booking.
- Chat.
- Xem điểm đón.
- Xem điểm trả.

---

## 12. Thứ tự đón và trả hành khách

Nếu CoRide hỗ trợ nhiều hành khách trên một Ride, hệ thống nên hiển thị thứ tự các điểm dừng.

```text
LỘ TRÌNH ĐÓN KHÁCH

1. Xuất phát
   Phenikaa University

        ↓

2. Đón Nguyễn Văn B
   Nguyễn Trãi
   07:45

        ↓

3. Đón Trần Văn C
   Cầu Am
   07:55

        ↓

4. Trả Nguyễn Văn B
   Cầu Giấy

        ↓

5. Trả Trần Văn C
   Mỹ Đình

        ↓

6. Điểm đến cuối
```

---

## 13. Trang Chat

Sau khi Booking được xác nhận:

```text
Driver ↔ Passenger
```

Ví dụ:

```text
Nguyễn Văn B

Passenger:
Em đang đứng trước số 120 Nguyễn Trãi.

Driver:
Anh còn khoảng 5 phút nữa tới.
```

Mục đích:

- Xác nhận điểm đón.
- Thông báo thời gian đến.
- Hỗ trợ tìm nhau.
- Thông báo các thay đổi nhỏ trong khu vực đón.

---

## 14. Trang Active Trip

Đây là màn hình quan trọng nhất khi tài xế bắt đầu thực hiện chuyến.

Trang này nên gồm:

- Bản đồ lớn.
- Vị trí tài xế.
- Route của chuyến.
- Các điểm đón.
- Các điểm trả.
- Điểm tiếp theo.
- Hành khách liên quan tới điểm tiếp theo.
- Khoảng cách.
- ETA.
- Các nút thao tác trạng thái.

Ví dụ:

```text
CHUYẾN ĐANG THỰC HIỆN

Phenikaa University
        ↓
Cầu Giấy

Hành khách:
2

Điểm tiếp theo:

Nguyễn Văn B
Nguyễn Trãi

Khoảng cách:
1.2 km

Dự kiến:
5 phút

[ Bắt đầu điều hướng ]

[ Đã đến điểm đón ]
```

---

## 15. Bản đồ trong Active Trip

Bản đồ ở `Active Trip` là bắt buộc.

Ví dụ tài xế có hai Passenger:

```text
                  P1
                  ↓
A ================ ● ========= P2 ========= Q1 ===== Q2 ===== B
                              ↑             ↑        ↑
                           đón khách 2    trả 1    trả 2
```

Bản đồ nên hiển thị:

```text
Driver Current Location
Driver Route
Passenger Pickup Points
Passenger Dropoff Points
Next Stop
Final Destination
```

---

## 16. Điểm tiếp theo

Active Trip không nên chỉ hiển thị điểm đến cuối cùng.

Hệ thống cần xác định `Next Stop`.

Ví dụ:

```text
ĐIỂM TIẾP THEO

Đón Nguyễn Văn B
120 Nguyễn Trãi

Cách:
1.2 km

Dự kiến:
5 phút

[ Bắt đầu điều hướng ]

[ Đã đến điểm đón ]
```

Sau khi hoàn thành stop hiện tại, hệ thống chuyển sang stop tiếp theo.

---

## 17. Khi tài xế đến điểm đón

Tài xế bấm:

```text
Đã đến điểm đón
```

Hệ thống cập nhật:

```text
Booking.status = DRIVER_ARRIVED
```

Passenger nhận Notification:

```text
Tài xế đã đến điểm đón.
```

Driver UI:

```text
Nguyễn Văn B

Trạng thái:
Đã đến điểm đón

[ Xác nhận khách đã lên xe ]
```

---

## 18. Xác nhận hành khách đã lên xe

Sau khi Passenger lên xe, tài xế bấm:

```text
Xác nhận khách đã lên xe
```

Trạng thái có thể chuyển thành:

```text
PICKED_UP
```

Sau đó hệ thống chọn stop tiếp theo.

```text
Nguyễn Văn B
✓ Đã lên xe

Điểm tiếp theo:
Đón Trần Văn C
```

---

## 19. Trường hợp có nhiều hành khách

Đối với Carpooling, không nên thiết kế luồng chỉ có:

```text
Đã đến điểm đón
        ↓
Bắt đầu chuyến
```

Ví dụ:

```text
Driver Route:

A --- P1 --- P2 --- Q1 --- Q2 --- B
```

Luồng phù hợp hơn:

```text
Xuất phát
   ↓
Đón Passenger 1
   ↓
Đón Passenger 2
   ↓
Trả Passenger 1
   ↓
Trả Passenger 2
   ↓
Hoàn thành Ride
```

---

## 20. Cấu trúc Stop đề xuất

Có thể biểu diễn mỗi điểm dừng bằng `TripStop`.

Ví dụ điểm đón:

```json
{
  "type": "PICKUP",
  "bookingId": "booking_1",
  "passengerId": "passenger_1",
  "latitude": 21.001,
  "longitude": 105.812,
  "sequence": 1,
  "status": "PENDING"
}
```

Ví dụ điểm trả:

```json
{
  "type": "DROPOFF",
  "bookingId": "booking_1",
  "passengerId": "passenger_1",
  "latitude": 21.032,
  "longitude": 105.801,
  "sequence": 3,
  "status": "PENDING"
}
```

---

## 21. Các trạng thái Ride đề xuất

```text
OPEN
FULL
IN_PROGRESS
COMPLETED
CANCELLED
```

| Trạng thái | Ý nghĩa |
|---|---|
| `OPEN` | Đang nhận Booking |
| `FULL` | Đã hết ghế |
| `IN_PROGRESS` | Chuyến đang thực hiện |
| `COMPLETED` | Đã hoàn thành |
| `CANCELLED` | Đã hủy |

---

## 22. Các trạng thái Booking đề xuất

```text
PENDING
CONFIRMED
REJECTED
CANCELLED
DRIVER_ARRIVING
DRIVER_ARRIVED
PICKED_UP
COMPLETED
```

| Trạng thái | Ý nghĩa |
|---|---|
| `PENDING` | Chờ Driver xác nhận |
| `CONFIRMED` | Driver đã chấp nhận |
| `REJECTED` | Driver từ chối |
| `CANCELLED` | Booking bị hủy |
| `DRIVER_ARRIVING` | Driver đang tới điểm đón |
| `DRIVER_ARRIVED` | Driver đã tới điểm đón |
| `PICKED_UP` | Passenger đã lên xe |
| `COMPLETED` | Passenger đã được trả |

---

## 23. Bản đồ nên xuất hiện ở đâu

Trong CoRide, bản đồ nên xuất hiện bắt buộc ở ba màn hình:

### 23.1. Ride Detail

Hiển thị:

```text
Driver Origin
Driver Destination
Driver Route
Confirmed Stops
```

### 23.2. Booking Request Detail

Hiển thị:

```text
Driver Route
Passenger Pickup
Passenger Dropoff
Detour
Route Matching
```

### 23.3. Active Trip

Hiển thị:

```text
Driver Current Location
Driver Route
Pickup Stops
Dropoff Stops
Next Stop
Final Destination
```

---

## 24. Màn hình không cần bản đồ

Để tránh giao diện nặng, không cần hiển thị bản đồ ở:

```text
My Rides
Booking Requests List
Chat
```

---

## 25. Quan hệ với thuật toán Matching

Trang `Booking Request Detail` nên hiển thị trực tiếp kết quả của thuật toán matching.

```text
Matching Score: 92%

Match Type:
ON_ROUTE

Pickup Distance To Route:
350 m

Dropoff Distance To Route:
420 m

Detour:
0.8 km

Additional Time:
4 phút

Route Similarity:
86%
```

Qua đó tài xế có thể hiểu tại sao hệ thống đề xuất Passenger này.

---

## 26. Luồng UI hoàn chỉnh phía tài xế

```text
My Rides
    ↓
Ride Detail
    │
    │  MAP:
    │  Driver Route
    │
    ↓
Booking Requests
    ↓
Booking Request Detail
    │
    │  MAP:
    │  Driver Route
    │  + Passenger Pickup
    │  + Passenger Dropoff
    │
    ↓
Matching Information
    ↓
MatchScore
Detour
Additional Time
    ↓
Accept / Reject
        │
        ├── Reject
        │      ↓
        │ Booking = REJECTED
        │
        └── Accept
               ↓
        Booking = CONFIRMED
               ↓
        Update availableSeats
               ↓
         Passenger List
               ↓
              Chat
               ↓
          Active Trip
               │
               │ MAP:
               │ Driver Location
               │ + Pickup Stops
               │ + Dropoff Stops
               │ + Route
               ↓
          Next Pickup
               ↓
         Driver Arrived
               ↓
        Passenger Picked Up
               ↓
          Next Stop
               ↓
          Dropoff
               ↓
        Booking Completed
               ↓
          Next Stop
               ↓
        Ride Completed
```

---

## 27. Cấu trúc cuối cùng đề xuất

Phía tài xế có thể triển khai 5 màn hình chính:

```text
1. My Rides
2. Ride Detail
3. Booking Request Detail
4. Chat
5. Active Trip
```

Trong đó `Ride Detail` có thể chứa:

```text
Booking Requests
Passenger List
```

để giảm số page riêng biệt.

---

## 28. Kết luận

Sau khi hành khách matching với tài xế, CoRide nên để tài xế quản lý toàn bộ quá trình từ `Ride Detail` đến `Active Trip`.

Bản đồ là thành phần quan trọng và nên bắt buộc ở:

```text
Ride Detail
Booking Request Detail
Active Trip
```

Đặc biệt, `Booking Request Detail` cần hiển thị:

```text
Driver Route
Passenger Pickup
Passenger Dropoff
Matching Score
Detour
Additional Time
```

để tài xế hiểu rõ tác động của việc nhận hành khách.

Khi chuyến bắt đầu, `Active Trip` nên hoạt động như màn hình điều khiển chuyến Carpooling, hỗ trợ nhiều điểm đón và trả thay vì chỉ một điểm xuất phát và một điểm đến cuối cùng.
