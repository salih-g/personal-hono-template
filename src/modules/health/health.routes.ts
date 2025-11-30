import { Hono } from 'hono';
import type { AppVariables } from '@/types/app';
import { healthCheck } from './health.controller';

const health = new Hono<{ Variables: AppVariables }>();

health.get('/', healthCheck);

export default health;
