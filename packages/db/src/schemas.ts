import { z } from 'zod';

/**
 * Esquemas de validación Zod compartidos entre Frontend (Web) y Backend / Admin
 */

export const SharedPassengerSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  documentType: z.string().default('DNI'),
  documentNumber: z.string().min(1, 'El número de documento es requerido'),
});

export const SharedCheckoutSchema = z.object({
  firstName: z.string().min(1, 'El nombre del titular es requerido'),
  lastName: z.string().min(1, 'El apellido del titular es requerido'),
  email: z.string().email('Correo electrónico inválido'),
  phone: z.string().min(6, 'Número de teléfono inválido'),
  hotel: z.string().optional().default(''),
  language: z.string().default('Español'),
  requirements: z.string().optional().default(''),
  tourTitle: z.string().min(1, 'El tour es requerido'),
  tourSlug: z.string().min(1, 'El slug es requerido'),
  date: z.string().min(1, 'La fecha es requerida'),
  pax: z.coerce.number().int().min(1, 'Mínimo 1 pasajero'),
  serviceType: z.enum(['shared', 'private']).default('shared'),
  passengers: z.array(SharedPassengerSchema).optional().default([]),
});

export const SharedCategorySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z.string().min(2, 'El slug debe tener al menos 2 caracteres').regex(/^[a-z0-9-]+$/, 'Slug inválido'),
});

export const SharedContactSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido'),
  email: z.string().email('Correo inválido'),
  phone: z.string().optional(),
  message: z.string().min(5, 'El mensaje debe tener al menos 5 caracteres'),
});

/**
 * Esquemas de Seguridad, Roles y Usuarios Administrativos
 */
export const SharedRoleSchema = z.enum(['SUPERADMIN', 'MASTER', 'OPERATOR', 'CONTENT_CREATOR', 'MARKETING']);
export type SharedRoleType = z.infer<typeof SharedRoleSchema>;

export const SharedLoginSchema = z.object({
  email: z.string().email('Ingrese un correo electrónico válido').trim().toLowerCase(),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const SharedCreateUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').trim(),
  email: z.string().email('Ingrese un correo electrónico válido').trim().toLowerCase(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula')
    .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula')
    .regex(/[0-9]/, 'Debe incluir al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe incluir al menos un carácter especial (@$!%*?&)'),
  role: SharedRoleSchema.default('OPERATOR'),
  isActive: z.boolean().default(true),
});

export const SharedUpdateUserSchema = z.object({
  id: z.string().min(1, 'ID de usuario requerido'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').trim().optional(),
  email: z.string().email('Ingrese un correo electrónico válido').trim().toLowerCase().optional(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula')
    .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula')
    .regex(/[0-9]/, 'Debe incluir al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe incluir al menos un carácter especial (@$!%*?&)')
    .optional()
    .or(z.literal('')),
  role: SharedRoleSchema.optional(),
  isActive: z.boolean().optional(),
});

/**
 * Esquemas Zod para Gestión de Cupones Comerciales
 */
export const SharedDiscountTypeSchema = z.enum(['PERCENTAGE', 'FIXED']);
export type SharedDiscountType = z.infer<typeof SharedDiscountTypeSchema>;

export const SharedCreateCouponSchema = z.object({
  code: z
    .string()
    .min(3, 'El código debe tener al menos 3 caracteres')
    .max(20, 'El código no puede exceder 20 caracteres')
    .trim()
    .transform((val) => val.toUpperCase())
    .refine((val) => /^[A-Z0-9_-]+$/.test(val), 'El código solo puede contener letras mayúsculas, números y guiones'),
  description: z.string().optional().nullable(),
  discountType: SharedDiscountTypeSchema.default('PERCENTAGE'),
  discountValue: z.coerce.number().positive('El valor del descuento debe ser mayor a 0'),
  minSpend: z.coerce.number().min(0, 'El gasto mínimo no puede ser negativo').default(0),
  maxDiscount: z.coerce.number().min(0).optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  usageLimit: z.coerce.number().int().positive('El límite debe ser un número entero mayor a 0').optional().nullable(),
  isActive: z.boolean().default(true),
});

export const SharedUpdateCouponSchema = z.object({
  id: z.string().min(1, 'ID de cupón requerido'),
  code: z
    .string()
    .min(3, 'El código debe tener al menos 3 caracteres')
    .max(20, 'El código no puede exceder 20 caracteres')
    .trim()
    .transform((val) => val.toUpperCase())
    .refine((val) => /^[A-Z0-9_-]+$/.test(val), 'El código solo puede contener letras mayúsculas, números y guiones')
    .optional(),
  description: z.string().optional().nullable(),
  discountType: SharedDiscountTypeSchema.optional(),
  discountValue: z.coerce.number().positive('El valor del descuento debe ser mayor a 0').optional(),
  minSpend: z.coerce.number().min(0).optional().nullable(),
  maxDiscount: z.coerce.number().min(0).optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
});

