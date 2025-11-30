import { Hono } from 'hono';
import type { AppVariables } from '@/types/app';
import { requireAdmin } from '@/middleware/auth';
import { getAllUsers, updateUserRole, deleteUserById } from './admin.controller';

const admin = new Hono<{ Variables: AppVariables }>();

admin.use('*', requireAdmin());

admin.get('/users', getAllUsers);
admin.patch('/users/:userId/role', updateUserRole);
admin.delete('/users/:userId', deleteUserById);

export default admin;
