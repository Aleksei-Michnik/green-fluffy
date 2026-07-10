# Phase 5: Health Diary, Procedures, Documents & Care Providers — Design Document

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

Phase 5 delivers the health heart of the app in three sub-sections:

- **5A — Health diary & documents**: a typed diary timeline (conditions, symptoms, treatments, vaccinations, vet visits, procedures, observations, life events, free notes), structured measurements with trend charts, and a documents vault (passports, chips, pedigrees, medical records, prescriptions, lab results). Photos attach to entries through the Phase 3 media pipeline, optionally landing in the gallery too — one upload, two uses.
- **5B — Procedures lifecycle**: surgeries, castration/spaying, dental work, grooming procedures for animals; cutting, grafting, repotting for plants — tracked as **recommended → planned → done/cancelled**, with performer attribution, documents, and reminder hooks.
- **5C — Care providers directory**: a **shared** directory of vet clinics, vets, gardeners, pond-health organizations, aquarium caretakers, and farm services — referenced from vet visits, procedures, and care events; kept in our own DB and actualized from open data sources; no public testimonials, but links to websites/Google Business profiles.

**The unified timeline principle**: the diary is the single log of _everything_ that happens to a pet. Health entries and life events live here natively; care events (feeding/watering, Phase 6) and completed procedures are surfaced into the same timeline with their details (time, quantity, catalog item, performer).

**Dependencies**: Phase 3 (media), Phase 4 (roles: caretakers write, viewers read; per-entry visibility interacts with public diary sections). Phase 9 later supplies KB-driven procedure recommendations (9.8) into the 5B "recommended" list.

## Architecture

```
apps/api/src/
  diary/
    diary.module.ts / controller / service
    dto/ (create-entry.dto with per-type detail schemas, query-entries.dto)
    types/entry-details.ts        # discriminated union per entry type
  measurement/measurement.module.ts / controller / service
  document/document.module.ts / controller / service / dto
  procedure/procedure.module.ts / controller / service / dto
  provider/
    provider.module.ts / controller / service / dto
    sync/osm-provider.importer.ts  # 5.16 open-data sync
```

Design choices:

- **One `DiaryEntry` table for all types** with a `details` JSON validated per type by a discriminated-union DTO — flexible, index-friendly on the common columns (petId, type, occurredAt), no join zoo. Life events are `type=EVENT` with a validated `eventKind`.
- **Measurements are first-class rows** (not only JSON) so charts and range queries are cheap; a measurement-type diary entry creates/updates `Measurement` rows transactionally.
- Documents are metadata over `MediaFile` scans + structured fields (numbers, dates, issuer); **always private** (never in any public DTO — same type-level guarantee as geo).
- **Procedures are first-class rows** (not just diary entries) because they have a forward-looking lifecycle (recommended/planned) the diary — a log of the past — can't express; completing a procedure creates its linked `type=PROCEDURE` diary entry transactionally.
- **Providers are shared, global entities** (not per-user): created by users or imported from open data, deduplicated, referenced everywhere a human/organization performs something. Personal data caution: providers are _businesses/professionals in their public role_; the directory stores only their public data (name, kind, public links, locality).

## Database Schema

```prisma
enum DiaryEntryType { CONDITION SYMPTOM MEASUREMENT TREATMENT VACCINATION VET_VISIT PROCEDURE OBSERVATION NOTE EVENT }
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
  providerId   String?         @map("provider_id") @db.VarChar(36)  // who performed (vet visit, procedure...)
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

enum ProcedureStatus { RECOMMENDED PLANNED DONE CANCELLED }

model Procedure {
  id            String          @id @default(uuid()) @db.VarChar(36)
  petId         String          @map("pet_id") @db.VarChar(36)
  kind          String          @db.VarChar(30)   // castration | spaying | surgery | dental | grooming_procedure |
                                                   // cutting | grafting | repotting | pruning_major | other
  title         String          @db.VarChar(200)
  status        ProcedureStatus
  source        String          @db.VarChar(10)    // kb | vet | user — where the recommendation came from
  kbRuleId      String?         @map("kb_rule_id") @db.VarChar(36)   // Phase 9.8 ProcedureRule linkage
  necessity     String?         @db.VarChar(15)    // must | recommended | optional (from KB or vet)
  scheduledAt   DateTime?       @map("scheduled_at")
  performedAt   DateTime?       @map("performed_at")
  providerId    String?         @map("provider_id") @db.VarChar(36)  // clinic/gardener/org
  performerName String?         @map("performer_name") @db.VarChar(200) // vet's/worker's name as free text
  performedByUserId String?     @map("performed_by_user_id") @db.VarChar(36) // when owner/caretaker did it
  notes         String?         @db.Text
  diaryEntryId  String?         @map("diary_entry_id") @db.VarChar(36)  // created on DONE
  reminderId    String?         @map("reminder_id") @db.VarChar(36)     // Phase 6 hook for PLANNED
  createdAt     DateTime        @default(now()) @map("created_at")
  updatedAt     DateTime        @updatedAt @map("updated_at")
  deletedAt     DateTime?       @map("deleted_at")

  media         ProcedureMedia[]
  @@index([petId, status])
  @@map("procedures")
}

model ProcedureMedia {
  id          String @id @default(uuid()) @db.VarChar(36)
  procedureId String @map("procedure_id") @db.VarChar(36)
  mediaId     String @map("media_id") @db.VarChar(36)
  @@unique([procedureId, mediaId])
  @@map("procedure_media")
}

enum ProviderKind { VET_CLINIC VET GARDENER POND_ORG AQUARIUM_CARETAKER FARM_SERVICE OTHER }

model Provider {
  id           String       @id @default(uuid()) @db.VarChar(36)
  kind         ProviderKind
  name         String       @db.VarChar(200)
  websiteUrl   String?      @map("website_url") @db.VarChar(500)
  googleBusinessUrl String? @map("google_business_url") @db.VarChar(500)
  phone        String?      @db.VarChar(30)
  city         String?      @db.VarChar(100)          // locality only — provider geo is public business data,
  region       String?      @db.VarChar(100)          // but we still keep it coarse in v1
  countryCode  String?      @map("country_code") @db.VarChar(2)
  sourceKind   String       @default("user") @map("source_kind") @db.VarChar(10) // user | osm | import
  sourceRef    String?      @map("source_ref") @db.VarChar(100)   // e.g. OSM node/way id — sync anchor
  createdBy    String?      @map("created_by") @db.VarChar(36)
  verifiedAt   DateTime?    @map("verified_at")        // maintainer-confirmed
  mergedIntoId String?      @map("merged_into_id") @db.VarChar(36) // dedup tombstone
  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")

  @@index([kind, countryCode, city])
  @@index([sourceKind, sourceRef])
  @@fulltext([name])
  @@map("providers")
}

model ProviderSuggestion {          // user-suggested corrections, maintainer-reviewed
  id          String   @id @default(uuid()) @db.VarChar(36)
  providerId  String   @map("provider_id") @db.VarChar(36)
  userId      String   @map("user_id") @db.VarChar(36)
  changes     Json                                   // proposed field diffs
  status      String   @default("open") @db.VarChar(10)  // open | applied | rejected
  createdAt   DateTime @default(now()) @map("created_at")
  @@index([status])
  @@map("provider_suggestions")
}
```

`CareEvent` (Phase 6) also carries `providerId` — added there; attribution is thus uniform across vet visits, procedures, and care events.

### `details` JSON per entry type (validated discriminated union)

| Type               | details shape                                                                                                                                                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CONDITION          | `{ name, status: active                                                                                                                                                                                                                | resolved | chronic, diagnosedBy? }` |
| SYMPTOM            | `{ symptoms: string[], severity: mild                                                                                                                                                                                                  | moderate | severe }`                |
| MEASUREMENT        | `{ measurements: [{metric, value, unit, customName?}] }` → mirrored to `Measurement` rows                                                                                                                                              |
| TREATMENT          | `{ medication?, dosage?, frequency?, startedAt?, endedAt? }`                                                                                                                                                                           |
| VACCINATION        | `{ vaccine, batch?, nextDueAt? }` — `nextDueAt` feeds Phase 6 health reminders                                                                                                                                                         |
| VET_VISIT          | `{ reason?, outcome?, vetName? }` + top-level `providerId` for the clinic                                                                                                                                                              |
| PROCEDURE          | `{ procedureId }` — the linked `Procedure` row carries the substance                                                                                                                                                                   |
| EVENT              | `{ eventKind, ... }` — validated kinds: `birth_giving`, `trauma`, `accident`, `grooming`, `flowering`, `fruiting`, `pest_infestation`, `disaster` (+ `disasterKind: drought\|hurricane\|hail\|fire\|flood\|vandalism\|other`), `other` |
| OBSERVATION / NOTE | `{}` (title/body carry content)                                                                                                                                                                                                        |

## API Endpoints

| Endpoint                                              | Guard                                                            | Notes                                                                                                                                                                    |
| ----------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /api/v1/pets/:id/diary`                         | CARETAKER+                                                       | Type-validated; `mediaIds` (already-uploaded) + `alsoInGallery` flag per media; MEASUREMENT type creates `Measurement` rows in same tx                                   |
| `GET /api/v1/pets/:id/diary`                          | VIEWER+ (PUBLIC → public entries only when diary section public) | Cursor by `occurredAt`; filters `type[]`, `from`, `to`, `q` (FULLTEXT)                                                                                                   |
| `GET/PATCH/DELETE /api/v1/diary/:entryId`             | author or OWNER for delete; CARETAKER edit-own                   | Edits audit-logged                                                                                                                                                       |
| `GET /api/v1/pets/:id/measurements?metric=&from=&to=` | VIEWER+                                                          | Series for charts; unit-normalized (see below)                                                                                                                           |
| `GET /api/v1/pets/:id/registry?type=VACCINATION`      | VIEWER+                                                          | Filtered registry with `nextDueAt` status (ok/due-soon/overdue)                                                                                                          |
| `POST/GET/PATCH/DELETE /api/v1/pets/:id/documents`    | CARETAKER+ read, OWNER write                                     | Structured fields + scan mediaIds; `GET ?number=` chip search across own pets                                                                                            |
| `POST/GET/PATCH/DELETE /api/v1/pets/:id/procedures`   | CARETAKER+ read, OWNER write                                     | Lifecycle transitions validated (RECOMMENDED→PLANNED→DONE/CANCELLED; direct PLANNED/DONE creation allowed); DONE requires `performedAt`, creates linked diary entry (tx) |
| `POST /api/v1/procedures/:id/complete`                | OWNER                                                            | `{performedAt, providerId?, performerName?, notes?, mediaIds?}` → status DONE + diary entry                                                                              |
| `GET /api/v1/pets/:id/procedures/recommended`         | VIEWER+                                                          | KB-recommended (Phase 9.8) minus already planned/done/dismissed                                                                                                          |
| `GET /api/v1/providers?query=&kind=&near=`            | authed                                                           | Shared directory search (FULLTEXT name + kind + locality)                                                                                                                |
| `POST /api/v1/providers`                              | authed                                                           | Inline creation (dedup check: same kind + similar name + same locality ⇒ suggest existing)                                                                               |
| `GET /api/v1/providers/:id`                           | authed                                                           | Detail with links (website, Google Business)                                                                                                                             |
| `POST /api/v1/providers/:id/suggest`                  | authed                                                           | Correction suggestion (maintainer-reviewed queue)                                                                                                                        |

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
components/procedure/
  ProcedureBoard.tsx (Recommended | Planned | History columns/tabs)
  ProcedureForm.tsx  CompleteProcedureDialog.tsx (date, provider/performer, notes, photos, docs)
  RecommendedBadge.tsx (must/recommended, source: KB rule link or vet)
components/provider/
  ProviderPicker.tsx (search shared directory + inline add; used by vet visits, procedures, care events)
  ProviderCard.tsx (name, kind, locality, website/Google Business links — no ratings)
  ProviderDirectory.tsx (app/[locale]/providers page)  SuggestEditDialog.tsx
```

UX requirements: composer opens pre-focused with type NOTE (one-tap "just write"); switching type morphs the detail fields (EVENT type shows the event-kind picker: birth, trauma/accident, grooming, flowering, fruiting, pests, disaster…); photo attach accepts camera on mobile; timeline groups by day with relative headers in the user's locale/timezone. The timeline is the **unified log**: it renders diary entries natively and (from Phase 6) care events inline with their time/quantity/item details — one stream, filterable by kind.

## Iteration Plan

### 5A: Health Diary & Documents

| #   | Work                                                                                                                                                                                                         | Done when                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| 5.1 | Schema `phase5_health` (diary/measurement/document models + event kinds) + fixtures                                                                                                                          | Migration applied                                                           |
| 5.2 | Diary API: CRUD, discriminated-union validation (incl. `eventKind` taxonomy), media linking (+`alsoInGallery` sets `MediaFile.inGallery`), filters + FULLTEXT, pagination, audit; access matrix registration | Suite green incl. per-type validation matrix                                |
| 5.3 | Timeline UI: entries, day grouping, type/event-kind filters, search box                                                                                                                                      | E2E scroll/filter/search                                                    |
| 5.4 | Composer: type-aware forms (incl. event-kind picker + disaster sub-kind), photo attach, visibility select; edit + delete flows                                                                               | E2E: symptom entry with 2 photos in <1 min script; flowering event recorded |
| 5.5 | Measurements: mirror-to-rows logic, series endpoint with normalization, charts + quick-measure dialog                                                                                                        | Chart shows mixed-unit series correctly (kg+g entries)                      |
| 5.6 | Documents API: CRUD, chip-number search, always-private enforcement (public DTO snapshot re-run)                                                                                                             | Docs never appear on any public surface (test)                              |
| 5.7 | Documents UI: vault tab, previews, structured form, attach-to-entry (prescription → vet visit)                                                                                                               | E2E: passport with scan; prescription linked to visit                       |
| 5.8 | Per-entry visibility: PUBLIC entries appear on public pet page when diary section public; interplay tests (entry PUBLIC + section private ⇒ hidden)                                                          | Matrix: section × entry visibility → correct exposure                       |
| 5.9 | Vaccination/treatment registry + due-status computation (`nextDueAt`), surfaced on health tab; hands off to Phase 6 reminders                                                                                | Registry E2E; overdue badge logic unit-tested                               |

### 5B: Procedures Lifecycle

| #    | Work                                                                                                                                                                                                           | Done when                                                                    |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 5.10 | `Procedure` schema (`phase5b_procedures`) + API: lifecycle state machine (RECOMMENDED→PLANNED→DONE/CANCELLED, direct creation in any active state), complete-action creating linked diary entry + media, audit | State-machine unit tests; complete-tx test (diary entry rollback on failure) |
| 5.11 | Procedures UI: board (Recommended/Planned/History), forms, complete dialog with docs/photos/provider; planned procedures create Phase 6 reminders when scheduled (hook stub if Phase 6 not yet deployed)       | E2E: plan castration → schedule → complete → appears in diary with documents |
| 5.12 | Plant procedures: cutting/grafting/repotting kinds, performer attribution variants (self / provider / named worker); recommended list wired to accept Phase 9.8 KB rules (empty until then)                    | Plant procedure with gardener provider E2E                                   |

### 5C: Care Providers Directory

| #    | Work                                                                                                                                                                                                                                                                                                         | Done when                                                                                 |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| 5.13 | `Provider` + `ProviderSuggestion` schema (`phase5c_providers`) + API: search (FULLTEXT + kind + locality), inline create with dedup check, suggestion queue                                                                                                                                                  | Dedup: creating "VetClinic Haifa" twice suggests existing; suggestion round-trip          |
| 5.14 | Attribution: `providerId` on diary entries (vet visits) + procedures (+ Phase 6 care events when they land); `ProviderPicker` integrated in all composers                                                                                                                                                    | Vet visit attributed to clinic E2E; gardener on cutting E2E                               |
| 5.15 | Directory UI: `/providers` search page + provider cards/pages with website & Google Business links (external-link safety: `rel="noopener nofollow"`, URL validation http(s) only)                                                                                                                            | Directory browsable; invalid link schemes rejected                                        |
| 5.16 | Open-data sync: OSM importer (`amenity=veterinary` via Overpass, per-country batches) — match by `sourceRef`, then name+locality similarity; new ⇒ insert `sourceKind=osm`; changed ⇒ update untouched fields only; user-edited fields win; conflicts → suggestion queue; scheduled monthly + manual trigger | Importer idempotent on fixture; user-created record untouched by sync; provenance visible |

## Testing Strategy

- Per-type DTO validation matrix (every type × valid/invalid details, incl. event kinds and disaster sub-kinds).
- Transactionality: MEASUREMENT entry rollback removes `Measurement` rows; procedure completion rollback removes the diary entry; media link failures don't orphan.
- Procedure state machine: full transition table incl. invalid transitions (DONE→PLANNED rejected).
- Provider dedup: similarity cases (case, punctuation, "Ltd." suffixes) and false-positive guard (same name, different city ⇒ no dedup).
- Sync safety: user-edited fields never overwritten; deleted-upstream keeps local row; importer idempotency.
- Visibility interplay matrix (§5.8) added to the standing access-control suite; providers are shared/global but write-guarded (creator or maintainer edits; others suggest).
- FULLTEXT search tested with Hebrew/Cyrillic content (diary and provider names).
- Chart data: normalization unit tests (g→kg, °F→°C), empty/single-point series render.

## Extendability Notes

- New entry types / event kinds = enum or taxonomy value + details schema + icon; no migration beyond enum.
- `Measurement` rows independent of entries allow future sensor ingestion (Phase 16) to write the same table — charts pick it up for free.
- `VACCINATION.nextDueAt` + registry endpoint are the contract Phase 6.9 consumes for health reminders; `Procedure.scheduledAt` + `reminderId` are the 5B equivalent.
- `Procedure.kbRuleId`/`necessity` are the Phase 9.8 contract: KB rules materialize RECOMMENDED procedures per species×sex (castration must/recommended for cats/dogs/rodents).
- Provider directory is the seed for future integrations (booking, richer open-data sources, municipality entities); testimonials/ratings intentionally excluded — links to external public profiles instead.
- Documents `number` index enables future lost-pet chip lookup (explicitly out of scope now — privacy design needed first).
