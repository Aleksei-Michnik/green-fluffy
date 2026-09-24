# Learnings log

Append-only. Written by the `learn` skill: one row per finding, newest last. `Applied to` names
the agent / skill / wiki page / index that was updated so the lesson sticks.

| Date       | Finding                                                                                       | Evidence                             | Applied to                                |
| ---------- | --------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------- |
| 2026-09-24 | Per-project Haraka is superseded by the shared relay with client-side DKIM                    | infra `mail/README.md`               | `wiki/infra-context.md`, `decisions.md`   |
| 2026-09-24 | Production deploys must be dispatch-only; ported `push: [main]` trigger is wrong for 0.8      | infra `next-session.md` §2           | `wiki/infra-context.md`, `devops` agent   |
| 2026-09-24 | Mdock registry already contains green-fluffy; adoption is a small compose change in this repo | `infra/mdock/hosts.json`             | `wiki/infra-context.md`, `devops` agent   |
| 2026-09-24 | This repo's commits carry the Claude co-author trailer; myfinpro's rules differ               | `git log`                            | `commit-hygiene` skill                    |
| 2026-09-24 | Clone's git identity (global, organisation) differs from the repo history (personal)          | `git config user.email` vs `git log` | `wiki/gotchas.md`, `commit-hygiene` skill |
