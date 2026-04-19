# Database

Quy chuẩn thiết kế và làm việc với database trong hệ thống CoRide.

## Công nghệ

- **DBMS:** PostgreSQL 15 + extension **PostGIS** (bắt buộc)
- **ORM:** Prisma / TypeORM (chọn nhất quán trong project)
- **Cache / Session:** Redis 7
- **File Storage:** Cloudflare R2 (không lưu binary vào DB)
- **Naming:** snake_case cho tất cả (table, column, index)

> **PostGIS là cốt lõi** của thuật toán matching. Không được dùng `FLOAT lat, FLOAT lng` riêng lẻ cho dữ liệu địa lý.

---

## Schema Design

### Quy tắc đặt tên

```sql
-- Table: danh từ số nhiều, snake_case
users
trips
bookings
trip_waypoints
payment_transactions

-- Column: snake_case, mô tả rõ ràng
departure_time      -- Không dùng "time" hay "date" chung chung
pickup_point        -- GEOMETRY(POINT) — không phải pickup_lat + pickup_lng
available_seats     -- Không dùng "seats" (ambiguous)
is_verified         -- Boolean bắt đầu bằng is_/has_/can_

-- Primary Key: UUID v4
id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- Foreign Key: [referenced_table_singular]_id
driver_id, passenger_id, trip_id, booking_id
```

### Cột bắt buộc cho mọi table

```sql
id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
deleted_at  TIMESTAMPTZ  NULL  -- Soft delete, NULL = chưa xóa
```

### Soft Delete — BẮT BUỘC, không hard delete

```sql
-- Xóa
UPDATE trips SET deleted_at = NOW() WHERE id = $1;

-- Mọi query phải filter
WHERE deleted_at IS NULL

-- Prisma
findMany({ where: { deletedAt: null } })
```

---

## PostGIS — Dữ liệu địa lý

### Lưu tọa độ

```sql
-- BẮT BUỘC: dùng GEOMETRY(POINT, 4326) thay vì 2 cột FLOAT
-- SRID 4326 = WGS84 (chuẩn GPS toàn cầu)

ALTER TABLE trips
  ADD COLUMN pickup_point   GEOMETRY(POINT, 4326) NOT NULL,
  ADD COLUMN dropoff_point  GEOMETRY(POINT, 4326) NOT NULL;

-- Insert
INSERT INTO trips (pickup_point, dropoff_point, ...)
VALUES (
  ST_SetSRID(ST_MakePoint(106.6297, 10.8231), 4326),  -- (lng, lat) — THỨ TỰ NÀY!
  ST_SetSRID(ST_MakePoint(106.6952, 10.7769), 4326),
  ...
);
```

> **Lưu ý thứ tự:** PostGIS và GeoJSON dùng `(longitude, latitude)` — ngược với Google Maps `(lat, lng)`. Phải nhất quán trong toàn bộ codebase.

### Thuật toán matching lộ trình — Core Algorithm

```sql
-- Tìm chuyến phù hợp với yêu cầu hành khách
-- Điều kiện: điểm đón + điểm trả đều trong bán kính 2km
SELECT
  t.id,
  t.driver_id,
  t.departure_time,
  t.available_seats,
  t.price_per_seat,
  ST_Distance(
    t.pickup_point::geography,
    ST_MakePoint(:passenger_pickup_lng, :passenger_pickup_lat)::geography
  ) AS pickup_distance_meters,
  ST_Distance(
    t.dropoff_point::geography,
    ST_MakePoint(:passenger_dropoff_lng, :passenger_dropoff_lat)::geography
  ) AS dropoff_distance_meters
FROM trips t
WHERE
  -- Trong bán kính 2km từ điểm đón hành khách
  ST_DWithin(
    t.pickup_point::geography,
    ST_MakePoint(:passenger_pickup_lng, :passenger_pickup_lat)::geography,
    2000
  )
  -- Trong bán kính 2km từ điểm trả hành khách
  AND ST_DWithin(
    t.dropoff_point::geography,
    ST_MakePoint(:passenger_dropoff_lng, :passenger_dropoff_lat)::geography,
    2000
  )
  AND t.departure_time BETWEEN :search_from AND :search_to
  AND t.available_seats >= :requested_seats
  AND t.status = 'active'
  AND t.deleted_at IS NULL
ORDER BY
  t.departure_time ASC,
  pickup_distance_meters ASC
LIMIT :limit OFFSET :offset;
```

### Index cho PostGIS — BẮT BUỘC

```sql
-- GIST index cho spatial query — không có index này query sẽ rất chậm
CREATE INDEX idx_trips_pickup_point  ON trips USING GIST(pickup_point);
CREATE INDEX idx_trips_dropoff_point ON trips USING GIST(dropoff_point);

-- Composite GIST + B-tree cho query phổ biến (spatial + time filter)
CREATE INDEX idx_trips_pickup_point_departure
  ON trips USING GIST(pickup_point)
  WHERE status = 'active' AND deleted_at IS NULL;
```

### Chuyển đổi coordinate trong code

```typescript
// TypeScript helper — đảm bảo nhất quán thứ tự lng/lat
function toPostGISPoint(lat: number, lng: number): string {
  // PostGIS: ST_MakePoint(longitude, latitude)
  return `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
}

// Parse kết quả từ PostGIS về object JS
function parseGeoPoint(geoJson: string): { lat: number; lng: number } {
  const parsed = JSON.parse(geoJson); // GeoJSON format
  return {
    lng: parsed.coordinates[0], // Thứ tự GeoJSON: [lng, lat]
    lat: parsed.coordinates[1],
  };
}
```

---

## Schema tham khảo — Các bảng chính

```sql
-- Users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE,
  phone         VARCHAR(20) UNIQUE,
  display_name  VARCHAR(100) NOT NULL,
  avatar_url    TEXT,
  role          VARCHAR(20) NOT NULL DEFAULT 'passenger', -- driver | passenger | admin
  rating_avg    DECIMAL(3,2) DEFAULT 0,
  rating_count  INTEGER DEFAULT 0,
  is_verified   BOOLEAN DEFAULT FALSE,  -- Đã xác minh CCCD + bằng lái (tài xế)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

-- Trips
CREATE TABLE trips (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id       UUID NOT NULL REFERENCES users(id),
  pickup_point    GEOMETRY(POINT, 4326) NOT NULL,
  pickup_address  TEXT NOT NULL,           -- Địa chỉ văn bản để hiển thị
  dropoff_point   GEOMETRY(POINT, 4326) NOT NULL,
  dropoff_address TEXT NOT NULL,
  departure_time  TIMESTAMPTZ NOT NULL,
  total_seats     SMALLINT NOT NULL,
  available_seats SMALLINT NOT NULL,
  price_per_seat  INTEGER NOT NULL,        -- VND
  status          VARCHAR(20) NOT NULL DEFAULT 'active',
                  -- active | in_progress | completed | cancelled
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- Bookings
CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         UUID NOT NULL REFERENCES trips(id),
  passenger_id    UUID NOT NULL REFERENCES users(id),
  seats_booked    SMALLINT NOT NULL DEFAULT 1,
  total_price     INTEGER NOT NULL,        -- VND = seats_booked × price_per_seat
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
                  -- pending | confirmed | rejected | cancelled | completed
  payment_method  VARCHAR(20),             -- vnpay | momo | cash
  payment_status  VARCHAR(20) DEFAULT 'unpaid',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  UNIQUE(trip_id, passenger_id)            -- Một hành khách chỉ đặt 1 lần mỗi chuyến
);
```

---

## Indexing Strategy

```sql
-- Foreign keys
CREATE INDEX idx_trips_driver_id           ON trips(driver_id);
CREATE INDEX idx_bookings_trip_id          ON bookings(trip_id);
CREATE INDEX idx_bookings_passenger_id     ON bookings(passenger_id);

-- Spatial (GIST) — PostGIS
CREATE INDEX idx_trips_pickup_point        ON trips USING GIST(pickup_point);
CREATE INDEX idx_trips_dropoff_point       ON trips USING GIST(dropoff_point);

-- Filter thông dụng
CREATE INDEX idx_trips_departure_time      ON trips(departure_time);
CREATE INDEX idx_trips_status              ON trips(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_trips_active              ON trips(status, departure_time)
  WHERE status = 'active' AND deleted_at IS NULL;

-- Full-text search (nếu cần tìm theo địa chỉ văn bản)
CREATE INDEX idx_trips_pickup_address_fts
  ON trips USING GIN(to_tsvector('simple', pickup_address));
```

---

## Query Guidelines

### Luôn dùng parameterized query hoặc ORM

```typescript
// Sai — SQL Injection
db.query(`SELECT * FROM trips WHERE driver_id = '${driverId}'`);

// Đúng — Parameterized
db.query('SELECT * FROM trips WHERE driver_id = $1', [driverId]);

// Tốt nhất — ORM (Prisma)
prisma.trip.findMany({ where: { driverId } });
```

### Pagination bắt buộc

```typescript
const trips = await prisma.trip.findMany({
  where: { status: 'active', deletedAt: null },
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { departureTime: 'asc' },
});
```

### Tránh N+1 Query

```typescript
// Sai — N+1 queries
const bookings = await prisma.booking.findMany();
for (const booking of bookings) {
  booking.trip = await prisma.trip.findUnique({ where: { id: booking.tripId } });
}

// Đúng — Eager load
const bookings = await prisma.booking.findMany({
  include: { trip: { include: { driver: true } } },
});
```

---

## Migration Rules

- **Không sửa** migration đã commit — tạo migration mới để sửa
- Tên: `{timestamp}_{action}_{table}` — ví dụ: `20241201120000_add_pickup_point_to_trips`
- Mọi migration có cả `up` và `down`
- Test trên staging trước khi chạy production
- **Backup DB** trước khi chạy migration trên production
