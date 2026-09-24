---
name: testing
description: Test commands, suite levels, coverage gates, standing security suites and test-writing patterns for this monorepo (Jest + Testcontainers for the API, Vitest for web/shared, Playwright e2e). Use when writing, running or debugging tests, or deciding which suite an acceptance criterion needs.
---

# Testing

Details and the standing-suite catalogue: `wiki/testing.md`.

```bash
pnpm lint && pnpm typecheck && pnpm format:check          # always first
pnpm --filter @green-fluffy/api test                       # Jest unit (*.spec.ts)
pnpm test:integration                                      # Jest + Testcontainers (Docker) — from Phase 1.2
pnpm --filter @green-fluffy/web test                       # Vitest + Testing Library
pnpm --filter @green-fluffy/shared test
pnpm test:e2e                                              # Playwright (stack up, browsers installed)
pnpm test:coverage
```

- Pick the level from the plan's testing strategy: DTO/logic → unit; endpoint behaviour and
  guards → integration; user-visible flow → Playwright; security invariants → the standing suite
  for that domain (access matrix, public snapshots, upload security, geo sweep, cascade).
- Write tests in the neighbours' style; reuse helpers and factories before adding new ones;
  test through public surfaces; inject clocks for time logic; record fixtures for third parties.
- A failing test that reveals a product defect stays in place as the acceptance gate — report
  the defect, do not soften the test.
- Gates: business logic ≥ 80 %, overall ≥ 60 %, PR diff ≥ 70 % (thresholds to be wired into the
  jest/vitest configs with the first domain module).
- Environment: integration and e2e need Docker; jsdom Web Storage shim lives in
  `apps/web/src/test-setup.ts`.
