# Gotchas (environment and tooling)

- **jsdom 29 under Node 26 has no Web Storage** → `apps/web/src/test-setup.ts` shims
  `localStorage`/`sessionStorage`. Remove the shim only when jsdom ships it (commit `dc67442`).
- **Node 26 dropped corepack** → Dockerfiles install pnpm via `npm i -g pnpm`.
- **Nest emit footgun with a `dist` anon volume**: `incremental: false` + `deleteOutDir: false`
  in `nest-cli.json`/tsconfig so `dist` always emits and the mount point is never removed.
- **Prisma 7 + `prisma.config.ts` does not load `.env`** → `process.loadEnvFile`; `prisma generate`
  in CI works with the placeholder URL.
- **Stale local container trap**: `docker ps` shows names, not versions —
  `docker inspect --format '{{.Config.Image}}' green-fluffy-mysql` must say `mysql:9.7`.
- **`pnpm` minimum-release-age policy** is on (`pnpm-workspace.yaml`): a just-published version may
  be refused; `minimumReleaseAgeExclude` lists the exceptions. Verify versions, then pin.
- **Editing `packages/shared` requires `docker compose build api web`** (baked into images).
- **`turbo.json` has `globalDependencies: [".env"]`** — a changed root `.env` invalidates caches.
- **Prettier runs on markdown in CI** (`format:check`): wiki, docs, agent and skill files must be
  prettier-clean; `next-env.d.ts` and `pnpm-lock.yaml` are ignored.
- **WSL2 + Docker Desktop**: `docker context ls` shows `default` (socket) and `desktop-linux`;
  published ports reach the Windows loopback through Docker Desktop. Windows Chrome is the Mdock
  browser; Playwright ignores Chrome resolver rules.
- **`curl … | grep -q` under `set -o pipefail`** misreports success (EPIPE → curl exit 23) — write
  the body to a file and grep the file (found in mrmichnik's deploy script, 2026-09-24).
- **`docker compose down -v`** wipes the local database and redis volumes — confirm first.
- `IMPLEMENTATION-PLAN.md` §3 still says Node 24 / pnpm 10 / `mysql 8.4` in places; README and
  `.nvmrc` (Node 26, pnpm 11, MySQL 9.7) are current.
- **Git identity**: this clone's `git config user.email` is the workstation's global (organisation)
  identity, while every commit in the history carries the owner's personal one. Set a repo-local
  `user.email` matching `git log -1 --format=%ae` before the first commit (`commit-hygiene`).
