---
name: prisma-migrations
description: Rules for changing the Prisma schema and creating migrations in this repo — naming, expand-then-contract for blue/green, serialization across parallel work, seeds, the MariaDB driver adapter. Use whenever apps/api/prisma/schema.prisma or a migration changes.
---

# Prisma migrations

- **Naming**: `phase<N>_<topic>` (`phase0_init`, `phase1_accounts`, `phase2_species`,
  `phase2_pets`, `phase3_media`, `phase4_sharing`, …) — one migration per schema iteration.
- **Expand then contract, always** (plan §4.6): add columns/tables nullable or defaulted, deploy,
  backfill, switch code, then drop in a later migration. Old and new slots run against the same
  database during a blue/green switch.
- **One migration in flight at a time.** In parallel work the orchestrator grants the "migration
  slot" and names the base migration; never create two migrations from the same baseline.
- **Conventions**: `@@map("snake_case")` tables and `@map` columns; ids `@db.VarChar(36)` uuid;
  `createdAt/updatedAt`; soft delete `deletedAt`; indexes for every list pattern
  (`(pet_id, occurred_at)` style) justified in the contract; FULLTEXT where the design says.
- **Pre-wired columns** (e.g. `Pet.locationId`, `avatarMediaId`) get their FKs in the phase that
  activates them — expand migration, not a rewrite.
- **Commands** (host, from `apps/api`, or `docker compose exec api`):
  `pnpm db:migrate --name phaseN_topic` → review the SQL → `pnpm db:generate` → run tests.
  CI uses `prisma generate` with the placeholder URL; integration tests apply migrations to a
  Testcontainers MySQL 9.7.
- **Seeds** are idempotent upserts by natural key (species by slug); run twice, expect no diff.
- **Driver**: `PrismaMariaDb` adapter; `prisma.config.ts` loads `.env` itself. Keep
  `binaryTargets` (`native`, `linux-musl-openssl-3.0.x`) for the Alpine images.
- Never edit an applied migration; add a new one. Never `migrate reset` against anything but a
  local database.
