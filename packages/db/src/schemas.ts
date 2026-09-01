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
