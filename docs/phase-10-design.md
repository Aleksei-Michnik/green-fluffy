# Phase 10: Social — Follows, Likes, Comments, Discovery Feed — Design Document

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Feed Design](#feed-design)
- [API Endpoints](#api-endpoints)
- [Frontend Pages and Components](#frontend-pages-and-components)
- [Iteration Plan](#iteration-plan)
- [Testing Strategy](#testing-strategy)
- [Abuse Prevention & Moderation](#abuse-prevention--moderation)
- [Extendability Notes](#extendability-notes)

---

## Overview

Phase 10 activates the community layer over the public content that Phases 3–8 created: following pets and users, liking and commenting on public content, owner-side moderation, and a **discovery feed** for logged-in users (public pet pages stay anonymous-visible; the feed requires login — confirmed scope). Social interaction happens **only on public content**: private pets have no social surface at all.

**Dependencies**: Phases 3–4 (media + public model); Phase 6 (notifications). Stories (Phase 11) plug into this feed.

## Architecture

```
apps/api/src/
  social/
    social.module.ts
    follow.controller.ts / service
    like.controller.ts / service
    comment.controller.ts / service
    activity.service.ts               # writes ActivityEvent on publish actions
    feed.controller.ts / service
    moderation.controller.ts / service  # reports queue, blocks
```

Core concepts:

- **Polymorphic subjects** via `(subjectType, subjectId)`: `PET_PHOTO | ALBUM | DIARY_ENTRY | STORY (11) | GROUP_PHOTO`. A single `SocialSubjectResolver` maps subject → owning pet/group → visibility; **every** social read/write revalidates public visibility at request time (a pet flipped private takes its social layer with it instantly).
- **ActivityEvent** rows are written when public content is created (or content becomes public) — the feed's raw material and the future audit of what was ever exposed.
- Denormalized counters (`likeCount`, `commentCount`) on `ActivityEvent` maintained transactionally; periodically reconciled (same drift-job pattern as media quotas).

## Database Schema

```prisma
enum SocialSubjectType { PET_PHOTO ALBUM DIARY_ENTRY STORY GROUP_PHOTO }

model Follow {
  id             String   @id @default(uuid()) @db.VarChar(36)
  followerUserId String   @map("follower_user_id") @db.VarChar(36)
  petId          String?  @map("pet_id") @db.VarChar(36)       // XOR followedUserId
  followedUserId String?  @map("followed_user_id") @db.VarChar(36)
  createdAt      DateTime @default(now()) @map("created_at")
  @@unique([followerUserId, petId])
  @@unique([followerUserId, followedUserId])
  @@index([petId]) @@index([followedUserId])
  @@map("follows")
}

model Like {
  id          String            @id @default(uuid()) @db.VarChar(36)
  userId      String            @map("user_id") @db.VarChar(36)
  subjectType SocialSubjectType @map("subject_type")
  subjectId   String            @map("subject_id") @db.VarChar(36)
  createdAt   DateTime          @default(now()) @map("created_at")
  @@unique([userId, subjectType, subjectId])
  @@index([subjectType, subjectId])
  @@map("likes")
}

enum CommentStatus { VISIBLE DELETED_BY_AUTHOR DELETED_BY_OWNER HIDDEN_BY_REPORT }

model Comment {
  id           String            @id @default(uuid()) @db.VarChar(36)
  subjectType  SocialSubjectType @map("subject_type")
  subjectId    String            @map("subject_id") @db.VarChar(36)
  authorUserId String            @map("author_user_id") @db.VarChar(36)
  parentId     String?           @map("parent_id") @db.VarChar(36)   // one level deep
  body         String            @db.VarChar(2000)                    // plain text; linkified render only
  status       CommentStatus     @default(VISIBLE)
  createdAt    DateTime          @default(now()) @map("created_at")
  updatedAt    DateTime          @updatedAt @map("updated_at")
  @@index([subjectType, subjectId, createdAt])
  @@index([authorUserId])
  @@map("comments")
}

model ActivityEvent {
  id           String            @id @default(uuid()) @db.VarChar(36)
  petId        String?           @map("pet_id") @db.VarChar(36)
  groupId      String?           @map("group_id") @db.VarChar(36)
  subjectType  SocialSubjectType @map("subject_type")
  subjectId    String            @map("subject_id") @db.VarChar(36)
  publishedAt  DateTime          @map("published_at")
  likeCount    Int               @default(0) @map("like_count")
  commentCount Int               @default(0) @map("comment_count")
  retractedAt  DateTime?         @map("retracted_at")           // content deleted or made private
  @@unique([subjectType, subjectId])
  @@index([publishedAt])
  @@index([petId, publishedAt])
  @@map("activity_events")
}

enum ReportStatus { OPEN REVIEWED_DISMISSED REVIEWED_ACTIONED }

model Report {
  id             String       @id @default(uuid()) @db.VarChar(36)
  reporterUserId String       @map("reporter_user_id") @db.VarChar(36)
  subjectType    String       @db.VarChar(30)     // social subjects + COMMENT + PET (page itself)
  subjectId      String       @map("subject_id") @db.VarChar(36)
  reason         String       @db.VarChar(30)      // spam | abuse | animal_welfare | inappropriate | other
  note           String?      @db.VarChar(500)
  status         ReportStatus @default(OPEN)
  reviewedBy     String?      @map("reviewed_by") @db.VarChar(36)
  reviewedAt     DateTime?    @map("reviewed_at")
  createdAt      DateTime     @default(now()) @map("created_at")
  @@index([status, createdAt])
  @@map("reports")
}

model UserBlock {
  id            String   @id @default(uuid()) @db.VarChar(36)
  blockerUserId String   @map("blocker_user_id") @db.VarChar(36)  // pet/group owner
  blockedUserId String   @map("blocked_user_id") @db.VarChar(36)
  createdAt     DateTime @default(now()) @map("created_at")
  @@unique([blockerUserId, blockedUserId])
  @@map("user_blocks")
}
```

`Pet`/`PetGroup` gain `socialSettings Json?` — `{ likesEnabled: true, commentsEnabled: true, showOwner: false }` (expand migration; `showOwner` formalizes the Phase 4 opt-in). `User` gains `isModerator Boolean @default(false)` (maintainer-set flag; no admin UI yet).

## Feed Design

Fan-out **on read** — correct call at this scale (thousands of users, VDS): one indexed query over materialized `ActivityEvent`, no fan-out storage to maintain.

```
feed = merge by publishedAt DESC, cursor-paginated:
  A. followed: events whose petId ∈ my followed pets OR pet.owner ∈ my followed users
  B. discovery: recent public events (excluding A, excluding my own, excluding blocked-by relationships)
ordering: followed items get a recency boost (interleave A-first within each time bucket) — deterministic, no ML
```

- Visibility revalidated per page serve (events joined against current `isPublic` + section flags; `retractedAt` short-circuits).
- p95 target < 300 ms on VDS; covered by index `(publishedAt)` + join pruning; feed page size 20.
- The same query with `petId=` filter powers per-pet activity tabs.

## API Endpoints

| Endpoint | Guard | Notes |
| -------- | ----- | ----- |
| `POST/DELETE /api/v1/follows` | authed | `{petId}` or `{userId}`; no self/duplicate; blocked-by ⇒ 404 |
| `GET /api/v1/users/me/follows` | authed | Following list with pet cards |
| `POST/DELETE /api/v1/likes` | authed | Subject must be public + likes enabled; idempotent |
| `GET /api/v1/comments?subjectType=&subjectId=` | anon allowed (public subjects) | Threaded ×1, cursor |
| `POST /api/v1/comments` | authed | Public subject + comments enabled + not blocked; 2000-char cap |
| `PATCH/DELETE /api/v1/comments/:id` | author (5-min edit window) / subject owner delete / moderator | Status transitions, never hard delete |
| `GET /api/v1/feed` | authed | Merged feed (above) |
| `POST /api/v1/reports` | authed | Any public subject/comment/pet |
| `GET/PATCH /api/v1/moderation/reports` | moderator | Queue, dismiss/action (action = hide content + optional note) |
| `POST/DELETE /api/v1/blocks` | authed (as content owner) | Blocked users can't comment/like/follow the blocker's content |
| `PATCH /api/v1/pets/:id/social-settings` | OWNER | Toggles |

Social counters appear in `PublicPetDto` (Phase 4 contract anticipated them).

## Frontend Pages and Components

```
app/[locale]/
  feed/page.tsx               # logged-in home once Phase 10 ships (Today board moves to a tab/split)
  moderation/page.tsx         # moderator-only queue
components/social/
  FollowButton.tsx  LikeButton.tsx (optimistic)  CommentList.tsx  CommentComposer.tsx
  FeedCard.tsx (photo/album/diary variants)  FeedFilters.tsx (all | following)
  ReportDialog.tsx  BlockedUsersList.tsx (settings)  SocialSettingsPanel.tsx (per pet/group)
```

- Public pet page gains like/comment/follow on public items (anonymous users see counts + login CTA).
- Logged-in home becomes two tabs: **Feed** and **Today** (care board) — the app's daily loop.
- Notifications: `social` category activates — new comment on my content, new follower (never for likes by default).

## Iteration Plan

| # | Work | Done when |
| - | ---- | --------- |
| 10.1 | Schema `phase10_social` + `ActivityEvent` writers on publish paths (media upload to public pet, entry made public, album created, pet flips public ⇒ backfill events; flips private ⇒ retract) | Publish/retract lifecycle tests green |
| 10.2 | Follows: API + buttons + following list | Follow round-trip E2E |
| 10.3 | Likes: API + optimistic button + counters (tx + reconciliation job) | Idempotency + counter accuracy tests |
| 10.4 | Comments: API + thread UI + edit window + status model | E2E comment thread on a public photo; XSS corpus renders inert |
| 10.5 | Moderation: owner delete/settings toggles, blocks, report dialog + moderator queue page | Owner controls E2E; report → moderator hides |
| 10.6 | Feed: query + endpoint + page (tabs all/following) + p95 measurement on staging seed (10k events) | Feed p95 < 300 ms; visibility revalidation test (flip private mid-scroll) |
| 10.7 | Public pet page social surfaces + anonymous counts + login CTA | Anonymous sees counts, cannot act |
| 10.8 | Social notifications (comment/follow) via dispatcher, preference-gated (default: comments ON, follows ON, likes OFF) | Notification E2E |
| 10.9 | Anti-abuse hardening: endpoint throttles, block-semantics sweep across all social endpoints, banned-content re-serve check, `docs/moderation-playbook.md` (SLA, welfare-report escalation) | Abuse checklist signed off; playbook committed |

## Testing Strategy

- Visibility revalidation is the crown invariant: matrix tests — every social read/write × subject just-made-private/deleted/retracted ⇒ 404/hidden, including feed pages already cursor'd.
- Block semantics: blocked user attempting follow/like/comment on any surface of blocker's content ⇒ uniform 404.
- Counter reconciliation drift = 0 on staging seed.
- XSS corpus through comment render; linkification doesn't create `javascript:` hrefs.
- Feed determinism: same data ⇒ same page order (snapshot).

## Abuse Prevention & Moderation

- Throttles: comments 10/min/user, likes 60/min, follows 30/min, reports 10/day (tunable env).
- New accounts (< 24 h) get half limits — cheap spam damper.
- `animal_welfare` report reason is flagged top-priority in the queue (this app will see real cases — the playbook documents escalation and that we are not an enforcement body, with regional resource links).
- Moderator actions audit-logged; hidden content keeps rows (`HIDDEN_BY_REPORT`) for accountability.

## Extendability Notes

- Fan-out-on-write feed, hashtags, and mentions are deliberate non-goals until scale demands; `ActivityEvent` is the substrate all of them would build on.
- Stories (Phase 11) = one more `SocialSubjectType` + feed rail — everything here already handles them.
- Follower notifications digest, weekly "your pets' week" email — dispatcher categories, later.
- If moderation volume grows, the moderator flag graduates to a role system; queue already keyed by status/date.
