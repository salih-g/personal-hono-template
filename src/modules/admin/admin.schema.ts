import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const updateRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
