# Phase 1: Accounts — Auth, Profile, Timezone, Legal (Ported) — Design Document

## Table of Contents

- [Overview](#overview)
- [Reuse from myfinpro](#reuse-from-myfinpro)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Frontend Pages and Components](#frontend-pages-and-components)
- [External Setup (OAuth, Telegram, Mail DNS)](#external-setup-oauth-telegram-mail-dns)
- [Iteration Plan](#iteration-plan)
- [Testing Strategy](#testing-strategy)
- [Security Notes](#security-notes)
- [Deviations from myfinpro](#deviations-from-myfinpro)

---

## Overview

Phase 1 ports myfinpro's complete, production-proven account system: email+password auth with argon2id, JWT access tokens + rotating refresh tokens, Google OAuth, Telegram login, email verification, password reset, profile with timezone/locale, soft account deletion with grace period, transactional mail (self-hosted Haraka SMTP + DKIM), legal pages, and consent. This collapses myfinpro's Phases 1–4 into one port phase because the code already exists and is tested — the work is careful transplantation, not design.

**Dependencies**: Phase 0 complete (deployable skeleton, CI/CD, secrets in place).

**Porting rule reminder** (plan §2): copy file-by-file from the sister repo, keep paths aligned, port the tests with the code, rename branding, drop currency.

## Reuse from myfinpro

| Component               | Source (myfinpro repo)                                                                                                                                                                                                                                                                                                                                                                  | Deviation                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Auth module             | `apps/api/src/auth/**` — controller, service, `services/{token,refresh-token,password,oauth,email-verification,password-reset,account-deletion,account-cleanup}.service.ts`, `strategies/{local,jwt,google}.strategy.ts`, `guards/*`, `utils/telegram-auth.util.ts`, `decorators/current-user.decorator.ts`, `interfaces/jwt-payload.interface.ts`, `constants/auth-errors.ts`, `dto/*` | Drop `defaultCurrency` from DTOs/responses; add `avatarUrl`/`bio` to profile |
| Prisma models           | `User`, `RefreshToken`, `OAuthProvider`, `EmailVerificationToken`, `PasswordResetToken`, `AuditLog` from `apps/api/prisma/schema.prisma`                                                                                                                                                                                                                                                | See [schema deltas](#database-schema)                                        |
| Mail                    | `apps/api/src/mail/mail.service.ts`, `infrastructure/haraka/`                                                                                                                                                                                                                                                                                                                           | Re-brand, ×4 locales, own DKIM key + mail domain                             |
| Web auth                | `apps/web/src/lib/auth/{auth-context.tsx,types.ts}`, `apps/web/src/components/auth/*` (`TelegramLoginButton`, `TimezoneDetector`, `ProtectedRoute`, forms), `apps/web/src/app/[locale]/auth/*`, `settings/account/page.tsx`                                                                                                                                                             | Restyle; strings ×4 locales                                                  |
| Session for OAuth state | express-session config in `apps/api/src/main.ts` (in-memory, 5-min TTL, `__oauth_session` cookie)                                                                                                                                                                                                                                                                                       | As-is                                                                        |
| Reference docs          | myfinpro `docs/phase-1-design.md`, `phase-2-design.md`, `phase-4-design.md`, `phase-4-smtp-design.md`                                                                                                                                                                                                                                                                                   | Read before porting                                                          |

## Database Schema

Port the six models verbatim, with these deltas to `User`:

```prisma
model User {
  id                  String    @id @default(uuid()) @db.VarChar(36)
  email               String    @unique @db.VarChar(255)
  passwordHash        String?   @map("password_hash") @db.VarChar(255)
  name                String    @db.VarChar(100)
  // REMOVED (myfinpro-only): defaultCurrency
  avatarMediaId       String?   @map("avatar_media_id") @db.VarChar(36)  // FK added in Phase 3
  bio                 String?   @db.VarChar(500)
  locale              String    @default("en") @db.VarChar(5)            // en | he | ru | uk
  timezone            String    @default("UTC") @db.VarChar(50)          // IANA
  mediaQuotaBytes     BigInt    @default(1073741824) @map("media_quota_bytes")   // 1 GiB, used from Phase 3
  mediaUsedBytes      BigInt    @default(0) @map("media_used_bytes")
  isActive            Boolean   @default(true) @map("is_active")
  emailVerified       Boolean   @default(false) @map("email_verified")
  lastLoginAt         DateTime? @map("last_login_at")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")
  deletedAt           DateTime? @map("deleted_at")
  scheduledDeletionAt DateTime? @map("scheduled_deletion_at")
  // relations: refreshTokens, oauthProviders, emailVerificationTokens, passwordResetTokens (ported)
  @@index([email])
  @@index([createdAt])
  @@index([scheduledDeletionAt])
  @@map("users")
}
```

`RefreshToken`, `OAuthProvider`, `EmailVerificationToken`, `PasswordResetToken`, `AuditLog`: copy verbatim (token hashes SHA-256, cascade deletes, indexes included). Migration name: `phase1_accounts`.

## API Endpoints

All ported, under `/api/v1/auth` (rate limits via ported `@CustomThrottle`):

| Endpoint                                                        | Notes                                                                                                                                                  |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST register`                                                 | email + password (≥8, upper/lower/digit) + name + consent flag (new, see 1.10); optional `locale`                                                      |
| `POST login`, `POST refresh`, `POST logout`                     | JWT access 15 min; refresh = opaque UUID, SHA-256-hashed, rotating, reuse-detected, httpOnly `sameSite=strict` cookie at `/api`                        |
| `GET me`, `PATCH profile`                                       | profile incl. `timezone` (IANA string), `locale` (validated against `LOCALES`), `name`, `bio`                                                          |
| `POST send-verification-email`, `GET verify-email`              | 24 h token                                                                                                                                             |
| `POST forgot-password`, `POST reset-password`                   | 1 h token, revoke-all-sessions on reset                                                                                                                |
| `POST change-password`                                          | argon2 verify + revoke all refresh tokens; OAuth-only users get explicit error directing to reset flow                                                 |
| `GET google`, `GET google/callback`                             | Passport google-oauth20, `state:true`; callback → find-or-create by verified email → 302 to `https://${SERVER_NAME}/${locale}/auth/callback?token=…`   |
| `POST telegram/callback`, `POST link/telegram`                  | HMAC-SHA256 widget verification (`secret = sha256(botToken)`), 24 h freshness; synthetic email `telegram_<id>@telegram.user`                           |
| `GET connected-accounts`, `DELETE connected-accounts/:provider` | unlink guarded: cannot remove last login method                                                                                                        |
| `POST delete-account`, `POST cancel-deletion`                   | soft delete, 30-day grace, login reactivates within grace; hard-delete scheduler (`@nestjs/schedule` daily) — **pet handling stubbed until Phase 4.8** |

## Frontend Pages and Components

Ported and restyled, under `app/[locale]/`:

- `auth/login`, `auth/register`, `auth/callback`, `auth/verify-email`, `auth/forgot-password`, `auth/reset-password`
- `settings/account` — name, bio, avatar placeholder, email + verification state, timezone select (+ `TimezoneDetector` auto-set when still UTC), locale select, connected accounts (link/unlink Google & Telegram), change password, delete account (dialog + grace banner)
- `legal/terms`, `legal/privacy` (×4 locales; privacy explicitly covers geo data, media, and public-page behavior)
- Components: `AuthProvider`/`useAuth` context (in-memory access token, silent refresh on mount), `ProtectedRoute`, `TelegramLoginButton` (popup + postMessage flow), `TimezoneDetector`, consent checkbox
- Header gains login/avatar menu; footer gains legal links

## External Setup (OAuth, Telegram, Mail DNS)

Manual, documented steps (no values in repo):

1. **Google OAuth**: new Google Cloud project `green-fluffy`; OAuth consent screen; two OAuth clients (staging + production) with callback `https://<domain>/api/v1/auth/google/callback`; store in env secrets.
2. **Telegram**: create bots via @BotFather — production (e.g. `@GreenFluffyBot`) and staging; `/setdomain` to each env's domain for the login widget; tokens to secrets; `NEXT_PUBLIC_TELEGRAM_BOT_ID` = numeric token prefix (build arg).
3. **Mail DNS** (Cloudflare, michnik.pro zone): generate DKIM keypair (private → secret, written to server at deploy only); TXT records: DKIM selector for mail domain `green-fluffy.michnik.pro`, SPF, DMARC. Follow myfinpro `docs/phase-4-smtp-design.md`. Verify with mail-tester before 1.3 sign-off.

## Iteration Plan

### 1.1 Auth schema

Port the six models with the `User` deltas above; migration `phase1_accounts`; port model-level tests. **Done**: migration applied to staging via normal deploy.

### 1.2 Email+password auth

Port auth module core: register/login/refresh/logout/me, password service (argon2id 64MB/3/4), token service, refresh rotation + reuse detection, local + jwt strategies/guards, `@CurrentUser`, error constants, audit logging of auth events. Port unit + integration tests (Testcontainers). Wire `AuthModule` into `AppModule`. **Done**: full ported test suite green; endpoints functional via Swagger on staging.

### 1.3 Mail service

Port `MailModule` + Haraka container into `docker-compose.<env>.infra.yml`; local dev keeps mailpit. Re-brand templates; add ru/uk variants (mirroring existing en/he structure), template selection by `User.locale`. DNS work per [External Setup](#external-setup-oauth-telegram-mail-dns). **Done**: staging registration email hits a real inbox with DKIM+SPF pass (check headers / mail-tester score ≥ 9).

### 1.4 Email verification + password reset

Port both token flows (backend + pages + resend + banner for unverified users). **Done**: E2E register → verify → forgot → reset → login green in CI.

### 1.5 Google OAuth

Port strategy/guard/callback + express-session state config. External setup done first. **Done**: staging round-trip creates user, links by verified email on existing account, issues JWT; integration tests with mocked Google profile green.

### 1.6 Telegram login

Port `telegram-auth.util.ts` (HMAC verify), callback + link endpoints, `TelegramLoginButton`. **Done**: staging Telegram login + linking work; util unit tests (valid/expired/tampered hash) green.

### 1.7 Auth UI

Port remaining auth pages + context + guards; restyle to green-fluffy visual identity (green/nature palette; keep structure); translate ×4. **Done**: Playwright E2E login/register/logout in all four locales, RTL screenshot check for `he`.

### 1.8 Profile & settings

Port settings/account page + `PATCH profile` + `TimezoneDetector`; add `bio`; avatar upload deferred to Phase 3 (placeholder with initials). **Done**: timezone auto-detected on first login; locale switch persists and re-renders; connected accounts manageable.

### 1.9 Account deletion

Port soft-delete service, cancel/reactivate, deletion email, daily hard-delete scheduler + audit-log anonymization. Pet-transfer logic is a stub interface (`PetHandlingStrategy`) with TODO wired for Phase 4.8. **Done**: delete → banner → cancel; grace-expiry hard-delete covered by unit tests with faked clock.

### 1.10 Legal + consent

Terms + privacy pages (×4), registration consent checkbox (required, stored on user record with timestamp), global footer. Privacy policy written for this app: geo data, media, public pages, social features, retention, export (Phase 12). **Done**: registration blocked without consent; pages live in all locales.

## Testing Strategy

- **Port the myfinpro test suites with the code** — they encode edge cases (token reuse, expired tokens, OAuth linking, deletion grace). A port iteration without its tests is incomplete.
- Integration: Testcontainers MySQL per suite (ported harness `apps/api/test/helpers/testcontainers.ts`).
- E2E: Playwright auth flows (register/verify/login/reset/delete) + staging smoke additions to `test-staging.yml` (register + login on staging with a throwaway inbox).
- Security-specific: rate-limit tests on auth endpoints (5/min pattern), refresh-reuse detection test, Telegram hash tamper test, unlink-last-method guard test.

## Security Notes

- Fresh secrets for this project — never reuse myfinpro's JWT/session/DKIM/DB values.
- Auth endpoints strictly throttled (ported config); audit log on register/login/logout/link/unlink/delete/password events.
- The consent + privacy work here is load-bearing for later phases (geo, media, social); do not defer 1.10.

## Deviations from myfinpro

1. No `defaultCurrency` anywhere.
2. `User` gains `bio`, `avatarMediaId`, media quota fields (used from Phase 3).
3. Four locales instead of two — mail templates and all UI strings.
4. Consent checkbox at registration is required from day one (myfinpro added it in its Phase 4).
5. Account deletion must eventually handle pets (transfer/delete choice) — interface stubbed now, implemented in Phase 4.8.
