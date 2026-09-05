import { PrismaClient, Prisma } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

let prismaInstance: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prismaInstance = new PrismaClient();
} else {
  // Prevent multiple instances during dev reload
  const globalWithPrisma = global as typeof globalThis & {
    prisma?: PrismaClient;
  };
  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = new PrismaClient({
      log: process.env.DEBUG === 'true' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
    });
  }
  prismaInstance = globalWithPrisma.prisma;
}

export const prisma = prismaInstance;
export const transactionContext = new AsyncLocalStorage<Prisma.TransactionClient>();

export function getPrismaClient(): Prisma.TransactionClient | PrismaClient {
  const tx = transactionContext.getStore();
  return tx || prisma;
}

export default prisma;
