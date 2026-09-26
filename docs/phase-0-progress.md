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

## 0.3a — UI kit foundation (2026-09-25)

PR #2 (`feat/ui-kit`: `51ea9d1`, CI run 36109903981 green) merged into `main` as `88c4dd1` on
2026-09-25, CI run 36110121604 green. Spec: `docs/ui/0.3a-ui-kit.md`; design:
`docs/phase-0-design.md` 0.3a; catalogue: `wiki/ui-kit.md`; system: `wiki/ui-design-system.md`.

### Web

Semantic, theme-aware tokens in `globals.css` (warm leaf green primary, apricot accent, warm
neutrals; `@theme inline` utilities such as `bg-surface`, `text-ink-muted`, `outline-focus`),
one `focus-ring` and one `pressable` utility, `useRipple`, named animations, a global
reduced-motion rule, Rubik self-hosted (Latin + Cyrillic + Hebrew). Primitives: Button,
LinkButton, IconButton, Spinner, Field + Input/Textarea/Select, Checkbox, Switch, Card, Badge,
Chip, Alert, Toast (through Alert), Dialog (native `<dialog>`), Skeleton, EmptyState;
ThemeToggle, Header, Footer, ErrorBoundary, landing and 404 restyled; skip link and `main`
landmark in the locale layout. Dev-only `/kit` showcase (404 in production). Strings inside
primitives read the `ui` namespace, present in all four locale files. `jsx-a11y/recommended`
added to the shared ESLint config. Dependencies verified on npm the same day: lucide-react,
clsx, tailwind-merge, @fontsource-variable/rubik, axe-core, @axe-core/playwright,
@testing-library/user-event, eslint-plugin-jsx-a11y.

### Tests

141 web unit tests green (22 files; every primitive with `expectNoA11yViolations`, keyboard
via user-event, one non-English assertion each). Playwright `kit.spec.ts` + `smoke.spec.ts`:
40 passed on chromium and mobile-chrome against the local stack — axe (WCAG 2.2 AA +
best-practice) clean in 4 locales × 2 themes, focus ring, modal dialog, toasts, reduced motion.
`pnpm lint && pnpm typecheck && pnpm format:check` green. Production build (`next build` inside
the web image with `NODE_ENV=production`) green: routes `/_not-found`, `/[locale]`,
`/[locale]/kit`, `/api/health`.

### Decisions

Semantic tokens only in components; native elements first (`<dialog>`, `<select>`, checkbox);
showcase English-only; ripple cleanup by timer; see `wiki/decisions.md` (2026-09-25 rows).

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

## 0.4b — the production hostname is the only local URL (2026-09-26)

Owner's direction: local must mirror production including the domain, as mrmichnik does through
the infra repo's proxy toolkit (our Mdocker, the ancestor of myorcare's Mdock). The opt-in overlay
of 0.4a is folded into `docker-compose.yml`: `nginx` joins the external `mdock_net` and publishes
no port; `mdock.sh up` precedes `docker compose up`; `http://localhost:8080` no longer exists
(direct `:3000`/`:3001` stay for host tooling). The browser-side API URL is relative (`/api/v1`).
The one thing the app needs from the registry — the origin for Next's `allowedDevOrigins` — is
loaded from `../infra/mdock/generated/env/green-fluffy.env`, which `mdock.sh gen` now derives
from `hosts.json` (optional `env_file`, `MDOCK_ENV` override); nothing hand-written, no hostname
in this repository. Infra side: `hostHeader: localhost` dropped for green-fluffy so the proxy
passes the real `Host`, and the local nginx became the default server (444 catch-all removed).
Verification table in `wiki/deployment.md`: page/API/Swagger 200, asset with `Origin` 200, HMR
101, `MDOCK_DEV_ORIGINS` in the container, the production hostname as `Host` in the API log,
`localhost:8080` refused, `mdock.sh status` green.

Found and fixed on the way (the workstation had rebooted): after a MySQL restart the API stayed
503 with pool timeouts until some other client had logged in — `caching_sha2_password` full
authentication over plain TCP needs the server's RSA key, which the `mariadb` driver fetches
only with `allowPublicKeyRetrieval=true`. Added to the container and example `DATABASE_URL`s;
reproduced with `FLUSH PRIVILEGES` (503 for 70 s, 300 aborted connects) and re-verified with
the option (healthy in 10 s, none). `wiki/gotchas.md`.

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
