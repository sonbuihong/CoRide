# CONCERNS.md

## Technical Debt

### No Authentication
- No JWT, session, or OAuth implementation
- No login/register flows visible
- No protected routes

### No Input Validation
- No validation middleware on routes
- No schema validation (no Zod, Joi, etc.)

### No Error Handling Standardization
- No centralized error handler
- No consistent error response format

---

## Known Issues

### Database
- Prisma client imported but no schema visible (`prisma/schema.prisma`)
- Database provider not configured

### Security
- CORS enabled for all origins (`cors()` with no options)
- No rate limiting
- No helmet.js for security headers

---

## Fragile Areas

### Backend
- **Hardcoded port fallback**: `process.env.PORT || 3001` - no validation
- **No graceful shutdown** - server.ts doesn't handle SIGTERM/SIGINT

### Frontend
- **No error boundaries** - React error boundaries not implemented
- **No loading states** - API calls have no loading indicators

---

## Performance Concerns

- No caching strategies (Redis, in-memory)
- No query optimization visible
- No pagination on user routes
- No compression middleware

---

## Missing Infrastructure

- No CI/CD configuration
- No Docker files
- No environment validation
- No health check for database connectivity

---

## Code Quality Gaps

- No tests
- No API documentation
- No logging (console.log only)
- No type guards
- No consistent error messages