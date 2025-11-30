import { cors as honoCors } from 'hono/cors';
import { env } from '@/config/env';

export const cors = () => {
  return honoCors({
    origin: env.NODE_ENV === 'production' ? [env.BETTER_AUTH_URL] : '*',
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposeHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 86400,
  });
};
