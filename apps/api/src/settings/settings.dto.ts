import { z } from 'zod';

export const updateAgencyProfileSchema = z
  .object({
    name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
    phone: z.string().trim().max(50).nullable().optional(),
    email: z.string().trim().email('Correo electrónico no válido').nullable().optional().or(z.literal('')),
    address: z.string().trim().max(300).nullable().optional(),
    logoUrl: z.string().trim().url('URL de logo inválida').nullable().optional().or(z.literal('')),
    iconUrl: z.string().trim().url('URL de icono inválida').nullable().optional().or(z.literal('')),
    expectedUpdatedAt: z
      .string()
      .datetime({ message: 'expectedUpdatedAt debe ser una fecha ISO válida' }),
  })
  .strict();

export type UpdateAgencyProfileDto = z.infer<typeof updateAgencyProfileSchema>;

export const updateLegalProfileSchema = z
  .object({
    ruc: z.string().trim().regex(/^\d{11}$/, 'El RUC debe tener exactamente 11 dígitos numéricos'),
    legalName: z.string().trim().min(2, 'La razón social debe tener al menos 2 caracteres').max(200),
    tradeName: z.string().trim().max(200).nullable().optional().or(z.literal('')),
    fiscalAddress: z.string().trim().min(5, 'El domicilio fiscal debe tener al menos 5 caracteres').max(300),
    legalRepresentative: z.string().trim().max(200).nullable().optional().or(z.literal('')),
    contactEmail: z.string().trim().email('Correo de contacto no válido').nullable().optional().or(z.literal('')),
    contactPhone: z.string().trim().max(50).nullable().optional().or(z.literal('')),
    expectedUpdatedAt: z
      .string()
      .datetime({ message: 'expectedUpdatedAt debe ser una fecha ISO válida o null' })
      .nullable(),
  })
  .strict();

export type UpdateLegalProfileDto = z.infer<typeof updateLegalProfileSchema>;
