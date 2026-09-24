# Architecture map (checked 2026-09-24)

Condensed from `IMPLEMENTATION-PLAN.md` §1, §4–6. The plan and `docs/phase-N-design.md` are the
source of truth; this page is the orientation layer.

## Monorepo

```
apps/api        NestJS 11 — @green-fluffy/api      (Prisma 7 + @prisma/adapter-mariadb → MySQL 9.7)
apps/web        Next.js 16 App Router — @green-fluffy/web  (React 19, Tailwind 4, next-intl)
packages/shared @green-fluffy/shared — LOCALES, PAGINATION, API envelope + pagination DTOs
packages/eslint-config, packages/tsconfig            shared flat configs / TS bases
packages/species-data                                created in Phase 2 (dataset + validator + KB rules)
infrastructure/{docker,nginx,mysql}                  local images, dev nginx, DB init SQL
docs/                                                plan + design docs; progress docs (see progress-log skill)
wiki/                                                this directory
```

Existing API modules: `common/{context,decorators,filters,interceptors,logger,metrics,pipes,throttler}`,
`config/`, `health/`, `prisma/`. Existing web: `[locale]` layout + landing, `components/{layout,ui}`,
`i18n/{routing,request,navigation}`, `lib/api-client`, `proxy.ts`, `messages/{en,he,ru,uk}.json`.

## Module map by phase (API `apps/api/src/<module>` · web `apps/web/src/...`)

| Phase | API modules                                                 | Web surfaces                                           | Design doc             |
| ----- | ----------------------------------------------------------- | ------------------------------------------------------ | ---------------------- |
| 1     | `auth` (ported), `mail`                                     | `auth/*`, `settings/account`, `legal/*`                | `docs/phase-1-design`  |
| 2     | `species`, `pet` (+ `packages/species-data`)                | `pets`, `pets/new`, `pets/[petId]`, `components/pet`   | `docs/phase-2-design`  |
| 3     | `media` (storage adapter, processing, quota), `album`       | `components/media`, `components/album`                 | `docs/phase-3-design`  |
| 4     | `PetAccessService` + `PetAccessGuard`, invites, `public/*`  | `p/[petId]` (SSR), `pets/invite/[token]`, sharing      | `docs/phase-4-design`  |
| 5     | `diary`, `measurement`, `document`, `procedure`, `provider` | diary/health/documents tabs, procedures, providers     | `docs/phase-5-design`  |
| 6     | `care`, `reminder`, `notification`, `queue` (BullMQ)        | `today`, `pets/[petId]/care`, `settings/notifications` | `docs/phase-6-design`  |
| 7     | `location` (Nominatim), `weather` (Open-Meteo)              | `components/map` (client-only)                         | `docs/phase-7-design`  |
| 8     | `pet-group` (+ `SubjectAccessService` refactor)             | `groups/*`, `components/group`                         | `docs/phase-8-design`  |
| 9     | `knowledge` (engines, kb-sync, warnings)                    | dashboard warnings panel, recommendations tab          | `docs/phase-9-design`  |
| 10    | `social` (follow/like/comment/feed/moderation)              | `feed`, `moderation`, `components/social`              | `docs/phase-10-design` |
| 11    | `story`                                                     | `components/story`                                     | `docs/phase-11-design` |
| 12    | `export`, `privacy`                                         | `settings/privacy`, `settings/export`                  | `docs/phase-12-design` |

Dependency edges that matter for parallel work: 2→3→4; 5 needs 3+4; 6 needs 4+5; 7 needs 4 (+6 for
alerts); 8 needs 4+6+7; 9 needs 2+6+8 (+7 optional); 10 needs 3+4+6; 11 needs 3+4+10; 12 needs all.
6 and 7 are independent of each other.

## Cross-cutting invariants (plan §4–5)

- **Cursor pagination** everywhere: `{ data, cursor, hasMore }`; DTOs in `packages/shared`.
- **Global exception filter** + standardized error codes; class-validator whitelist on every DTO.
- **Expand-then-contract migrations only** (blue/green); indexes per list pattern (plan §4.6).
- **Access resolved server-side** by one resolver (`PetAccessService` → `SubjectAccessService`);
  roles OWNER / CARETAKER / VIEWER / PUBLIC / NONE; unauthorized private subject ⇒ **404**, not 403.
- **Public DTOs are separate classes** — no precise geo, documents, members at the type level.
- **Media**: magic-byte MIME whitelist, size caps, EXIF removed by re-encoding, opaque keys outside
  web root, served only through the API with access checks.
- **Audit log** on auth, visibility, location, document access, deletions, moderation (90 days).
- **All timestamps UTC**; reminders evaluated in the reminder's IANA timezone; user timezone for UI.
- **4 locales from day one** (`en`, `he` RTL, `ru`, `uk`) for UI strings, emails, species names.
