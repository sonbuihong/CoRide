# API Conventions

Quy chuẩn thiết kế và tài liệu hóa API cho module Tasks Manager.

## Base URL

```
/api/v1/tasks-manager
```

Tất cả endpoint đều có prefix versioning. Khi có breaking change, tăng version (v2, v3...).

## Naming Convention

### Resource naming (danh từ số nhiều, kebab-case)
```
GET    /api/v1/tasks               # Lấy danh sách task
POST   /api/v1/tasks               # Tạo task mới
GET    /api/v1/tasks/:id           # Lấy chi tiết task
PUT    /api/v1/tasks/:id           # Cập nhật toàn bộ task
PATCH  /api/v1/tasks/:id          # Cập nhật một phần
DELETE /api/v1/tasks/:id           # Xóa task

GET    /api/v1/tasks/:id/comments  # Sub-resource
```

### Không dùng động từ trong URL
```
# Sai
POST /api/v1/createTask
GET  /api/v1/getTaskById/:id

# Đúng
POST /api/v1/tasks
GET  /api/v1/tasks/:id
```

## Request

### Headers bắt buộc
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
Accept: application/json
```

### Query Parameters chuẩn
```
GET /api/v1/tasks?page=1&limit=20&sort=createdAt&order=desc&search=keyword
```

| Param    | Type    | Default | Mô tả                          |
|----------|---------|---------|-------------------------------|
| `page`   | integer | 1       | Số trang (bắt đầu từ 1)        |
| `limit`  | integer | 20      | Số item mỗi trang (max: 100)  |
| `sort`   | string  | createdAt | Field để sort                |
| `order`  | enum    | desc    | `asc` hoặc `desc`             |
| `search` | string  | -       | Tìm kiếm full-text            |

## Response

### Success Response
```json
{
  "success": true,
  "data": { ... },          // Object hoặc Array
  "meta": {                 // Chỉ có khi là danh sách
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "TASK_NOT_FOUND",   // Machine-readable error code
    "message": "Task không tồn tại hoặc bạn không có quyền truy cập",
    "details": []               // Mảng lỗi validation (nếu có)
  }
}
```

### Error Codes chuẩn
| HTTP Status | Error Code              | Ý nghĩa                        |
|-------------|-------------------------|-------------------------------|
| 400         | `VALIDATION_ERROR`      | Dữ liệu đầu vào không hợp lệ  |
| 401         | `UNAUTHORIZED`          | Chưa đăng nhập                |
| 403         | `FORBIDDEN`             | Không có quyền                |
| 404         | `NOT_FOUND`             | Resource không tồn tại        |
| 409         | `CONFLICT`              | Conflict dữ liệu              |
| 422         | `UNPROCESSABLE_ENTITY`  | Logic validation thất bại     |
| 429         | `RATE_LIMIT_EXCEEDED`   | Quá nhiều request             |
| 500         | `INTERNAL_SERVER_ERROR` | Lỗi server                    |

## Idempotency

- `GET`, `PUT`, `DELETE` phải idempotent
- Dùng `Idempotency-Key` header cho POST quan trọng (tạo payment, gửi notification)
