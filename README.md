# Green and Fluffy 🌱🐾

Care for any living being you love — animals **and** plants: at home, in the garden, on the farm, or on the street.

Pet & plant profiles, Instagram-like albums and stories, health diaries, feeding/watering logs and reminders, locations with weather monitoring, and safety recommendations ("is this plant dangerous for my cat?").

**Production**: `green-fluffy.michnik.pro` *(not yet configured)* · **Staging**: `stage-green-fluffy.michnik.pro` *(not yet configured)*

## Documentation

- [User Stories / Use Cases](SPECIFICATION-USER-STORIES.md)
- [Implementation Plan](IMPLEMENTATION-PLAN.md)
- Phase design documents: [docs/](docs/)

## Tech Stack

pnpm + Turborepo monorepo · NestJS API · Next.js web · TypeScript 6 · Prisma 7 + MySQL 9.7 (LTS) · next-intl (en, he, ru, uk) · Docker Compose + shared Nginx (blue-green deploys) · GitHub Actions CI/CD. Runtime: Node 26.

## Local Development

The whole stack runs in Docker. Host ports are deliberately non-standard
(MySQL **3308**, Redis **6381**, app via Nginx **8080**) so this stack can run
alongside the sibling [myfinpro](https://github.com/Aleksei-Michnik/myfinpro)
stack on the same machine.

### Prerequisites

- Docker Engine 25+ and Docker Compose v2+
- (Optional, for running tooling on the host) Node 26 + pnpm 11 — `nvm use` reads `.nvmrc`

### Quick start (fresh clone)

```bash
# 1. Environment files (placeholders only — safe local defaults)
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 2. Start the full stack (builds the api/web images on first run)
docker compose up -d --build

# 3. Apply database migrations and seed the baseline row
docker compose exec api pnpm db:deploy
docker compose exec api pnpm db:seed
```

Then open:

| Service            | URL                                   |
| ------------------ | ------------------------------------- |
| Web (via Nginx)    | http://localhost:8080                 |
| API health         | http://localhost:8080/api/v1/health   |
| Web (direct)       | http://localhost:3000                 |
| API (direct)       | http://localhost:3001/api/v1/health   |
| Swagger docs       | http://localhost:8080/api/docs        |
| Mailpit (email UI) | http://localhost:8025                 |

MySQL is reachable on `localhost:3308`, Redis on `localhost:6381`.

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
