/// <reference types="node" />
import path from 'node:path';
import process from 'node:process';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

// Load apps/api/.env when DATABASE_URL isn't already provided by the
// environment (e.g. docker compose sets it directly). The guard keeps the
// container case — where the URL points at the `mysql` service — untouched.
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(path.join(process.cwd(), '.env'));
  } catch {
    // No .env file — the check below reports the missing URL.
  }
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL is not set');
  process.exit(1);
}

// Prisma 7 driver-adapter pattern: the datasource block carries no `url`,
// so every client must be constructed with an adapter (same as PrismaService).
const adapter = new PrismaMariaDb(databaseUrl);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // Phase 0: verify database connection through the mariadb driver adapter.
  await prisma.$connect();
  console.log('✅ Database connection verified');

  await prisma.healthCheck.create({ data: { status: 'seeded' } });
  console.log('✅ Health check row created');

  console.log('🌱 Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
