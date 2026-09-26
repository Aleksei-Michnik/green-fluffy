---
name: port-from-myfinpro
description: Procedure for copying a subsystem from the sister repo myfinpro (~/myfinpro, read-only) into this repo with renames, deltas, newer versions and its tests. Use for any "port", "reuse from myfinpro" or Phase 0–1 iteration.
---

# Port from myfinpro

Source map with verified paths: `wiki/myfinpro-reuse-map.md`. Decision: copy-and-adapt, no
shared package, keep relative paths identical for cross-repo diffing (plan §2).

1. **Locate**: `ls`/`grep` the source in `~/myfinpro` (branch `develop`); include `*.spec.ts`,
   integration tests, fixtures, docs that describe the subsystem.
2. **Inspect for coupling**: grep `currency`, `budget`, `transaction`, `receipt` — drop
   finance-only surface at port time; do not carry dead code.
3. **Copy** to the same relative path; rename identifiers (`myfinpro`→`green-fluffy`,
   `MyFinPro`→`Green and Fluffy`, `@myfinpro/*`→`@green-fluffy/*`, container/network/image names).
4. **Apply the documented deltas** for the target phase (`docs/phase-1-design.md` "Deviations",
   the reuse map "Known deltas"): `User` fields, four locales, consent, stubs.
5. **Dependencies**: add at the latest stable version verified online (`stack-versions`); adapt
   to breaking changes; never downgrade to myfinpro's pin.
6. **Infra material** (compose, scripts, workflows): check `wiki/infra-context.md` first — the
   shared infra repo supersedes parts of it (shared mail relay, shared edge contract; the deploy
   triggers stay myfinpro's). Port what is not superseded, and take the `deploy.sh` tenant steps
   from mrmichnik, the newest implementation.
7. **Tests travel with code** and must pass here before the port is complete.
8. **Backports**: note fixes discovered here that apply to myfinpro in the report/PR description.
