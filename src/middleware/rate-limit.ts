import type { MiddlewareHandler } from 'hono';
import type { RateLimiter } from '@/lib/rate-limiter';
import { RateLimitError } from '@/utils/errors';

export const rateLimit = (limiter: RateLimiter): MiddlewareHandler => {
  return async (c, next) => {
    const identifier =
      c.req.header('X-Forwarded-For') ?? c.req.header('CF-Connecting-IP') ?? 'unknown';

    const result = limiter.check(identifier);

    c.header('X-RateLimit-Limit', limiter['maxRequests'].toString());
    c.header('X-RateLimit-Remaining', result.remaining.toString());
    c.header('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

    if (!result.allowed) {
      throw new RateLimitError();
    }

    await next();
  };
};
