# Code conventions (checked 2026-09-24)

Inherited from myfinpro's DNA and adapted; the code in the repo is the reference when in doubt.

## Non-negotiable

- **Minimal and DRY.** Reuse existing helpers, components, DTOs, types. A type or constant used by
  both API and web lives in `packages/shared`. Never derive two constants that must hold the same
  value — compute one from the other.
- **No legacy paths.** Replacing something removes the old path: no deprecated wrappers, no
  commented-out code, no "keep for compat".
- **Latest stable versions, verified online** — never inherit myfinpro's pins (`stack-versions`).
- **Tests accompany changes** (`testing.md`); an iteration without its tests is incomplete.
- **Prettier on every changed file** before finishing (`pnpm format`); CI runs `format:check` on
  `**/*.{ts,tsx,js,jsx,json,md,yaml,yml}` — markdown included.
- **Nothing sensitive in files or commit messages** (`commit-hygiene` skill).

## Layout and naming

- API: one directory per module `apps/api/src/<module>/{<module>.module,controller,service}.ts`,
  `dto/`, `guards/`, `constants/<module>-errors.ts`; unit tests `*.spec.ts` next to the source;
  integration tests under `apps/api/test/`.
- Web: routes in `src/app/[locale]/<area>/page.tsx`; components in `src/components/<domain>/`;
  domain API clients and types in `src/lib/<domain>/`; hooks in `src/hooks/`; unit tests
  `*.spec.tsx` next to components; Playwright in `apps/web/e2e/`.
- Ported files keep myfinpro's relative paths (cross-repo diffing).
- Prisma: models `PascalCase`, tables/columns `snake_case` via `@@map`/`@map`, ids `VarChar(36)`
  uuid, soft delete `deletedAt`, migration names `phase<N>_<topic>` (`prisma-migrations` skill).
- Enums stored as Prisma enums; JSON columns for open-ended per-type payloads with a validated
  discriminated-union DTO.
- Error codes: constants per module (`auth-errors.ts` pattern); errors thrown as Nest exceptions
  and shaped by the global filter.
- Commits: Conventional Commits, lowercase subject, optional `(N.m)` iteration suffix as in
  `feat: local dev stack — MySQL 9.7, Redis, Mailpit, Nginx (0.4)`.

## Runtime facts to code against

- API prefix `/api/v1`; Swagger at `/api/docs` behind `SWAGGER_ENABLED`.
- `PrismaService` builds the client with `new PrismaMariaDb(DATABASE_URL)` (driver adapter); the
  seed and `prisma.config.ts` load env with `process.loadEnvFile` and run through `tsx`.
- Web talks to the API through nginx in the browser (`NEXT_PUBLIC_API_URL`) and directly for SSR
  (`API_INTERNAL_URL`).
- `localePrefix: 'never'` — locale comes from cookie/detection, not the path; `he` renders
  `dir="rtl"`; theme via `<html data-theme>` set pre-hydration.
- Trust-proxy list in `main.ts` includes the CDN and Docker ranges; keep it when editing bootstrap.
