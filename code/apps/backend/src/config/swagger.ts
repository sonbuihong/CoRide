import { SwaggerUiOptions } from 'swagger-ui-express';

/**
 * OpenAPI 3.0 Specification cho CoRide Backend API.
 * Truy cập tại: http://localhost:5001/api/docs
 */
export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'CoRide API',
    version: '1.0.0',
    description:
      'API documentation cho nền tảng đi chung xe CoRide. ' +
      'Đăng nhập để lấy **accessToken**, sau đó click **Authorize** và nhập **Bearer <token>** để test các endpoint cần xác thực.',
    contact: { name: 'CoRide Team' },
  },
  servers: [
    {
      url: 'http://localhost:5001/api',
      description: 'Local Development Server',
    },
  ],

  // ─── Security Scheme ────────────────────────────────────────────────────────
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Nhập accessToken nhận được từ POST /auth/login. Format: **Bearer eyJ...**',
      },
    },

    schemas: {
      // ── Auth ──────────────────────────────────────────────────────────────
      RegisterInput: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', minLength: 6, example: '123456' },
          firstName: { type: 'string', example: 'Nguyen' },
          lastName: { type: 'string', example: 'Van A' },
          phone: { type: 'string', example: '0901234567' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', example: '123456' },
        },
      },

      // ── User ──────────────────────────────────────────────────────────────
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string', nullable: true },
          lastName: { type: 'string', nullable: true },
          phone: { type: 'string', nullable: true },
          avatarUrl: { type: 'string', nullable: true },
          bio: { type: 'string', nullable: true },
          rating: { type: 'number' },
          ratingCount: { type: 'integer' },
          role: { type: 'string', enum: ['USER', 'ADMIN'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      UpdateProfileInput: {
        type: 'object',
        required: ['firstName', 'lastName'],
        properties: {
          firstName: { type: 'string', example: 'Nguyen' },
          lastName: { type: 'string', example: 'Van A' },
          phone: { type: 'string', example: '0901234567' },
          bio: { type: 'string', example: 'Tôi là tài xế thân thiện' },
        },
      },

      // ── Ride ──────────────────────────────────────────────────────────────
      CreateRideInput: {
        type: 'object',
        required: ['origin', 'destination', 'departureTime', 'availableSeats', 'pricePerSeat'],
        properties: {
          origin: { type: 'string', example: 'Hà Nội' },
          originLat: { type: 'number', example: 21.0285 },
          originLng: { type: 'number', example: 105.8542 },
          destination: { type: 'string', example: 'Hải Phòng' },
          destinationLat: { type: 'number', example: 20.8449 },
          destinationLng: { type: 'number', example: 106.6881 },
          departureTime: {
            type: 'string',
            format: 'date-time',
            example: '2026-12-01T08:00:00.000Z',
          },
          availableSeats: { type: 'integer', minimum: 1, example: 3 },
          pricePerSeat: { type: 'number', minimum: 0, example: 150000 },
          description: { type: 'string', example: 'Đi qua QL5, khởi hành đúng giờ' },
        },
      },
      Ride: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          driverId: { type: 'string', format: 'uuid' },
          driver: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              firstName: { type: 'string', nullable: true },
              lastName: { type: 'string', nullable: true },
              avatarUrl: { type: 'string', nullable: true },
              rating: { type: 'number' },
              ratingCount: { type: 'integer' },
            },
          },
          origin: { type: 'string' },
          destination: { type: 'string' },
          departureTime: { type: 'string', format: 'date-time' },
          availableSeats: { type: 'integer' },
          pricePerSeat: { type: 'number' },
          status: { type: 'string', enum: ['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'] },
          description: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // ── Booking ───────────────────────────────────────────────────────────
      CreateBookingInput: {
        type: 'object',
        required: ['rideId', 'seats'],
        properties: {
          rideId: { type: 'string', format: 'uuid', example: 'a1b2c3d4-...' },
          seats: { type: 'integer', minimum: 1, example: 2 },
        },
      },
      UpdateBookingStatusInput: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['CONFIRMED', 'REJECTED'],
            description: 'Hành động của tài xế: xác nhận hoặc từ chối',
          },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          rideId: { type: 'string', format: 'uuid' },
          passengerId: { type: 'string', format: 'uuid' },
          seats: { type: 'integer' },
          totalPrice: { type: 'number' },
          status: {
            type: 'string',
            enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED'],
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // ── Review ────────────────────────────────────────────────────────────
      CreateReviewInput: {
        type: 'object',
        required: ['rideId', 'revieweeId', 'rating'],
        properties: {
          rideId: { type: 'string', format: 'uuid' },
          revieweeId: { type: 'string', format: 'uuid' },
          rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
          comment: { type: 'string', example: 'Tài xế rất thân thiện!' },
        },
      },

      // ── Error ─────────────────────────────────────────────────────────────
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Lỗi mô tả cụ thể' },
        },
      },
    },
  },

  // ─── Tags (nhóm endpoints theo module) ─────────────────────────────────────
  tags: [
    { name: 'Health', description: 'Kiểm tra trạng thái server' },
    { name: 'Auth', description: 'Đăng ký, đăng nhập, refresh token, đăng xuất' },
    { name: 'Users', description: 'Quản lý hồ sơ người dùng' },
    { name: 'Rides', description: 'Đăng và tìm kiếm chuyến đi' },
    { name: 'Bookings', description: 'Đặt chỗ và quản lý booking' },
    { name: 'Notifications', description: 'Thông báo real-time (SSE)' },
    { name: 'Reviews', description: 'Đánh giá sau chuyến đi' },
  ],

  // ─── Paths ──────────────────────────────────────────────────────────────────
  paths: {
    // ── Health ────────────────────────────────────────────────────────────────
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Kiểm tra trạng thái server',
        responses: {
          200: {
            description: 'Server đang hoạt động bình thường',
            content: {
              'application/json': {
                example: { status: 'ok', timestamp: '2026-04-16T00:00:00Z', environment: 'development' },
              },
            },
          },
        },
      },
    },

    // ── Auth ──────────────────────────────────────────────────────────────────
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Đăng ký tài khoản mới',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RegisterInput' } },
          },
        },
        responses: {
          201: { description: 'Đăng ký thành công' },
          400: { description: 'Dữ liệu không hợp lệ', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          409: { description: 'Email đã tồn tại' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Đăng nhập',
        description: 'Trả về **accessToken** trong body và **refreshToken** trong HttpOnly Cookie.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } },
          },
        },
        responses: {
          200: {
            description: 'Đăng nhập thành công',
            content: {
              'application/json': {
                example: {
                  message: 'Đăng nhập thành công',
                  user: { id: 'uuid', email: 'user@example.com' },
                  accessToken: 'eyJhbGciOiJIUzI1NiJ9...',
                },
              },
            },
          },
          401: { description: 'Sai email hoặc mật khẩu' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Làm mới accessToken',
        description: 'Dùng refreshToken trong Cookie để lấy accessToken mới (token rotation).',
        responses: {
          200: { description: 'Trả về accessToken mới' },
          401: { description: 'Refresh token không hợp lệ hoặc hết hạn' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Đăng xuất',
        description: 'Thu hồi refresh token và xóa cookie.',
        responses: { 200: { description: 'Đăng xuất thành công' } },
      },
    },

    // ── Users ─────────────────────────────────────────────────────────────────
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Lấy thông tin bản thân',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Thông tin user hiện tại', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: { description: 'Chưa đăng nhập' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Cập nhật hồ sơ cá nhân',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateProfileInput' } } },
        },
        responses: {
          200: { description: 'Cập nhật thành công' },
          401: { description: 'Chưa đăng nhập' },
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Xem profile người dùng khác (public)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Thông tin user', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          404: { description: 'Không tìm thấy user' },
        },
      },
    },

    // ── Rides ─────────────────────────────────────────────────────────────────
    '/rides': {
      get: {
        tags: ['Rides'],
        summary: 'Tìm kiếm chuyến đi (public)',
        parameters: [
          { name: 'origin', in: 'query', schema: { type: 'string' }, description: 'Điểm đi (tìm kiếm gần đúng)', example: 'Hà Nội' },
          { name: 'destination', in: 'query', schema: { type: 'string' }, description: 'Điểm đến', example: 'Hải Phòng' },
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Ngày khởi hành (YYYY-MM-DD)', example: '2026-12-01' },
          { name: 'driverId', in: 'query', schema: { type: 'string', format: 'uuid' }, description: 'Lọc chuyến đi của 1 tài xế cụ thể' },
        ],
        responses: {
          200: {
            description: 'Danh sách chuyến đi',
            content: {
              'application/json': {
                example: { rides: [], total: 0 },
              },
            },
          },
        },
      },
      post: {
        tags: ['Rides'],
        summary: 'Tạo chuyến đi mới (chỉ tài xế)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateRideInput' } } },
        },
        responses: {
          201: { description: 'Tạo chuyến đi thành công', content: { 'application/json': { schema: { $ref: '#/components/schemas/Ride' } } } },
          400: { description: 'Dữ liệu không hợp lệ' },
          401: { description: 'Chưa đăng nhập' },
        },
      },
    },
    '/rides/{id}': {
      get: {
        tags: ['Rides'],
        summary: 'Xem chi tiết chuyến đi',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Chi tiết chuyến đi', content: { 'application/json': { schema: { $ref: '#/components/schemas/Ride' } } } },
          404: { description: 'Không tìm thấy chuyến đi' },
        },
      },
      patch: {
        tags: ['Rides'],
        summary: 'Cập nhật chuyến đi (chỉ tài xế sở hữu)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateRideInput' } } },
        },
        responses: {
          200: { description: 'Cập nhật thành công' },
          403: { description: 'Không có quyền chỉnh sửa' },
          404: { description: 'Không tìm thấy chuyến đi' },
        },
      },
      delete: {
        tags: ['Rides'],
        summary: 'Xóa chuyến đi (chỉ tài xế sở hữu)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Xóa thành công' },
          403: { description: 'Không có quyền xóa' },
          404: { description: 'Không tìm thấy chuyến đi' },
        },
      },
    },

    // ── Bookings ──────────────────────────────────────────────────────────────
    '/bookings': {
      post: {
        tags: ['Bookings'],
        summary: 'Gửi yêu cầu đặt chỗ',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateBookingInput' } } },
        },
        responses: {
          201: { description: 'Gửi yêu cầu thành công (trạng thái PENDING)' },
          400: { description: 'Không đủ ghế / chuyến đã đầy / đã đặt trước đó' },
          404: { description: 'Không tìm thấy chuyến đi' },
        },
      },
    },
    '/bookings/my': {
      get: {
        tags: ['Bookings'],
        summary: 'Xem danh sách booking của tôi (hành khách)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Danh sách booking' } },
      },
    },
    '/bookings/driver': {
      get: {
        tags: ['Bookings'],
        summary: 'Xem danh sách booking trên chuyến đi của tôi (tài xế)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Danh sách booking theo tài xế' } },
      },
    },
    '/bookings/ride/{rideId}': {
      get: {
        tags: ['Bookings'],
        summary: 'Xem tất cả booking của một chuyến đi',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'rideId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Danh sách booking theo chuyến đi' } },
      },
    },
    '/bookings/{id}/status': {
      patch: {
        tags: ['Bookings'],
        summary: 'Tài xế xác nhận / từ chối đặt chỗ',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateBookingStatusInput' } } },
        },
        responses: {
          200: { description: 'Cập nhật thành công' },
          400: { description: 'Trạng thái không hợp lệ' },
          403: { description: 'Không phải tài xế của chuyến đi này' },
        },
      },
    },
    '/bookings/{id}/cancel': {
      patch: {
        tags: ['Bookings'],
        summary: 'Hành khách hủy đặt chỗ',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Hủy thành công' },
          400: { description: 'Không thể hủy booking ở trạng thái này' },
          403: { description: 'Không phải hành khách của booking này' },
        },
      },
    },

    // ── Notifications ─────────────────────────────────────────────────────────
    '/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Lấy danh sách thông báo (50 gần nhất)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Danh sách thông báo' } },
      },
    },
    '/notifications/subscribe': {
      get: {
        tags: ['Notifications'],
        summary: 'Kết nối SSE nhận thông báo real-time',
        description:
          'Server-Sent Events endpoint. Giữ kết nối HTTP mở và push notification về client ngay khi có. ' +
          'Không thể test trực tiếp qua Swagger — dùng `EventSource` từ trình duyệt.',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Kết nối SSE thành công (stream)' } },
      },
    },
    '/notifications/read-all': {
      patch: {
        tags: ['Notifications'],
        summary: 'Đánh dấu tất cả thông báo đã đọc',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Cập nhật thành công' } },
      },
    },
    '/notifications/{id}/read': {
      patch: {
        tags: ['Notifications'],
        summary: 'Đánh dấu 1 thông báo đã đọc',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Đã đánh dấu đọc' },
          404: { description: 'Không tìm thấy thông báo' },
        },
      },
    },

    // ── Reviews ────────────────────────────────────────────────────────────────
    '/reviews/user/{userId}': {
      get: {
        tags: ['Reviews'],
        summary: 'Xem đánh giá của một người dùng (public)',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Danh sách đánh giá nhận được' } },
      },
    },
    '/reviews': {
      post: {
        tags: ['Reviews'],
        summary: 'Gửi đánh giá sau chuyến đi',
        description: 'Chỉ dùng được sau khi chuyến đi kết thúc (status = COMPLETED). Mỗi cặp reviewer-reviewee chỉ được đánh giá 1 lần / chuyến.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateReviewInput' } } },
        },
        responses: {
          201: { description: 'Gửi đánh giá thành công' },
          400: { description: 'Chuyến đi chưa kết thúc / đã đánh giá rồi' },
          403: { description: 'Không tham gia chuyến đi này' },
        },
      },
    },
  },
};

/** Cấu hình hiển thị cho Swagger UI */
export const swaggerUiOptions: SwaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { background-color: #1e293b; }
    .swagger-ui .topbar-wrapper img { content: url(''); }
    .swagger-ui .topbar-wrapper::after { content: 'CoRide API'; color: white; font-size: 1.2rem; font-weight: bold; }
  `,
  customSiteTitle: 'CoRide API Docs',
  swaggerOptions: {
    persistAuthorization: true, // Giữ token sau khi refresh trang
    displayRequestDuration: true,
    filter: true,
  },
};

