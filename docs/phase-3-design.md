# Phase 3: Media Foundation — Uploads, Albums, Quotas — Design Document

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Upload & Serving Pipeline](#upload--serving-pipeline)
- [API Endpoints](#api-endpoints)
- [Frontend Pages and Components](#frontend-pages-and-components)
- [Iteration Plan](#iteration-plan)
- [Testing Strategy](#testing-strategy)
- [Security Notes](#security-notes)
- [Extendability Notes](#extendability-notes)

---

## Overview

Phase 3 builds the media subsystem everything visual depends on: secure uploads (images, video, documents), automatic image variants, per-user quotas, pet galleries, Instagram-like albums, and user/pet avatars. Media serving is always authorization-checked; the filesystem is an implementation detail behind a `StorageAdapter`, keeping a later S3 move incremental (plan §8.4).

**Dependencies**: Phase 2 (pets exist). Visibility here is still owner-only; Phase 4 layers members/public on top of the same checks.

## Architecture

```
apps/api/src/
  media/
    media.module.ts / media.controller.ts / media.service.ts
    storage/
      storage-adapter.interface.ts     # put/getStream/delete/stat
      local-fs.adapter.ts              # v1 implementation (MEDIA_ROOT)
    processing/
      image-processor.ts               # sharp: EXIF strip + variants
      mime-sniffer.ts                  # magic-bytes detection (file-type lib)
    quota/quota.service.ts
    dto/  guards/media-access.guard.ts
  album/
    album.module.ts / controller / service / dto
```

Key decisions:

- **Opaque storage keys**: `media/<yy>/<mm>/<uuid>-<variant>.<ext>` — no user-controlled names, sharded by month for filesystem hygiene.
- **Variants generated synchronously at upload** (sharp is fast at our sizes; avoids "image not ready" UX). Video poster frames are the only async job (3.8).
- **One `MediaFile` row per logical file**, variants tracked in a JSON column; deletion removes all variants + updates quota atomically.
- Quota accounting on `User.mediaUsedBytes` (Phase 1 columns), updated in the same transaction as `MediaFile` create/delete; a reconciliation job (3.9) guards drift.

## Database Schema

```prisma
enum MediaKind { IMAGE VIDEO DOCUMENT }

model MediaFile {
  id           String    @id @default(uuid()) @db.VarChar(36)
  ownerUserId  String    @map("owner_user_id") @db.VarChar(36)
  petId        String?   @map("pet_id") @db.VarChar(36)     // null = user-level (e.g. user avatar)
  kind         MediaKind
  mimeType     String    @map("mime_type") @db.VarChar(100)
  sizeBytes    BigInt    @map("size_bytes")                  // original + all variants
  width        Int?
  height       Int?
  durationSec  Int?      @map("duration_sec")                // video
  storageKey   String    @unique @map("storage_key") @db.VarChar(255)
  variants     Json?                                          // { thumb: {key,w,h,bytes}, medium: {...}, large: {...}, poster: {...} }
  checksum     String    @db.VarChar(64)                      // sha256 of original
  inGallery    Boolean   @default(true) @map("in_gallery")    // diary/doc attachments may opt out
  caption      String?   @db.VarChar(500)
  takenAt      DateTime? @map("taken_at")                     // from EXIF *before* stripping (date only, no GPS)
  createdAt    DateTime  @default(now()) @map("created_at")
  deletedAt    DateTime? @map("deleted_at")

  @@index([petId, createdAt])
  @@index([ownerUserId])
  @@map("media_files")
}

model Album {
  id           String   @id @default(uuid()) @db.VarChar(36)
  petId        String   @map("pet_id") @db.VarChar(36)
  title        String   @db.VarChar(120)
  description  String?  @db.VarChar(1000)
  coverMediaId String?  @map("cover_media_id") @db.VarChar(36)
  sortOrder    Int      @default(0) @map("sort_order")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@index([petId, sortOrder])
  @@map("albums")
}

model AlbumItem {
  id        String   @id @default(uuid()) @db.VarChar(36)
  albumId   String   @map("album_id") @db.VarChar(36)
  mediaId   String   @map("media_id") @db.VarChar(36)
  caption   String?  @db.VarChar(500)
  sortOrder Int      @default(0) @map("sort_order")

  @@unique([albumId, mediaId])
  @@index([albumId, sortOrder])
  @@map("album_items")
}
```

Also in this phase: activate `Pet.avatarMediaId` and `User.avatarMediaId` FKs (expand migration).

## Upload & Serving Pipeline

### Upload (`POST /api/v1/media`)

1. Auth + (if `petId` given) pet write-access check (owner now; caretaker from Phase 4).
2. Multipart stream to temp file in `MEDIA_ROOT/tmp` (never memory-buffered whole).
3. **Magic-bytes MIME sniff** (`file-type`); reject if not in whitelist: `image/jpeg|png|webp|heic|gif`, `video/mp4|webm`, `application/pdf`. Extension is ignored. **No SVG** (XSS vector).
4. Size caps by kind: image 15 MB, video 100 MB, document 25 MB (`MEDIA_MAX_*` env).
5. Quota pre-check (`usedBytes + size ≤ quotaBytes`) → 413 with localized error.
6. Images: read `takenAt` from EXIF, then **re-encode via sharp** (strips ALL metadata incl. GPS — re-encoding, not tag-stripping, is the guarantee); auto-rotate; generate variants thumb 256 / medium 1024 / large 2048 (skip upsizing); WebP for variants, original format preserved for the original.
7. PDFs stored as-is; served with `Content-Disposition: attachment` + `X-Content-Type-Options: nosniff`.
8. Write files via `StorageAdapter`, then `MediaFile` row + quota increment in one transaction; on failure, delete orphan files.

### Serving (`GET /api/v1/media/:id/:variant`)

1. Load `MediaFile` → resolve subject (pet-level or user-level) → access check (this phase: owner/creator; Phase 4 swaps in the shared visibility resolver — single choke point by design).
2. Stream with `Content-Type`, `ETag` (checksum), `Cache-Control: private, max-age=3600`; public media (Phase 4+) get `public, max-age=31536000, immutable` — safe because keys are content-addressed-ish (UUID per upload, replaced not mutated).
3. Range requests supported for video.

## API Endpoints

| Endpoint                                                        | Notes                                                                                                                                                  |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /api/v1/media`                                            | multipart; fields: file, `petId?`, `caption?`, `inGallery?`                                                                                            |
| `GET /api/v1/media/:id/:variant`                                | `variant ∈ original                                                                                                                                    | thumb | medium | large | poster`; auth-checked streaming |
| `DELETE /api/v1/media/:id`                                      | owner of media or pet owner; removes files + quota decrement                                                                                           |
| `PATCH /api/v1/media/:id`                                       | caption, `inGallery`                                                                                                                                   |
| `GET /api/v1/pets/:id/media`                                    | gallery: cursor-paginated, newest first                                                                                                                |
| `POST /api/v1/pets/:id/avatar` / `POST /api/v1/users/me/avatar` | upload + square-crop variants (256/64)                                                                                                                 |
| `GET /api/v1/users/me/storage`                                  | `{ usedBytes, quotaBytes }`                                                                                                                            |
| Albums                                                          | `POST/GET/PATCH/DELETE /api/v1/pets/:id/albums`, `POST/DELETE/PATCH albums/:albumId/items` (add/remove/reorder/caption), `PATCH albums/:albumId/cover` |

## Frontend Pages and Components

```
components/media/
  UploadDropzone.tsx      # drag&drop + camera capture on mobile; progress; multi-file
  MediaGrid.tsx           # responsive masonry-ish grid of thumbs
  Lightbox.tsx            # keyboard/touch, zoom, caption, delete
  VideoPlayer.tsx  StorageUsageBar.tsx  AvatarUploader.tsx (with crop UI)
components/album/
  AlbumGrid.tsx  AlbumCard.tsx  AlbumView.tsx  AlbumManageDialog.tsx
```

- Pet page gains a **Photos** tab: gallery grid + upload zone + albums row.
- Settings gains avatar upload + `StorageUsageBar`.
- Dashboard `PetCard` uses avatar thumbs.

## Iteration Plan

| #   | Work                                                                                                                                                          | Done when                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 3.1 | `StorageAdapter` + local FS impl + `MediaFile` model (`phase3_media` migration) + `MEDIA_ROOT` volume in dev/staging/prod compose + deploy bind mounts        | Adapter unit tests; staging volume writable and on backup path (verified in 3.9)                |
| 3.2 | Upload endpoint: sniffing, caps, quota, EXIF re-encode, variants; quota service                                                                               | Security tests: MIME spoof rejected, oversize 413, quota 413, EXIF-GPS absent from output bytes |
| 3.3 | Serving endpoint: streaming, ETag, cache headers, range                                                                                                       | 403 for other users; video seek works                                                           |
| 3.4 | Pet gallery UI: Photos tab, dropzone (multi-file + mobile camera), grid, lightbox, delete, captions; pet avatar                                               | E2E: upload → appears → delete → quota restored                                                 |
| 3.5 | Albums API + tests                                                                                                                                            | CRUD + ordering + cover + uniqueness                                                            |
| 3.6 | Albums UI: grid, album view, manage dialog (add from gallery, reorder, captions, cover)                                                                       | E2E album lifecycle                                                                             |
| 3.7 | User avatar + storage bar in settings; avatar crop                                                                                                            | Avatar renders in header/comments-to-be                                                         |
| 3.8 | Video: upload within caps, inline player; async poster-frame job (ffmpeg via BullMQ — first queue use if before Phase 6, otherwise reuse)                     | Video plays; poster appears ≤ 1 min after upload                                                |
| 3.9 | Ops: media dir added to `backup.sh` archive + restore verification; orphan-file/quota-drift reconciliation job; deleted-file purge job (soft-deleted 30 days) | Restore drill includes media; reconciliation logs zero drift on staging                         |

## Testing Strategy

- **Upload security suite** (CI-mandatory from here on): spoofed MIME (rename .exe→.jpg), SVG rejection, oversize, quota edge (exactly at limit), EXIF GPS stripped (byte-level scan of stored variants for GPS tags), HEIC conversion.
- Adapter contract tests (same suite must pass for the future S3 adapter).
- Integration: upload→serve→delete lifecycle with Testcontainers + tmp media root.
- E2E: gallery + album flows, mobile viewport upload.
- Load sanity: 20 parallel uploads on staging stay under memory limits (streamed, not buffered).

## Security Notes

- Re-encode is the EXIF guarantee; never trust tag-stripping libraries alone.
- Files live outside web root; nginx never serves `MEDIA_ROOT` directly — only the API does (public-cache optimization via nginx `proxy_cache` is allowed later, keyed by the API response, not the filesystem).
- Per-IP + per-user throttle on upload endpoints; checksum dedupe is deliberately **not** cross-user (privacy: existence oracle).
- Quota transactionality prevents negative/runaway accounting; reconciliation job alerts on drift.

## Extendability Notes

- S3 move = implement `S3Adapter` passing the adapter contract tests + copy migration script; DB stores only storage keys.
- `variants` JSON leaves room for new sizes/formats (AVIF) without migrations.
- `takenAt` enables future "on this day" and timeline features.
- Stories (Phase 11) and documents (Phase 5) reuse `MediaFile` + this pipeline unchanged.
