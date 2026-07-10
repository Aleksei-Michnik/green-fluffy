# Phase 12: Data Export & Privacy Dashboard — Design Document

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Export Format](#export-format)
- [API Endpoints](#api-endpoints)
- [Frontend](#frontend)
- [Iteration Plan](#iteration-plan)
- [Testing Strategy](#testing-strategy)

---

## Overview

Phase 12 closes the GDPR-style loop opened in Phase 1: users can **export everything** (structured data + media archive) and **see and control** their privacy posture in one place — what's public, who has access to what, active sessions, and the audit trail of sensitive changes. It also verifies deletion cascades across everything built since Phase 1.9/4.8.

**Dependencies**: all core phases (it exports their data); myfinpro deferred its export for lack of data — we ship it once the data model is complete.

## Architecture

```
apps/api/src/export/
  export.module.ts / controller / service
  jobs/export-builder.job.ts     # BullMQ, streams zip to EXPORT_ROOT
apps/api/src/privacy/
  privacy.controller.ts / service # aggregated read-models over existing tables
```

- Export runs async (BullMQ): builds a zip on disk (`EXPORT_ROOT`, outside media root, per-user subdir), records an `ExportJob` row, notifies when ready; download via single-use, expiring signed link; files auto-purged after 7 days (cleanup job).
- Concurrency: one active export per user; size guard (user quota bounds media size, so worst case ≈ quota + JSON).

```prisma
model ExportJob {
  id          String    @id @default(uuid()) @db.VarChar(36)
  userId      String    @map("user_id") @db.VarChar(36)
  status      String    @db.VarChar(15)    // pending | building | ready | failed | expired
  storageKey  String?   @map("storage_key") @db.VarChar(255)
  sizeBytes   BigInt?   @map("size_bytes")
  downloadTokenHash String? @map("download_token_hash") @db.VarChar(255)  // sha256, single-use
  expiresAt   DateTime? @map("expires_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  completedAt DateTime? @map("completed_at")
  @@index([userId, createdAt])
  @@map("export_jobs")
}
```

## Export Format

```
export-<date>/
  manifest.json            # schema version, generated-at, counts per section
  profile.json             # user profile, preferences, connected providers (ids only, no tokens)
  pets/<petId>/pet.json    # profile, members(*), visibility, location (precise — it's the user's own data)
  pets/<petId>/diary.json  care.json  measurements.json  documents.json  procedures.json  # providers referenced by id + name snapshot
  pets/<petId>/media/<file>            # originals, human-readable names manifest-mapped
  groups/<groupId>/...     # same shape
  social.json              # my follows, likes, comments authored
  reminders.json  warnings.json (incl. dismissals)  audit.json (my audit events)
```

Scope rule: **the user's own data only** — pets they own/manage, their authored content on others' pets (comments), memberships listed but _other users' personal data minimized_ (display names only). JSON schemas versioned in `packages/shared` so the format is testable and future-import-friendly.

## API Endpoints

| Endpoint                                                  | Notes                                                                                                                                                                                                                       |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/v1/export`                                     | Enqueue; 409 if one active; audit-logged                                                                                                                                                                                    |
| `GET /api/v1/export`                                      | My export history + statuses                                                                                                                                                                                                |
| `GET /api/v1/export/:id/download?token=`                  | Single-use token, expiring; streams zip; audit-logged                                                                                                                                                                       |
| `GET /api/v1/privacy/overview`                            | Aggregate: public pets/groups (with section flags), members across my pets, pets I'm member of, active sessions (refresh tokens: device/IP/created), recent sensitive audit events (visibility, location, members, exports) |
| `DELETE /api/v1/sessions/:id` / `DELETE /api/v1/sessions` | Revoke one/all other sessions (extends ported refresh-token service)                                                                                                                                                        |

## Frontend

- `settings/privacy/page.tsx` — the **privacy dashboard**: “What’s public” (pet cards with per-section badges + direct fix links), “Who has access” (members table across pets/groups), “Active sessions” (device list + revoke), “Recent sensitive activity” (audit excerpt), links to legal + retention policy.
- `settings/export/page.tsx` — request button with progress state, history list, download (single-use warning), format explanation.
- Deletion settings page gains a "export first" nudge.

## Iteration Plan

| #    | Work                                                                                                                                                                                                                                                                                                        | Done when                                                                            |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 12.1 | Export job: builder (streamed zip, memory-bounded), `ExportJob` model + migration `phase12_export`, download tokens, purge job, notification on ready                                                                                                                                                       | Export of a seeded heavy user (500 media) completes < 10 min on staging; memory flat |
| 12.2 | Export UI + history + download; audit                                                                                                                                                                                                                                                                       | E2E: request → notified → download once → second download rejected                   |
| 12.3 | Privacy dashboard: overview endpoint (read-models) + page + session revocation                                                                                                                                                                                                                              | Dashboard answers "who sees my data?" against a complex fixture                      |
| 12.4 | Retention & cascade verification: deletion-cascade test suite across ALL domains (account deletion fixture with pets/groups/media/social/exports ⇒ zero orphans, quota released, ActivityEvents retracted, comments anonymized as "[deleted user]"); retention policy documented on privacy page ×4 locales | Cascade suite green in CI; policy published                                          |

## Testing Strategy

- Export completeness: golden fixture user → manifest counts equal DB counts; zip validated; no other users' emails/ids beyond display names (scan test).
- Token security: single-use, expiry, wrong-user 404.
- Cascade suite (12.4) becomes a standing CI fixture — the final safety net for every future phase touching user data.
- Privacy overview read-models covered by the access matrix (no privilege escalation via aggregation).
