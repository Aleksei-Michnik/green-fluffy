# Progress

Index only — iteration detail lives in `docs/phase-<N>-progress.md`. Format: `progress-log` skill.

**Last updated**: 2026-09-25 · **Current work**: UI kit foundation (0.3a) built and verified —
tokens, 18 primitives, axe in unit and e2e, `/kit` showcase, `ui-kit` skill and catalogue;
next plan row is **1.1** (auth schema) — Phase 0.6–0.10 blocked on the sibling infra work
(`wiki/infra-context.md`).

| Phase | Name                                              | Status      | Done        | Detail                                     |
| ----- | ------------------------------------------------- | ----------- | ----------- | ------------------------------------------ |
| 0     | Foundation: scaffold, CI/CD, environments         | in progress | 5/10 + 0.3a | [phase-0-progress.md](phase-0-progress.md) |
| 1     | Accounts: auth, profile, timezone, legal (ported) | not started | 0/10        |                                            |
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
