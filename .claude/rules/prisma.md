---
paths:
  - 'apps/api/prisma/**'
---

Schema and migrations follow the `prisma-migrations` skill: name `phase<N>_<topic>`, expand then
contract, one migration in flight at a time, `@@map` snake_case, idempotent seeds, never edit an
applied migration.
