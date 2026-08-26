# UC ĐĂNG CHUYẾN TRONG HỆ THỐNG CORIDE

## 1. Tổng quan

UC **Đăng chuyến** dành cho tài xế trong phân hệ Carpooling của CoRide nên được thiết kế ngắn gọn, rõ ràng và dễ thao tác.

Mục tiêu của UC này là cho phép tài xế:

- Nhập điểm đi và điểm đến.
- Chọn thời gian khởi hành.
- Chọn phương tiện.
- Xác nhận tuyến đường.
- Thiết lập số ghế còn trống.
- Thiết lập giá mỗi ghế.
- Cho phép hoặc không cho phép đón khách dọc đường.
- Xem lại thông tin.
- Đăng chuyến lên hệ thống.

Luồng đề xuất:

```text
Đăng chuyến
    ↓
Nhập thông tin hành trình
    ↓
Xác nhận lộ trình
    ↓
Thiết lập chuyến
    ↓
Xem lại thông tin
    ↓
Đăng chuyến
    ↓
Ride.status = OPEN
    ↓
Chi tiết chuyến đã đăng
```

---

## 2. Cấu trúc màn hình đề xuất

UC Đăng chuyến nên có khoảng 4 màn hình chính:

| Màn hình | Chức năng |
|---|---|
| `Create Ride` | Nhập điểm đi, điểm đến, ngày giờ và phương tiện |
| `Route Preview` | Xác nhận tuyến đường trên bản đồ |
| `Ride Settings` | Thiết lập số ghế, giá và quy tắc đón khách |
| `Ride Confirmation` | Xem lại và xác nhận đăng chuyến |

Sau khi đăng thành công, hệ thống chuyển sang:

```text
Ride Detail
```

Trang `Ride Detail` nên thuộc UC **Quản lý chuyến đã đăng** thay vì UC Đăng chuyến.

---

## 3. Trang Nhập thông tin chuyến - Create Ride

Đây là màn hình đầu tiên khi tài xế chọn chức năng:

```text
Đăng chuyến
```

### 3.1. Thông tin cần nhập

Trang này nên có:

- Điểm xuất phát.
- Điểm đến.
- Ngày khởi hành.
- Giờ khởi hành.
- Phương tiện sử dụng.
- Nút `Tiếp tục`.

Ví dụ:

```text
ĐĂNG CHUYẾN

Điểm đi
[ Phenikaa University ]

Điểm đến
[ Cầu Giấy ]

Ngày đi
[ 16/08/2026 ]

Giờ khởi hành
[ 07:30 ]

Phương tiện
[ Toyota Vios - 30A-12345 ]

[ Tiếp tục ]
```

### 3.2. Dữ liệu địa điểm

Điểm đi và điểm đến nên sử dụng Goong Autocomplete hoặc dịch vụ Geocoding của hệ thống.

Sau khi người dùng chọn địa điểm, hệ thống lưu:

```text
originAddress
originLat
originLng

destinationAddress
destinationLat
destinationLng
```

Ví dụ:

```json
{
  "originAddress": "Phenikaa University",
  "originLat": 20.9621,
  "originLng": 105.7483,

  "destinationAddress": "Cầu Giấy, Hà Nội",
  "destinationLat": 21.0362,
  "destinationLng": 105.7906
}
```

---

## 4. Trang Xác nhận lộ trình - Route Preview

Sau khi tài xế nhập điểm đi và điểm đến, hệ thống gọi dịch vụ Directions để lấy tuyến đường.

Trang này nên hiển thị:

- Điểm xuất phát.
- Điểm đến.
- Bản đồ.
- Tuyến đường dự kiến.
- Khoảng cách.
- Thời gian di chuyển dự kiến.
- Nút quay lại.
- Nút tiếp tục.

Ví dụ:

```text
XÁC NHẬN LỘ TRÌNH

Phenikaa University
        ↓
Cầu Giấy

Khoảng cách:
14.2 km

Thời gian dự kiến:
35 phút

┌──────────────────────────────┐
│                              │
│            MAP               │
│                              │
│ A ======================= B  │
│                              │
└──────────────────────────────┘

[ Quay lại ]     [ Tiếp tục ]
```

---

## 5. Dữ liệu tuyến đường cần lưu

Sau khi tài xế xác nhận tuyến, CoRide nên lưu:

```text
routePolyline
distance
duration
```

Ví dụ:

```text
routePolyline = [
    [20.9801, 105.7901],
    [20.9813, 105.7932],
    [20.9845, 105.7982],
    ...
]
```

Trong đó:

```text
distance = 14200 m
duration = 2100 s
```

`routePolyline` là dữ liệu rất quan trọng vì thuật toán matching của CoRide có thể dùng tuyến này để tìm:

- Khách có cùng điểm đi và điểm đến.
- Khách có điểm đi/đến gần tuyến.
- Khách nằm dọc lộ trình.
- Khách có hành trình cùng chiều với tài xế.

---

## 6. Trang Thiết lập chuyến - Ride Settings

Sau khi xác nhận tuyến đường, tài xế thiết lập các thông tin liên quan tới chuyến đi.

Trang này nên có:

- Số ghế còn trống.
- Giá mỗi ghế.
- Cho phép đón khách dọc đường hay không.
- Ghi chú cho hành khách.

Ví dụ:

```text
THIẾT LẬP CHUYẾN

Số ghế còn trống

[ - ]  3  [ + ]

Giá mỗi ghế

[ 50.000 ] VNĐ

Đón khách dọc đường

[ Có ]

Ghi chú

[ Tôi có thể đón khách tại các
  điểm gần tuyến đường.          ]

[ Tiếp tục ]
```

---

## 7. Số ghế

Tài xế nhập:

```text
availableSeats
```

Ví dụ:

```text
availableSeats = 3
```

Hệ thống cần kiểm tra:

```text
availableSeats > 0
```

và không vượt quá số ghế hợp lệ của phương tiện.

Ví dụ:

```text
CAR:
1 → 4 ghế

BIKE:
1 ghế
```

Giới hạn thực tế có thể phụ thuộc vào dữ liệu Vehicle của CoRide.

---

## 8. Giá mỗi ghế

Tài xế nhập:

```text
pricePerSeat
```

Ví dụ:

```text
pricePerSeat = 50000
```

Có thể hiển thị:

```text
50.000đ / ghế
```

Hệ thống nên kiểm tra:

```text
pricePerSeat > 0
```

và có thể áp dụng giá tối thiểu hoặc giá đề xuất trong tương lai.

---

## 9. Cho phép đón khách dọc đường

Đây là một trường quan trọng nếu CoRide sử dụng thuật toán Route-Based Ride Matching.

Tên trường đề xuất:

```text
allowRoutePickup
```

Kiểu dữ liệu:

```text
boolean
```

Ví dụ:

```text
allowRoutePickup = true
```

hoặc:

```text
allowRoutePickup = false
```

### Trường hợp `true`

Nếu:

```text
allowRoutePickup = true
```

hệ thống có thể matching các hành khách:

- Có điểm đi nằm gần tuyến tài xế.
- Có điểm đến nằm gần tuyến tài xế.
- Đi cùng chiều.
- Không làm tài xế vòng quá xa.

Ví dụ:

```text
Tài xế:

A -------- P -------- Q -------- B

Hành khách:

          P -------- Q
```

### Trường hợp `false`

Nếu:

```text
allowRoutePickup = false
```

hệ thống chỉ nên ưu tiên các hành khách có:

```text
Passenger Origin ≈ Driver Origin
```

và:

```text
Passenger Destination ≈ Driver Destination
```

---

## 10. Ghi chú chuyến đi

Tài xế có thể nhập:

```text
note
```

Ví dụ:

```text
Có thể đón khách tại khu vực Nguyễn Trãi.
Không hút thuốc trên xe.
Có thể mang hành lý nhỏ.
```

Trường này không bắt buộc.

---

## 11. Trang Xem lại và xác nhận - Ride Confirmation

Trước khi tạo Ride, hệ thống nên cho tài xế xem lại toàn bộ thông tin.

Ví dụ:

```text
XEM LẠI CHUYẾN ĐI

Phenikaa University
        ↓
Cầu Giấy

16/08/2026
07:30

Phương tiện:
Toyota Vios
30A-12345

Khoảng cách:
14.2 km

Thời gian:
35 phút

Số ghế:
3

Giá:
50.000đ / ghế

Đón khách dọc đường:
Có

Ghi chú:
Có thể đón khách tại các điểm gần tuyến.

Tổng thu tối đa:
150.000đ

[ Chỉnh sửa ]

[ Đăng chuyến ]
```

---

## 12. Tổng thu tối đa

Có thể hiển thị:

```text
estimatedMaximumRevenue =
    availableSeats * pricePerSeat
```

Ví dụ:

```text
3 * 50.000
=
150.000đ
```

Thông tin này chỉ mang tính tham khảo.

---

## 13. Xử lý khi bấm Đăng chuyến

Khi tài xế nhấn:

```text
Đăng chuyến
```

Frontend gửi dữ liệu tới Backend.

Ví dụ request:

```json
{
  "originAddress": "Phenikaa University",
  "originLat": 20.9621,
  "originLng": 105.7483,

  "destinationAddress": "Cầu Giấy, Hà Nội",
  "destinationLat": 21.0362,
  "destinationLng": 105.7906,

  "departureTime": "2026-08-16T07:30:00",

  "vehicleId": "vehicle_id",

  "availableSeats": 3,

  "pricePerSeat": 50000,

  "allowRoutePickup": true,

  "distance": 14200,

  "duration": 2100,

  "routePolyline": "...",

  "note": "Có thể đón khách gần tuyến đường."
}
```

Backend kiểm tra dữ liệu hợp lệ.

Nếu hợp lệ:

```text
Create Ride
```

và đặt trạng thái:

```text
Ride.status = OPEN
```

---

## 14. Trạng thái sau khi đăng chuyến

Sau khi đăng thành công:

```text
Ride.status = OPEN
```

Ý nghĩa:

- Chuyến đã được đăng.
- Hành khách có thể tìm thấy chuyến.
- Thuật toán matching có thể đưa chuyến vào danh sách kết quả.
- Hành khách có thể gửi yêu cầu đặt chỗ.
- Tài xế có thể quản lý các Booking liên quan.

---

## 15. Trang Chi tiết chuyến đã đăng - Ride Detail

Sau khi đăng thành công, hệ thống chuyển tài xế tới:

```text
Ride Detail
```

Ví dụ:

```text
CHUYẾN ĐÃ ĐĂNG

Phenikaa University
        ↓
Cầu Giấy

16/08/2026 - 07:30

Phương tiện:
Toyota Vios
30A-12345

Số ghế:
3

Giá:
50.000đ / ghế

Ghế còn lại:
3 / 3

Đón khách dọc đường:
Có

Trạng thái:
Đang mở nhận đặt chỗ
```

Các nút có thể gồm:

```text
[ Xem yêu cầu đặt chỗ ]

[ Chỉnh sửa chuyến ]

[ Hủy chuyến ]
```

---

## 16. Khi có hành khách đặt chỗ

Sau khi thuật toán matching hiển thị chuyến cho hành khách, hành khách có thể gửi Booking.

Tài xế có thể nhìn thấy:

```text
YÊU CẦU ĐẶT CHỖ

Hành khách:
Nguyễn Văn B

Điểm đón:
Nguyễn Trãi

Điểm đến:
Cầu Giấy

Số ghế:
1

Matching Score:
92%

Loại Matching:
Đón dọc đường

[ Từ chối ]     [ Xác nhận ]
```

Phần này thuộc UC quản lý Booking hoặc UC Quản lý chuyến đã đăng.

---

## 17. Quan hệ với thuật toán Matching

Khi tài xế đăng chuyến, các dữ liệu sau sẽ được sử dụng bởi thuật toán matching:

```text
originLat
originLng

destinationLat
destinationLng

departureTime

availableSeats

routePolyline

distance

duration

allowRoutePickup

pricePerSeat
```

Thuật toán có thể sử dụng chúng để kiểm tra:

```text
Direct Match
Nearby Match
On-Route Match
```

---

## 18. Luồng kết nối với Route-Based Ride Matching

```text
Driver đăng chuyến
        ↓
Lưu Origin + Destination
        ↓
Lưu Route Polyline
        ↓
Ride.status = OPEN
        ↓
Passenger tìm chuyến
        ↓
Matching Algorithm
        ↓
Direct Match
        hoặc
Nearby Match
        hoặc
On-Route Match
        ↓
Tính Matching Score
        ↓
Hiển thị chuyến
```

---

## 19. Validation đề xuất

Trước khi cho phép đăng chuyến, hệ thống nên kiểm tra:

### Điểm đi

```text
origin != null
```

### Điểm đến

```text
destination != null
```

### Điểm đi khác điểm đến

```text
origin != destination
```

### Thời gian

```text
departureTime > currentTime
```

### Phương tiện

```text
vehicleId != null
```

### Số ghế

```text
availableSeats > 0
```

### Giá

```text
pricePerSeat > 0
```

### Route

```text
routePolyline != null
```

---

## 20. Pseudocode UC Đăng chuyến

```javascript
async function createRide(driver, input) {

    // 1. Kiểm tra tài xế
    if (!driver) {
        throw new Error("UNAUTHORIZED");
    }

    // 2. Kiểm tra phương tiện
    const vehicle = await getVehicle(
        input.vehicleId
    );

    if (!vehicle) {
        throw new Error("VEHICLE_NOT_FOUND");
    }

    // 3. Kiểm tra thời gian
    if (
        input.departureTime <= currentTime()
    ) {
        throw new Error(
            "INVALID_DEPARTURE_TIME"
        );
    }

    // 4. Kiểm tra số ghế
    if (input.availableSeats <= 0) {
        throw new Error(
            "INVALID_AVAILABLE_SEATS"
        );
    }

    // 5. Kiểm tra giá
    if (input.pricePerSeat <= 0) {
        throw new Error(
            "INVALID_PRICE"
        );
    }

    // 6. Lấy route
    const route =
        await getRouteFromMapService(
            input.origin,
            input.destination
        );

    if (!route) {
        throw new Error(
            "ROUTE_NOT_FOUND"
        );
    }

    // 7. Tạo Ride
    const ride = await database.ride.create({
        driverId: driver.id,

        vehicleId: vehicle.id,

        originAddress:
            input.origin.address,

        originLat:
            input.origin.lat,

        originLng:
            input.origin.lng,

        destinationAddress:
            input.destination.address,

        destinationLat:
            input.destination.lat,

        destinationLng:
            input.destination.lng,

        departureTime:
            input.departureTime,

        availableSeats:
            input.availableSeats,

        pricePerSeat:
            input.pricePerSeat,

        allowRoutePickup:
            input.allowRoutePickup,

        note:
            input.note,

        routePolyline:
            route.polyline,

        distance:
            route.distance,

        duration:
            route.duration,

        status:
            "OPEN"
    });

    return ride;
}
```

---

## 21. Flow tổng thể

```text
Driver
   ↓
Chọn "Đăng chuyến"
   ↓
Nhập điểm đi
   ↓
Nhập điểm đến
   ↓
Chọn ngày / giờ
   ↓
Chọn phương tiện
   ↓
Tiếp tục
   ↓
Hệ thống lấy Route
   ↓
Hiển thị Route Preview
   ↓
Driver xác nhận
   ↓
Nhập số ghế
   ↓
Nhập giá
   ↓
Chọn cho phép đón khách dọc đường
   ↓
Nhập ghi chú
   ↓
Xem lại chuyến
   ↓
Xác nhận đăng
   ↓
Backend kiểm tra dữ liệu
   ↓
Create Ride
   ↓
Ride.status = OPEN
   ↓
Ride Detail
```

---

## 22. Cách chia Use Case trong báo cáo

Nên phân biệt rõ:

### UC Đăng chuyến

Bao gồm:

```text
1. Nhập thông tin hành trình.
2. Chọn phương tiện.
3. Xác nhận tuyến đường.
4. Thiết lập số ghế.
5. Thiết lập giá.
6. Cấu hình đón khách dọc đường.
7. Xem lại thông tin.
8. Xác nhận đăng chuyến.
```

Kết thúc UC:

```text
Ride.status = OPEN
```

### UC Quản lý chuyến đã đăng

Bao gồm:

```text
Xem chi tiết chuyến.
Chỉnh sửa chuyến.
Hủy chuyến.
Xem yêu cầu đặt chỗ.
Xác nhận Booking.
Từ chối Booking.
Theo dõi số ghế còn lại.
```

Như vậy hai Use Case không bị chồng chéo.

---

## 23. Cấu trúc cuối cùng đề xuất

### UC Đăng chuyến

```text
Create Ride
      ↓
Route Preview
      ↓
Ride Settings
      ↓
Ride Confirmation
      ↓
Create Ride Record
```

### Sau khi UC hoàn thành

```text
Ride Detail
      ↓
Manage Ride
```

---

## 24. Kết luận

Trong hệ thống CoRide, UC Đăng chuyến nên được tổ chức thành bốn màn hình chính:

```text
1. Create Ride
2. Route Preview
3. Ride Settings
4. Ride Confirmation
```

Sau khi tài xế xác nhận đăng chuyến:

```text
Ride.status = OPEN
```

và hệ thống chuyển sang:

```text
Ride Detail
```

Trang Ride Detail thuộc UC Quản lý chuyến đã đăng.

Cách thiết kế này giúp:

- Luồng đăng chuyến ngắn gọn.
- Giao diện dễ sử dụng.
- Dữ liệu tuyến đường được lưu đầy đủ.
- Tương thích với thuật toán Route-Based Ride Matching.
- Hỗ trợ cơ chế đón khách dọc đường.
- Dễ triển khai trên Web và Mobile.
- Dễ mô tả trong Use Case, Activity Diagram và Sequence Diagram của báo cáo CoRide.
