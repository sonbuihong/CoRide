# STACK.md

## Overview

This is a TypeScript monorepo with 3 applications: backend (Express), web (Next.js), and mobile (Expo).

---

## Languages

| App | Language | Version |
|-----|----------|---------|
| Backend | TypeScript | ^5.9.3 |
| Web | TypeScript | ^5 |
| Mobile | JavaScript/TypeScript | - |

---

## Runtimes & Frameworks

### Backend (`apps/backend/`)
- **Runtime**: Node.js
- **Framework**: Express ^5.2.1
- **Type System**: TypeScript ^5.9.3
- **Development**: nodemon ^3.1.14, ts-node ^10.9.2

### Web (`apps/web/`)
- **Framework**: Next.js 14.2.35 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS ^3.4.1
- **Components**: Shadcn ^4.2.0

### Mobile (`apps/mobile/`)
- **Framework**: Expo (inferred from `npm run start` script)
- **Runtime**: React Native

---

## Dependencies

### Backend Core
- `express` ^5.2.1 - Web framework
- `@prisma/client` ^5.22.0 - Database ORM
- `cors` ^2.8.6 - CORS middleware
- `dotenv` ^17.4.1 - Environment variables

### Backend Dev
- `prisma` ^5.22.0 - Database schema tool
- `typescript` ^5.9.3
- `nodemon` ^3.1.14
- `ts-node` ^10.9.2

### Web Core
- `next` 14.2.35
- `react` ^18
- `react-dom` ^18
- `lucide-react` ^1.7.0 - Icons
- `@base-ui/react` ^1.3.0 - UI components
- `class-variance-authority` ^0.7.1 - Class variance utility
- `clsx` ^2.1.1 - ClassName utility
- `tailwind-merge` ^3.5.0 - Tailwind utility merger

### Web Dev
- `typescript` ^5
- `eslint` ^8
- `eslint-config-next` 14.2.35
- `postcss` ^8
- `tailwindcss` ^3.4.1

---

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Root monorepo config, workspaces |
| `apps/backend/package.json` | Backend dependencies |
| `apps/backend/tsconfig.json` | Backend TypeScript config |
| `apps/web/package.json` | Web dependencies |
| `apps/web/tsconfig.json` | Web TypeScript config |
| `apps/web/.eslintrc.json` | Web ESLint config |
| `apps/web/tailwind.config.ts` | Tailwind CSS config |
| `apps/web/components.json` | Shadcn components config |

---

## Scripts

### Root
```json
{
  "dev:web": "npm run dev --workspace=apps/web",
  "dev:mobile": "npm run start --workspace=apps/mobile",
  "dev:backend": "npm run dev --workspace=apps/backend",
  "lint": "npm run lint --workspaces",
  "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\""
}
```

### Backend
```json
{
  "dev": "nodemon src/server.ts",
  "build": "tsc"
}
```

### Web
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```