import 'dotenv/config';
import { serve } from '@hono/node-server';
import app from '@/app';
import { env } from '@/config/env';
import { logger } from '@/lib/logger';
import { disconnectDb } from '@/lib/db';

const server = serve({
  fetch: app.fetch,
  port: env.PORT,
});

logger.info(
  {
    port: env.PORT,
    env: env.NODE_ENV,
  },
  `🚀 Server running on http://localhost:${env.PORT}`
);

const shutdown = async () => {
  logger.info('Shutting down gracefully...');

  server.close(() => {
    logger.info('HTTP server closed');
  });

  await disconnectDb();
  logger.info('Database disconnected');

  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught Exception');
  process.exit(1);
});
