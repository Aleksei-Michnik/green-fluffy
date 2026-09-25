# Phase 1 — Accounts: auth, profile, timezone, legal (ported)

Design doc: [phase-1-design.md](phase-1-design.md).

## 1.1 — Auth schema (2026-09-25)

PR #3 (`phase/1`: `e2ecb66` + docs `1aee117`, CI run 36151855027 and PR gates 36151855016 green) merged into `main` as `e606ce1` on 2026-09-25 with a merge commit (history kept), CI run 36152117733 green.

### Scope

The six account models ported from myfinpro's `apps/api/prisma/schema.prisma` into
`apps/api/prisma/schema.prisma`: `User`, `RefreshToken`, `OAuthProvider`,
`EmailVerificationToken`, `PasswordResetToken`, `AuditLog`. `User` carries the documented
deltas: no `defaultCurrency` (nor myfinpro's later `dueReminderDays`, `llmProvider`,
`llmModel`, finance relations); added `avatarMediaId` (pre-wired, FK arrives with the Phase 3
expand migration), `bio`, `mediaQuotaBytes` (default 1 GiB), `mediaUsedBytes`. The other five
models are verbatim: SHA-256 token hashes (unique), expiry and revocation fields, cascade
deletes from `users`, the same indexes; `AuditLog.userId` stays nullable for anonymisation.

Migration `20260925080632_phase1_accounts` (expand-only: six tables, indexes, four FKs), created
with `pnpm db:migrate --name phase1_accounts` against the local MySQL 9.7 and applied there.
`prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma` reports no
difference; `prisma migrate status` reports the database up to date.

### Tests

`apps/api/src/auth/__tests__/prisma-models.spec.ts` (myfinpro's `prisma-models.spec.ts`
pattern, extended): compile-time smoke test on the six generated types, plus runtime assertions
on `Prisma.ModelName` and the `*ScalarFieldEnum`s — the `User` deltas (no `defaultCurrency`,
the four added fields), hashed/expiring/user-scoped token models with `revokedAt`/`replacedBy`
on refresh tokens, `OAuthProvider` keyed by provider + providerId, `AuditLog` user-optional.
API unit suite: 95 tests green in 14 suites (90 before). `pnpm --filter @green-fluffy/api lint`
and `typecheck` green; prettier clean on the spec (`.prisma` and `.sql` are outside the repo's
format glob).

Gates: `code-review` (medium) — no findings. `qa-tester` — all automatable criteria met
(lint/typecheck/format, 90 → 95 tests, migration checksum in `_prisma_migrations` equals the
file on disk, from-scratch apply into an empty schema yields the seven tables and four cascade
FKs, five models byte-identical to myfinpro and `User` deltas exact, SQL expand-only).
`security-reviewer` — no findings; hashed tokens, cascades and repo hygiene verified. The plan
row 1.1 said `avatarUrl`; corrected to `avatarMediaId` + `mediaUsedBytes` to match the design
doc and the code.

### Decisions

- `@@index([email])` next to `@unique` on `users.email` is kept verbatim from myfinpro (the
  design doc lists it); dropping the redundant index is a possible backport, not a port-time
  change.
- Carried forward from the security review: `audit_logs` has deliberately no FK to `users`,
  so the 1.9 anonymiser must null `user_id` _and_ `ip_address` / `user_agent` (and scrub
  `details`); the plan's 90-day audit retention (§4.8) still needs a scheduled purge — neither
  belongs to 1.1. `OAuthProvider.metadata` (1.5) stays the minimum provider profile; never
  write precise coordinates into `AuditLog.details` (Phase 7), it surfaces in the 12.3
  privacy dashboard. `User.bio` is user content: plain-text rendering when first shown (1.7).
- No dependency change: Prisma stays at the repo's 7.8.x; npm's latest stable is 7.10.0
  (8.0.0 is a release candidate) — a separate chore, not part of a schema iteration.

**BLOCKED**: the plan's "Done" criterion _migration applied on staging via normal deploy_
cannot be met — no staging environment exists (0.6–0.10 wait on the sibling infra work,
`wiki/infra-context.md`). The migration will be applied by the first staging deploy of 0.7.
