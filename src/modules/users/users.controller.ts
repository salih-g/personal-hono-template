import type { AppContext } from '@/types/app';
import { successResponse } from '@/utils/response';
import * as userService from './users.service';
import { updateUserSchema } from './users.schema';

export async function getMe(c: AppContext) {
  const session = await c.get('session');

  if (!session?.user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const user = await userService.getUserById(session.user.id);
  return successResponse(c, user);
}

export async function getUser(c: AppContext) {
  const id = c.req.param('id');
  const user = await userService.getUserById(id);
  return successResponse(c, user);
}

export async function updateMe(c: AppContext) {
  const session = await c.get('session');

  if (!session?.user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json();
  const data = updateUserSchema.parse(body);

  const user = await userService.updateUser(session.user.id, data);
  return successResponse(c, user);
}

export async function deleteMe(c: AppContext) {
  const session = await c.get('session');

  if (!session?.user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await userService.deleteUser(session.user.id);
  return successResponse(c, { message: 'User deleted successfully' });
}
