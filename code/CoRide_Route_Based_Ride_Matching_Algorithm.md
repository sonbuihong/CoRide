# THUẬT TOÁN GHÉP CHUYẾN DỰA TRÊN ĐỘ TƯƠNG ĐỒNG TUYẾN ĐƯỜNG CHO HỆ THỐNG CORIDE

## 1. Mục tiêu

Thuật toán tìm kiếm và ghép chuyến của CoRide được xây dựng nhằm hỗ trợ hành khách tìm các chuyến đi Carpooling phù hợp từ danh sách chuyến mà tài xế đã đăng trước đó.

Hệ thống không chỉ tìm các chuyến có điểm đi và điểm đến giống nhau, mà còn hỗ trợ:

- Ghép chuyến khi điểm đi của hành khách gần điểm đi của tài xế.
- Ghép chuyến khi điểm đến của hành khách gần điểm đến của tài xế.
- Ghép hành khách nằm trên lộ trình di chuyển của tài xế.
- Hỗ trợ tài xế đón và trả khách dọc đường.
- Kiểm tra chiều di chuyển để tránh ghép các hành trình ngược hướng.
- Hạn chế các chuyến khiến tài xế phải đi vòng quá xa.
- Xếp hạng kết quả theo mức độ phù hợp thay vì chỉ trả về kết quả đúng/sai.

Tên đề xuất:

**Route-Based Ride Matching Algorithm**  
**Thuật toán ghép chuyến dựa trên độ tương đồng tuyến đường**

---

## 2. Dữ liệu đầu vào

### 2.1. Dữ liệu hành khách

Khi hành khách tìm chuyến, hệ thống nhận các thông tin:

- Điểm đi.
- Điểm đến.
- Thời gian mong muốn khởi hành.
- Số ghế cần đặt.

Sau khi Geocoding, hai địa điểm được chuyển thành tọa độ:

```text
PO = Passenger Origin
PD = Passenger Destination
```

Trong đó:

```text
PO = (latitude, longitude)
PD = (latitude, longitude)
```

### 2.2. Dữ liệu chuyến của tài xế

Mỗi chuyến Carpooling do tài xế đăng nên lưu:

```text
Ride
- originLat
- originLng
- destinationLat
- destinationLng
- departureTime
- availableSeats
- price
- routePolyline
- distance
- duration
- status
```

Trong đó `routePolyline` là dữ liệu quan trọng nhất để xác định toàn bộ tuyến đường tài xế sẽ đi qua.

Ví dụ:

```text
[
  [20.9801, 105.7901],
  [20.9813, 105.7932],
  [20.9845, 105.7982],
  ...
]
```

Ký hiệu:

```text
DO = Driver Origin
DD = Driver Destination
R  = Driver Route
```

---

## 3. Các loại ghép chuyến

Thuật toán chia kết quả thành ba loại chính.

### 3.1. DIRECT MATCH

Điểm đi và điểm đến của hành khách gần như trùng với tài xế.

```text
Tài xế:
A ------------------------------ B

Hành khách:
A ------------------------------ B
```

Điều kiện:

```text
distance(PO, DO) <= DIRECT_RADIUS

AND

distance(PD, DD) <= DIRECT_RADIUS
```

Đây là loại kết quả có mức ưu tiên cao nhất.

---

### 3.2. NEARBY MATCH

Điểm đi và điểm đến không hoàn toàn giống nhau nhưng nằm gần nhau.

```text
Tài xế:
A ------------------------------ B
 \                                  A' ----------------------------- B'
          Hành khách
```

Ví dụ:

- Điểm đi hành khách cách điểm đi tài xế 500 m.
- Điểm đến hành khách cách điểm đến tài xế 700 m.

Nếu các khoảng cách nhỏ hơn ngưỡng cấu hình thì chuyến vẫn được coi là phù hợp.

---

### 3.3. ON-ROUTE MATCH

Hành khách không xuất phát tại điểm đầu của tài xế nhưng điểm đón và điểm trả nằm trên hoặc gần tuyến đường của tài xế.

```text
Tài xế:

A ----------- P ----------- Q ----------- B
              ↑             ↑
           khách lên     khách xuống

Hành khách:

              P ----------- Q
```

Đây là cơ chế hỗ trợ **đón khách dọc đường**.

Hành khách không nhất thiết phải có cùng điểm đến cuối cùng với tài xế.

Ví dụ:

```text
Tài xế:
Hà Đông ----------------------------- Nội Bài
             ↑              ↑
          Cầu Giấy       Nhật Tân

Hành khách:
          Cầu Giấy ------ Nhật Tân
```

Trường hợp này vẫn có thể ghép chuyến nếu hành khách đi cùng chiều và không làm tài xế phải vòng đường quá lớn.

---

## 4. Quy trình xử lý

Thuật toán gồm các bước:

```text
Candidate Filtering
        ↓
Direct/Nearby Matching
        ↓
Route Projection
        ↓
Direction Validation
        ↓
Route Overlap
        ↓
Detour Validation
        ↓
Time Compatibility
        ↓
Matching Score
        ↓
Ranking
```

---

## 5. Bước 1 - Lọc các chuyến hợp lệ

Trước khi thực hiện tính toán tuyến đường, hệ thống loại các chuyến không đủ điều kiện.

Điều kiện cơ bản:

```text
ride.status == OPEN

ride.departureTime > currentTime

ride.availableSeats >= passenger.requiredSeats
```

Ví dụ hành khách cần hai ghế:

```text
ride.availableSeats >= 2
```

Nếu không thỏa mãn thì chuyến không được xét tiếp.

---

## 6. Bước 2 - Kiểm tra Direct Match

Hệ thống tính khoảng cách:

```text
originDistance = distance(PO, DO)

destinationDistance = distance(PD, DD)
```

Khoảng cách địa lý ban đầu có thể tính bằng công thức Haversine.

Nếu:

```text
originDistance <= DIRECT_RADIUS

AND

destinationDistance <= DIRECT_RADIUS
```

thì chuyến được đánh dấu:

```text
matchType = DIRECT
```

Ví dụ:

```text
DIRECT_RADIUS = 1000 m
```

---

## 7. Bước 3 - Kiểm tra khoảng cách từ hành khách tới tuyến tài xế

Nếu chuyến không phải Direct Match, hệ thống kiểm tra điểm đi và điểm đến của hành khách có gần tuyến đường của tài xế hay không.

Tính:

```text
pickupProjection =
    projectPointToRoute(PO, R)

dropoffProjection =
    projectPointToRoute(PD, R)
```

Mỗi phép chiếu trả về:

```text
distanceToRoute
routePosition
nearestPoint
```

Trong đó:

- `distanceToRoute`: khoảng cách từ điểm hành khách đến tuyến tài xế.
- `routePosition`: vị trí tương đối của điểm trên tuyến tài xế.
- `nearestPoint`: điểm gần nhất trên tuyến tài xế.

Điều kiện:

```text
pickupProjection.distance <= PICKUP_RADIUS

AND

dropoffProjection.distance <= DROPOFF_RADIUS
```

Ví dụ:

```text
PICKUP_RADIUS  = 1500 m
DROPOFF_RADIUS = 1500 m
```

---

## 8. Bước 4 - Kiểm tra chiều di chuyển

Hai điểm của hành khách có thể cùng nằm trên tuyến tài xế nhưng hành khách lại muốn đi ngược hướng.

Ví dụ:

```text
Tài xế:

A ---- P ---- Q ---- B
```

Hành khách:

```text
P → Q
```

là hợp lệ.

Trong khi:

```text
Q → P
```

không hợp lệ.

Do đó cần so sánh vị trí của hai điểm trên tuyến:

```text
pickupPosition < dropoffPosition
```

Ví dụ:

```text
pickupPosition  = 0.25
dropoffPosition = 0.75
```

thì:

```text
0.25 < 0.75
```

=> hành khách đi cùng chiều tài xế.

Nếu:

```text
pickupPosition >= dropoffPosition
```

thì loại chuyến.

---

## 9. Bước 5 - Kiểm tra mức độ vòng đường

Một điểm có thể gần tuyến theo đường thẳng nhưng tài xế thực tế phải vòng rất xa do:

- Đường một chiều.
- Cầu.
- Đường cấm.
- Ngõ cụt.
- Mạng lưới giao thông thực tế.

Vì vậy đối với các candidate phù hợp, nên tính tuyến mới.

### Tuyến gốc

```text
DO → DD
```

Khoảng cách:

```text
originalDistance
```

### Tuyến sau khi nhận khách

```text
DO → PO → PD → DD
```

Khoảng cách:

```text
newDistance
```

Độ vòng:

```text
detourDistance =
    newDistance - originalDistance
```

Tỷ lệ vòng:

```text
detourRatio =
    (newDistance - originalDistance)
    / originalDistance
```

Ví dụ:

```text
originalDistance = 20 km
newDistance      = 22 km

detourDistance   = 2 km
detourRatio      = 10%
```

Điều kiện đề xuất:

```text
detourDistance <= MAX_DETOUR_DISTANCE

AND/OR

detourRatio <= MAX_DETOUR_RATIO
```

Ví dụ:

```text
MAX_DETOUR_DISTANCE = 3000 m
MAX_DETOUR_RATIO    = 0.15
```

---

## 10. Bước 6 - Kiểm tra thời gian

Đối với hành khách được đón dọc tuyến, thời gian phù hợp phải được tính tại vị trí dự kiến tài xế đi qua điểm đón.

Ví dụ:

```text
Tài xế xuất phát:      08:00
Đến khu vực đón khách: 08:25
Hành khách mong muốn:  08:20
```

Chênh lệch:

```text
5 phút
```

=> phù hợp.

Tính:

```text
timeDifference =
    abs(
        passengerDesiredTime
        -
        driverExpectedPickupTime
    )
```

Điều kiện:

```text
timeDifference <= TIME_TOLERANCE
```

Ví dụ:

```text
TIME_TOLERANCE = 30 phút
```

---

## 11. Bước 7 - Tính độ trùng tuyến

Ngoài việc kiểm tra hai điểm đầu cuối, CoRide có thể tính tuyến đường của hành khách:

```text
PassengerRoute = route(PO, PD)
```

Sau đó so sánh với tuyến tài xế:

```text
DriverRoute = R
```

Mục tiêu là tính tỷ lệ tuyến hành khách nằm trong hành lang tuyến của tài xế.

Ví dụ:

```text
Độ dài tuyến hành khách: 12 km
Đoạn trùng tuyến tài xế: 10 km
```

Khi đó:

```text
RouteOverlap =
    10 / 12
    = 0.833
```

Hay:

```text
RouteSimilarity = 83.3%
```

Giá trị càng cao thì hai hành trình càng phù hợp.

---

## 12. Bước 8 - Tính Matching Score

Thay vì chỉ trả về đúng hoặc sai, mỗi chuyến được chấm điểm từ 0 đến 100.

Công thức đề xuất:

```text
Score =
    0.25 * OriginScore
  + 0.25 * DestinationScore
  + 0.20 * RouteScore
  + 0.15 * DetourScore
  + 0.15 * TimeScore
```

Trong đó mỗi thành phần được chuẩn hóa về:

```text
0 → 1
```

Sau cùng:

```text
MatchScore = Score * 100
```

---

## 13. Origin Score

Đặt:

```text
d = khoảng cách từ điểm đón hành khách
    đến điểm/tuyến đón phù hợp của tài xế
```

Công thức:

```text
OriginScore =
    max(
        0,
        1 - d / MAX_PICKUP_DISTANCE
    )
```

Ví dụ:

```text
MAX_PICKUP_DISTANCE = 2 km
```

| Khoảng cách | OriginScore |
|---|---:|
| 0 km | 1.00 |
| 0.5 km | 0.75 |
| 1 km | 0.50 |
| 2 km | 0.00 |

---

## 14. Destination Score

Tương tự OriginScore:

```text
DestinationScore =
    max(
        0,
        1 - destinationDistance / MAX_DROPOFF_DISTANCE
    )
```

Điểm trả càng gần tuyến tài xế thì điểm số càng cao.

---

## 15. Route Score

RouteScore phản ánh mức độ trùng tuyến giữa hành trình hành khách và tài xế.

Có thể định nghĩa:

```text
RouteScore =
    overlapDistance
    /
    passengerRouteDistance
```

Ví dụ:

```text
Passenger Route = 12 km
Overlap         = 10 km
```

thì:

```text
RouteScore = 10 / 12 = 0.833
```

---

## 16. Detour Score

Độ vòng càng thấp thì điểm càng cao.

Ví dụ:

```text
DetourScore =
    max(
        0,
        1 - detourRatio / MAX_DETOUR_RATIO
    )
```

Nếu:

```text
MAX_DETOUR_RATIO = 15%
```

và:

```text
detourRatio = 5%
```

thì DetourScore sẽ cao hơn một chuyến có độ vòng 12%.

---

## 17. Time Score

Có thể sử dụng:

```text
TimeScore =
    max(
        0,
        1 - timeDifference / TIME_TOLERANCE
    )
```

Ví dụ:

```text
TIME_TOLERANCE = 30 phút
```

Nếu chênh lệch:

```text
0 phút  → 1.00
15 phút → 0.50
30 phút → 0.00
```

---

## 18. Xếp hạng kết quả

Sau khi tính MatchScore:

```text
Ride A = 96
Ride B = 88
Ride C = 75
Ride D = 61
```

Hệ thống sắp xếp:

```text
ORDER BY MatchScore DESC
```

Kết quả:

```text
1. Ride A - 96%
2. Ride B - 88%
3. Ride C - 75%
4. Ride D - 61%
```

Có thể loại những chuyến có điểm dưới ngưỡng:

```text
MIN_MATCH_SCORE = 60
```

---

## 19. Cấu hình đề xuất ban đầu

```javascript
const MATCH_CONFIG = {
    DIRECT_RADIUS: 1000,

    PICKUP_RADIUS: 1500,

    DROPOFF_RADIUS: 1500,

    MAX_DETOUR_METERS: 3000,

    MAX_DETOUR_RATIO: 0.15,

    TIME_TOLERANCE_MINUTES: 30,

    MIN_MATCH_SCORE: 60
};
```

Các giá trị này nên được lưu dưới dạng cấu hình để dễ điều chỉnh và thử nghiệm.

---

## 20. Pseudocode

```javascript
function findMatchingRides(passenger, rides) {
    const results = [];

    for (const ride of rides) {

        // 1. Lọc điều kiện cơ bản
        if (ride.status !== "OPEN") {
            continue;
        }

        if (ride.availableSeats < passenger.seats) {
            continue;
        }

        if (ride.departureTime < currentTime()) {
            continue;
        }

        // 2. Kiểm tra Direct Match
        const originDistance =
            distance(
                passenger.origin,
                ride.origin
            );

        const destinationDistance =
            distance(
                passenger.destination,
                ride.destination
            );

        let matchType = null;

        if (
            originDistance <= DIRECT_RADIUS &&
            destinationDistance <= DIRECT_RADIUS
        ) {
            matchType = "DIRECT";
        }

        // 3. Project điểm hành khách lên route tài xế
        const pickupProjection =
            projectPointToRoute(
                passenger.origin,
                ride.routePolyline
            );

        const dropoffProjection =
            projectPointToRoute(
                passenger.destination,
                ride.routePolyline
            );

        // 4. Kiểm tra khoảng cách tới route
        if (
            pickupProjection.distance > PICKUP_RADIUS ||
            dropoffProjection.distance > DROPOFF_RADIUS
        ) {
            continue;
        }

        // 5. Kiểm tra hướng di chuyển
        if (
            pickupProjection.routePosition >=
            dropoffProjection.routePosition
        ) {
            continue;
        }

        if (matchType === null) {
            matchType = "ON_ROUTE";
        }

        // 6. Tính độ vòng
        const detour =
            calculateDetour(
                ride,
                passenger.origin,
                passenger.destination
            );

        if (
            detour.distance > MAX_DETOUR_METERS &&
            detour.ratio > MAX_DETOUR_RATIO
        ) {
            continue;
        }

        // 7. Tính thời gian dự kiến tới điểm đón
        const expectedPickupTime =
            calculatePickupETA(
                ride,
                pickupProjection
            );

        const timeDiff =
            differenceInMinutes(
                passenger.desiredTime,
                expectedPickupTime
            );

        if (
            Math.abs(timeDiff) >
            TIME_TOLERANCE_MINUTES
        ) {
            continue;
        }

        // 8. Tính độ trùng tuyến
        const routeOverlap =
            calculateRouteOverlap(
                passenger,
                ride
            );

        // 9. Tính Matching Score
        const score =
            calculateMatchScore({
                pickupDistance:
                    pickupProjection.distance,

                dropoffDistance:
                    dropoffProjection.distance,

                detourRatio:
                    detour.ratio,

                timeDifference:
                    Math.abs(timeDiff),

                routeOverlap
            });

        // 10. Chỉ giữ kết quả đủ điểm
        if (score < MIN_MATCH_SCORE) {
            continue;
        }

        results.push({
            ride,
            matchType,
            score,
            pickupProjection,
            dropoffProjection,
            detour,
            expectedPickupTime
        });
    }

    // 11. Sắp xếp theo độ phù hợp
    return results.sort(
        (a, b) => b.score - a.score
    );
}
```

---

## 21. Flow thuật toán tổng thể

```text
Hành khách nhập
Điểm đi + Điểm đến + Thời gian + Số ghế
                    ↓
             Geocoding tọa độ
                    ↓
         Lấy các Ride đang OPEN
                    ↓
        Lọc theo thời gian và số ghế
                    ↓
           Kiểm tra Direct Match
                    ↓
      Project Origin lên Driver Route
                    ↓
   Project Destination lên Driver Route
                    ↓
      Khoảng cách tới Route hợp lệ?
              ↓              ↓
             Không           Có
              ↓              ↓
             Loại       Kiểm tra chiều
                              ↓
                  PickupPosition
                         <
                  DropoffPosition?
                    ↓           ↓
                  Không         Có
                    ↓           ↓
                   Loại     Tính Detour
                                  ↓
                         Detour hợp lệ?
                           ↓          ↓
                         Không        Có
                           ↓          ↓
                          Loại    Kiểm tra
                                  thời gian
                                      ↓
                              Tính RouteOverlap
                                      ↓
                              Tính MatchScore
                                      ↓
                           Score >= ngưỡng?
                              ↓          ↓
                            Không        Có
                              ↓          ↓
                             Loại     Giữ kết quả
                                          ↓
                                   Sort giảm dần
                                          ↓
                              Trả danh sách chuyến
```

---

## 22. Cách hiển thị trên giao diện

Hệ thống có thể cho hành khách biết lý do chuyến được đề xuất.

### Ví dụ 1 - Trùng tuyến

```text
96% phù hợp
Loại: Trùng điểm đi và điểm đến

Điểm đón cách bạn: 200 m
Điểm trả cách điểm đến: 350 m
```

### Ví dụ 2 - Đón dọc đường

```text
89% phù hợp
Loại: Đón dọc đường

Tài xế đi qua khu vực điểm đón và điểm đến của bạn.
Độ lệch tuyến dự kiến: 0.8 km
```

### Ví dụ 3 - Gần tuyến

```text
78% phù hợp
Loại: Gần tuyến

Điểm đón cách tuyến: 700 m
Điểm trả cách tuyến: 900 m
Độ vòng dự kiến: 1.4 km
```

---

## 23. Các trường hợp cần loại

Một chuyến không được hiển thị nếu xảy ra một trong các trường hợp:

- Chuyến đã đóng hoặc hủy.
- Chuyến đã qua thời gian khởi hành.
- Không đủ số ghế.
- Điểm đón quá xa tuyến.
- Điểm trả quá xa tuyến.
- Hành khách muốn đi ngược chiều tài xế.
- Tài xế phải vòng quá xa.
- Thời gian không phù hợp.
- MatchScore thấp hơn ngưỡng tối thiểu.

---

## 24. Ưu điểm của thuật toán

Thuật toán này có các ưu điểm:

1. Không phụ thuộc tuyệt đối vào việc điểm đi và điểm đến phải giống nhau.
2. Hỗ trợ đúng bản chất của mô hình Carpooling.
3. Hỗ trợ đón khách dọc đường.
4. Kiểm tra được chiều di chuyển.
5. Hạn chế việc tài xế phải đi vòng quá xa.
6. Có thể tích hợp dữ liệu tuyến đường từ Goong Maps.
7. Có Matching Score để xếp hạng kết quả.
8. Dễ mở rộng thêm các tiêu chí khác trong tương lai.
9. Phù hợp để trình bày như một thuật toán nghiệp vụ riêng của hệ thống CoRide.

---

## 25. Hướng mở rộng

Trong các phiên bản sau, Matching Score có thể bổ sung:

- Đánh giá trung bình của tài xế.
- Số chuyến đã hoàn thành.
- Mức độ đúng giờ.
- Giá chuyến đi.
- Loại phương tiện.
- Sở thích ghép chuyến.
- Tỷ lệ hủy chuyến của tài xế.
- Lịch sử lựa chọn của hành khách.

Ví dụ:

```text
FinalScore =
    RouteMatchingScore * 0.80
    +
    DriverQualityScore * 0.10
    +
    PriceScore * 0.10
```

Tuy nhiên, đối với phiên bản đồ án tốt nghiệp, nên ưu tiên các tiêu chí liên quan trực tiếp đến tuyến đường để giữ thuật toán rõ ràng và dễ kiểm thử.

---

## 26. Kết luận

Thuật toán ghép chuyến của CoRide không chỉ thực hiện tìm kiếm theo điểm đi và điểm đến mà còn phân tích toàn bộ tuyến đường của tài xế. Hệ thống lần lượt kiểm tra khoảng cách địa lý, vị trí của hành khách trên tuyến, chiều di chuyển, độ vòng đường, thời gian và mức độ trùng tuyến. Các chuyến hợp lệ sau đó được chấm Matching Score và sắp xếp theo độ phù hợp giảm dần.

Cách tiếp cận này giúp CoRide giải quyết đồng thời ba trường hợp chính:

```text
1. Cùng điểm đi và điểm đến
2. Điểm đi và điểm đến gần nhau
3. Hành khách nằm trên tuyến đường của tài xế
```

Nhờ đó hệ thống có thể hỗ trợ cơ chế **đón khách dọc đường** và khai thác tốt hơn các ghế trống trên những chuyến Carpooling đã được tài xế đăng trước đó.
