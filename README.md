# Green and Fluffy 🌱🐾

Care for any living being you love — animals **and** plants: at home, in the garden, on the farm, or on the street.

Pet & plant profiles, Instagram-like albums and stories, health diaries, feeding/watering logs and reminders, locations with weather monitoring, and safety recommendations ("is this plant dangerous for my cat?").

**Production**: `green-fluffy.michnik.pro` _(not yet configured)_ · **Staging**: `stage-green-fluffy.michnik.pro` _(not yet configured)_

## Documentation

- [User Stories / Use Cases](SPECIFICATION-USER-STORIES.md)
- [Implementation Plan](IMPLEMENTATION-PLAN.md)
- Phase design documents: [docs/](docs/)

## Tech Stack

pnpm + Turborepo monorepo · NestJS API · Next.js web · TypeScript 6 · Prisma 7 + MySQL 9.7 (LTS) · next-intl (en, he, ru, uk) · Docker Compose + shared Nginx (blue-green deploys) · GitHub Actions CI/CD. Runtime: Node 26.

## Local Development

The whole stack runs in Docker and is browsed at its **production URL** — the same hostname,
over TLS — through the shared local reverse proxy from the private infra repo (`mdocker/`). It
terminates TLS on `127.0.0.1:443` and routes by hostname to this stack's `nginx`, which publishes
no port of its own; an isolated browser resolves the production hostnames to the proxy while your
normal browser keeps reaching the real sites. The hostname is registered there, never here.
Datastore ports are deliberately non-standard (MySQL **3308**, Redis **6381**) so this stack runs
alongside the sibling [myfinpro](https://github.com/Aleksei-Michnik/myfinpro) and mrmichnik
stacks on the same machine.

### Prerequisites

- Docker Engine 25+ and Docker Compose v2.24+ (Docker Desktop on WSL2: its port forwarding is
  what makes `127.0.0.1` mean the same thing to the Windows browser and to the containers)
- The infra repo cloned beside this one (`../infra`) with its proxy prerequisites (`mkcert`, `jq`)
- (Optional, for running tooling on the host) Node 26 + pnpm 11 — `nvm use` reads `.nvmrc`

### Quick start (fresh clone)

```bash
# 1. Environment files (placeholders only — safe local defaults)
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 2. The shared proxy: network, certificate, routers — once per boot
(cd ../infra/mdocker && ./mdocker.sh up)

# 3. Start the full stack (builds the api/web images on first run)
docker compose up -d --build

# 4. Apply database migrations and seed the baseline row
docker compose exec api pnpm db:deploy
docker compose exec api pnpm db:seed

# 5. The app, at its production URL, in the isolated browser
(cd ../infra/mdocker && ./mdocker.sh browser green-fluffy)
```

| Service            | Where                                                                   |
| ------------------ | ----------------------------------------------------------------------- |
| Web, API, Swagger  | `https://<production hostname>` — `/`, `/api/v1/health`, `/api/docs`    |
| Web (direct)       | http://localhost:3000                                                   |
| API (direct)       | http://localhost:3001/api/v1/health                                     |
| Mailpit (email UI) | http://localhost:8025 — every outbound mail is captured, none delivered |

MySQL is reachable on `localhost:3308`, Redis on `localhost:6381`. From a shell, reach the app the
way `curl` says it: `curl --cacert "$(mkcert -CAROOT)/rootCA.pem" --resolve <host>:443:127.0.0.1
https://<host>/api/v1/health`; `./mdocker.sh status` in the infra repo shows every host end to end.

### How the production URL works here

- `nginx` joins the proxy's external network `mdocker_net` under the container name the infra
  registry expects; the proxy forwards the production hostname as `Host`, exactly as the shared
  edge does on the server, and `nginx` answers to whatever name it is sent.
- The browser calls the API at the page's own origin (`NEXT_PUBLIC_API_URL=/api/v1`), so the URL
  is the same at the production hostname and anywhere else the stack is reached.
- Hot reload: the dev images run `nest start --watch` and `next dev` over the bind-mounted
  sources. Next 16 only serves `/_next` dev requests (assets, the HMR socket) to origins it
  knows, so `docker compose` loads `MDOCKER_DEV_ORIGINS` from the file `mdocker.sh gen` derives from
  the registry (`../infra/mdocker/generated/env/green-fluffy.env`; `MDOCKER_ENV` in `.env` points
  elsewhere when the infra checkout is not a sibling). Without it the stack still runs and the
  page loads, but nothing reloads.
- The isolated browser pins the proxy's local CA until `./mdocker.sh trust` makes the machine trust
  it; the proxy's README in the infra repo has the rest.

### Database commands

Run inside the api container (`docker compose exec api …`) or on the host from
`apps/api` if you have Node 26 installed:

```bash
pnpm db:migrate    # create + apply a new migration (dev)
pnpm db:deploy     # apply existing migrations (no shadow DB) — used in the quick start
pnpm db:seed       # run prisma/seed.ts
pnpm db:studio     # open Prisma Studio
pnpm db:reset      # drop, re-apply migrations, re-seed (destructive)
```

### Everyday commands

```bash
docker compose ps                 # service status/health
docker compose logs -f api web    # tail app logs
docker compose restart api        # restart a service
docker compose down               # stop the stack (keeps volumes/data)
docker compose down -v            # stop and wipe the database/redis volumes
```

### Notes

- The `api` and `web` images build the shared package and generate the Prisma
  client at image-build time, so a fresh clone boots with only the commands
  above. Editing `packages/shared` requires `docker compose build api web`.
- App source (`apps/api`, `apps/web`) is bind-mounted for hot reload.
- CI does not start this stack; a machine without the proxy can still create the network
  (`docker network create mdocker_net`) and use the direct web port.
- Migrations run as a dev user with broad local privileges so Prisma can manage
  its shadow database. Production uses a tightly-scoped user + `db:deploy`.

## Workspace scripts (host)

```bash
pnpm install       # install all workspace dependencies
pnpm dev           # run api + web in watch mode (requires Node 26 on host)
pnpm lint          # eslint across all packages
pnpm typecheck     # tsc --noEmit across all packages
pnpm test          # unit tests (api, web, shared)
pnpm build         # production build of every package
```

## Sister Project

Authentication (email, Google, Telegram), user management, timezone handling, and the deployment infrastructure are reused from [myfinpro](https://github.com/Aleksei-Michnik/myfinpro), which shares the same VDS and architectural conventions.

## Security

This is a **public repository**. No API keys, secrets, passwords, or tokens are ever committed — all secrets live in GitHub Actions secrets and server-side environment variables. The committed `.env.example` files contain local-only placeholder values, never real credentials. See the security sections of the [implementation plan](IMPLEMENTATION-PLAN.md).
