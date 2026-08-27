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

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
