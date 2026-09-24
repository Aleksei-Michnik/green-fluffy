# Learnings log

Append-only. Written by the `learn` skill: one row per finding, newest last. `Applied to` names
the agent / skill / wiki page / index that was updated so the lesson sticks.

| Date       | Finding                                                                                                  | Evidence                                                  | Applied to                                    |
| ---------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------- |
| 2026-09-24 | Per-project Haraka is superseded by the shared relay with client-side DKIM                               | infra `mail/README.md`                                    | `wiki/infra-context.md`, `decisions.md`       |
| 2026-09-24 | Production deploys must be dispatch-only; ported `push: [main]` trigger is wrong for 0.8                 | infra `next-session.md` §2                                | `wiki/infra-context.md`, `devops` agent       |
| 2026-09-24 | Mdock registry already contains green-fluffy; adoption is a small compose change in this repo            | `infra/mdock/hosts.json`                                  | `wiki/infra-context.md`, `devops` agent       |
| 2026-09-24 | This repo's commits carry the Claude co-author trailer; myfinpro's rules differ                          | `git log`                                                 | `commit-hygiene` skill                        |
| 2026-09-24 | Clone's git identity (global, organisation) differs from the repo history (personal)                     | `git config user.email` vs `git log`                      | `wiki/gotchas.md`, `commit-hygiene` skill     |
| 2026-09-24 | Mdock adoption is network membership only; routers are generated (websecure only), never labels          | infra `mdock/traefik/docker-compose.yml`, sibling session | `wiki/infra-context.md`, `local-stack` skill  |
| 2026-09-24 | No scheduled backups exist on the shared server for any project; 0.9 must not assume them                | infra `docs/13-deploy-runbook.md` §5                      | `wiki/infra-context.md`, `wiki/deployment.md` |
| 2026-09-25 | Hot reload behind mdock verified end to end; 403 without `MDOCK_DEV_ORIGINS`, 200 with; HMR 101          | `wiki/deployment.md` table                                | `wiki/deployment.md`, `decisions.md`          |
| 2026-09-25 | Rebuilt dev images still fail until anonymous volumes are renewed (`up -d -V`)                           | local stack, this session                                 | `wiki/gotchas.md`, `local-stack` skill        |
| 2026-09-25 | Backups model: scheduled workflow + dump inside the container; no cron, no credentials file              | infra doc 09 §9.1a, doc 13 §5; mrmichnik production dump  | `docs/phase-0-design.md` 0.9, `decisions.md`  |
| 2026-09-25 | Public-repo scheduled workflows stop after 60 idle days; notifications go to the cron line's last editor | GitHub docs "Events that trigger workflows"               | `docs/phase-0-design.md` 0.9                  |
