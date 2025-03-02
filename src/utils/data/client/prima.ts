import { PrismaClient } from '@prisma/client';

// Use a global variable to ensure the PrismaClient instance is reused
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['warn', 'error'],
  });

// Prevent multiple instances during hot-reloading in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
