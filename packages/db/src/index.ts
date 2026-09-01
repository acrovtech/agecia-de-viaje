import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export { PrismaClient } from "@prisma/client";
export type * from "@prisma/client";
export * from "./transfers-data";
export * from "./schemas";

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
