# Infra context — what green-fluffy needs from the sibling infra work

Last synced **2026-09-26** by reading `~/Aleksei-Michnik/infra` (private) and `~/mrmichnik`
(private). Refresh with the `infra-sync` skill / `infra-scout` agent. This is a **public**
repository: only paths, container names and network names may be written here — never server
addresses, usernames or hostnames-as-configuration; the private repos hold the topology.

## The shared picture

- One shared VDS hosts myfinpro (production + staging, blue/green), the three mrmichnik WordPress
  sites (all three in production on the acceptor since 2026-09-24) and,
  once deployed, green-fluffy. Docker networks `green-fluffy-{staging,production}-net` already
  exist on the server; `/opt/green-fluffy` exists; a `green-fluffy-deploy` SSH key is installed
  for the deploy user; **nothing is deployed yet** (no workflow, no images).
- **Shared edge**: today `myfinpro-nginx` binds 80/443 and routes by `Host`. Infra Phase 5
  (`infra/docs/07`) moves it to a neutral `shared-nginx` at `/opt/shared/nginx` with every tenant
  network declared in compose — **after** the WordPress cutover. Tenant contract: render
  `green-fluffy-<env>.conf` into the shared `conf.d/`, `nginx -t` inside the edge container, then
  reload — never restart; never write `nginx.conf`, `_default.conf`, `cloudflare-ips.conf`.
- **Deploy pattern (all projects)**: CI builds images → GHCR → scp config + ssh → health-gated
  blue/green slot switch. Canonical templates are an infra Phase 5 deliverable that does not
  exist yet (checked 2026-09-26). 0.7–0.10 port from myfinpro (workflows, compose split) and
  mrmichnik (`deploy.sh` tenant steps) now — exact steps in `docs/phase-0-design.md` — and switch
  to the synced copies ("synced from infra@sha") when they land.
- **Production trigger is per project** (owner, 2026-09-26): mrmichnik is dispatch-only (`ref` +
  a literal `confirm`; WordPress releases need the owner's review). myfinpro and green-fluffy
  keep the myfinpro pattern as-is: push to `develop` deploys staging, push to `main` (a PR from
  `develop`) deploys production gated on CI and staging tests younger than 24 h, with dispatch +
  `confirm` as the manual route. This supersedes the 2026-09-24 note that applied dispatch-only
  to every project.
- **Mail**: a shared outbound relay `shared-haraka` (alias `haraka:25` on `shared-mail-net`) is
  deployed; it does **not** sign DKIM — each client signs (Nodemailer in myfinpro). Phase 1.3 must
  therefore join `shared-mail-net` and sign DKIM in `mail.service.ts` instead of shipping its own
  Haraka container (the plan's per-project Haraka is superseded).
- **Secrets**: GitHub Actions secrets injected per run; no `.env` at rest on the server.

## Mdock — local development front door (infra Phase 6, being built now)

- `infra/mdock/hosts.json` registers `green-fluffy` → upstream `green-fluffy-nginx:80` on
  `mdock_net`; since 2026-09-26 without a `hostHeader` rewrite, so the proxy passes the production
  hostname as `Host` (the local nginx is the default server). `mdock-traefik` (Traefik v3.6) runs
  on this workstation; mrmichnik and this repo use it as the only local front door. The toolkit
  is our Mdocker — the ancestor of myorcare's Mdock — taking Mdock's improvements back.
- Adoption (PR #1 merged 2026-09-24 as an opt-in overlay; default since 2026-09-26): the `nginx`
  service joins the external `mdock_net` in `docker-compose.yml` — **no labels, no published
  port**. Routing is generated from the infra registry (`mdock.sh gen` → file-provider routers on
  `websecure` only; a router on `web` would outrank the proxy's http→https redirect). The
  hostname is written only in `hosts.json`; `mdock.sh gen` also derives
  `generated/env/<id>.env` (`MDOCK_HOST`, `MDOCK_URL`, `MDOCK_DEV_ORIGINS`), which compose loads
  as an optional `env_file` from the sibling checkout — the only app-side knob, and no longer a
  hand-written one. The browser-side API URL is relative. Hot reload is the rule for every
  project — see `wiki/deployment.md`.
- Playwright cannot use Chrome's resolver rules; derive staging/local base URLs from env.

## Open items (none blocks 0.6–0.10 any more — re-checked 2026-09-26)

1. Infra Phase 5 templates (`deploy.sh`, workflows, vhost template) — not created; the ported
   files serve until then.
2. Shared-edge neutralization — after the WordPress soak (≥ 2026-10-02); not blocking: the tenant
   contract works against today's edge (mrmichnik in production through it since 2026-09-24), and
   the edge vhost listens on port 80 only while the `michnik.pro` zone is Flexible (doc 04 §2.2.1).
3. PTR / inbound mail work is unrelated to green-fluffy (its mail domain is a subdomain; outbound
   goes through the shared relay).
4. Backups: the shared `infra/backup/` tooling of 0.9 is not built yet (`/opt/shared/backup`
   absent on 2026-09-26); building it is 0.9's first step, before the first production deploy.
   mrmichnik runs its own `backup.yml` since 2026-09-25, myfinpro its own since 2026-09-24
   (PR #53); both migrate to the shared tooling in Phase 5.
5. Owner steps on the way: branch protection on `main` and `develop`, public visibility of the two
   GHCR packages after the first build, the merges (`develop`, then `develop → main`).

## What to re-check on every sync

`infra/docs/13-deploy-runbook.md` (cross-project deploy contract: matrix, flow, gaps),
`infra/docs/notes/next-session.md` (top and §2 table), `infra/docs/notes/phase-2-pipeline.md §1`,
`infra/mdock/{hosts.json,README.md}`, `infra/edge/`, `infra/templates/` (exists?), `infra/backup/` (exists?),
`infra/mail/README.md`, and `git -C ~/Aleksei-Michnik/infra log --since=<last sync>`;
`~/mrmichnik/scripts/{deploy,rollback}.sh` and `.github/workflows/deploy-*.yml` as the newest
reference implementation of the shared pattern (mrmichnik `main` at `4fe525f` on 2026-09-24:
dispatch-only production, hot reload for themes).
