import { Hono } from 'hono';
import type { AppVariables } from '@/types/app';
import { requireAuth } from '@/middleware/auth';
import { getMe, getUser, updateMe, deleteMe } from './users.controller';

const users = new Hono<{ Variables: AppVariables }>();

users.use('*', requireAuth());

users.get('/me', getMe);
users.patch('/me', updateMe);
users.delete('/me', deleteMe);
users.get('/:id', getUser);

export default users;
