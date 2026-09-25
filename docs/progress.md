# Progress

Index only — iteration detail lives in `docs/phase-<N>-progress.md`. Format: `progress-log` skill.

**Last updated**: 2026-09-25 · **Current work**: Phase 1 started — 1.1 auth schema done
(six account models, `phase1_accounts` migration applied locally, model tests); next plan row
is **1.2** (email+password auth). Staging apply of the migration and Phase 0.6–0.10 stay
blocked on the sibling infra work (`wiki/infra-context.md`).

| Phase | Name                                              | Status      | Done        | Detail                                     |
| ----- | ------------------------------------------------- | ----------- | ----------- | ------------------------------------------ |
| 0     | Foundation: scaffold, CI/CD, environments         | in progress | 5/10 + 0.3a | [phase-0-progress.md](phase-0-progress.md) |
| 1     | Accounts: auth, profile, timezone, legal (ported) | in progress | 1/10        | [phase-1-progress.md](phase-1-progress.md) |
| 2     | Pet profiles & species catalog                    | not started | 0/8         |                                            |
| 3     | Media foundation                                  | not started | 0/9         |                                            |
| 4     | Access control, sharing & public pages            | not started | 0/9         |                                            |
| 5     | Health diary, procedures, documents & providers   | not started | 0/16        |                                            |
| 6     | Feeding & care, reminders, notifications          | not started | 0/10        |                                            |
| 7     | Locations, maps & weather                         | not started | 0/8         |                                            |
| 8     | Pet groups                                        | not started | 0/8         |                                            |
| 9     | Knowledge base: warnings & recommendations        | not started | 0/9         |                                            |
| 10    | Social                                            | not started | 0/9         |                                            |
| 11    | Stories                                           | not started | 0/6         |                                            |
| 12    | Data export & privacy dashboard                   | not started | 0/4         |                                            |

## Phase 0 — summary

Monorepo on the latest toolchain (Node 26, pnpm 11, TS 6), NestJS API skeleton with health,
metrics and throttling, Next.js web skeleton with four locales, theme toggle and — since
2026-09-25 — the accessible, localised UI kit (semantic tokens, primitives, axe-verified,
`/kit` showcase), local Docker stack on non-default ports (optionally behind the shared mdock
proxy with hot reload), and CI with lint/typecheck/prettier/unit/build/gitleaks. Server
provisioning and CD are deferred until the shared infra provides its templates; the 0.9 backups
design is written.

## Phase 1 — summary

The six account models (`User` with the green-fluffy deltas, refresh/verification/reset
tokens, OAuth providers, audit log) are in the schema with the expand-only `phase1_accounts`
migration and model-level tests (1.1, 2026-09-25). The auth module, mail, OAuth, Telegram,
UI, profile, deletion and legal pages (1.2–1.10) follow; the staging apply waits for the CD
pipeline.
