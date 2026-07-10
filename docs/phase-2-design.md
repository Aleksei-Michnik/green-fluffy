# Phase 2: Pet Profiles & Species Catalog — Design Document

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Species Seed Dataset](#species-seed-dataset)
- [API Endpoints](#api-endpoints)
- [Frontend Pages and Components](#frontend-pages-and-components)
- [Iteration Plan](#iteration-plan)
- [Testing Strategy](#testing-strategy)
- [Extendability Notes](#extendability-notes)

---

## Overview

Phase 2 introduces the core domain entity: the **Pet** — any animal or plant, owned by a user, a municipality/community, or nobody (stray/wild) — plus the **Species catalog** it references. After this phase a user can create, browse, edit, and archive pets with rich identity data (no photos yet — Phase 3; no sharing — Phase 4: until then pets are visible to their creator only).

**Dependencies**: Phase 1 (authenticated users).

## Architecture

### API modules

```
apps/api/src/
  species/
    species.module.ts / controller / service
    dto/ (search-species.dto, species-response.dto)
  pet/
    pet.module.ts / controller / service
    dto/ (create-pet.dto, update-pet.dto, archive-pet.dto, pet-response.dto)
    guards/ pet-owner.guard.ts        # Phase 4 generalizes this to PetAccessGuard
    constants/ pet-errors.ts
packages/
  species-data/                       # versioned dataset + loader + validator
    data/animals/*.json  data/plants/*.json
    src/ (schema.ts, validate.ts, index.ts)
```

### Frontend

```
apps/web/src/
  app/[locale]/
    pets/
      page.tsx                # my pets dashboard (grid, filters, archive toggle)
      new/page.tsx            # multi-step create form
      [petId]/page.tsx        # pet profile page v1
      [petId]/edit/page.tsx
  components/pet/
    PetCard.tsx  PetForm/ (CategoryStep, SpeciesStep, DetailsStep)
    SpeciesPicker.tsx         # autocomplete against species API
    ArchiveDialog.tsx  OwnerTypeSelect.tsx  AliasesEditor.tsx
  lib/pet/ (pet-api.ts, types.ts)
```

## Database Schema

```prisma
enum LifeCategory { ANIMAL PLANT }            // stored as VARCHAR via Prisma enum
enum OwnerType    { USER MUNICIPALITY NONE }
enum PetStatus    { ACTIVE ARCHIVED }
enum Placement    { OPEN_SUN PARTIAL_SHADE SHADE INDOOR UNKNOWN }

model Species {
  id             String   @id @default(uuid()) @db.VarChar(36)
  category       LifeCategory
  rank           String   @db.VarChar(20)      // species | breed | variety | genus
  parentId       String?  @map("parent_id") @db.VarChar(36)   // cat -> maine coon
  parent         Species? @relation("SpeciesTree", fields: [parentId], references: [id])
  children       Species[] @relation("SpeciesTree")
  scientificName String?  @map("scientific_name") @db.VarChar(255)
  slug           String   @unique @db.VarChar(120)            // stable key, ties KB rules to species
  commonNames    Json     @map("common_names")                 // { en: [..], he: [..], ru: [..], uk: [..] }
  attributes     Json?                                          // habitat, indoor/outdoor, edible, lifespan...
  datasetVersion String   @map("dataset_version") @db.VarChar(20)
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  @@index([category, rank])
  @@index([parentId])
  @@fulltext([scientificName])
  @@map("species")
}

model Pet {
  id              String       @id @default(uuid()) @db.VarChar(36)
  category        LifeCategory
  speciesId       String?      @map("species_id") @db.VarChar(36)
  species         Species?     @relation(fields: [speciesId], references: [id])
  customSpecies   String?      @map("custom_species") @db.VarChar(255)  // free-text fallback
  name            String       @db.VarChar(100)
  aliases         Json?                                                  // ["Murzik", "The Boss"]
  sex             String?      @db.VarChar(10)                           // male | female | hermaphrodite | unknown
  birthDate       DateTime?    @map("birth_date") @db.Date
  birthPrecision  String       @default("unknown") @map("birth_precision") @db.VarChar(10) // exact|month|year|estimated|unknown
  description     String?      @db.Text
  ownerType       OwnerType    @default(USER) @map("owner_type")
  ownerUserId     String?      @map("owner_user_id") @db.VarChar(36)     // required when ownerType=USER
  ownerLabel      String?      @map("owner_label") @db.VarChar(255)      // e.g. "Haifa municipality"
  createdByUserId String       @map("created_by_user_id") @db.VarChar(36)
  placement       Placement    @default(UNKNOWN)                          // meaningful for plants; UI hides for animals
  status          PetStatus    @default(ACTIVE)
  archiveReason   String?      @map("archive_reason") @db.VarChar(20)     // deceased|sold|released|removed|other
  archivedAt      DateTime?    @map("archived_at")
  isPublic        Boolean      @default(false) @map("is_public")          // enforced from Phase 4
  avatarMediaId   String?      @map("avatar_media_id") @db.VarChar(36)    // FK in Phase 3
  locationId      String?      @map("location_id") @db.VarChar(36)        // FK in Phase 7
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")
  deletedAt       DateTime?    @map("deleted_at")

  @@index([ownerUserId, status])
  @@index([createdByUserId])
  @@index([speciesId])
  @@map("pets")
}
```

Notes:

- **Owner semantics**: `ownerType=USER` + `ownerUserId` = normal ownership. `MUNICIPALITY` uses `ownerLabel` (free text now; a Municipality entity is a future refinement). `NONE` = stray/wild. In all cases `createdByUserId` is the acting manager and, until Phase 4, the only person with access.
- `deletedAt` supports soft delete tied to account-deletion flows (hard cascade rules finalized in Phase 4.8).
- `customSpecies` keeps unknown species from blocking creation; such pets simply get fewer KB warnings later.

## Species Seed Dataset

Lives in `packages/species-data` — the same package later carries hazard/companion rules (Phase 9), so its shape matters:

```jsonc
// data/animals/cat.json (abridged)
{
  "slug": "felis-catus",
  "category": "ANIMAL",
  "rank": "species",
  "scientificName": "Felis catus",
  "commonNames": {
    "en": ["Cat", "Domestic cat"],
    "he": ["חתול"],
    "ru": ["Кошка", "Кот"],
    "uk": ["Кіт", "Кішка"],
  },
  "attributes": { "keptAs": ["indoor", "outdoor"], "class": "mammal" },
  "children": [
    { "slug": "maine-coon", "rank": "breed", "commonNames": { "en": ["Maine Coon"], "...": [] } },
  ],
}
```

- Initial coverage target: ~200 entries — top household animals + breeds, common houseplants, garden/farm plants (wheat, tomato…), aquarium fish, common street trees.
- `slug` is the **stable foreign key** for KB rules and future dataset updates; never renamed, only aliased.
- Zod schema validation (`src/validate.ts`) runs in CI; the seed loader upserts by slug and stamps `datasetVersion`.
- Sources for names: public-domain/CC lists; every file carries a `_sources` field.

## API Endpoints

| Endpoint                                               | Auth        | Notes                                                                                                                                                                                 |
| ------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/species?query=&category=&locale=`         | authed      | Autocomplete: prefix + FULLTEXT match on locale common names (JSON extraction with fallback to all locales + scientific name); returns tree-aware results (breed rows include parent) |
| `GET /api/v1/species/:id`                              | authed      | Full record                                                                                                                                                                           |
| `POST /api/v1/pets`                                    | authed      | Create; validates species/customSpecies XOR presence, owner consistency (see DTO rules)                                                                                               |
| `GET /api/v1/pets`                                     | authed      | Own + created pets; filters: `category`, `status`, cursor pagination                                                                                                                  |
| `GET /api/v1/pets/:id`                                 | owner-guard | Full record (guard swapped for `PetAccessGuard` in Phase 4)                                                                                                                           |
| `PATCH /api/v1/pets/:id`                               | owner-guard | Partial update; audit-logged                                                                                                                                                          |
| `POST /api/v1/pets/:id/archive` / `POST :id/unarchive` | owner-guard | With `archiveReason`                                                                                                                                                                  |
| `DELETE /api/v1/pets/:id`                              | owner-guard | Soft delete; audit-logged                                                                                                                                                             |

DTO validation rules (class-validator): `ownerType=USER` ⇒ `ownerUserId` required (defaults to caller); `MUNICIPALITY` ⇒ `ownerLabel` required; `NONE` ⇒ both null. `speciesId` XOR `customSpecies` (at least one; both allowed — custom refines species). `birthDate` ≤ today; `birthPrecision` required when `birthDate` set.

## Frontend Pages and Components

- **Create flow** (`pets/new`): 3 steps — (1) Animal or Plant (two large cards); (2) `SpeciesPicker` — debounced autocomplete in the user's locale, grouped by species→breed, "can't find it" → free-text `customSpecies`; (3) details — name, aliases, sex (animals), birth/planting date + precision selector ("exact / month / year / roughly"), owner type (mine / another label / municipality / no owner), placement (plants only), description.
- **Dashboard** (`pets`): responsive card grid (initials/species-icon placeholder until Phase 3 avatars), filter chips (All / Animals / Plants / Archived), empty state that sells the create flow.
- **Pet page v1** (`pets/[petId]`): header (name, species chain "Cat → Maine Coon", status), info section, description, aliases; placeholder sections for Photos (Phase 3), Diary (5), Care (6), Location (7) — visible as teasers so navigation structure is final from the start.
- All strings ×4 locales; forms mobile-first (garden usage).

## Iteration Plan

| #   | Work                                                                                                                                                                                                                 | Done when                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 2.1 | `packages/species-data` package: Zod schema, validator (CI job), initial dataset (~200 entries, 4-locale names), seed loader (`pnpm db:seed` idempotent upsert by slug) + `Species` model/migration `phase2_species` | Seed runs twice with no diff; CI validates dataset                     |
| 2.2 | Species API: search endpoint with locale-aware matching + unit/integration tests incl. Hebrew/Cyrillic queries                                                                                                       | Autocomplete returns "Кошка" for `ru`, breeds grouped under parents    |
| 2.3 | `Pet` model + migration `phase2_pets` + factory fixtures                                                                                                                                                             | Migration applied via normal staging deploy                            |
| 2.4 | Pet CRUD API: endpoints, DTO validation matrix, `PetOwnerGuard`, audit logging, cursor pagination; access tests (creator-only at this phase)                                                                         | API suite green incl. owner-consistency cases                          |
| 2.5 | Create/edit UI: 3-step form + `SpeciesPicker`; E2E create-a-cat and create-a-monstera                                                                                                                                | Pet creatable in each locale; validation errors localized              |
| 2.6 | Dashboard: grid, filters, archive toggle, empty states                                                                                                                                                               | Playwright: filters + pagination                                       |
| 2.7 | Pet page v1 with teaser sections; edit entry point                                                                                                                                                                   | Renders all field combinations (no species, no owner, plant vs animal) |
| 2.8 | Aliases editor + archive/unarchive flows (reason dialog, archived badge, excluded from default lists)                                                                                                                | Archive round-trip E2E; archived pets excluded from actives everywhere |

## Testing Strategy

- Unit: DTO validation matrix (owner types × fields), species search ranking, seed loader idempotency.
- Integration (Testcontainers): pet CRUD + guards; species search against seeded data in all four locales.
- E2E: create flows for one animal + one plant; archive flow; dashboard filters.
- Access matrix (v1): another authenticated user gets 403/404 on someone else's pet — becomes the seed of the Phase 4 matrix suite.

## Extendability Notes

- `Species.attributes` JSON absorbs future per-species facts without migrations; structured columns can be extracted later if queried.
- `slug`-keyed dataset lets Phase 9 hazard rules reference species stably and lets dataset updates ship as normal PRs (validated in CI, applied by seed job on deploy).
- `Municipality` as a real entity (with its own users/roles) is a deliberate future step; `ownerLabel` keeps v1 simple.
- `placement`, `locationId`, `isPublic`, `avatarMediaId` are pre-wired columns that Phases 3/4/7 activate — expand-then-contract friendly.
