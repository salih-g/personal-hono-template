# Hono Backend Template

Production-ready backend template built with Hono, featuring authentication, database integration, and monitoring capabilities following modern best practices.

## Features

✨ **Modern Stack**
- Hono v4 - Fast web framework
- TypeScript - Strict type safety
- Prisma 7 - Type-safe ORM
- PostgreSQL - Robust database
- Better-auth - Flexible authentication

🔐 **Authentication**
- Email/Password authentication
- Google OAuth integration
- Session management
- Email verification

⚡ **Performance & Reliability**
- In-memory caching
- Rate limiting
- Request ID tracking
- Graceful shutdown

📝 **Developer Experience**
- ESLint + Prettier
- Strict TypeScript
- Type-safe environment variables
- Modular monolith architecture

🛡️ **Security**
- CORS configuration
- Input validation (Zod)
- SQL injection prevention
- Error handling

📊 **Monitoring**
- Structured logging (Pino)
- Health check endpoint
- Request/response logging

## Project Structure

```
src/
├── modules/           # Feature modules (auth, users, health)
│   ├── auth/
│   ├── users/
│   └── health/
├── lib/              # Shared libraries (db, logger, cache, etc.)
├── middleware/       # HTTP middleware
├── config/           # Configuration (env validation)
├── utils/            # Utilities (errors, response helpers)
├── types/            # TypeScript types
├── app.ts            # Hono app setup
└── index.ts          # Server entry point
```

## Prerequisites

- Node.js 20+
- PostgreSQL 17+
- pnpm 10+

## Installation

1. **Clone and install dependencies**
```bash
pnpm install
```

2. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your values
```

3. **Setup database**
```bash
# Start PostgreSQL with Docker
pnpm docker:up

# Generate Prisma client and run migrations
pnpm db:generate
pnpm db:migrate
```

4. **Generate better-auth schema** (if not using provided Prisma schema)
```bash
npx @better-auth/cli generate
```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | No | `development` |
| `PORT` | Server port | No | `3000` |
| `DATABASE_URL` | PostgreSQL connection URL | Yes | - |
| `BETTER_AUTH_SECRET` | Auth secret (min 32 chars) | Yes | - |
| `BETTER_AUTH_URL` | Base URL for auth | Yes | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | No | - |
| `RESEND_API_KEY` | Resend API key for emails | Yes | - |
| `FROM_EMAIL` | Sender email address | Yes | - |
| `LOG_LEVEL` | Logging level | No | `info` |

### Generate Auth Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Development

```bash
# Start dev server with hot reload
pnpm dev

# Run linting
pnpm lint

# Format code
pnpm format

# Type check
pnpm type-check
```

## Production

### Build and Run

```bash
# Build
pnpm build

# Start production server
pnpm start
```

### Docker

```bash
# Build and start with Docker Compose
pnpm docker:up

# View logs
pnpm docker:logs

# Stop containers
pnpm docker:down
```

## API Endpoints

### Health Check
- `GET /health` - Health check with database status

### Authentication
- `POST /api/auth/sign-up/email` - Email/password signup
- `POST /api/auth/sign-in/email` - Email/password signin
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get current session
- `GET /api/auth/google` - Google OAuth

### Users (Protected)
- `GET /api/users/me` - Get current user
- `PATCH /api/users/me` - Update current user
- `DELETE /api/users/me` - Delete current user
- `GET /api/users/:id` - Get user by ID

### Admin (Admin Only)
- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/users/:userId/role` - Update user role
- `DELETE /api/admin/users/:userId` - Delete user

## Database

### Run Migrations

```bash
pnpm db:migrate
```

### Seed Database

```bash
pnpm db:seed
```

### Prisma Studio

```bash
pnpm db:studio
```

## Architecture

### Modular Monolith

Each feature is organized as a self-contained module:

```
modules/[feature]/
├── [feature].controller.ts  # HTTP handlers
├── [feature].service.ts     # Business logic
├── [feature].routes.ts      # Route definitions
├── [feature].schema.ts      # Zod schemas
└── index.ts                 # Module exports
```

**Benefits:**
- Easy to navigate and understand
- Clear separation of concerns
- Testable business logic
- Can be extracted to microservices later

### Middleware Chain

1. Request ID generation
2. Logger initialization
3. CORS headers
4. Rate limiting
5. Session extraction
6. Routes
7. Error handling

### Role-Based Authorization

The template includes a flexible role-based authorization system:

**Roles:**
- `USER` - Default role for all users
- `MODERATOR` - Moderator access
- `ADMIN` - Full administrative access

**Middleware Guards:**
```typescript
import { requireAuth, requireRole, requireAdmin, requireModerator } from '@/middleware/auth';

// Require authentication
app.use('/api/protected/*', requireAuth());

// Require specific role(s)
app.use('/api/mod/*', requireModerator()); // ADMIN or MODERATOR
app.use('/api/admin/*', requireAdmin()); // ADMIN only

// Custom role requirements
app.use('/api/custom/*', requireRole(UserRole.ADMIN, UserRole.MODERATOR));
```

**Usage Example:**
```typescript
import { Hono } from 'hono';
import { requireAdmin } from '@/middleware/auth';

const admin = new Hono();

// All routes require ADMIN role
admin.use('*', requireAdmin());

admin.get('/users', getAllUsers);
admin.patch('/users/:id/role', updateUserRole);
```

**Database Schema:**
```prisma
enum UserRole {
  USER
  ADMIN
  MODERATOR
}

model User {
  role UserRole @default(USER)
  // ... other fields
}
```

## Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint errors
pnpm format           # Format with Prettier
pnpm format:check     # Check formatting
pnpm type-check       # TypeScript type checking

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database

# Docker
pnpm docker:up        # Start containers
pnpm docker:down      # Stop containers
pnpm docker:logs      # View container logs
```

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Hono
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma 7
- **Authentication**: Better-auth
- **Validation**: Zod
- **Logger**: Pino
- **Email**: Resend
- **Linting**: ESLint
- **Formatting**: Prettier

## Security Best Practices

✅ Type-safe environment validation
✅ Input validation on all endpoints
✅ SQL injection prevention (Prisma)
✅ Rate limiting
✅ CORS configuration
✅ Secure session management
✅ Error sanitization in production
✅ Request ID tracking

## License

MIT
