# Testing (checked 2026-09-24)

## Stack and commands (repo root)

| Suite                 | Tool                               | Command                                                                           | Notes                                                     |
| --------------------- | ---------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Lint / types / format | eslint 10, tsc, prettier           | `pnpm lint && pnpm typecheck && pnpm format:check`                                | cheapest gate — always first                              |
| API unit              | Jest 30 + ts-jest, `*.spec.ts`     | `pnpm --filter @green-fluffy/api test`                                            | 90 tests green at 0.5                                     |
| API integration       | Jest + Testcontainers MySQL 9.7    | `pnpm test:integration`                                                           | **not yet ported** — arrives with Phase 1.2; needs Docker |
| Web / shared unit     | Vitest 4 + Testing Library + jsdom | `pnpm --filter @green-fluffy/web test`, `pnpm --filter @green-fluffy/shared test` | 74 web tests green                                        |
| Web E2E               | Playwright 1.61, `apps/web/e2e/`   | `pnpm test:e2e`                                                                   | `smoke.spec.ts` only so far; browsers must be installed   |
| Staging suites        | `test:staging`, `test:e2e:staging` | wired in root scripts, filled in 0.10                                             | gate production deploys (plan 0.8/0.10)                   |

Run scoped suites while iterating; run the full relevant suite before a verdict. CI (`ci.yml`)
runs lint+typecheck+prettier, unit tests with coverage artifact, build, and gitleaks.

## Gates (plan §4.7)

Business logic ≥ 80 %, overall ≥ 60 %, PR diff ≥ 70 %. Coverage thresholds are not yet enforced
in the jest/vitest configs — add them when the first domain module lands (Phase 2).

## Standing suites — mandatory once introduced, never removed

- **Access-control matrix** (from 4.2): role ∈ {anon, non-member, viewer, caretaker, owner} ×
  every subject-scoped endpoint → expected status/payload; every new endpoint registers itself
  (coverage assertion on route metadata). Extended to groups in 8.2.
- **Public serializer snapshots** (4.5): `PublicPetDto`/`PublicGroupDto` prove absence of geo,
  documents, members.
- **Upload security** (3.2): MIME spoof, SVG rejection, oversize, quota edge, EXIF-GPS byte scan.
- **Geo privacy sweep** (7.8): response-schema walk, SSR/OG/sitemap scan, log redaction.
- **Deletion cascade** (12.4): account deletion fixture ⇒ zero orphans.

## Patterns

- Integration harness: port myfinpro's `apps/api/test/helpers/testcontainers.ts`
  (`MySqlContainer('mysql:9.7')`, `prisma migrate deploy` against the container, utf8mb4).
- Time-sensitive code (reminders, expiry, DST) runs with an injected clock / fake timers.
- External providers (Nominatim, Open-Meteo, OSM) are tested against recorded fixtures — no live
  calls in CI.
- Test behaviour through public surfaces (endpoints, rendered components), not internals; never
  weaken a test to pass (no `.skip`, no broadened assertions, no raised timeouts to hide races).
- jsdom under Node 26 lacks Web Storage — `apps/web/src/test-setup.ts` shims it (`gotchas.md`).
