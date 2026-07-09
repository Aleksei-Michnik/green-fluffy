import path from 'node:path';
import process from 'node:process';
import { defineConfig } from 'prisma/config';

// Prisma 7 with prisma.config.ts does NOT auto-load .env. Load apps/api/.env
// for CLI commands (migrate/seed/studio) using Node's built-in loader. Safe
// no-op when the file is absent (e.g. `prisma generate` in CI), where the
// placeholder URL below applies. Real secrets never live in this file.
try {
  process.loadEnvFile(path.join(__dirname, '.env'));
} catch {
  // No .env present — fall through to process.env / the placeholder URL.
}

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    // Use DATABASE_URL from environment. Falls back to a placeholder
    // for operations like `prisma generate` that don't need a real connection.
    url: process.env.DATABASE_URL ?? 'mysql://placeholder:placeholder@localhost:3306/placeholder',
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
