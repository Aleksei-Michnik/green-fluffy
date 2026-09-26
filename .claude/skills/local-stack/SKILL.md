---
name: local-stack
description: Starts, checks and troubleshoots the local Docker stack — the app at its production URL through the shared proxy toolkit from the infra repo (MySQL 3308, Redis 6381, Mailpit 8025, direct api 3001 and web 3000) — and runs database commands inside it. Use before e2e tests, when a service is unhealthy, when the app must be exercised for real, or when the proxy, hostname or hot reload misbehaves.
---

# Local stack

Everything runs in Docker and the app is browsed at its **production URL** through the shared
local proxy from the infra repo (`../infra/mdocker`, our Mdocker toolkit): TLS on `127.0.0.1:443`,
routing by hostname to `green-fluffy-nginx`, which publishes no port. The hostname lives only in
the infra registry (`hosts.json`) — never in this repository. Datastore ports are non-standard
on purpose (myfinpro takes the defaults).

```bash
cp -n .env.example .env; cp -n apps/api/.env.example apps/api/.env; cp -n apps/web/.env.example apps/web/.env
(cd ../infra/mdocker && ./mdocker.sh up)    # once per boot: mdocker_net, certificate, routers, generated/env/*.env
docker compose up -d --build            # first run builds api/web dev images
docker compose ps                       # all six healthy?
docker compose exec api pnpm db:deploy && docker compose exec api pnpm db:seed
(cd ../infra/mdocker && ./mdocker.sh status)   # every host end to end; green-fluffy must say 200, "on mdocker_net"
(cd ../infra/mdocker && ./mdocker.sh browser green-fluffy)   # isolated Chrome at the production URL
```

From a shell: `H=$(sed -n 's/^MDOCKER_HOST=//p' ../infra/mdocker/generated/env/green-fluffy.env)`, then
`curl --cacert "$(mkcert -CAROOT)/rootCA.pem" --resolve "$H:443:127.0.0.1" "https://$H/api/v1/health"`.
Swagger at `https://$H/api/docs`; direct ports `:3001/api/v1/health` and web `:3000` still work
for host tooling. Mailpit UI `http://localhost:8025`; MySQL `localhost:3308`, Redis
`localhost:6381`. `.env` files are gitignored copies of the examples (placeholders only). Host
tooling (Node 26 + pnpm 11) can run `pnpm dev`, tests and Prisma commands from `apps/api`
against the containers.

## Database

`pnpm db:migrate` (dev, creates a migration), `db:deploy`, `db:seed`, `db:studio`, `db:reset`
(destructive). Editing `packages/shared` requires `docker compose build api web`.

## Troubleshooting

- Unhealthy `api`: `docker compose logs -f api`; usually a failed migration or a missing env var.
  `pool timeout: failed to retrieve a connection` right after MySQL (re)started → `DATABASE_URL`
  lacks `allowPublicKeyRetrieval=true` (`wiki/gotchas.md`).
- After `docker compose build` (or when the log shows a start-time `pnpm install`, a missing
  `PrismaClient` export or a version the registry does not know): `docker compose up -d -V` —
  anonymous `node_modules`/`dist` volumes outlive a rebuild (`wiki/gotchas.md`).
- Wrong MySQL image running (stale container) → `stack-versions` drift section.
- Port clash → the myfinpro or mrmichnik stacks may be up; ports are set in root `.env`.
- Never `docker compose down -v` without confirming: it wipes the local database.

## The proxy, the hostname and hot reload (see `wiki/infra-context.md`)

- `docker-compose.yml`: `nginx` joins the external `mdocker_net` (created by `mdocker.sh up`) — no
  labels, no port; the routers are generated from the infra registry. Without the network the
  stack does not start: run `mdocker.sh up` (or `docker network create mdocker_net` on a machine
  without the proxy and use the direct web port).
- The proxy forwards the real `Host`; the local nginx is the default server and accepts any name.
- Browser-side API URL is relative (`NEXT_PUBLIC_API_URL=/api/v1`): same origin as the page.
- Next 16 serves `/_next` dev requests (assets, HMR socket) only to origins it knows, so compose
  loads `MDOCKER_DEV_ORIGINS` from `../infra/mdocker/generated/env/green-fluffy.env` (optional
  `env_file`; `MDOCKER_ENV` in `.env` overrides the path). Page loads but nothing reloads → that
  file is missing or stale: `mdocker.sh gen`, then `docker compose up -d web`.
- Probe websockets through the proxy with `curl --http1.1`; over HTTP/2 the upgrade is dropped.
- Blank, "Untitled" tab in the mdocker browser although `curl` through the proxy gets 200 → the
  window runs a Chrome older than the installed one (background update): `mdocker.sh status`
  "browser" line; `mdocker.sh browser green-fluffy --relaunch`. Not a stack problem.
- Docker Desktop down (after a Windows reboot) looks like `/var/run/docker.sock` missing and
  `docker: unknown command: docker compose` — Desktop mounts the Compose plugin (`wiki/gotchas.md`).
