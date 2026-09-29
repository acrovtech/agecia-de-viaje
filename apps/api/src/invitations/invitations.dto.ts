import { z } from 'zod';

export const createInvitationSchema = z
  .object({
    email: z
      .string()
      .email('Email inválido')
      .transform((val) => val.toLowerCase().trim()),
    role: z.enum(['ADMIN', 'EDITOR', 'OPERATOR', 'VIEWER']), // OWNER cannot be invited!
  })
  .strict();

export type CreateInvitationDto = z.infer<typeof createInvitationSchema>;

export const acceptInvitationSchema = z
  .object({
    name: z.string().min(1, 'El nombre es requerido').max(100).optional(),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .refine(
        (val) => Buffer.byteLength(val, 'utf8') <= 72,
        'La contraseña no puede exceder 72 bytes en formato UTF-8'
      ),
  })
  .strict();

export type AcceptInvitationDto = z.infer<typeof acceptInvitationSchema>;
