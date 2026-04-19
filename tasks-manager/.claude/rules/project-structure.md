# Project Structure

Cấu trúc thư mục chuẩn cho module Tasks Manager.

## Tổng quan

```
tasks-manager/
├── .claude/              # Cấu hình AI assistant (không ảnh hưởng runtime)
├── src/
│   ├── config/           # Cấu hình ứng dụng (env, database, redis...)
│   ├── common/           # Shared code dùng chung toàn module
│   │   ├── decorators/   # Custom decorators (@CurrentUser, @Roles...)
│   │   ├── filters/      # Exception filters
│   │   ├── guards/       # Auth guards
│   │   ├── interceptors/ # Logging, transform response...
│   │   ├── pipes/        # Validation pipes
│   │   └── types/        # Shared TypeScript types
│   ├── database/
│   │   ├── migrations/   # TypeORM/Prisma migrations
│   │   └── seeds/        # Seed data cho development
│   └── modules/          # Feature modules (xem bên dưới)
│       ├── tasks/
│       ├── comments/
│       └── notifications/
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example          # Template biến môi trường (commit lên git)
├── .env                  # Biến môi trường thực tế (KHÔNG commit)
├── docker-compose.yml    # Services cho local development
├── Dockerfile
└── package.json
```

## Feature Module Structure

Mỗi module theo **Vertical Slice Architecture**:

```
src/modules/tasks/
├── dto/                        # Data Transfer Objects
│   ├── create-task.dto.ts
│   ├── update-task.dto.ts
│   └── task-query.dto.ts
├── entities/                   # Database entities
│   └── task.entity.ts
├── task.controller.ts          # HTTP layer — chỉ nhận request, trả response
├── task.service.ts             # Business logic
├── task.repository.ts          # Database access (optional, nếu logic query phức tạp)
├── task.module.ts              # Module definition
└── task.spec.ts                # Unit tests cùng chỗ với module
```

## Phân chia trách nhiệm (Layer Responsibilities)

### Controller
- Nhận HTTP request, parse params/body/query
- Gọi service và trả response
- Xử lý HTTP-specific concerns (status code, headers)
- **Không có** business logic
- **Không có** database query

```typescript
// Đúng — Controller mỏng
@Get(':id')
async getTask(@Param('id') id: string, @CurrentUser() user: User) {
  const task = await this.taskService.getTask(id, user.id);
  return { success: true, data: task };
}
```

### Service
- Chứa business logic
- Gọi repository/entity để truy cập data
- Gọi các service khác khi cần
- Throw domain errors có nghĩa (`NotFoundError`, `ForbiddenError`...)
- **Không có** kiến thức về HTTP (status code, request object)

### Repository (tuỳ chọn)
- Dùng khi query phức tạp cần tách khỏi service
- Wrap ORM operations thành các method có tên rõ ràng
- **Không có** business logic

### DTO (Data Transfer Object)
- Định nghĩa shape của input/output
- Dùng class-validator decorators để validate
- Tách riêng Create / Update / Query DTOs

```typescript
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsUUID()
  @IsNotEmpty()
  assigneeId: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
```

## Quy tắc Import

- **Không import** từ layer cao hơn (service không import controller)
- **Không circular import** — nếu cần, dùng event emitter hoặc tách shared module
- Dùng path alias `@/` thay vì relative path `../../`

```typescript
// Sai
import { TaskService } from '../../../modules/tasks/task.service';

// Đúng
import { TaskService } from '@/modules/tasks/task.service';
```

## Môi trường & Config

```
.env.example    ← Commit lên Git (template, không có giá trị thực)
.env            ← KHÔNG commit (gitignore)
.env.test       ← Cho môi trường test (có thể commit nếu không có secret)
```

Config được load qua `ConfigService`, **không đọc `process.env` trực tiếp** trong business code:

```typescript
// Sai
const jwtSecret = process.env.JWT_SECRET;

// Đúng
const jwtSecret = this.configService.get<string>('JWT_SECRET');
```
