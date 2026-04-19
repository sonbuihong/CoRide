# Error Handling

Quy chuẩn xử lý lỗi nhất quán trong toàn bộ module Tasks Manager.

## Nguyên tắc cốt lõi

1. **Không nuốt lỗi (No silent failures)** — Mọi lỗi phải được log hoặc re-throw
2. **Fail fast** — Phát hiện và báo lỗi sớm nhất có thể
3. **User-friendly messages** — Message cho user phải rõ ràng, không expose stack trace
4. **Structured logging** — Log phải có đủ context để debug

## Error Class Hierarchy

```typescript
// Base error
class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Domain errors
class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} với id "${id}" không tồn tại`, 404);
  }
}

class ValidationError extends AppError {
  constructor(details: ValidationDetail[]) {
    super('VALIDATION_ERROR', 'Dữ liệu đầu vào không hợp lệ', 400, details);
  }
}

class ForbiddenError extends AppError {
  constructor(action: string) {
    super('FORBIDDEN', `Bạn không có quyền ${action}`, 403);
  }
}

class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
  }
}
```

## Service Layer

```typescript
// Sai — Không xử lý lỗi cụ thể
async function getTask(id: string): Promise<Task> {
  return await taskRepo.findOne(id); // Trả về null nếu không tìm thấy
}

// Đúng — Throw error có ý nghĩa
async function getTask(id: string, requesterId: string): Promise<Task> {
  const task = await taskRepo.findOne({ where: { id, deletedAt: null } });

  if (!task) {
    throw new NotFoundError('Task', id);
  }

  // Kiểm tra quyền truy cập (không chỉ tồn tại, mà còn phải có quyền)
  if (task.assigneeId !== requesterId && task.createdBy !== requesterId) {
    throw new ForbiddenError('xem task này');
  }

  return task;
}
```

## Controller Layer

```typescript
// Global exception filter xử lý tất cả — controller chỉ throw, không catch
@Get(':id')
async getTask(@Param('id') id: string, @CurrentUser() user: User) {
  return this.taskService.getTask(id, user.id);
  // Không try/catch ở đây — để global filter xử lý
}
```

## Global Exception Filter

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof AppError) {
      // Lỗi nghiệp vụ đã biết trước — log ở level WARN
      logger.warn({
        code: exception.code,
        message: exception.message,
        path: request.url,
      });

      return response.status(exception.statusCode).json({
        success: false,
        error: {
          code: exception.code,
          message: exception.message,
          details: exception.details,
        },
      });
    }

    // Lỗi không mong đợi — log ở level ERROR với full stack
    logger.error({
      message: 'Unhandled exception',
      error: exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? exception.stack : undefined,
      path: request.url,
    });

    return response.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        // Không expose chi tiết lỗi ra ngoài production
        message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
      },
    });
  }
}
```

## Async Error — Không quên await

```typescript
// Sai — Unhandled promise rejection
router.get('/tasks', (req, res) => {
  taskService.getTasks().then(tasks => res.json(tasks));
  // Nếu getTasks() reject, lỗi không được xử lý!
});

// Đúng
router.get('/tasks', async (req, res, next) => {
  try {
    const tasks = await taskService.getTasks();
    res.json(tasks);
  } catch (error) {
    next(error); // Chuyển cho error middleware
  }
});

// Hoặc dùng wrapper
const asyncHandler = (fn: AsyncHandler) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

## Logging Standards

```typescript
// Log phải có đủ context để reproduce lỗi
logger.error({
  message: 'Failed to send task notification',
  taskId: task.id,
  assigneeId: task.assigneeId,
  error: error.message,
  // KHÔNG log: password, token, PII (email, phone)
});
```
