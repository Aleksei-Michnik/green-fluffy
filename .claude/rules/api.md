---
paths:
  - 'apps/api/**'
  - 'packages/shared/**'
---

API code: DTOs validated with class-validator (whitelist); error constants per module; every
subject-scoped route uses the access guard and registers in the access-matrix suite; private
subjects 404; public reads use a separate public DTO; audit-log sensitive changes; tests next to
the code. Skills: `privacy-guard`, `prisma-migrations`, `testing`. Conventions: `wiki/conventions.md`.
