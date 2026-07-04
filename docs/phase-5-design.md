# Phase 5: Health Diary, Measurements & Documents — Design Document

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Frontend Pages and Components](#frontend-pages-and-components)
- [Iteration Plan](#iteration-plan)
- [Testing Strategy](#testing-strategy)
- [Extendability Notes](#extendability-notes)

---

## Overview

Phase 5 delivers the health heart of the app: a typed diary timeline (conditions, symptoms, treatments, vaccinations, vet visits, observations, free notes), structured measurements with trend charts, and a documents vault (passports, chips, pedigrees, medical records, prescriptions, lab results). Photos attach to entries through the Phase 3 media pipeline, optionally landing in the gallery too — one upload, two uses.

**Dependencies**: Phase 3 (media), Phase 4 (roles: caretakers write, viewers read; per-entry visibility interacts with public diary sections).

## Architecture

```
apps/api/src/
  diary/
    diary.module.ts / controller / service
    dto/ (create-entry.dto with per-type detail schemas, query-entries.dto)
    types/entry-details.ts        # discriminated union per entry type
  measurement/measurement.module.ts / controller / service
  document/document.module.ts / controller / service / dto
```

Design choices:

- **One `DiaryEntry` table for all types** with a `details` JSON validated per type by a discriminated-union DTO — flexible, index-friendly on the common columns (petId, type, occurredAt), no join zoo.
- **Measurements are first-class rows** (not only JSON) so charts and range queries are cheap; a measurement-type diary entry creates/updates `Measurement` rows transactionally.
- Documents are metadata over `MediaFile` scans + structured fields (numbers, dates, issuer); **always private** (never in any public DTO — same type-level guarantee as geo).

## Database Schema

```prisma
enum DiaryEntryType { CONDITION SYMPTOM MEASUREMENT TREATMENT VACCINATION VET_VISIT OBSERVATION NOTE EVENT }
enum EntryVisibility { PRIVATE MEMBERS PUBLIC }

model DiaryEntry {
  id           String          @id @default(uuid()) @db.VarChar(36)
  petId        String          @map("pet_id") @db.VarChar(36)
  authorUserId String          @map("author_user_id") @db.VarChar(36)
  type         DiaryEntryType
  title        String?         @db.VarChar(200)
  body         String?         @db.Text                  // plain text + minimal markdown (sanitized render)
  occurredAt   DateTime        @map("occurred_at")        // user-set event time (tz-aware display)
  details      Json?                                       // per-type payload, see below
  visibility   EntryVisibility @default(MEMBERS)
  createdAt    DateTime        @default(now()) @map("created_at")
  updatedAt    DateTime        @updatedAt @map("updated_at")
  deletedAt    DateTime?       @map("deleted_at")

  media        DiaryEntryMedia[]
  measurements Measurement[]

  @@index([petId, occurredAt])
  @@index([petId, type, occurredAt])
  @@fulltext([title, body])
  @@map("diary_entries")
}

model DiaryEntryMedia {
  id      String @id @default(uuid()) @db.VarChar(36)
  entryId String @map("entry_id") @db.VarChar(36)
  mediaId String @map("media_id") @db.VarChar(36)
  @@unique([entryId, mediaId])
  @@map("diary_entry_media")
}

enum MetricType { WEIGHT HEIGHT LENGTH GIRTH TEMPERATURE CUSTOM }

model Measurement {
  id         String     @id @default(uuid()) @db.VarChar(36)
  petId      String     @map("pet_id") @db.VarChar(36)
  entryId    String?    @map("entry_id") @db.VarChar(36)
  metric     MetricType
  customName String?    @map("custom_name") @db.VarChar(50)   // when metric=CUSTOM
  value      Decimal    @db.Decimal(10, 3)
  unit       String     @db.VarChar(10)                        // kg|g|lb|cm|m|in|°C|°F|...
  measuredAt DateTime   @map("measured_at")
  createdAt  DateTime   @default(now()) @map("created_at")

  @@index([petId, metric, measuredAt])
  @@map("measurements")
}

enum PetDocumentType { PASSPORT CHIP PEDIGREE MEDICAL PRESCRIPTION LAB_RESULT OTHER }

model PetDocument {
  id         String          @id @default(uuid()) @db.VarChar(36)
  petId      String          @map("pet_id") @db.VarChar(36)
  entryId    String?         @map("entry_id") @db.VarChar(36)   // e.g. prescription attached to a vet visit
  type       PetDocumentType
  title      String          @db.VarChar(200)
  number     String?         @db.VarChar(100)                    // chip/passport number
  issuer     String?         @db.VarChar(200)                    // clinic, authority
  issuedAt   DateTime?       @map("issued_at") @db.Date
  validUntil DateTime?       @map("valid_until") @db.Date
  details    Json?
  createdAt  DateTime        @default(now()) @map("created_at")
  updatedAt  DateTime        @updatedAt @map("updated_at")
  deletedAt  DateTime?       @map("deleted_at")

  media      PetDocumentMedia[]

  @@index([petId, type])
  @@index([number])
  @@map("pet_documents")
}

model PetDocumentMedia {
  id         String @id @default(uuid()) @db.VarChar(36)
  documentId String @map("document_id") @db.VarChar(36)
  mediaId    String @map("media_id") @db.VarChar(36)
  @@unique([documentId, mediaId])
  @@map("pet_document_media")
}
```

### `details` JSON per entry type (validated discriminated union)

| Type | details shape |
| ---- | ------------- |
| CONDITION | `{ name, status: active|resolved|chronic, diagnosedBy? }` |
| SYMPTOM | `{ symptoms: string[], severity: mild|moderate|severe }` |
| MEASUREMENT | `{ measurements: [{metric, value, unit, customName?}] }` → mirrored to `Measurement` rows |
| TREATMENT | `{ medication?, dosage?, frequency?, startedAt?, endedAt? }` |
| VACCINATION | `{ vaccine, batch?, nextDueAt? }` — `nextDueAt` feeds Phase 6 health reminders |
| VET_VISIT | `{ clinic?, vet?, reason?, outcome? }` |
| OBSERVATION / NOTE / EVENT | `{}` (title/body carry content) |

## API Endpoints

| Endpoint | Guard | Notes |
| -------- | ----- | ----- |
| `POST /api/v1/pets/:id/diary` | CARETAKER+ | Type-validated; `mediaIds` (already-uploaded) + `alsoInGallery` flag per media; MEASUREMENT type creates `Measurement` rows in same tx |
| `GET /api/v1/pets/:id/diary` | VIEWER+ (PUBLIC → public entries only when diary section public) | Cursor by `occurredAt`; filters `type[]`, `from`, `to`, `q` (FULLTEXT) |
| `GET/PATCH/DELETE /api/v1/diary/:entryId` | author or OWNER for delete; CARETAKER edit-own | Edits audit-logged |
| `GET /api/v1/pets/:id/measurements?metric=&from=&to=` | VIEWER+ | Series for charts; unit-normalized (see below) |
| `GET /api/v1/pets/:id/registry?type=VACCINATION` | VIEWER+ | Filtered registry with `nextDueAt` status (ok/due-soon/overdue) |
| `POST/GET/PATCH/DELETE /api/v1/pets/:id/documents` | CARETAKER+ read, OWNER write | Structured fields + scan mediaIds; `GET ?number=` chip search across own pets |

Unit handling: values stored as entered (`value` + `unit`); series endpoint normalizes to the metric's canonical unit (kg, cm, °C) for charting and returns both raw and normalized.

## Frontend Pages and Components

```
app/[locale]/pets/[petId]/
  diary/page.tsx            # timeline tab
  health/page.tsx           # measurements charts + vaccination registry
  documents/page.tsx        # documents vault tab
components/diary/
  Timeline.tsx  TimelineEntry.tsx (type icon + color)  EntryFilters.tsx
  EntryComposer/ (TypePicker, per-type detail forms, MediaAttach with "also add to gallery" toggle, VisibilitySelect)
components/health/
  MeasurementChart.tsx      # Recharts line, unit toggle, per-metric tabs
  QuickMeasureDialog.tsx    # fast weight entry from pet header
  VaccinationRegistry.tsx   # table with due status badges
components/document/
  DocumentList.tsx  DocumentCard.tsx (PDF/image preview via media endpoint)  DocumentForm.tsx
```

UX requirements: composer opens pre-focused with type NOTE (one-tap "just write"); switching type morphs the detail fields; photo attach accepts camera on mobile; timeline groups by day with relative headers in the user's locale/timezone.

## Iteration Plan

| # | Work | Done when |
| - | ---- | --------- |
| 5.1 | Schema `phase5_health` (all models above) + fixtures | Migration applied |
| 5.2 | Diary API: CRUD, discriminated-union validation, media linking (+`alsoInGallery` sets `MediaFile.inGallery`), filters + FULLTEXT, pagination, audit; access matrix registration | Suite green incl. per-type validation matrix |
| 5.3 | Timeline UI: entries, day grouping, type filters, search box | E2E scroll/filter/search |
| 5.4 | Composer: type-aware forms, photo attach, visibility select; edit + delete flows | E2E: symptom entry with 2 photos in <1 min script |
| 5.5 | Measurements: mirror-to-rows logic, series endpoint with normalization, charts + quick-measure dialog | Chart shows mixed-unit series correctly (kg+g entries) |
| 5.6 | Documents API: CRUD, chip-number search, always-private enforcement (public DTO snapshot re-run) | Docs never appear on any public surface (test) |
| 5.7 | Documents UI: vault tab, previews, structured form, attach-to-entry (prescription → vet visit) | E2E: passport with scan; prescription linked to visit |
| 5.8 | Per-entry visibility: PUBLIC entries appear on public pet page when diary section public; interplay tests (entry PUBLIC + section private ⇒ hidden) | Matrix: section × entry visibility → correct exposure |
| 5.9 | Vaccination/treatment registry + due-status computation (`nextDueAt`), surfaced on health tab; hands off to Phase 6 reminders | Registry E2E; overdue badge logic unit-tested |

## Testing Strategy

- Per-type DTO validation matrix (every type × valid/invalid details).
- Transactionality: MEASUREMENT entry rollback removes `Measurement` rows; media link failures don't orphan.
- Visibility interplay matrix (§5.8) added to the standing access-control suite.
- FULLTEXT search tested with Hebrew/Cyrillic content.
- Chart data: normalization unit tests (g→kg, °F→°C), empty/single-point series render.

## Extendability Notes

- New entry types = enum value + details schema + icon; no migration beyond enum.
- `Measurement` rows independent of entries allow future sensor ingestion (Phase 16) to write the same table — charts pick it up for free.
- `VACCINATION.nextDueAt` + registry endpoint are the contract Phase 6.9 consumes for health reminders.
- Documents `number` index enables future lost-pet chip lookup (explicitly out of scope now — privacy design needed first).
