---
name: stack-versions
description: Authoritative runtime and dependency versions for this project and the rule to always verify the latest stable release online before pinning. Read before adding a dependency, choosing a container image or tag, editing Dockerfiles, compose files, .nvmrc or CI, or debugging a version-mismatch symptom.
---

# Stack versions (verified 2026-09-24 against the repo)

| Component                                                                                                                                                                       | Version in repo                                  | Pinned in                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| Node.js                                                                                                                                                                         | **26** (`.nvmrc` = 26; host runs 26.5)           | `.nvmrc`, `engines.node >= 26`, Dockerfiles, CI                |
| pnpm                                                                                                                                                                            | **11.9.0**                                       | root `package.json` `packageManager`                           |
| TypeScript                                                                                                                                                                      | **6.0.x**                                        | root + `apps/*` devDependencies                                |
| NestJS                                                                                                                                                                          | 11.1.x                                           | `apps/api/package.json`                                        |
| Prisma                                                                                                                                                                          | 7.8.x + `@prisma/adapter-mariadb`, `mariadb` 3.5 | `apps/api/package.json`                                        |
| Next.js                                                                                                                                                                         | 16.2.x, React 19.2, Tailwind 4.3, next-intl 4.13 | `apps/web/package.json`                                        |
| Jest 30 / Vitest 4 / Playwright 1.61 / eslint 10 / prettier 3.9                                                                                                                 | —                                                | per package                                                    |
| UI kit: lucide-react 1.47, clsx 2.1, tailwind-merge 3.7, @fontsource-variable/rubik 5.3, axe-core 4.13, @axe-core/playwright 4.13, user-event 14.6, eslint-plugin-jsx-a11y 6.10 | verified on npm 2026-09-25                       | `apps/web/package.json`, `packages/eslint-config/package.json` |
| MySQL                                                                                                                                                                           | **9.7** (LTS line)                               | `docker-compose.yml` `image: mysql:9.7`                        |
| Redis                                                                                                                                                                           | **8.8** (`redis:8.8-alpine`)                     | `docker-compose.yml`                                           |
| nginx                                                                                                                                                                           | 1.30-alpine · Mailpit v1.30                      | `docker-compose.yml`                                           |

## The rule

**Always the latest stable version, verified online at the moment of choosing** (npm registry,
nodejs.org, Docker Hub, GitHub releases) — never from memory, never from myfinpro's pins (it
lags: Node 24, pnpm 10, TS 5.9 in places). Adapt code to breaking changes instead of
downgrading. If a compose tag or lockfile disagrees with this table, the files win and this
table is stale — fix it.

Check a version: `npm view <pkg> version`, `npm view <pkg> dist-tags`,
`curl -s https://nodejs.org/dist/index.json | head`, Docker Hub tags page.
pnpm's minimum-release-age policy may refuse a release published hours ago — wait or add an
explicit `minimumReleaseAgeExclude` entry with a reason.

## Drift symptoms

- `caching_sha2_password` / handshake errors from a host process → check the running image:
  `docker inspect --format '{{.Config.Image}}' green-fluffy-mysql` must say `mysql:9.7`;
  recreate with `docker compose up -d --force-recreate mysql` (destroys local data — confirm).
- `corepack: not found` → Node 26 dropped it; install pnpm with npm.
- jsdom Web Storage missing under Node 26 → see `wiki/gotchas.md`.
