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
- **Anonymous volumes survive `docker compose up -d --build`/`--force-recreate`**: the
  `node_modules` and `dist` volumes keep whatever a start-time `pnpm install` put there (seen
  2026-09-25: `@prisma/client` 7.9.0 in the volume vs 7.8.0 in the lockfile → "no exported member
  PrismaClient", `web` crash-looping on a missing registry version). After a rebuild run
  `docker compose up -d -V` (renew anonymous volumes).
- **curl to the mdock proxy negotiates HTTP/2**, where `Upgrade: websocket` is not a thing — an
  HMR handshake probe returns 404. Use `--http1.1` (→ 101). Browsers do this themselves.
- **`api` health 503 "pool timeout" for a few minutes right after a fresh recreate** (2026-09-25),
  while a direct driver query from the same container succeeded; cleared by itself, cause not
  determined. Wait one healthcheck cycle before digging.
- **pnpm 11 applies a default minimum release age** even though `pnpm config get minimumReleaseAge`
  prints `undefined`: `pnpm add lucide-react` on 2026-09-25 resolved 1.47.0 while 1.48.0 (published
  ~20 h earlier) was `latest`. Expect a one-day lag behind npm; do not hand-pin the newer one.
- **jsdom 29 has `HTMLDialogElement` without `showModal()`/`show()`/`close()`** (and no
  `matchMedia`) — `apps/web/src/test-setup.ts` shims the dialog methods; `useRipple` guards
  `matchMedia`. React maps `onAnimationEnd` to a prefixed event in jsdom, so the ripple cleanup is
  a timer (`RIPPLE_DURATION_MS`), not an `animationend` listener.
- **Tailwind 4 `outline-none` + `focus-visible:outline-3` renders no ring**: `outline-none` sets
  `--tw-outline-style: none` and `outline-<n>` reuses that variable. The `focus-ring` utility adds
  `focus-visible:outline-solid` to reset it — verified by compiling `globals.css` (2026-09-25).
- **`apps/web/.next` on the host is root-owned** (created by an earlier Docker run): a host
  `next build` cannot write there; build inside the container (`docker compose run --rm --no-deps
web pnpm run build`) or `sudo rm -rf` the directory first.
- **tailwind-merge does not know custom radius/shadow/ease/animate names** (`rounded-control` vs
  `rounded-full` were both kept) — `src/lib/cn.ts` registers them via `extendTailwindMerge`;
  colour tokens need no registration.
- **Docker Desktop down on WSL2** (typically after a Windows reboot) looks like a missing
  `/var/run/docker.sock` and `docker: unknown command: docker compose` — Desktop mounts the
  Compose plugin. Start Docker Desktop; the stack's `restart: unless-stopped` brings it back.
