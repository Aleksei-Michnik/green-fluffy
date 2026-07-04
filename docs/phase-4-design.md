# Phase 4: Access Control, Sharing & Public Pages — Design Document

## Table of Contents

- [Overview](#overview)
- [Reuse from myfinpro](#reuse-from-myfinpro)
- [Authorization Model](#authorization-model)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Public Surface (SSR, SEO, Caching)](#public-surface-ssr-seo-caching)
- [Frontend Pages and Components](#frontend-pages-and-components)
- [Iteration Plan](#iteration-plan)
- [Testing Strategy](#testing-strategy)
- [Security Notes](#security-notes)

---

## Overview

Phase 4 is the security keystone: it turns creator-only pets into shareable ones. It adds members with roles (viewer/caretaker) via invite links, public/private pets with per-section visibility, anonymous SEO-friendly public pet pages, and resolves account deletion's pet handling. **Every later phase builds on the access rules defined here** — this phase's access-control test matrix becomes a permanent CI fixture.

**Dependencies**: Phases 2–3. The invite/role mechanics are an adaptation of myfinpro's proven group system.

## Reuse from myfinpro

| Component | Source | Adaptation |
| --------- | ------ | ---------- |
| Invite tokens | `Group`/`GroupInviteToken` models + `apps/api/src/group/` service logic (UUID token, SHA-256 hash at rest, 7-day expiry, single-use accept) | Same mechanics, subject = Pet |
| Role guards | `group-member.guard.ts`, `group-admin.guard.ts` | Generalized `PetAccessGuard(minRole)` |
| Membership UI | `/groups/[id]` member list, invite link generation, role management, accept-invite page | Restyle to pet context |

## Authorization Model

Single source of truth — `PetAccessService.resolveRole(userId|null, petId) → OWNER | CARETAKER | VIEWER | PUBLIC | NONE`:

- `OWNER`: `pet.ownerUserId === userId` **or** (`ownerType != USER` and `pet.createdByUserId === userId`) — the creator manages municipal/ownerless pets.
- `CARETAKER` / `VIEWER`: from `PetMember`.
- `PUBLIC`: `pet.isPublic` and requester has no higher role (incl. anonymous).
- `NONE`: everything else → 404 (not 403 — don't leak existence of private pets).

| Capability | PUBLIC | VIEWER | CARETAKER | OWNER |
| ---------- | ------ | ------ | --------- | ----- |
| Profile info | ✅ | ✅ | ✅ | ✅ |
| Photos/albums/stories | if section public | ✅ | ✅ | ✅ |
| Diary | if section public → public entries only | ✅ | ✅ | ✅ |
| Feeding/care history | if section public | ✅ | ✅ | ✅ |
| Precise location | ❌ **never** | ✅ | ✅ | ✅ |
| Coarse location (city/region) | if section public | ✅ | ✅ | ✅ |
| Documents | ❌ **never** | ❌ | ✅ | ✅ |
| Add media/diary/care | ❌ | ❌ | ✅ | ✅ |
| Edit profile/visibility/members/archive/delete | ❌ | ❌ | ❌ | ✅ |

Per-section visibility (`photos`, `diary`, `feeding`, `location`) applies only when the pet `isPublic`; documents and precise geo are excluded from the public model **at the type level** (no serializer field exists).

## Database Schema

```prisma
enum PetRole { CARETAKER VIEWER }

model PetMember {
  id        String   @id @default(uuid()) @db.VarChar(36)
  petId     String   @map("pet_id") @db.VarChar(36)
  userId    String   @map("user_id") @db.VarChar(36)
  role      PetRole
  invitedBy String   @map("invited_by") @db.VarChar(36)
  joinedAt  DateTime @default(now()) @map("joined_at")

  @@unique([petId, userId])
  @@index([userId])
  @@map("pet_members")
}

model PetInviteToken {
  id        String    @id @default(uuid()) @db.VarChar(36)
  petId     String    @map("pet_id") @db.VarChar(36)
  tokenHash String    @unique @map("token_hash") @db.VarChar(255)  // sha256, raw token only in the link
  role      PetRole
  createdBy String    @map("created_by") @db.VarChar(36)
  expiresAt DateTime  @map("expires_at")                            // 7 days
  usedAt    DateTime? @map("used_at")
  usedBy    String?   @map("used_by") @db.VarChar(36)

  @@index([petId])
  @@index([expiresAt])
  @@map("pet_invite_tokens")
}
```

`Pet` gains `sectionVisibility Json?` (`{ photos: "public"|"private", diary: ..., feeding: ..., location: ... }`, default all private) — expand migration `phase4_sharing`.

## API Endpoints

| Endpoint | Guard | Notes |
| -------- | ----- | ----- |
| `POST /api/v1/pets/:id/invites` | OWNER | `{ role }` → one-time link `https://<domain>/<locale>/pets/invite/<rawToken>` |
| `GET /api/v1/pets/invite/:token` | authed | Preview (pet name, role, inviter) without joining |
| `POST /api/v1/pets/invite/:token/accept` | authed | Single-use; expiry/used checks; audit-logged |
| `GET /api/v1/pets/:id/members` | VIEWER+ | List with roles |
| `PATCH /api/v1/pets/:id/members/:userId` | OWNER | Change role |
| `DELETE /api/v1/pets/:id/members/:userId` | OWNER (or self-leave) | Remove/leave |
| `PATCH /api/v1/pets/:id/visibility` | OWNER | `isPublic` + per-section map; audit-logged |
| `GET /api/v1/public/pets/:id` | none (anon) | `PublicPetDto` only; 404 unless `isPublic`; rate-limited; cacheable |
| `GET /api/v1/public/pets/:id/media` etc. | none | Public sections only, public entries only |

Retrofit in the same iteration set: **all** Phase 2–3 endpoints switch from `PetOwnerGuard` to `PetAccessGuard(minRole)`, and the media-serving choke point (Phase 3 §Serving) consults `PetAccessService`.

`PublicPetDto` (separate class, separate serializer path): id, name, species chain, category, description, avatar, public sections' content, `coarseLocation { city?, region?, country? }` (populated in Phase 7), social counts (Phase 10). **No** owner identity beyond display name opt-in, no members, no documents, no coordinates — enforced by construction and by snapshot tests.

## Public Surface (SSR, SEO, Caching)

- Next.js route `/[locale]/p/[petId]` (short shareable path) — SSR against the public API; `generateMetadata` for title/description/OpenGraph image (pet avatar `large` variant via public media URL).
- `sitemap.xml` listing public pets (updated on publish/unpublish); `robots.txt` allows `/p/*`, disallows everything else app-internal.
- Caching: public API responses `Cache-Control: public, max-age=60, stale-while-revalidate=300` (+ Cloudflare edge). Unpublishing must purge: flip to private → next request 404s (cache TTL ≤ 60 s is the accepted staleness bound; document it).
- Anonymous rate limiting: dedicated throttle bucket per IP for `/public/*`.

## Frontend Pages and Components

```
app/[locale]/
  p/[petId]/page.tsx            # public pet page (SSR, works logged-out)
  pets/invite/[token]/page.tsx  # accept-invite (login-gated with redirect-back)
  pets/[petId]/sharing/page.tsx # owner: visibility + members + invite links
components/sharing/
  VisibilityPanel.tsx           # public toggle + per-section switches + "what others see" preview link
  MemberList.tsx  InviteLinkDialog.tsx  RoleBadge.tsx  LeavePetButton.tsx
```

- Dashboard: "Shared with me" section (member pets, role badge).
- Pet page header: visibility indicator (private / members / public) + "View as public" preview for owners.
- Account settings: "Pets I'm a member of" with leave actions.

## Iteration Plan

| # | Work | Done when |
| - | ---- | --------- |
| 4.1 | Schema (`phase4_sharing`): `PetMember`, `PetInviteToken`, `sectionVisibility` | Migration applied |
| 4.2 | `PetAccessService` + `PetAccessGuard(minRole)`; retrofit all pet/media/album endpoints; 404-not-403 policy | **Access matrix suite** (5 roles × all endpoints) green in CI |
| 4.3 | Invites: create/preview/accept/revoke API + UI (dialog with copyable link, accept page); member management (list/role/remove/leave); audit | Invite E2E: owner → link → second user joins as caretaker |
| 4.4 | Visibility: API + `VisibilityPanel`; audit on every change | Section toggles reflected immediately in access checks |
| 4.5 | `PublicPetDto` + `/public/*` endpoints + serializer snapshot tests + anon throttling | Snapshot proves absence of geo/docs/members fields |
| 4.6 | Public SSR page `/p/[petId]` + OpenGraph + sitemap + robots; share button on pet page | Lighthouse SEO ≥ 90; link unfurls with image in Telegram/Slack |
| 4.7 | Shared-with-me dashboard section; caretaker write-path verification (upload photo, add caption) | Caretaker can add, viewer cannot (E2E) |
| 4.8 | Account deletion × pets: implement `PetHandlingStrategy` (Phase 1.9 stub): sole-owner pets → choose transfer-to-member or delete; member rows always removed; municipal/ownerless pets keep creator until transfer | Deletion E2E both branches; no orphaned access |
| 4.9 | Hardening: fuzz public endpoints (invalid ids, enumeration), cache purge behavior, rate limits, `X-Robots-Tag: noindex` on preview-as-public, pen-test checklist pass | Checklist in PR description signed off |

## Testing Strategy

- **Access-control matrix suite**: parametrized integration tests — role ∈ {anon, non-member, viewer, caretaker, owner} × every pet-scoped endpoint → expected status/filtered payload. Runs on every CI from now on; any new endpoint must register itself in the matrix (enforced by a coverage assertion on route metadata).
- Serializer snapshot tests for `PublicPetDto` (geo/docs absence).
- Invite lifecycle: expiry, reuse, revoked, cross-pet token confusion.
- E2E: share → accept → caretaker contributes → owner revokes; public page anonymous browsing incl. all four locales.
- SEO checks: metadata, sitemap validity, Lighthouse in CI (informational job).

## Security Notes

- 404 for unauthorized access to private pets (no existence oracle); invite preview is the deliberate exception (requires possessing the token).
- Raw invite tokens never stored or logged; hash-at-rest like refresh tokens.
- Cache rules must never let a private pet linger publicly: flip-to-private test asserts 404 within TTL bound.
- Public pages expose the owner's chosen display name only if the owner enabled "show me as owner" (off by default).
- All visibility/membership mutations audit-logged with actor, before/after.
