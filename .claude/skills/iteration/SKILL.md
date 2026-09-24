---
name: iteration
description: Runs one IMPLEMENTATION-PLAN iteration (e.g. 2.3) end to end — ground truth, contracts, implementation, tests, i18n, docs, commit-ready — delegating to the specialist agents. Use when asked to "do iteration N.m", "implement 2.4", or to continue the plan by one step.
argument-hint: '<phase.iteration> e.g. 2.3'
---

# iteration $ARGUMENTS

1. **Ground truth**: `docs/progress.md`, `git status`, `git log --oneline -10`. If the previous
   iteration is not recorded as done, stop and say so.
2. **Scope**: the row `$ARGUMENTS` in `IMPLEMENTATION-PLAN.md` §7 and its "Iteration Plan" cell in
   `docs/phase-<N>-design.md`. Acceptance criteria are the specification.
3. **Blocked?** Rows needing servers, DNS, third-party accounts or secrets (0.6–0.10, 1.3, 1.5,
   1.6 external setup) are implemented up to the automatable boundary and reported `BLOCKED:
<what the owner must do>`. Never fake a verification.
4. **Contracts**: if the row lacks concrete shapes, run `architect` first. New web surface →
   `ui-designer` spec first.
5. **Implement in parallel where independent** (`Agent` tool, worktrees for coders):
   `api-coder` / `porter`, `web-coder`, `kb-curator`, then `i18n-translator`. One Prisma
   migration at a time.
6. **Gate**: `qa-tester` verdict against the acceptance criteria; `security-reviewer` when auth,
   visibility, media, geo, social, CI or deploy files changed; `/code-review` for the diff.
7. **Docs**: `progress-log` skill (phase progress file + index); update the design doc if reality
   diverged; `pnpm format`.
8. **Commit** per `commit-hygiene` only when asked; otherwise leave the tree clean and report the
   proposed message.
9. **Close**: run `learn` if anything surprised you; report outcome, evidence, blockers, next row.
