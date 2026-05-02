import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const maxPool = Number(process.env.DATABASE_POOL_MAX ?? 10);
const connectionTimeoutMs = Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS ?? 20000);

// Create connection pool (tunable for remote DBs / avoid exhaustion under parallel requests)
const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL as string,
    max: Number.isFinite(maxPool) && maxPool > 0 ? maxPool : 10,
    connectionTimeoutMillis: Number.isFinite(connectionTimeoutMs) ? connectionTimeoutMs : 20000,
    idleTimeoutMillis: 30000,
  });

// Create adapter
const adapter = new PrismaPg(pool);

// Create Prisma Client with adapter
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}

export default prisma;