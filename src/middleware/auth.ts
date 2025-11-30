import type { MiddlewareHandler } from 'hono';
import type { AppVariables } from '@/types/app';
import { UnauthorizedError, ForbiddenError } from '@/utils/errors';
import { UserRole } from '@prisma/client';

export const requireAuth = (): MiddlewareHandler<{ Variables: AppVariables }> => {
  return async (c, next) => {
    const session = c.get('session');

    if (!session?.user) {
      throw new UnauthorizedError('Authentication required');
    }

    await next();
  };
};

export const requireRole = (
  ...allowedRoles: UserRole[]
): MiddlewareHandler<{ Variables: AppVariables }> => {
  return async (c, next) => {
    const session = c.get('session');

    if (!session?.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const userRole = session.user.role as UserRole;

    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    await next();
  };
};

export const requireAdmin = (): MiddlewareHandler<{ Variables: AppVariables }> => {
  return requireRole(UserRole.ADMIN);
};

export const requireModerator = (): MiddlewareHandler<{ Variables: AppVariables }> => {
  return requireRole(UserRole.ADMIN, UserRole.MODERATOR);
};
