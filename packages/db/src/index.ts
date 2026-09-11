import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export { PrismaClient, ReservationStatus } from "@prisma/client";

// Re-export / override Role with full 5-role enum
export type Role = 'SUPERADMIN' | 'MASTER' | 'OPERATOR' | 'CONTENT_CREATOR' | 'MARKETING';
export const Role = {
  SUPERADMIN: 'SUPERADMIN',
  MASTER: 'MASTER',
  OPERATOR: 'OPERATOR',
  CONTENT_CREATOR: 'CONTENT_CREATOR',
  MARKETING: 'MARKETING',
} as const;

// Enums y tipos de Cupones Comerciales
export type DiscountType = 'PERCENTAGE' | 'FIXED';
export const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED',
} as const;

export interface CouponItem {
  id: string;
  code: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  minSpend?: number | null;
  maxDiscount?: number | null;
  expiresAt?: Date | string | null;
  usageLimit?: number | null;
  timesUsed: number;
  isActive: boolean;
  createdBy?: string | null;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

// Tipo extendido de Reserva con soporte para atribución de marketing
export interface MarketingCampaignLogItem {
  id: string;
  customerEmail: string;
  campaignCode: string;
  subject: string;
  message: string;
  flyerUrl?: string | null;
  whatsappUrl?: string | null;
  sentByEmail?: string | null;
  createdAt: Date;
}

export * from "./transfers-data";
export * from "./schemas";
export * from "./auth-security";

/**
 * Traduce códigos de error conocidos de Prisma a mensajes claros en español.
 */
export function handlePrismaError(error: any): string {
  if (!error) return 'Ocurrió un error inesperado.';

  // Prisma Client Known Request Error
  if (error?.code === 'P2002') {
    const target = Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : (error.meta?.target || 'campo');
    return `Ya existe un registro con el mismo ${target} (duplicado no permitido).`;
  }
  if (error?.code === 'P2025') {
    return 'El registro solicitado no fue encontrado en la base de datos.';
  }
  if (error?.code === 'P2003') {
    return 'Violación de clave foránea o relación inexistente.';
  }
  if (error?.code === 'P2014') {
    return 'La operación violaría una relación obligatoria entre registros.';
  }

  return error.message || 'Error en la base de datos.';
}

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
