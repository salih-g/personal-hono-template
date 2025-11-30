import type { MiddlewareHandler } from 'hono';
import type { AppVariables } from '@/types/app';
import { createLogger } from '@/lib/logger';

export const loggerMiddleware = (): MiddlewareHandler<{ Variables: AppVariables }> => {
  return async (c, next) => {
    const requestId = c.get('requestId');
    const logger = createLogger({ requestId });
    c.set('logger', logger);

    const start = Date.now();
    const { method, url } = c.req;

    logger.info({ method, url }, 'Request started');

    await next();

    const duration = Date.now() - start;
    const status = c.res.status;

    logger.info(
      {
        method,
        url,
        status,
        duration,
      },
      'Request completed'
    );
  };
};
