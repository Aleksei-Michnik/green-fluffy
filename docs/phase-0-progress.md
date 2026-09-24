# Phase 0 — Foundation

Design doc: [phase-0-design.md](phase-0-design.md). Entries reconstructed from git history on
2026-09-24; dates are commit dates.

## 0.1 — Monorepo scaffold (2026-07-04)

Commit `887f067`. pnpm 11 + Turborepo workspace, `packages/{tsconfig,eslint-config,shared}`,
prettier, `.nvmrc` = 26, `@green-fluffy/*` naming.

## 0.2 — API skeleton (2026-07-04)

Commit `6e6cd3f`. NestJS 11 bootstrap (helmet, CORS, cookies, trust proxy, pino, Swagger,
`/api/v1`), health module with DB/Redis/memory indicators, metrics, throttler, request context.

## 0.3 — Web skeleton + i18n×4 (2026-07-04)

Commit `3d55fcc`. App Router `[locale]` layout, next-intl for en/he/ru/uk (`localePrefix:
'never'`), RTL for `he`, theme toggle, `ui/{Button,Input,Toast,ErrorBoundary}`, header/footer.
Not done from the design step list: ESLint guard against hardcoded UI strings.

## 0.4 — Local dev stack (2026-07-09)

Commit `cf55b0e`. `docker-compose.yml`: mysql:9.7, redis:8.8-alpine, mailpit v1.30,
nginx:1.30-alpine, api/web dev images; ports 3308/6381/8080; Prisma 7 + MariaDB adapter verified
against MySQL 9.7; migration `phase0_init`; seed via tsx; README quick start.

## 0.5 — CI (2026-07-11)

Commits `15c3936`, `5efe56c`, `dc67442`. `ci.yml` (lint+typecheck+prettier, unit with coverage
artifact, build, gitleaks), `pr-check.yml` (Conventional PR titles); actions pinned by SHA;
jsdom Web Storage shim for Node 26. Not done: branch protection settings (owner action).

### Tests

90 api unit tests, 74 web unit tests, shared tests — all green in CI.

## 0.4a — mdock overlay, hot reload behind the shared proxy (2026-09-25)

PR #1 (`feat/mdock`: `97df06f`, `51e4ce9`) merged into `main` as `0ac5704` on 2026-09-24, CI run
36063042480 green. `docker-compose.mdock.yml` puts nginx on the proxy network; `next.config.ts`
reads `allowedDevOrigins` from `MDOCK_DEV_ORIGINS`; `NEXT_PUBLIC_API_URL` from
`MDOCK_PUBLIC_API_URL`; both only in the local `.env`. Verified 2026-09-25 through the proxy:
page 200, `/_next/static` chunk with the page's `Origin` 200 with the variable set and 403 with
it unset, HMR upgrade 101, an edit served on the next request, `/api/v1/health` 200 at the same
origin, headless Chrome load with every chunk 200 — table in `wiki/deployment.md`. Stack repair
on the way: rebuilt dev images and renewed anonymous volumes (`wiki/gotchas.md`). Also added
`.claude/settings.json` allowing agents to dispatch and watch workflows.

## 0.9 — design rewritten (2026-09-25), not implemented

Backups follow the shared model instead of the ported cron design, with the owner's answers of
2026-09-25 folded in: the tooling is infra's and reusable (`backup.sh` + `projects.conf` +
scheduled `backup.yml`, shipped to `/opt/shared/backup/` on every run like `certs.yml`); files
live under `/var/backups/<project>/<env>`, never in the project tree; dump inside the mysql
container with its own environment; 7 daily / 4 weekly; integrity check per file; weekly restore
drill on the server; age check that fails the run as the alert; same-disk accepted for now; SSH
step and secret names as in myfinpro. This repository keeps nothing backup-related beyond the
pre-deploy call in 0.8's workflow. A reusable workflow from infra was ruled out on verified
facts (private-repo components are shared with private repos only). BLOCKED on 0.8 and on the
infra tooling.

## 0.6–0.10 — deferred

BLOCKED: server provisioning, staging/production CD, backups and staging suites wait for the
shared infra templates and the dispatch-only production policy (`wiki/infra-context.md`).
