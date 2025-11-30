import type { ErrorHandler } from 'hono';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '@/utils/errors';
import { errorResponse } from '@/utils/response';
import { env } from '@/config/env';
import { logger } from '@/lib/logger';

export const errorHandler: ErrorHandler = (err, c) => {
  const requestLogger = c.get('logger') ?? logger;

  if (err instanceof AppError) {
    requestLogger.warn({ error: err.message, code: err.code }, 'Application error');
    return errorResponse(c, err.code, err.message, err.statusCode);
  }

  if (err instanceof ZodError) {
    requestLogger.warn({ error: err.issues }, 'Validation error');
    return errorResponse(
      c,
      'VALIDATION_ERROR',
      'Invalid request data',
      400,
      env.NODE_ENV === 'development' ? err.issues : undefined
    );
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    requestLogger.error({ error: err }, 'Database error');

    if (err.code === 'P2002') {
      return errorResponse(c, 'CONFLICT', 'Resource already exists', 409);
    }

    if (err.code === 'P2025') {
      return errorResponse(c, 'NOT_FOUND', 'Resource not found', 404);
    }

    return errorResponse(
      c,
      'DATABASE_ERROR',
      env.NODE_ENV === 'development' ? err.message : 'Database operation failed',
      500
    );
  }

  requestLogger.error({ error: err }, 'Unexpected error');

  return errorResponse(
    c,
    'INTERNAL_SERVER_ERROR',
    env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    500,
    env.NODE_ENV === 'development' ? err.stack : undefined
  );
};
