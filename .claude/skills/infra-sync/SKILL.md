---
name: infra-sync
description: Read-only procedure for probing the sibling infra and mrmichnik repos for changes that affect this project and refreshing wiki/infra-context.md. Use when the wiki sync date is stale (>7 days), before deploy/compose/CI/nginx/Mdock work, or when asked what the infra side is doing.
---

# infra-sync

Repos (private, local clones, **never modify**): `~/Aleksei-Michnik/infra` (plan, edge, mail,
DNS, Mdock), `~/mrmichnik` (WordPress sites — newest reference implementation of the shared
deploy pattern), `~/myfinpro` (sister app). `~/myorcare/web` is a read-only reference for Mdock.

1. Last sync date: first lines of `wiki/infra-context.md`.
2. `git -C ~/Aleksei-Michnik/infra log --oneline --since=<date>` and the same for `~/mrmichnik`;
   `git status --short` in both (uncommitted work in flight is a signal, not a fact).
3. Read, in order: `infra/docs/notes/next-session.md` (top + the step table),
   `infra/docs/notes/phase-2-pipeline.md` §1, `infra/mdock/hosts.json` (+ README if present),
   `infra/edge/` and `infra/templates/` (exist yet?), `infra/mail/README.md` (relay contract),
   `infra/docs/09-secrets-and-rotation.md` (policy changes), `~/mrmichnik/scripts/deploy.sh`
   and `.github/workflows/deploy-*.yml` (pattern changes).
4. Extract only what changes green-fluffy's work: Mdock adoption shape, edge contract, deploy
   templates availability, production-deploy policy, mail relay, secrets policy, blocked items.
5. Update `wiki/infra-context.md`: sync date, changed facts (replace, do not append duplicates),
   "Open items" list. Binding decisions → a row in `wiki/decisions.md`.
6. Report the delta: unblocked / newly blocked / must-change, with the infra doc and section
   as evidence. Mark anything unverifiable as _unverified_.

Public-repo rule: describe servers and users by role; never copy addresses, usernames,
hostnames-as-configuration or secret names' values.
