---
name: local-stack
description: Starts, checks and troubleshoots the local Docker stack (MySQL 3308, Redis 6381, Mailpit 8025, nginx 8080, api 3001, web 3000) and runs database commands inside it. Use before e2e tests, when a service is unhealthy, when the app must be exercised for real, or when adopting the shared Mdock front door.
---

# Local stack

Everything runs in Docker; host ports are non-standard on purpose (myfinpro takes the defaults).

```bash
cp -n .env.example .env; cp -n apps/api/.env.example apps/api/.env; cp -n apps/web/.env.example apps/web/.env
docker compose up -d --build            # first run builds api/web dev images
docker compose ps                       # all six healthy?
docker compose exec api pnpm db:deploy && docker compose exec api pnpm db:seed
curl -fsS http://localhost:8080/api/v1/health   # via nginx; direct: :3001/api/v1/health, web :3000
```

Mailpit UI `http://localhost:8025`; Swagger `http://localhost:8080/api/docs`; MySQL
`localhost:3308`, Redis `localhost:6381`. `.env` files are gitignored copies of the examples
(placeholders only). Host tooling (Node 26 + pnpm 11) can run `pnpm dev`, tests and Prisma
commands from `apps/api` against the containers.

## Database

`pnpm db:migrate` (dev, creates a migration), `db:deploy`, `db:seed`, `db:studio`, `db:reset`
(destructive). Editing `packages/shared` requires `docker compose build api web`.

## Troubleshooting

- Unhealthy `api`: `docker compose logs -f api`; usually a failed migration or a missing env var.
- Wrong MySQL image running (stale container) → `stack-versions` drift section.
- Port clash → the myfinpro or mrmichnik stacks may be up; ports are set in root `.env`.
- Never `docker compose down -v` without confirming: it wipes the local database.

## Mdock (shared local front door — see `wiki/infra-context.md`)

The shared Traefik (`mdock-traefik`, network `mdock_net`) already routes the project's production
hostname to `green-fluffy-nginx:80`. Adoption in this repo = `docker-compose.mdock.yml` (PR #1):
the `nginx` service joins the external `mdock_net` network, no labels — routing is generated from
the infra registry. Set `MDOCK_PUBLIC_API_URL` and `MDOCK_DEV_ORIGINS` in the local `.env` for
same-origin API calls and hot reload (`wiki/deployment.md`). Hostnames are written only in the
infra registry, never in this repo.
