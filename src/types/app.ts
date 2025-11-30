import type { Context } from 'hono';
import type { Logger } from 'pino';
import type { Session, User } from '@/lib/auth';

export interface AppVariables {
  logger: Logger;
  requestId: string;
  userId?: string;
  session?: { user: User | null; session: Session | null };
}

export type AppContext = Context<{ Variables: AppVariables }>;
