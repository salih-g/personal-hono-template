# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Production-ready Hono backend template with authentication, database integration, and monitoring. Designed for quick project initialization with TypeScript strict mode, role-based authorization, and December 2025 best practices.

## Essential Commands

### Development
```bash
pnpm dev              # Start dev server with hot reload
pnpm build            # Build for production (tsc + tsc-alias)
pnpm start            # Start production server
```

### Code Quality
```bash
pnpm type-check       # TypeScript type checking (must pass before commits)
pnpm lint             # Run ESLint
pnpm lint:fix         # Auto-fix ESLint issues
pnpm format           # Format with Prettier
pnpm format:check     # Check formatting
```

### Database (Prisma 7)
```bash
pnpm db:generate      # Generate Prisma client (required after schema changes)
pnpm db:push          # Push schema changes to database
pnpm db:migrate       # Create and run migrations
pnpm db:studio        # Open Prisma Studio GUI
pnpm db:seed          # Seed database
```

**SQL Queries:** See [docs/USER_MANAGEMENT_SQL.md](docs/USER_MANAGEMENT_SQL.md) for comprehensive user management SQL queries (fetch, delete, transactions, backups)

### Docker
```bash
pnpm docker:up        # Start PostgreSQL with Docker Compose
pnpm docker:down      # Stop containers
pnpm docker:logs      # View container logs
```

## Architecture

### Modular Monolith Structure

Each feature is organized as a self-contained module in `src/modules/[feature]/`:
- `[feature].controller.ts` - HTTP handlers (request/response)
- `[feature].service.ts` - Business logic and database operations
- `[feature].routes.ts` - Route definitions with middleware
- `[feature].schema.ts` - Zod validation schemas
- `index.ts` - Module exports

**Example modules**: `auth`, `users`, `admin`, `health`

This architecture keeps related code together, making it easy to understand, test, and potentially extract to microservices later.

### Middleware Chain Order (in src/app.ts)

1. Request ID generation
2. Logger initialization
3. CORS headers
4. Rate limiting (global)
5. Session extraction (Better-auth)
6. Routes
7. Error handling (global)

### Core Libraries Location

- `src/lib/` - Shared libraries (db, auth, logger, cache, rate-limiter, email)
- `src/middleware/` - HTTP middleware (auth guards, error handler, logger, cors, rate-limit, request-id)
- `src/utils/` - Utilities (custom error classes, response helpers)
- `src/config/` - Configuration (type-safe env validation)
- `src/types/` - Shared TypeScript types

## Critical Configuration Details

### Prisma 7 Configuration

**IMPORTANT**: This project uses Prisma 7's new configuration approach.

- `DATABASE_URL` is defined in `prisma.config.ts`, NOT in `schema.prisma`
- Always use `prisma.config.ts` with `defineConfig()` and `env()` helper
- Never add `url = env("DATABASE_URL")` to schema.prisma datasource

### TypeScript Path Aliases

- Uses `@/*` path aliases mapped to `src/` directory
- **CRITICAL**: `moduleResolution: "Bundler"` is required (NOT "NodeNext")
- Build uses `tsc-alias` to resolve aliases: `tsc && tsc-alias`
- Never use relative imports like `../../lib/db` - always use `@/lib/db`

### Environment Variables

All environment variables are validated at startup using Zod schema in `src/config/env.ts`. The app will exit with validation errors if required variables are missing.

Required variables:
- `DATABASE_URL` - PostgreSQL connection
- `BETTER_AUTH_SECRET` - Min 32 characters (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `BETTER_AUTH_URL` - Base URL for auth
- `RESEND_API_KEY` - Email service
- `FROM_EMAIL` - Sender email

Optional:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - For Google OAuth

**Expo Mobile App** (optional, for mobile authentication):
- `EXPO_APP_SCHEME` - Mobile app URL scheme (default: `myapp`)

## Expo Mobile App Integration

This backend supports authentication from Expo mobile apps via the `@better-auth/expo` plugin.

### Setup

**Backend Configuration:**

The backend is pre-configured for Expo support with:
- `expo()` plugin in `src/lib/auth.ts`
- Mobile scheme in `trustedOrigins` for CSRF protection
- Conditional Expo Go patterns for development testing

**Environment Variables:**

```bash
# .env (Development)
NODE_ENV=development                   # Development mode enables Expo Go patterns
EXPO_APP_SCHEME=myapp                  # Your app's URL scheme

# .env.production (Production)
NODE_ENV=production                    # Production mode disables Expo Go patterns
EXPO_APP_SCHEME=myapp                  # Your app's URL scheme
```

**What They Do:**
- `NODE_ENV`: Controls environment mode. When `development`, Expo Go patterns (`exp://`) are automatically enabled for local testing. When `production`, only the specific app scheme is trusted for security.
- `EXPO_APP_SCHEME`: Defines your mobile app's deep link scheme (e.g., `myapp://`)

### Mobile Client Setup

Your Expo app needs:

```bash
pnpm add better-auth @better-auth/expo expo-secure-store expo-linking expo-web-browser
```

**app.json configuration:**
```json
{
  "expo": {
    "scheme": "myapp"
  }
}
```

**Client initialization:**
```typescript
import { createAuthClient } from 'better-auth/client';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';

const authClient = createAuthClient({
  baseURL: 'https://your-backend-url.com',
  plugins: [
    expoClient({
      scheme: 'myapp',
      storage: SecureStore,
    })
  ]
});
```

### How It Works

**Web vs Mobile Authentication:**
- **Web**: Session stored in HTTP cookies, OAuth callbacks to `https://yoursite.com/auth/callback/google`
- **Mobile**: Session stored in expo-secure-store, OAuth callbacks to `myapp://auth/callback/google` (deep links)

**OAuth Flow (Mobile):**
```
1. User taps "Sign in with Google"
2. App opens browser via WebBrowser.openAuthSessionAsync()
3. User authenticates with Google
4. Google redirects to: myapp://auth/callback/google?code=...
5. Expo intercepts deep link and reopens app
6. expo() plugin exchanges code for session
7. Session saved to expo-secure-store
```

**Security:**
- Mobile app scheme (`myapp://`) added to `trustedOrigins` for CSRF protection
- Expo Go patterns (`exp://`) automatically enabled in development mode (`NODE_ENV=development`)
- Production builds only accept your specific app scheme for security

### Supported Features

- ✅ Email/password authentication
- ✅ Google OAuth (with deep linking)
- ✅ Session persistence (expo-secure-store)
- ✅ Automatic session restoration on app reload
- ✅ Token refresh
- ✅ Logout

### Development Workflow

**Development Mode (Expo Go):**
- Automatically trusts Expo Go patterns when `NODE_ENV=development`
- Supported IP ranges: `10.0.0.x`, `192.168.x.x`, `172.x.x.x`, `localhost`
- Allows connections from Expo Go development client

**Production Mode:**
- Only trusts your specific app scheme (`myapp://`) when `NODE_ENV=production`
- Enhanced security by blocking Expo Go development patterns

### Important: Expo Origin Header Handling

Due to Expo SDK 54+ using immutable headers and Hono's request handling, the backend includes a middleware that transforms the `expo-origin` header to `origin` header before Better Auth validation. This is required because:

- **Expo sends authentication requests** with `expo-origin` header (e.g., `exp://192.168.68.52:8081`)
- **Better Auth validates** the `origin` header for CSRF protection
- **The expo() plugin's automatic transformation** doesn't work with Hono's immutable headers (would cause "TypeError: Can't modify immutable headers")

**Solution Implemented:**
- Set `disableOriginOverride: true` in `expo()` plugin configuration (src/lib/auth.ts)
- Added middleware in `src/app.ts` (before auth routes) that copies `expo-origin` to `origin` header
- This is the official solution for Hono + Expo SDK 54+ (not a workaround)

**References:**
- [Better Auth Issue #5568](https://github.com/better-auth/better-auth/issues/5568)
- [Better Auth Issue #1058](https://github.com/better-auth/better-auth/issues/1058)

## Role-Based Authorization

### Available Roles
- `USER` - Default role
- `MODERATOR` - Moderator access
- `ADMIN` - Full administrative access

### Middleware Guards (from @/middleware/auth)

```typescript
import { requireAuth, requireRole, requireAdmin, requireModerator } from '@/middleware/auth';

// Require any authenticated user
router.use('*', requireAuth());

// Require specific role(s)
router.use('*', requireAdmin());              // ADMIN only
router.use('*', requireModerator());          // ADMIN or MODERATOR
router.use('*', requireRole(UserRole.ADMIN)); // Custom role check
```

### Adding Role to Better-Auth User

The `role` field is added via Better-auth's `additionalFields` in `src/lib/auth.ts`:

```typescript
user: {
  additionalFields: {
    role: {
      type: 'string',
      defaultValue: 'USER',
    },
  },
}
```

## Authentication Flow

- Uses Better-auth with Prisma adapter
- Session management via `auth.api.getSession()`
- Session extracted in `src/app.ts` middleware and stored in context: `c.get('session')`
- User type includes role: `typeof auth.$Infer.Session.user & { role: UserRole }`

## Error Handling

All errors extend `AppError` from `src/utils/errors.ts`:
- `ValidationError` - Input validation failures
- `UnauthorizedError` - Authentication required
- `ForbiddenError` - Insufficient permissions
- `NotFoundError` - Resource not found
- `ConflictError` - Duplicate resources
- `RateLimitError` - Rate limit exceeded

Global error handler in `src/middleware/error-handler.ts` handles AppError, ZodError, and Prisma errors with appropriate status codes.

## Response Format

Use standardized response helpers from `src/utils/response.ts`:

```typescript
import { successResponse, errorResponse } from '@/utils/response';

// Success
return successResponse(c, data, 200);

// Error
return errorResponse(c, 'ERROR_CODE', 'Error message', 400);
```

## Development Workflow

1. **Before starting**: Ensure `.env` exists with valid credentials
2. **After schema changes**: Run `pnpm db:generate` to regenerate Prisma client
3. **Before committing**: Ensure `pnpm type-check && pnpm lint && pnpm format:check` all pass
4. **Adding new features**: Create a new module in `src/modules/[feature]/` following existing patterns

## Strict Code Quality Rules

### TypeScript Strict Mode (tsconfig.json)

All strict TypeScript checks are enabled and **MUST** pass:

```json
{
  "strict": true,                           // Enable all strict type checks
  "noUncheckedIndexedAccess": true,         // Array/object access returns T | undefined
  "noUnusedLocals": true,                   // Error on unused local variables
  "noUnusedParameters": true,               // Error on unused function parameters
  "noImplicitReturns": true,                // All code paths must return a value
  "noFallthroughCasesInSwitch": true,       // Switch cases must break or return
  "verbatimModuleSyntax": true              // Explicit import/export type syntax
}
```

### ESLint Rules (eslint.config.js)

**Enforced errors** (build will fail):
- `@typescript-eslint/no-explicit-any: error` - **ABSOLUTELY NO `any` types allowed**
- `@typescript-eslint/no-unused-vars: error` - No unused variables (except prefixed with `_`)

**Warnings**:
- `@typescript-eslint/no-non-null-assertion: warn` - Avoid `!` assertions when possible

**Disabled** (TypeScript handles these):
- `explicit-function-return-type` - Type inference is sufficient
- `explicit-module-boundary-types` - Type inference is sufficient

### Code Style Requirements

1. **No `any` types** - Use `unknown` or proper types. This is strictly enforced by ESLint
2. **No workarounds** - Use proper solutions (e.g., Bundler moduleResolution for path aliases, not hacks)
3. **No over-engineering** - Keep solutions simple and focused on current requirements
4. **Prefer readability over cleverness** - Code should be immediately understandable
5. **Use path aliases** - Always use `@/` imports, never relative imports like `../../`
6. **Unused variables** - Prefix with `_` if intentionally unused (e.g., `_req` in handlers)

### Pre-Commit Checklist

Before committing, all of these **MUST** pass:

```bash
pnpm type-check       # TypeScript compilation with strict checks
pnpm lint             # ESLint with no-explicit-any enforcement
pnpm format:check     # Prettier formatting
```

### Important Notes

- **Modular structure** - Keep related code together in feature modules
- **In-memory implementations** - No external dependencies like Redis for caching/rate-limiting
- **Type-safe everything** - Environment variables, database queries, API responses all validated with Zod
- **Follow existing patterns** - Match the structure and style of existing modules when adding features
