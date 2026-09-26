# Infra context — what green-fluffy needs from the sibling infra work

Last synced **2026-09-24** (Mdock section re-checked 2026-09-26) by reading `~/Aleksei-Michnik/infra` (private) and `~/mrmichnik`
(private). Refresh with the `infra-sync` skill / `infra-scout` agent. This is a **public**
repository: only paths, container names and network names may be written here — never server
addresses, usernames or hostnames-as-configuration; the private repos hold the topology.

## The shared picture

- One shared VDS hosts myfinpro (production + staging, blue/green), the three mrmichnik WordPress
  sites (staging live with production data as of 2026-09-24; production cutover pending) and,
  once deployed, green-fluffy. Docker networks `green-fluffy-{staging,production}-net` already
  exist on the server; `/opt/green-fluffy` exists; a `green-fluffy-deploy` SSH key is installed
  for the deploy user; **nothing is deployed yet** (no workflow, no images).
- **Shared edge**: today `myfinpro-nginx` binds 80/443 and routes by `Host`. Infra Phase 5
  (`infra/docs/07`) moves it to a neutral `shared-nginx` at `/opt/shared/nginx` with every tenant
  network declared in compose — **after** the WordPress cutover. Tenant contract: render
  `green-fluffy-<env>.conf` into the shared `conf.d/`, `nginx -t` inside the edge container, then
  reload — never restart; never write `nginx.conf`, `_default.conf`, `cloudflare-ips.conf`.
- **Deploy pattern (all projects)**: CI builds images → GHCR → scp config + ssh → health-gated
  blue/green slot switch. Canonical `deploy.sh` / workflows / vhost templates will be vendored
  from `infra/templates/` with a "synced from infra@sha" header (Phase 5) — **port from myfinpro
  only until those exist, and keep the diff small**.
- **Production never deploys as a side effect of a merge** (owner decision 2026-09-24, mrmichnik
  first): `deploy-production.yml` is `workflow_dispatch`-only with `ref` + a literal `confirm`
  input. Apply the same to green-fluffy's Phase 0.8 instead of the ported `push: [main]` trigger.
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

## Open items that block green-fluffy Phase 0.6–0.10

1. Infra Phase 5 templates (`deploy.sh`, workflows, vhost template) — not created yet.
2. Shared edge neutralization — after WordPress cutover and 7-day soak.
3. PTR / inbound mail work is unrelated to green-fluffy (its mail domain is a subdomain; outbound
   goes through the shared relay).
4. **No scheduled backups run on the shared server for any project** (infra `docs/13-deploy-runbook.md`
   §5, 2026-09-24). Phase 0.9 adopts them; nothing before it may assume they exist. Owner decision
   2026-09-25: the tooling is infra's, reusable for every project — `backup/{backup.sh,projects.conf}`
   - a scheduled `backup.yml` shipping to `/opt/shared/backup/` on every run (the `certs.yml`
     shape), files under `/var/backups/<project>/<env>`; this repo registers itself there and calls
     the pre-deploy dump from its production workflow, nothing more (`docs/phase-0-design.md` 0.9).

## What to re-check on every sync

`infra/docs/13-deploy-runbook.md` (cross-project deploy contract: matrix, flow, gaps),
`infra/docs/notes/next-session.md` (top and §2 table), `infra/docs/notes/phase-2-pipeline.md §1`,
`infra/mdock/{hosts.json,README.md}`, `infra/edge/`, `infra/templates/` (exists?), `infra/backup/` (exists?),
`infra/mail/README.md`, and `git -C ~/Aleksei-Michnik/infra log --since=<last sync>`;
`~/mrmichnik/scripts/{deploy,rollback}.sh` and `.github/workflows/deploy-*.yml` as the newest
reference implementation of the shared pattern (mrmichnik `main` at `4fe525f` on 2026-09-24:
dispatch-only production, hot reload for themes).
