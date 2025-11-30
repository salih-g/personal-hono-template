import type { AppContext } from '@/types/app';
import { successResponse } from '@/utils/response';
import { db } from '@/lib/db';

export async function getAllUsers(c: AppContext) {
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return successResponse(c, users);
}

export async function updateUserRole(c: AppContext) {
  const userId = c.req.param('userId');
  const { role } = await c.req.json();

  const user = await db.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      updatedAt: true,
    },
  });

  return successResponse(c, user);
}

export async function deleteUserById(c: AppContext) {
  const userId = c.req.param('userId');

  await db.user.delete({
    where: { id: userId },
  });

  return successResponse(c, { message: 'User deleted successfully' });
}
