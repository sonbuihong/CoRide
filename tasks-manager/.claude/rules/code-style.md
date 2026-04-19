# Code Style

Quy chuẩn viết code cho toàn bộ module Tasks Manager.

## Nguyên tắc nền tảng

1. **Readability first** — Code được đọc nhiều hơn viết. Ưu tiên rõ ràng hơn ngắn gọn.
2. **Self-documenting** — Tên biến/hàm tốt hơn comment giải thích "what".
3. **Comment "why"** — Chỉ comment khi cần giải thích lý do (business logic phức tạp, workaround).
4. **DRY** — Logic lặp > 2 lần thì tách thành hàm/module riêng.

## Naming Convention

### Variables & Functions (camelCase)
```typescript
// Sai
const d = new Date();
const usr = await getUsr();
function proc(t: Task) {}

// Đúng
const currentDate = new Date();
const currentUser = await getCurrentUser();
function processOverdueTask(task: Task) {}
```

### Constants (SCREAMING_SNAKE_CASE)
```typescript
const MAX_TASKS_PER_USER = 100;
const DEFAULT_PAGE_SIZE = 20;
const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
} as const;
```

### Classes & Types & Interfaces (PascalCase)
```typescript
class TaskService {}
type TaskStatus = 'pending' | 'in_progress' | 'done';
interface CreateTaskDto {
  title: string;
  description?: string;
  assigneeId: string;
}
```

### Files (kebab-case)
```
task.service.ts
create-task.dto.ts
task.controller.ts
task.repository.ts
```

## Functions

### Một hàm — một việc (Single Responsibility)
```typescript
// Sai: hàm làm quá nhiều thứ
async function createTaskAndNotify(dto: CreateTaskDto) {
  const task = await db.task.create(dto);
  await sendEmail(task.assignee.email, `Task mới: ${task.title}`);
  await updateUserStats(task.assigneeId);
  return task;
}

// Đúng: tách logic, compose ở nơi gọi
async function createTask(dto: CreateTaskDto): Promise<Task> { ... }
async function notifyTaskAssignee(task: Task): Promise<void> { ... }
async function updateAssigneeStats(userId: string): Promise<void> { ... }
```

### Giới hạn độ dài hàm
- **Lý tưởng:** dưới 20 dòng
- **Chấp nhận được:** đến 40 dòng
- **Cần refactor:** trên 40 dòng

### Early return thay vì nested if
```typescript
// Sai
function getTaskPriority(task: Task): string {
  if (task.dueDate) {
    if (task.dueDate < new Date()) {
      return 'urgent';
    } else {
      return 'normal';
    }
  } else {
    return 'low';
  }
}

// Đúng
function getTaskPriority(task: Task): string {
  if (!task.dueDate) return 'low';
  if (task.dueDate < new Date()) return 'urgent';
  return 'normal';
}
```

## Import Order

```typescript
// 1. Node built-ins
import path from 'path';

// 2. External packages
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// 3. Internal aliases
import { DatabaseModule } from '@/database';
import { AuthGuard } from '@/auth';

// 4. Relative imports
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
```

## TypeScript

- **Không dùng `any`** — Dùng `unknown` nếu không biết type, rồi narrow xuống
- **Dùng strict mode** — `tsconfig.json` phải có `"strict": true`
- **Prefer interface over type** cho object shapes; dùng type cho union/intersection

## Giới hạn dòng

- Tối đa **100 ký tự** mỗi dòng
- Nếu dài hơn, xuống dòng với indent hợp lý
