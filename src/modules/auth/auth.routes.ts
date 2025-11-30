import { Hono } from 'hono';
import type { AppVariables } from '@/types/app';
import { auth } from '@/lib/auth';

const authRoutes = new Hono<{ Variables: AppVariables }>();

authRoutes.on(['POST', 'GET'], '/*', (c) => {
  return auth.handler(c.req.raw);
});

export default authRoutes;
