import { z } from 'zod';

export const updateMembershipSchema = z
  .object({
    role: z.enum(['OWNER', 'ADMIN', 'EDITOR', 'OPERATOR', 'VIEWER']).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export type UpdateMembershipDto = z.infer<typeof updateMembershipSchema>;
