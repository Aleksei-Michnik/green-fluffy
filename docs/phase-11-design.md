# Phase 11: Stories — Design Document

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Lifecycle](#lifecycle)
- [API Endpoints](#api-endpoints)
- [Frontend Pages and Components](#frontend-pages-and-components)
- [Iteration Plan](#iteration-plan)
- [Testing Strategy](#testing-strategy)
- [Extendability Notes](#extendability-notes)

---

## Overview

Phase 11 adds Instagram-style **stories**: short-lived (24 h) photo/video posts on a pet, shown in a tap-through viewer and a story rail on the feed and public pet pages. Expired stories aren't deleted — they move to a **private story archive** visible to the pet's owner and members. Stories ride entirely on existing rails: media pipeline (Phase 3), visibility resolver (Phase 4), social subjects + feed (Phase 10), notifications (Phase 6).

**Dependencies**: Phases 3, 4, 10.

## Architecture

```
apps/api/src/story/
  story.module.ts / controller / service
  jobs/story-expiry.job.ts        # marks expired; no deletion
components/story/
  StoryRail.tsx  StoryAvatarRing.tsx (unseen gradient ring)
  StoryViewer.tsx (fullscreen, progress bars, tap/swipe/keyboard)
  StoryComposer.tsx (capture/pick → caption → publish)
  StoryArchiveGrid.tsx
```

- A story is **one media item + optional caption**; a pet's active stories form its current "reel" ordered by publish time.
- Story visibility = pet's photo-section visibility: public pet + public photos ⇒ story is public (feed rail, public page); otherwise members-only. Same resolver call as every other media read — no special path.
- Seen-state per user tracked server-side (`StoryView`) so the unseen ring works across devices; views also give owners a simple view count (viewer list only for members — not public).

## Database Schema

```prisma
model Story {
  id          String    @id @default(uuid()) @db.VarChar(36)
  petId       String    @map("pet_id") @db.VarChar(36)
  authorUserId String   @map("author_user_id") @db.VarChar(36)   // owner or caretaker
  mediaId     String    @map("media_id") @db.VarChar(36)
  caption     String?   @db.VarChar(500)
  publishedAt DateTime  @default(now()) @map("published_at")
  expiresAt   DateTime  @map("expires_at")                        // publishedAt + 24h
  expiredAt   DateTime? @map("expired_at")                        // set by job; null = active
  deletedAt   DateTime? @map("deleted_at")                        // author/owner delete (also retracts)

  @@index([petId, expiresAt])
  @@index([expiresAt, expiredAt])
  @@map("stories")
}

model StoryView {
  id       String   @id @default(uuid()) @db.VarChar(36)
  storyId  String   @map("story_id") @db.VarChar(36)
  userId   String   @map("user_id") @db.VarChar(36)
  viewedAt DateTime @default(now()) @map("viewed_at")
  @@unique([storyId, userId])
  @@map("story_views")
}
```

Stories register as `SocialSubjectType.STORY` (enum value reserved in Phase 10): likes allowed while active; comments **off** for stories in v1 (quick reactions later). `ActivityEvent` written on publish for public stories; retracted on expiry/delete.

## Lifecycle

```
publish → active (visible per pet visibility; in rails; likeable)
       → [24h] expiry job (5-min sweep, idempotent): sets expiredAt, retracts ActivityEvent
       → archived (owner + members only: archive grid; likes frozen)
delete (author or pet owner, any time) → gone from all surfaces, media stays in MediaFile unless also deleted
```

Media uploaded through the standard pipeline with `inGallery=false` by default ("also add to gallery" toggle in composer flips it — the one-upload-two-uses pattern from diary).

## API Endpoints

| Endpoint | Guard | Notes |
| -------- | ----- | ----- |
| `POST /api/v1/pets/:id/stories` | CARETAKER+ | `{mediaId, caption?, alsoInGallery?}`; validates media belongs to pet |
| `GET /api/v1/pets/:id/stories` | visibility-resolved | Active reel, ordered; includes my seen-state |
| `GET /api/v1/feed/story-rail` | authed | Followed + discovery pets with active stories, unseen-first |
| `GET /api/v1/public/pets/:id/stories` | anon | Public pets with public photos only |
| `POST /api/v1/stories/:id/view` | authed | Upsert seen; anonymous views not tracked |
| `DELETE /api/v1/stories/:id` | author or pet OWNER | |
| `GET /api/v1/pets/:id/stories/archive` | VIEWER+ | Expired stories grid, cursor by publishedAt |
| `GET /api/v1/stories/:id/viewers` | pet OWNER/CARETAKER | View list + count |

## Frontend Pages and Components

- **StoryComposer**: entry from pet page (+ FAB) — capture/pick (mobile camera), caption, gallery toggle, publish; image variants reused; video capped at 60 s for stories (client-side duration check + server validation).
- **StoryViewer**: fullscreen; progress bars per item (5 s images, video = duration); tap right/left, swipe between pets' reels, Esc/close; caption overlay; like button; owner sees view count.
- **StoryRail**: horizontal avatar rings on feed top and public pet page (public only); unseen gradient ring → gray when seen.
- **Archive**: tab on pet page (members): grid by month; tap opens viewer in archive mode.

## Iteration Plan

| # | Work | Done when |
| - | ---- | --------- |
| 11.1 | Schema `phase11_stories` + story CRUD API + visibility resolution + ActivityEvent publish/retract | Lifecycle API tests green |
| 11.2 | Composer (capture, caption, gallery toggle, video duration validation) | E2E: publish story from mobile viewport |
| 11.3 | Viewer (progress, gestures, keyboard, likes, view tracking) | E2E tap-through; a11y: keyboard operable, reduced-motion respected |
| 11.4 | Rails: feed story-rail endpoint + component + public pet page rail; unseen ordering | Rail shows unseen-first; anonymous sees public reels |
| 11.5 | Expiry job + archive grid + viewer archive mode; retraction verified in feed/public | Story vanishes from public surfaces ≤ 5 min after 24 h; appears in archive |
| 11.6 | Story notifications: optional new-story for followers (default OFF), digest-friendly | Preference-gated delivery E2E |

## Testing Strategy

- Expiry sweep: idempotent, timezone-irrelevant (pure UTC instants), clock-faked boundary tests (23:59/24:01).
- Visibility: pet flips private with active public story ⇒ story instantly gone from rail/public (Phase 10 revalidation pattern).
- Seen-state: cross-device (two sessions), unseen ordering.
- Access: archive/viewers endpoints in the standing matrix.
- Performance: rail query on staging seed (500 pets, 2k stories) p95 < 200 ms.

## Extendability Notes

- Quick emoji reactions, story replies (DM-ish), and highlights (pinned permanent reels) are natural follow-ups; `StoryView` + archive already store what they'd need.
- Story mentions/tags of other pets would ride the Phase 10 subject system.
- 24 h TTL is a constant, not a law — per-story TTL is one column away if ever wanted.
