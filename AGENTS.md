# Green and Fluffy — agent index

Care platform for animals **and** plants: NestJS 11 API + Next.js 16 web, pnpm/Turborepo, Prisma 7
on MySQL 9.7, four locales (`en`, `he` RTL, `ru`, `uk`). Sister project **myfinpro** is the
reference implementation for auth, users, timezone and deployment; the private **infra** repo
owns servers, edge, mail and the Mdock local-dev toolkit. **This repository is public.**

This file is the index. Depth lives in `docs/` (what to build), `wiki/` (how we build it here),
`.claude/agents/` (who does what) and `.claude/skills/` (how to do recurring tasks). Read a
deeper file only when its topic is in play. `CLAUDE.md` is a symlink to this file — edit
`AGENTS.md`.

## Hard rules (everything else is in a skill)

1. **Nothing sensitive in git**: no secrets, tokens, server addresses, usernames or hostnames used
   as configuration — in files, fixtures, docs or commit messages (`commit-hygiene`).
2. **Latest stable versions, verified online**; never inherit myfinpro's pins (`stack-versions`).
3. **Privacy invariants**: server-side access resolution, 404 for private subjects, separate
   public DTOs, coarse geo only in public, documents never public, EXIF removed (`privacy-guard`).
4. **Four locales from the first string**; RTL for Hebrew (`i18n`).
5. **Tests travel with code**; never weaken a test to pass (`testing`).
6. **Minimal, DRY, no legacy paths**; prettier on every changed file, markdown included
   (`wiki/conventions.md`).
7. **No push, deploy, merge to `main` or server action** unless the user asks in this session.
8. **Never guess**: a fact you did not verify this session is marked _unverified_ or left out.

## Where things are

| Path                                           | Content                                                                    |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| `SPECIFICATION-USER-STORIES.md`                | what and why                                                               |
| `IMPLEMENTATION-PLAN.md`                       | phases 0–12, 116 iterations with acceptance criteria (§7); invariants §4–5 |
| `docs/phase-N-design.md`                       | per-phase schema, endpoints, UI, iteration plan, tests                     |
| `docs/progress.md`, `docs/phase-N-progress.md` | ground truth of what is done (`progress-log`)                              |
| `docs/ui/`                                     | UI specs written by `ui-designer` before a surface is built                |
| `wiki/`                                        | operational knowledge — index in `wiki/README.md`                          |
| `.claude/rules/`                               | path-scoped one-liners that point at the right skill                       |

## Status (2026-09-24)

Phase 0 iterations 0.1–0.5 shipped (scaffold, API and web skeletons, local stack, CI). 0.6–0.10
(server, staging/production CD, backups, staging tests) wait for the sibling infra work: deploy
templates, dispatch-only production, shared edge, Mdock adoption — see `wiki/infra-context.md`.
Feature phases start at 1.1 (port auth). Branch `main` only; no deploy workflow exists yet.

## Agents (`.claude/agents/`) — call by role

| Agent               | Call when                                                                          |
| ------------------- | ---------------------------------------------------------------------------------- |
| `orchestrator`      | implementing a phase or several iterations; runs specialists in parallel           |
| `architect`         | an iteration needs concrete contracts (schema, endpoints, DTOs, shared types)      |
| `ui-designer`       | before any new page/component; design tokens; UI inconsistency                     |
| `api-coder`         | work under `apps/api` or `packages/shared`                                         |
| `web-coder`         | work under `apps/web`                                                              |
| `porter`            | porting a subsystem from myfinpro (Phase 0–1, reuse map)                           |
| `qa-tester`         | gating an iteration or integration; raising coverage                               |
| `security-reviewer` | before merging changes to auth, visibility, media, geo, social, CI or deploy files |
| `i18n-translator`   | strings added or changed; before a UI iteration is done                            |
| `kb-curator`        | species and knowledge-base dataset work (2.1, 9.x)                                 |
| `devops`            | compose, Dockerfiles, nginx, workflows, deploy scripts, Mdock adoption             |
| `infra-scout`       | infra facts are stale (> 7 days) or a deploy-shaped task starts; read-only probe   |

Independent tasks run in parallel (own worktrees); Prisma migrations are serialized; every
iteration ends with a `qa-tester` verdict, `progress-log`, and `learn` when something was learned.

## Skills (`.claude/skills/`) — `/name` or auto-invoked

| Skill                | Use for                                                                       |
| -------------------- | ----------------------------------------------------------------------------- |
| `iteration <N.m>`    | run one plan iteration end to end                                             |
| `learn [focus]`      | turn this session's findings into updates of agents, skills, wiki, this index |
| `stack-versions`     | any dependency, image tag, runtime choice; version-drift symptoms             |
| `local-stack`        | start/check the Docker stack; DB commands; Mdock                              |
| `prisma-migrations`  | any schema or migration change                                                |
| `privacy-guard`      | any endpoint, serializer, public page, media path                             |
| `i18n`               | any user-facing string, message file, email template                          |
| `ui-conventions`     | anything under `apps/web/src`                                                 |
| `testing`            | writing or running tests; choosing the suite level                            |
| `port-from-myfinpro` | copying from the sister repo                                                  |
| `kb-dataset`         | dataset files and schema                                                      |
| `commit-hygiene`     | before staging, committing, PR text                                           |
| `progress-log`       | recording a finished iteration                                                |
| `infra-sync`         | probing the infra and mrmichnik repos; refreshing `wiki/infra-context.md`     |

## Sibling repositories (local clones; read-only from here)

`~/myfinpro` (sister app, branch `develop`) · `~/Aleksei-Michnik/infra` (private plan, edge, mail,
DNS, Mdock — start with `docs/notes/next-session.md`) · `~/mrmichnik` (WordPress sites; newest
reference for the shared deploy pattern) · `~/myorcare/web` (Mdock reference, never modified).
The home-level `~/CLAUDE.md` holds the cross-project rules and server topology; it is not part
of this repository.
