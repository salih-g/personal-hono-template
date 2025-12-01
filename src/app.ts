import { Hono } from 'hono';
import type { AppVariables } from '@/types/app';
import { requestId } from '@/middleware/request-id';
import { loggerMiddleware } from '@/middleware/logger';
import { cors } from '@/middleware/cors';
import { errorHandler } from '@/middleware/error-handler';
import { rateLimit } from '@/middleware/rate-limit';
import { globalRateLimiter } from '@/lib/rate-limiter';
import { auth, type User } from '@/lib/auth';
import type { UserRole } from '@prisma/client';

import healthRoutes from '@/modules/health';
import authRoutes from '@/modules/auth';
import usersRoutes from '@/modules/users';
import adminRoutes from '@/modules/admin';

const app = new Hono<{ Variables: AppVariables }>();

app.use('*', requestId());
app.use('*', loggerMiddleware());
app.use('*', cors());

// Expo Origin Header Transform (required for Expo SDK 54+ with Hono)
// Better Auth validates 'origin' header, but Expo sends 'expo-origin'
// The expo() plugin can't transform headers due to Hono's immutable headers
app.use('/api/auth/*', async (c, next) => {
  const expoOrigin = c.req.header('expo-origin');
  if (expoOrigin) {
    c.req.raw.headers.set('origin', expoOrigin);
  }
  await next();
});

app.use('*', rateLimit(globalRateLimiter));

app.use('*', async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set('userId', session?.user?.id);
  if (session) {
    c.set('session', {
      user: {
        ...session.user,
        role: (session.user as { role?: string }).role as UserRole,
      } as User,
      session: session.session,
    });
  }
  await next();
});

app.route('/health', healthRoutes);
app.route('/api/auth', authRoutes);
app.route('/api/users', usersRoutes);
app.route('/api/admin', adminRoutes);

app.get('/', (c) => {
  return c.json({
    name: 'Hono Backend Template',
    version: '1.0.0',
    status: 'running',
  });
});

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

app.onError(errorHandler);

export default app;
