# STRUCTURE.md

## Directory Layout

```
CoRide/
├── .planning/codebase/      # GSD planning documents
├── code/                   # Main code directory
│   ├── package.json       # Monorepo root
│   ├── apps/
│   │   ├── backend/       # Express backend
│   │   │   ├── src/
│   │   │   │   ├── controllers/
│   │   │   │   │   └── user.controller.ts
│   │   │   │   ├── routes/
│   │   │   │   │   └── user.routes.ts
│   │   │   │   └── server.ts
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   ├── web/          # Next.js frontend
│   │   │   ├── src/
│   │   │   │   ├── app/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── globals.css
│   │   │   │   │   └── fonts/
│   │   │   │   ├── components/ui/
│   │   │   │   │   └── button.tsx
│   │   │   │   └── lib/
│   │   │   │       └── utils.ts
│   │   │   ├── package.json
│   │   │   ├── tailwind.config.ts
│   │   │   ├── components.json
│   │   │   └── tsconfig.json
│   │   └── mobile/       # Expo mobile app
│   │       └── package.json
│   └── .vscode/
│       ├── settings.json
│       └── extensions.json
```

---

## Key File Locations

| Purpose | File Path |
|---------|------------|
| Backend entry | `code/apps/backend/src/server.ts` |
| Backend routes | `code/apps/backend/src/routes/user.routes.ts` |
| Backend controller | `code/apps/backend/src/controllers/user.controller.ts` |
| Web entry | `code/apps/web/src/app/page.tsx` |
| Web layout | `code/apps/web/src/app/layout.tsx` |
| UI utilities | `code/apps/web/src/lib/utils.ts` |
| Tailwind config | `code/apps/web/tailwind.config.ts` |
| Monorepo config | `code/package.json` |

---

## Naming Conventions

- **Files**: kebab-case (e.g., `user.routes.ts`, `user.controller.ts`)
- **Components**: PascalCase (e.g., `Button.tsx`)
- **Utilities**: kebab-case (e.g., `utils.ts`)

---

## Module Organization

### Backend
```
src/
├── controllers/  # Business logic
├── routes/      # Route definitions
└── server.ts    # App entry
```

### Web
```
src/
├── app/         # Next.js App Router pages
├── components/ # UI components
└── lib/        # Utilities
```