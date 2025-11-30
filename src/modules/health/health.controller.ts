import type { AppContext } from '@/types/app';
import { db } from '@/lib/db';
import { successResponse } from '@/utils/response';

export async function healthCheck(c: AppContext) {
  const startTime = Date.now();

  let dbStatus = 'healthy';
  let dbLatency = 0;

  try {
    const dbStart = Date.now();
    await db.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbStart;
  } catch {
    dbStatus = 'unhealthy';
  }

  const health = {
    status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: dbStatus,
      latency: dbLatency,
    },
    memory: {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
    },
    responseTime: Date.now() - startTime,
  };

  return successResponse(c, health);
}
