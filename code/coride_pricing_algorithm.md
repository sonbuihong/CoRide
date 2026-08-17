# Thuật toán đề xuất mức đóng góp chi phí cho CoRide

## 1. Mục tiêu

Thuật toán này được xây dựng cho chức năng **Carpooling** của hệ thống CoRide, theo nguyên tắc chia sẻ chi phí tương tự mô hình của BlaBlaCar.

Mục tiêu chính:

- Tính giá dựa trên quãng đường thực tế hành khách đi cùng tài xế.
- Hỗ trợ hành khách được đón/trả dọc đường.
- Tài xế vẫn phải tự chịu một phần chi phí chuyến đi.
- Hạn chế tài xế đặt giá quá cao và biến Carpooling thành hoạt động kiếm lợi nhuận.
- Có thể áp dụng cho điều kiện giao thông và chi phí vận hành tại Việt Nam.
- Tách biệt hoàn toàn với mô hình tính cước Ride-Hailing.

---

## 2. Nguyên tắc tính giá

CoRide không coi số tiền hành khách thanh toán là cước taxi mà là **mức đóng góp chi phí chuyến đi**.

Giá của hành khách được tính theo:

\[
P_i =
Round(
C_{distance,i}
+
C_{toll,i}
+
C_{detour,i}
)
\]

Trong đó:

- `P_i`: giá đề xuất cho hành khách `i`.
- `C_distance,i`: phần chi phí tương ứng với quãng đường hành khách thực sự đi cùng tài xế.
- `C_toll,i`: phần phí cao tốc, BOT hoặc phí đường bộ mà hành khách sử dụng.
- `C_detour,i`: chi phí phát sinh nếu tài xế phải lệch khỏi tuyến đường ban đầu để đón/trả khách.

CoRide không sử dụng:

- Giá mở cửa.
- Giá theo phút.
- Surge pricing.
- Tiền công tài xế.

Các thành phần trên phù hợp với Ride-Hailing hơn là Carpooling.

---

# 3. Tính chi phí nhiên liệu trên mỗi kilomet

Chi phí nhiên liệu trên một kilomet:

\[
C_{fuel/km}
=
\frac{FuelPrice \times FuelConsumption}{100}
\]

Trong đó:

- `FuelPrice`: giá nhiên liệu hiện tại, đơn vị VNĐ/lít.
- `FuelConsumption`: mức tiêu thụ nhiên liệu của phương tiện, đơn vị lít/100 km.

Ví dụ:

```text
FuelPrice = 22.119 VNĐ/lít
FuelConsumption = 6.5 lít/100 km
```

Khi đó:

\[
C_{fuel/km}
=
\frac{22.119 \times 6.5}{100}
\approx 1.438 VNĐ/km
\]

Giá nhiên liệu phải được lưu dưới dạng **cấu hình hệ thống** thay vì hard-code cố định vì giá xăng tại Việt Nam thay đổi theo từng kỳ điều hành.

---

# 4. Tính chi phí vận hành phương tiện

Ngoài nhiên liệu, xe còn phát sinh:

- Bảo dưỡng định kỳ.
- Thay dầu.
- Lốp xe.
- Sửa chữa.
- Hao mòn phương tiện.

CoRide sử dụng hệ số chi phí vận hành:

\[
C_{vehicle/km}
=
C_{fuel/km}
\times
(1 + MaintenanceRatio)
\]

Đề xuất:

```text
MaintenanceRatio = 0.50
```

Ví dụ:

\[
C_{vehicle/km}
=
1.438 \times 1.5
\approx 2.157 VNĐ/km
\]

Như vậy chi phí vận hành ước tính:

\[
C_{vehicle/km}
\approx 2.157 VNĐ/km
\]

---

# 5. Nguyên tắc tài xế phải chia sẻ chi phí

Carpooling không được thiết kế để tài xế thu toàn bộ chi phí từ hành khách.

Giả sử tài xế đăng:

```text
S = 3 ghế
```

Chi phí được phân bổ tương đương cho:

```text
1 tài xế + 3 ghế hành khách
= 4 phần
```

Mức đóng góp trên mỗi kilomet của một hành khách:

\[
R
=
\frac{C_{vehicle/km}}{S+1}
\]

Ví dụ:

\[
R
=
\frac{2.157}{4}
\approx 539 VNĐ/km
\]

Có thể làm tròn thành:

```text
540 VNĐ/km/ghế
```

Nếu chỉ có một hành khách đặt chỗ, hành khách đó vẫn chỉ đóng theo mức này. Phần chi phí của các ghế còn trống không được chuyển sang cho hành khách còn lại.

---

# 6. Công thức giá theo quãng đường hành khách sử dụng

Giả sử hành khách `i` đi `d_i` kilomet trên tuyến của tài xế.

Giá theo quãng đường:

\[
C_{distance,i}
=
d_i
\times
\frac{C_{vehicle/km}}{S+1}
\]

Ví dụ:

```text
Tuyến tài xế: Hà Nội -> Hải Phòng
Khoảng cách: 120 km
Số ghế đăng: 3
```

Với:

```text
R ≈ 539 VNĐ/km
```

Hành khách đi toàn tuyến:

\[
120 \times 539
=
64.680 VNĐ
\]

Làm tròn:

```text
65.000 VNĐ
```

---

# 7. Tính giá cho hành khách bắt dọc đường

Đây là trường hợp quan trọng của CoRide.

Ví dụ:

```text
A -------- B -------- C -------- D

Hà Nội                         Hải Phòng
<------------- 120 km ------------>
```

Tài xế:

```text
A -> D = 120 km
```

Các hành khách:

```text
Khách 1: A -> D = 120 km
Khách 2: B -> D = 70 km
Khách 3: B -> C = 40 km
```

CoRide không tính toàn bộ 120 km cho tất cả hành khách.

Khoảng cách thực tế của hành khách:

\[
d_i
=
DistanceAlongDriverRoute(Pickup_i, Dropoff_i)
\]

Với:

```text
R = 539 VNĐ/km
```

### Khách 1

\[
120 \times 539
=
64.680
\]

Giá:

```text
65.000 VNĐ
```

### Khách 2

\[
70 \times 539
=
37.730
\]

Giá:

```text
38.000 VNĐ
```

### Khách 3

\[
40 \times 539
=
21.560
\]

Giá:

```text
22.000 VNĐ
```

Bảng kết quả:

| Hành trình | Quãng đường dùng chung | Giá cơ bản |
|---|---:|---:|
| Hà Nội -> Hải Phòng | 120 km | 65.000 VNĐ |
| Điểm B -> Hải Phòng | 70 km | 38.000 VNĐ |
| Điểm B -> Điểm C | 40 km | 22.000 VNĐ |

---

# 8. Tính phí cao tốc và BOT

Phí cao tốc không nên cộng cố định vào giá/km.

Phí được tính riêng dựa trên đoạn đường mà hành khách thực tế sử dụng.

Giả sử một trạm hoặc đoạn cao tốc có chi phí:

\[
T_j
\]

Mức đóng góp của một hành khách:

\[
C_{toll,j}
=
\frac{T_j}{S+1}
\]

Tổng phí cao tốc của hành khách:

\[
C_{toll,i}
=
\sum_{j \in Toll_i}
\frac{T_j}{S+1}
\]

Ví dụ:

```text
Phí cao tốc = 120.000 VNĐ
Số ghế đăng = 3
```

Ta có:

\[
120.000 / 4
=
30.000 VNĐ
\]

Mỗi hành khách đi qua toàn bộ đoạn cao tốc đóng:

```text
30.000 VNĐ
```

Tài xế cũng chịu:

```text
30.000 VNĐ
```

Nếu hành khách lên xe sau đoạn thu phí thì:

\[
C_{toll}=0
\]

cho phần phí mà hành khách không sử dụng.

---

# 9. Tính chi phí lệch tuyến để đón khách

Một hành khách có thể không nằm chính xác trên route tài xế.

Ví dụ:

```text
Route tài xế
--------------------------------

                  Passenger
                      |
                      | 1.2 km
                      |
----------------------+
```

CoRide cần tạo route mới:

```text
DriverStart
    ->
PassengerPickup
    ->
PassengerDropoff
    ->
DriverDestination
```

Sau đó tính:

\[
\Delta d
=
D_{newRoute}
-
D_{originalRoute}
\]

Nếu độ lệch tuyến quá lớn, hệ thống loại chuyến khỏi kết quả matching.

Đề xuất:

```text
MAX_DETOUR_KM = 5 km
MAX_DETOUR_RATIO = 10%
```

Điều kiện:

```text
Nếu detour > 5 km
HOẶC
detour / originalDistance > 10%

=> Không matching chuyến.
```

Chi phí phát sinh:

\[
C_{detour}
=
\Delta d
\times
C_{vehicle/km}
\times
(1-DriverShare)
\]

Đề xuất:

```text
DriverShare = 20%
```

Do đó:

\[
C_{detour}
=
\Delta d
\times
C_{vehicle/km}
\times
0.8
\]

Ví dụ:

```text
detour = 1.2 km
C_vehicle/km = 2.157 VNĐ/km
```

\[
1.2 \times 2.157 \times 0.8
\approx 2.071 VNĐ
\]

Làm tròn:

```text
2.000 VNĐ
```

---

# 10. Giá đề xuất cuối cùng

Giá cơ bản của hành khách:

\[
P_i
=
C_{distance,i}
+
C_{toll,i}
+
C_{detour,i}
\]

Sau đó làm tròn:

\[
P_i
=
Round_{1000}(P_i)
\]

Ví dụ:

```text
Distance contribution = 64.680
Toll contribution     = 30.000
Detour contribution   = 2.000
```

Tổng:

```text
96.680 VNĐ
```

Làm tròn:

```text
97.000 VNĐ
```

---

# 11. Khoảng giá tài xế được phép điều chỉnh

CoRide tự động tạo:

```text
RecommendedPrice
```

Tài xế không được nhập giá hoàn toàn tự do.

Đề xuất:

```text
Minimum = 85%
Recommended = 100%
Maximum = 115%
```

Công thức:

\[
P_{min}
=
P_{recommended}
\times 0.85
\]

\[
P_{max}
=
P_{recommended}
\times 1.15
\]

Ví dụ:

```text
RecommendedPrice = 90.000 VNĐ
```

Ta có:

```text
Minimum ≈ 77.000 VNĐ
Recommended = 90.000 VNĐ
Maximum ≈ 103.000 VNĐ
```

Tỷ lệ ±15% là quy tắc đề xuất riêng của CoRide.

---

# 12. Giới hạn chống tạo lợi nhuận

CoRide cần đảm bảo tổng mức đóng góp của hành khách không vượt quá một tỷ lệ nhất định so với chi phí chuyến đi.

Tổng chi phí chuyến:

\[
C_{trip}
=
D
\times
C_{vehicle/km}
+
Toll
\]

CoRide đặt:

```text
DRIVER_MIN_SHARE = 20%
```

Khi đó:

\[
PassengerContribution
\leq
C_{trip}
\times
0.8
\]

Ví dụ:

```text
Tổng chi phí chuyến = 300.000 VNĐ
```

Hành khách được đóng tối đa:

\[
300.000
\times
0.8
=
240.000 VNĐ
\]

Tài xế phải chịu ít nhất:

```text
60.000 VNĐ
```

---

# 13. Cấu hình đề xuất cho CoRide

```ts
const CORIDE_PRICING_CONFIG = {
  // Mức tiêu hao mặc định của ô tô
  defaultFuelConsumption: 6.5, // L/100km

  // Giá nhiên liệu lấy từ cấu hình hệ thống
  fuelPrice: 22119, // VNĐ/L

  // Bảo dưỡng + hao mòn
  vehicleOverheadRatio: 0.50,

  // Tài xế chịu tối thiểu 20% chi phí
  minimumDriverShare: 0.20,

  // Biên độ tài xế được chỉnh giá
  driverPriceAdjustment: 0.15,

  // Đơn vị làm tròn
  roundingUnit: 1000,

  // Matching dọc đường
  maxDetourRatio: 0.10,
  maxDetourKm: 5,
};
```

Các giá trị trên phải được cấu hình từ backend để Admin có thể thay đổi khi cần thiết.

---

# 14. Pseudocode thuật toán

```text
FUNCTION calculateCarpoolPrice(driverRide, passengerRequest):

    # 1. Lấy route chính của tài xế
    driverRoute =
        GoongDirections(
            driverRide.start,
            driverRide.destination
        )

    originalDistance =
        driverRoute.distanceKm


    # 2. Chiếu điểm đón và điểm trả khách lên route
    pickup =
        projectPickupToDriverRoute(
            passengerRequest.pickup
        )

    dropoff =
        projectDropoffToDriverRoute(
            passengerRequest.dropoff
        )


    # 3. Kiểm tra đúng chiều di chuyển
    IF routePosition(pickup)
       >= routePosition(dropoff):

        REJECT


    # 4. Tính đoạn đường hành khách thực sự đi chung
    sharedDistance =
        routeDistance(
            pickup,
            dropoff
        )


    # 5. Tính route mới nếu đón khách
    newRoute =
        GoongDirections(
            driverRide.start,
            passengerRequest.pickup,
            passengerRequest.dropoff,
            driverRide.destination
        )

    detour =
        newRoute.distanceKm
        - originalDistance


    # 6. Kiểm tra độ lệch tuyến
    IF detour > MAX_DETOUR_KM:
        REJECT

    IF detour / originalDistance
       > MAX_DETOUR_RATIO:

        REJECT


    # 7. Tính chi phí nhiên liệu/km
    fuelCostPerKm =
        fuelPrice
        * fuelConsumption
        / 100


    # 8. Chi phí vận hành xe/km
    vehicleCostPerKm =
        fuelCostPerKm
        * (1 + vehicleOverheadRatio)


    # 9. Giá theo đoạn đường dùng chung
    distanceContribution =
        sharedDistance
        * vehicleCostPerKm
        / (offeredSeats + 1)


    # 10. Tính phí cao tốc/BOT
    tollContribution = 0

    FOR each tollSegment
        usedByPassenger:

        tollContribution +=
            tollSegment.price
            / (offeredSeats + 1)


    # 11. Chi phí lệch tuyến
    detourContribution =
        detour
        * vehicleCostPerKm
        * (1 - minimumDriverShare)


    # 12. Giá hệ thống đề xuất
    recommendedPrice =
        distanceContribution
        + tollContribution
        + detourContribution


    # 13. Làm tròn
    recommendedPrice =
        roundToNearest(
            recommendedPrice,
            1000
        )


    # 14. Khoảng điều chỉnh của tài xế
    minimumPrice =
        recommendedPrice
        * 0.85

    maximumPrice =
        recommendedPrice
        * 1.15


    # 15. Giới hạn chống lợi nhuận
    tripCost =
        originalDistance
        * vehicleCostPerKm
        + totalTollCost

    maximumPassengerContribution =
        tripCost
        * (1 - minimumDriverShare)


    maximumPrice =
        MIN(
            maximumPrice,
            remainingAllowedContribution
        )


    RETURN {
        sharedDistance,
        detour,
        distanceContribution,
        tollContribution,
        detourContribution,
        recommendedPrice,
        minimumPrice,
        maximumPrice
    }
```

---

# 15. Luồng xử lý

```text
Passenger
Pickup + Dropoff
       |
       v
Matching Engine
       |
       v
Driver Route
       |
       +------------------+
       |                  |
       v                  v
Shared Distance        Detour
       |                  |
       +--------+---------+
                |
                v
          Goong Directions
                |
                v
          Pricing Engine
                |
       +--------+---------+---------+
       |                  |         |
       v                  v         v
 Fuel Cost        Vehicle Cost    Toll
       |                  |         |
       +------------------+---------+
                          |
                          v
                 Cost Contribution
                          |
                          v
                  Recommended Price
                          |
                  +-------+-------+
                  |               |
                  v               v
                -15%            +15%
                  |               |
                  +-------+-------+
                          |
                          v
                   Anti-profit Cap
                          |
                          v
                      Final Price
```

---

# 16. Tên thuật toán đề xuất trong báo cáo

Có thể sử dụng tên:

> **Thuật toán đề xuất mức đóng góp chi phí dựa trên quãng đường dùng chung**

Tên tiếng Anh:

> **Route-based Cost Contribution Algorithm**

Thuật toán này dành riêng cho **Carpooling**.

Đối với chức năng **Ride-Hailing**, CoRide nên sử dụng một mô hình tính giá riêng, chẳng hạn:

```text
Base Fare
+ Distance Fare
+ Time Fare
+ Additional Fee
```

Không nên sử dụng chung một thuật toán tính giá cho Carpooling và Ride-Hailing.

---

# 17. Tóm tắt công thức

### Chi phí nhiên liệu

\[
C_{fuel/km}
=
\frac{FuelPrice \times FuelConsumption}{100}
\]

### Chi phí phương tiện

\[
C_{vehicle/km}
=
C_{fuel/km}
\times
(1 + MaintenanceRatio)
\]

### Giá theo quãng đường dùng chung

\[
C_{distance,i}
=
d_i
\times
\frac{C_{vehicle/km}}{S+1}
\]

### Phí cao tốc

\[
C_{toll,i}
=
\sum_{j \in Toll_i}
\frac{T_j}{S+1}
\]

### Chi phí lệch tuyến

\[
C_{detour,i}
=
\Delta d
\times
C_{vehicle/km}
\times
(1-DriverShare)
\]

### Giá đề xuất

\[
P_i
=
Round_{1000}
(
C_{distance,i}
+
C_{toll,i}
+
C_{detour,i}
)
\]

### Khoảng giá

\[
P_{min}
=
0.85P_i
\]

\[
P_{max}
=
1.15P_i
\]

### Điều kiện chống lợi nhuận

\[
\sum PassengerContribution
\leq
C_{trip}
\times
(1-DriverMinimumShare)
\]

Với đề xuất:

```text
DriverMinimumShare = 20%
```
