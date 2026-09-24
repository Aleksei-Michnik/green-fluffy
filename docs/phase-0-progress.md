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

## 0.6–0.10 — deferred

BLOCKED: server provisioning, staging/production CD, backups and staging suites wait for the
shared infra templates and the dispatch-only production policy (`wiki/infra-context.md`).
