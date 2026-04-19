# Testing

Quy chuẩn viết test cho module Tasks Manager.

## Triết lý Testing

- **Test behavior, not implementation** — Test kết quả đầu ra, không test cách code hoạt động bên trong
- **Confidence over coverage** — 80% coverage có nghĩa > 100% coverage không có giá trị
- **Fast feedback** — Unit test phải chạy nhanh (< 5 giây cho toàn bộ suite)
- **Readable tests** — Test là tài liệu sống (living documentation)

## Testing Pyramid

```
        [  E2E Tests  ]       ← Ít nhất, chạy chậm nhất, test user flow
       [Integration Tests]    ← Vừa phải, test tương tác giữa modules
      [   Unit Tests    ]     ← Nhiều nhất, nhanh nhất, test logic đơn lẻ
```

## Unit Tests

### Cấu trúc test — AAA Pattern (Arrange, Act, Assert)

```typescript
describe('TaskService', () => {
  describe('createTask', () => {
    it('nên tạo task thành công khi dữ liệu hợp lệ', async () => {
      // Arrange — Chuẩn bị dữ liệu và mock
      const createDto: CreateTaskDto = {
        title: 'Hoàn thành báo cáo tuần',
        assigneeId: 'user-123',
      };
      const mockUser = buildUser({ id: 'creator-456' });
      mockTaskRepo.save.mockResolvedValue(buildTask({ ...createDto }));

      // Act — Thực hiện action cần test
      const result = await taskService.createTask(createDto, mockUser.id);

      // Assert — Kiểm tra kết quả
      expect(result.title).toBe(createDto.title);
      expect(result.assigneeId).toBe(createDto.assigneeId);
      expect(result.createdBy).toBe(mockUser.id);
      expect(mockTaskRepo.save).toHaveBeenCalledTimes(1);
    });

    it('nên throw NotFoundError khi assignee không tồn tại', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        taskService.createTask(createDto, 'creator-id'),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
```

### Naming Convention cho test
```typescript
// Pattern: "nên [kết quả mong đợi] khi [điều kiện]"
it('nên trả về danh sách task khi user có quyền xem')
it('nên throw ForbiddenError khi user không phải owner')
it('nên trả về mảng rỗng khi không có task nào')
it('nên cập nhật updatedAt khi task được sửa')
```

### Test Factory (Builder Pattern)
```typescript
// Dùng factory function thay vì hard-code data trong test
function buildTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-default-id',
    title: 'Default Task Title',
    status: TaskStatus.PENDING,
    assigneeId: 'user-default-id',
    createdBy: 'creator-default-id',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    ...overrides,
  };
}
```

## Integration Tests

Test sự phối hợp giữa controller, service, và database (dùng test database thực):

```typescript
describe('TaskController (integration)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule], // Module thực, kết nối test DB
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // Login để lấy token
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    authToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/tasks — nên tạo task thành công', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Test task', assigneeId: 'user-123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Test task');
  });
});
```

## Quy tắc viết test

### Không test implementation, test behavior
```typescript
// Sai — Test implementation (brittle, dễ vỡ khi refactor)
it('nên gọi taskRepo.save() một lần', async () => {
  await taskService.createTask(dto);
  expect(taskRepo.save).toHaveBeenCalledTimes(1); // Quan tâm đến HOW
});

// Đúng — Test behavior
it('nên lưu task với đúng thông tin', async () => {
  const task = await taskService.createTask(dto);
  expect(task.title).toBe(dto.title);       // Quan tâm đến WHAT
  expect(task.assigneeId).toBe(dto.assigneeId);
});
```

### Mỗi test độc lập
- Không phụ thuộc vào thứ tự chạy test
- Mỗi test tự setup và cleanup dữ liệu của mình
- Dùng `beforeEach` để reset state

## Chạy Tests

```bash
# Unit tests
npm test

# Watch mode (dev)
npm test -- --watch

# Coverage report
npm test -- --coverage

# Chỉ test file cụ thể
npm test -- --testPathPattern=task.service

# Integration tests
npm run test:e2e
```

## Coverage Targets

| Layer       | Target  |
|-------------|---------|
| Service     | > 85%   |
| Controller  | > 70%   |
| Repository  | > 60%   |
| Utils       | > 90%   |
