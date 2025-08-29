import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Global Prisma instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client instance
export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env['NODE_ENV'] === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Store Prisma instance globally in development
if (process.env['NODE_ENV'] === 'development') {
  globalThis.__prisma = prisma;
}

// Database connection function
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database', { error });
    throw error;
  }
};

// Database disconnection function
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Failed to disconnect from database', { error });
    throw error;
  }
};

// Health check function
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed', { error });
    return false;
  }
};

// Transaction helper
export const transaction = prisma.$transaction;

export default prisma;