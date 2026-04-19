# CONVENTIONS.md

## Code Style

### TypeScript
- Strict mode enabled (inferred from tsconfig.json presence)
- Explicit type annotations for function parameters and return types
- Use `unknown` for catch clause errors: `err: unknown`

### ESLint & Prettier
- **ESLint** ^8.50.0 configured at root and per-project
- **Prettier** ^3.0.3 for code formatting
- Format command: `prettier --write "**/*.{ts,tsx,js,jsx,json,md}"`

---

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `user.routes.ts` |
| Functions | camelCase | `getUsers()` |
| Classes | PascalCase | `UserController` |
| Constants | UPPER_SNAKE | `PORT` |
| Interfaces | PascalCase | `UserResponse` |

---

## Patterns

### Error Handling (Frontend)
```typescript
try {
  const res = await fetch('...');
  if (!res.ok) throw new Error('Network response non-ok');
  backendHealth = await res.json();
} catch (err: unknown) {
  backendError = err instanceof Error ? err.message : 'Lỗi kết nối';
}
```

### Express Middleware Chain
```typescript
app.use(cors());
app.use(express.json());
```

### Next.js Server Component
```typescript
export default async function Home() {
  // Async server component
}
```

---

## Import Style

### Backend
```typescript
import express, { Express, Request, Response } from 'express';
import userRoutes from './routes/user.routes';
```

### Frontend
```typescript
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
```

---

## Vietnamese Text in Code

The codebase uses Vietnamese for user-facing strings:
- `'Lỗi kết nối'` - Connection error
- `'Thành công!'` - Success
- `'Thất bại'` - Failed
- Frontend/backend labels in Vietnamese

---

## Missing Conventions

- No consistent error response format
- No logging middleware
- No request validation patterns
- No consistent API response wrapper