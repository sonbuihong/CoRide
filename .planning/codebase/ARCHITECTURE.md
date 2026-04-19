# ARCHITECTURE.md

## Architecture Pattern

### Backend: MVC-like
- **Entry**: `src/server.ts` - Express app initialization
- **Routes**: `src/routes/*.routes.ts` - Route definitions
- **Controllers**: `src/controllers/*.controller.ts` - Business logic

### Web: Next.js App Router
- **Entry**: `src/app/page.tsx` - Homepage (server component)
- **Layout**: `src/app/layout.tsx` - Root layout
- **Utilities**: `src/lib/utils.ts` - Helper functions
- **Components**: `src/components/ui/` - Reusable UI components

---

## Data Flow

### Backend Flow
```
Request → Express Middleware → Route Handler → Controller → Response
```

1. Request enters via `server.ts`
2. CORS & JSON parsing middleware
3. Routes dispatch to controller
4. Controller processes business logic
5. Response sent to client

### Frontend Flow
```
User Action → Next.js Page → API Call → Backend → Response → UI Update
```

---

## Key Abstractions

### Backend
- **Routes**: Express Router-based route modules
- **Controllers**: Request handler functions

### Frontend
- **Utils**: Tailwind merge utility (`tailwind-merge`)
- **Components**: Shadcn UI components

---

## Entry Points

| App | Entry File | Port |
|-----|------------|------|
| Backend | `src/server.ts` | 3001 |
| Web | `src/app/page.tsx` | 3000 (Next.js default) |

---

## Configuration

- **Backend port**: `process.env.PORT || 3001`
- **Environment**: `dotenv.config()` loads `.env`
- **CORS**: Enabled for all origins

---

## Notable Patterns

- **Server Components**: Next.js page is async (`export default async function Home()`)
- **API Health Check**: Simple JSON response `{ status: 'ok', message: '...' }`
- **Monorepo**: Workspace structure with shared root config