# Deployment — how this project reaches local, staging and production

Checked **2026-09-24** against the workflows and the sibling repos; local proxy verification **2026-09-25**. The cross-project contract
(matrix, flow, gaps) is the private infra repo's `docs/13-deploy-runbook.md`; this page is the
green-fluffy detail. Public repository: roles and container names only, never addresses or
hostnames-as-configuration.

## Today

| Environment | State                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| local       | `mdock.sh up` (infra repo, our Mdocker toolkit), then `docker compose up -d --build` → the app at its **production URL** over TLS in the isolated browser (`mdock.sh browser green-fluffy`); `nginx` joins `mdock_net` and publishes no port (the only local URL since 2026-09-26; the opt-in overlay of PR #1, `0ac5704`, is folded in); dev images hot-reload (`nest start --watch`, `next dev` over bind-mounted `apps/*`). Direct `:3000` / `:3001` stay for host tooling; `http://localhost:8080` no longer exists |
| staging     | **none** — `ci.yml` and `pr-check.yml` only (Phase 0.7 pending)                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| production  | **none** (Phase 0.8 pending)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

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

## Local: the production URL, hot reload and what the app needs

Three things make the production hostname the local URL without writing it in this repository:

1. **Routing**: `nginx` is on the proxy's external network under the container name the infra
   registry expects; the proxy forwards the production hostname as `Host` (no rewrite since
   2026-09-26) and the local nginx is the default server, so the app sees the same `Host` it
   will see behind the shared edge.
2. **API URL**: the browser calls the page's own origin (`NEXT_PUBLIC_API_URL=/api/v1`; nginx
   routes `/api`), so nothing depends on where the stack is reached from.
3. **Hot reload**: Next 16 answers 403 to `/_next` dev requests that carry an `Origin` it does
   not know — the HMR websocket above all; plain asset loads send no `Origin` and pass. The
   check compares `Origin` with `allowedDevOrigins` (never with `Host`), so `next.config.ts`
   reads `MDOCK_DEV_ORIGINS`, which compose loads from the file `mdock.sh gen` derives from the
   registry (`../infra/mdock/generated/env/green-fluffy.env`, optional `env_file`; `MDOCK_ENV`
   in `.env` overrides the path). Missing or stale file → page loads, nothing reloads.

**Verified 2026-09-26** on the working tree of this change with Docker Desktop restarted, the
proxy up (`mdock.sh up`, routers regenerated without the `Host` rewrite), the stack recreated
from the new `docker-compose.yml`, all six containers healthy; `curl` with the mkcert CA and
`--resolve <host>:443:127.0.0.1`:

| Check                                                                 | Result                                                     |
| --------------------------------------------------------------------- | ---------------------------------------------------------- |
| page, `/api/v1/health`, `/api/docs` through the proxy                 | 200, 200, 200                                              |
| `/_next/static/chunks/…` with `Origin: https://<host>`                | 200                                                        |
| `/_next/webpack-hmr` upgrade with `--http1.1` and the page's `Origin` | 101                                                        |
| `MDOCK_DEV_ORIGINS` inside the `web` container                        | set, from the generated file (nothing in the local `.env`) |
| `Host` received by the API for the proxied health request             | the production hostname (see the API request log)          |
| `http://localhost:8080/`                                              | connection refused — the port is gone                      |
| `mdock.sh status`                                                     | `green-fluffy … → 200 … running, on mdock_net`             |

Before this change (2026-09-25, overlay + hand-written knobs) the same probes gave: page 200,
chunk 200 with `MDOCK_DEV_ORIGINS` set and 403 without, HMR 101 over HTTP/1.1 (404 over HTTP/2:
upgrade headers dropped), headless Chrome with every chunk 200, an edit served on the next
request. Probe websockets through the proxy with `curl --http1.1`.
