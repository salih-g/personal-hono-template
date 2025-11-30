import { RateLimitError } from '@/utils/errors';
import { logger } from '@/lib/logger';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private store: Map<string, RateLimitRecord> = new Map();

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {
    setInterval(() => this.cleanup(), windowMs);
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const record = this.store.get(identifier);

    if (!record || now > record.resetAt) {
      const newRecord: RateLimitRecord = {
        count: 1,
        resetAt: now + this.windowMs,
      };
      this.store.set(identifier, newRecord);

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt: newRecord.resetAt,
      };
    }

    if (record.count >= this.maxRequests) {
      logger.warn({ identifier }, 'Rate limit exceeded');
      return {
        allowed: false,
        remaining: 0,
        resetAt: record.resetAt,
      };
    }

    record.count++;
    this.store.set(identifier, record);

    return {
      allowed: true,
      remaining: this.maxRequests - record.count,
      resetAt: record.resetAt,
    };
  }

  enforce(identifier: string): void {
    const result = this.check(identifier);

    if (!result.allowed) {
      throw new RateLimitError();
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, record] of this.store.entries()) {
      if (now > record.resetAt) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug({ cleaned }, 'Rate limiter cleanup completed');
    }
  }
}

export const globalRateLimiter = new RateLimiter(100, 60000);
export const authRateLimiter = new RateLimiter(5, 60000);
