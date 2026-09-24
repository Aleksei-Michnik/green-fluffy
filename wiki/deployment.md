# Deployment — how this project reaches local, staging and production

Checked **2026-09-24** against the workflows and the sibling repos. The cross-project contract
(matrix, flow, gaps) is the private infra repo's `docs/13-deploy-runbook.md`; this page is the
green-fluffy detail. Public repository: roles and container names only, never addresses or
hostnames-as-configuration.

## Today

| Environment | State                                                                                                                                                                                                                                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| local       | `docker compose up -d --build` → `http://localhost:8080` (nginx → web :3000, api :3001); dev images hot-reload (`nest start --watch`, `next dev` over bind-mounted `apps/*`). Optional: `docker-compose.mdock.yml` serves the stack at its production hostname over TLS through the shared local proxy (PR #1) |
| staging     | **none** — `ci.yml` and `pr-check.yml` only (Phase 0.7 pending)                                                                                                                                                                                                                                                |
| production  | **none** (Phase 0.8 pending)                                                                                                                                                                                                                                                                                   |

CI on every push and PR to `main`: lint, typecheck, prettier, unit tests with coverage, build,
gitleaks; PR titles checked. Branch protection is an owner action, not yet done.

## The pipeline this project inherits (Phase 0.7–0.8)

The two deployed sibling projects share one shape, and this one adopts it unchanged:

1. CI builds `api` and `web` images from a clean checkout and pushes them to GHCR, tagged
   `<env>-<sha7>`.
2. The deploy workflow copies the deploy files (`docker-compose.*.yml`, nginx templates, `scripts/`)
   to `/opt/green-fluffy/<env>` on the shared server and runs `scripts/deploy.sh <env> <tag>` over
   SSH with the secrets exported into that session — nothing written to disk.
3. `deploy.sh` starts the idle blue/green slot beside the live one, waits for container health,
   runs migrations, renders `green-fluffy-<env>.conf` into the shared edge's `conf.d/`, `nginx -t`
   inside the edge container, reload (never restart), verifies through the real request path,
   records `.active-slot` + `.deploy-metadata`, retires the old slot. `rollback.sh <env>` reverses it.
4. Staging deploys on push to `develop` (to be created); production is **dispatch-only** with a
   `ref` that must be on `main` and a literal `confirm` input — never on push. The newest reference
   implementation of all of this is `~/mrmichnik` (`scripts/deploy.sh`, `.github/workflows/deploy-*.yml`);
   canonical templates arrive with infra Phase 5 and are vendored with a "synced from infra@sha" header.

Blocked on: infra Phase 5 templates and the shared-edge neutralization (after the WordPress
cutover and its soak). Networks `green-fluffy-{staging,production}-net`, `/opt/green-fluffy` and
the deploy key already exist on the server.

## Local hot reload behind the proxy

Next 16 answers 403 to `/_next` dev requests (assets, the HMR socket) from an origin it does not
know; behind the proxy the page origin is the production hostname while Next sees `localhost`.
`next.config.ts` therefore reads `allowedDevOrigins` from `MDOCK_DEV_ORIGINS`, and
`NEXT_PUBLIC_API_URL` from `MDOCK_PUBLIC_API_URL` — both set only in the developer's local `.env`
and passed through by the overlay.

## Verify and roll back (once deployed)

`/health` on the edge, the home page 200 with a full body, container logs clean; roll back with
`scripts/rollback.sh <env>` on the server. Databases are not rolled back by a slot rollback: a
release that migrates the schema needs a dump first. Scheduled backups do not exist yet on the
shared server for any project (2026-09-24) — Phase 0.9 must not assume they do.
