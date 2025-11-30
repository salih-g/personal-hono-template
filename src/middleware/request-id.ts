import type { MiddlewareHandler } from 'hono';
import type { AppVariables } from '@/types/app';
import { randomUUID } from 'crypto';

export const requestId = (): MiddlewareHandler<{ Variables: AppVariables }> => {
  return async (c, next) => {
    const id = c.req.header('X-Request-ID') ?? randomUUID();
    c.set('requestId', id);
    c.header('X-Request-ID', id);
    await next();
  };
};
