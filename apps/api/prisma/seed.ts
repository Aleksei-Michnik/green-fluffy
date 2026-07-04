/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Phase 0: Verify database connection
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
