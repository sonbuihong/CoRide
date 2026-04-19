# INTEGRATIONS.md

## External Services

### Database
- **Prisma ORM** ^5.22.0 - Database access layer
- Database provider not specified (likely PostgreSQL or MySQL)
- Schema defined via Prisma

---

## API Integrations

### Backend APIs
- **Express REST API** - Runs on port 3001 (or PORT env)
- **Health Check**: `GET /api/health`
- **User Routes**: `/api/users`

### External Endpoints
- **Frontend → Backend**: HTTP to `http://localhost:3001/api/*`

---

## Authentication & Security

- **CORS** ^2.8.6 - Cross-origin resource sharing enabled
- **dotenv** ^17.4.1 - Environment-based configuration
- No explicit auth middleware visible in codebase

---

## UI Component Libraries

- **Shadcn** ^4.2.0 - Component library (UI components in `src/components/ui/`)
- **Lucide React** ^1.7.0 - Icon set
- **Base UI** ^1.3.0 - React component library

---

## Development Tools

- **ESLint** ^8.50.0 (root) + project-specific configs
- **Prettier** ^3.0.3 - Code formatter

---

## Missing Integrations

- No database connection string visible
- No authentication provider (JWT, OAuth, etc.)
- No external API clients
- No webhook handlers