# Security

Quy chuẩn bảo mật cho module Tasks Manager. Đây là những nguyên tắc không thể thương lượng.

## Nguyên tắc bất biến

1. **Không hardcode secret** — API key, password, JWT secret → biến môi trường
2. **Validate input mọi nơi** — Không tin tưởng dữ liệu từ client
3. **Least privilege** — Chỉ cấp quyền tối thiểu cần thiết
4. **Defense in depth** — Nhiều lớp bảo vệ thay vì một lớp duy nhất

## Authentication

### JWT Config
```typescript
// Access token: ngắn hạn, dùng cho request thông thường
const ACCESS_TOKEN_EXPIRY = '15m';

// Refresh token: dài hơn, dùng để lấy access token mới
const REFRESH_TOKEN_EXPIRY = '7d';

// Luôn verify signature và exp claim
jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
```

### Không lưu sensitive data trong JWT payload
```typescript
// Sai — Payload có thể decode mà không cần secret
const payload = { userId, email, password, creditCard };

// Đúng — Chỉ lưu thông tin cần thiết để identify user
const payload = { sub: userId, role: user.role };
```

### Rate Limiting cho auth endpoints
```typescript
// Tránh brute force
@RateLimit({ windowMs: 15 * 60 * 1000, max: 5 }) // 5 lần / 15 phút
@Post('auth/login')
async login() {}
```

## Authorization — QUAN TRỌNG

### Kiểm tra quyền sở hữu (Ownership Check)

**Mọi resource action đều phải kiểm tra user có quyền trên resource đó không**, không chỉ kiểm tra đã đăng nhập.

```typescript
// Sai — Chỉ kiểm tra đăng nhập, không kiểm tra quyền sở hữu
@UseGuards(AuthGuard)
async deleteTask(@Param('id') id: string) {
  await this.taskService.delete(id); // Bất kỳ user nào cũng xóa được!
}

// Đúng — Kiểm tra ownership trong service
async deleteTask(taskId: string, requesterId: string): Promise<void> {
  const task = await this.getTask(taskId, requesterId); // Throw nếu không có quyền

  if (task.createdBy !== requesterId) {
    throw new ForbiddenError('xóa task này');
  }

  await this.taskRepo.softDelete(taskId);
}
```

### RBAC (Role-Based Access Control)
```typescript
// Định nghĩa roles rõ ràng
enum UserRole {
  USER = 'user',       // Tạo và quản lý task của mình
  MANAGER = 'manager', // Xem và quản lý task của team
  ADMIN = 'admin',     // Toàn quyền
}

// Apply role guard đúng chỗ
@Roles(UserRole.MANAGER, UserRole.ADMIN)
@Get('all')
async getAllTasks() {}
```

## Input Validation & Sanitization

```typescript
// Luôn dùng DTO với class-validator
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => value.trim()) // Xóa whitespace thừa
  title: string;

  @IsUUID('4')
  assigneeId: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

// Kích hoạt global validation pipe
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,      // Loại bỏ field không khai báo trong DTO
  forbidNonWhitelisted: true, // Throw lỗi nếu có field lạ
  transform: true,      // Tự động transform type
}));
```

## SQL Injection Prevention

```typescript
// Luôn dùng parameterized query hoặc ORM — KHÔNG nối string
// Sai
db.query(`SELECT * FROM tasks WHERE title = '${userInput}'`);

// Đúng (raw query)
db.query('SELECT * FROM tasks WHERE title = $1', [userInput]);

// Tốt nhất (ORM)
taskRepo.findOne({ where: { title: userInput } });
```

## Sensitive Data

### Không log thông tin nhạy cảm
```typescript
// Sai
logger.info(`User ${user.email} logged in with password ${password}`);

// Đúng
logger.info(`User ${user.id} logged in successfully`);
```

### Masking trong response
```typescript
// Không trả password hash về client dù đã được hash
const user = await userRepo.findOne(id);
const { password, ...safeUser } = user; // Loại bỏ trước khi return
return safeUser;
```

## CORS & Headers

```typescript
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

// Security headers (dùng Helmet)
app.use(helmet());
```

## Dependency Security

```bash
# Chạy định kỳ để phát hiện vulnerability
npm audit

# Fix tự động (chỉ patch/minor)
npm audit fix
```
