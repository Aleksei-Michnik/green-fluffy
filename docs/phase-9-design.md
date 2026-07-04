# Phase 9: Knowledge Base — Warnings & Recommendations ("My Green and Fluffy") — Design Document

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Dataset Design](#dataset-design)
- [Database Schema](#database-schema)
- [Rule Engines](#rule-engines)
- [API Endpoints](#api-endpoints)
- [Frontend Pages and Components](#frontend-pages-and-components)
- [Iteration Plan](#iteration-plan)
- [Testing Strategy](#testing-strategy)
- [Extendability Notes](#extendability-notes)

---

## Overview

Phase 9 delivers the app's signature intelligence: **warnings** when a user's combination of living beings is risky (lily in a household with cats; water-toxic plant beside a tank; poisonous flower within reach) and plant-to-plant **companion** advice (bad/good neighbors in a pot, patch, or open soil), plus species **care recommendations** contextualized by placement, season, and local weather. Everything is computed from a **curated, versioned, source-cited dataset** shipped in `packages/species-data` (decision from planning: no external KB APIs, no LLM in v1 — deterministic, free, auditable).

**Dependencies**: Phase 2 (species, placements), Phase 8 (groups define co-location), Phase 7 (weather context for recommendations; optional degradation without location), Phase 6 (notifications).

## Architecture

```
packages/species-data/
  data/hazards/*.json        # toxicity & danger rules
  data/companions/*.json     # plant-plant relations
  data/care/*.json           # care guidelines
  src/ (schema.ts extended, validate.ts, index.ts)
apps/api/src/
  knowledge/
    knowledge.module.ts
    kb-sync.service.ts        # seed/upsert dataset into DB on deploy (by slug + version)
    hazard-engine.service.ts
    companion-engine.service.ts
    recommendation.service.ts
    warnings.controller.ts / service   # user-facing computed warnings + dismissals
    jobs/warning-refresh.job.ts        # incremental recompute on relevant changes + nightly full pass
```

**Compute model**: warnings are recomputed **event-driven** (pet/group/placement/location/membership changes enqueue a per-user refresh job) into a materialized `ComputedWarning` table, plus a nightly full pass (catches dataset updates and seasonal flips). Materialization keeps dashboards instant and lets notifications fire only on *newly appearing* warnings.

## Dataset Design

Extends the Phase 2 package; every record cites sources. Species referenced by **slug** (stable key).

```jsonc
// data/hazards/lilium.json
{
  "subject": "lilium",                    // species slug or genus-level slug
  "subjectMatch": "descendants",          // exact | descendants (breeds/varieties inherit)
  "hazards": [
    {
      "type": "toxic_ingestion",          // toxic_ingestion | toxic_contact | water_toxic | thorn_injury | allergen
      "targets": ["felis-catus"],         // species slugs or categories: "@cats", "@dogs", "@fish", "@ANIMAL"
      "severity": "critical",             // info | caution | danger | critical
      "note": { "en": "All parts cause acute kidney failure in cats", "he": "…", "ru": "…", "uk": "…" },
      "sources": [{ "name": "ASPCA", "url": "https://www.aspca.org/…" }]
    }
  ]
}
// data/companions/tomato.json
{ "a": "solanum-lycopersicum", "b": "brassica-oleracea", "relation": "bad",
  "context": ["open_soil", "patch"], "note": { "en": "…", "…": "…" }, "sources": [ … ] }
// data/care/monstera.json
{ "subject": "monstera-deliciosa", "guidelines": [
  { "topic": "watering", "placement": ["INDOOR"], "season": "summer",
    "advice": { "en": "Water when top 3cm dry…", "…": "…" }, "sources": [ … ] } ] }
```

Curation rules (enforced by CI validator): every rule has ≥1 source; notes in all 4 locales (CI fails on missing); slugs must resolve against the species dataset; severity taxonomy fixed. Target macros (`@cats`, `@fish`, `@ANIMAL`) expand at sync time via species attributes.

Initial coverage target: ~120 hazard rules (ASPCA toxic-plant list top entries × cats/dogs; classic aquarium/pond dangers; common garden hazards), ~60 companion pairs (established companion-planting references), ~50 care guideline sets for the most common species.

## Database Schema

```prisma
model SpeciesHazard {
  id           String @id @default(uuid()) @db.VarChar(36)
  subjectSlug  String @map("subject_slug") @db.VarChar(120)
  subjectMatch String @map("subject_match") @db.VarChar(15)
  type         String @db.VarChar(30)
  targetSlug   String @map("target_slug") @db.VarChar(120)   // expanded (one row per concrete target)
  severity     String @db.VarChar(10)
  note         Json
  sources      Json
  datasetVersion String @map("dataset_version") @db.VarChar(20)
  @@index([subjectSlug]) @@index([targetSlug])
  @@map("species_hazards")
}

model CompanionRule {
  id       String @id @default(uuid()) @db.VarChar(36)
  aSlug    String @map("a_slug") @db.VarChar(120)
  bSlug    String @map("b_slug") @db.VarChar(120)
  relation String @db.VarChar(10)      // good | bad
  context  Json                         // ["pot","patch","open_soil","water"]
  note     Json
  sources  Json
  datasetVersion String @map("dataset_version") @db.VarChar(20)
  @@index([aSlug]) @@index([bSlug])
  @@map("companion_rules")
}

model CareGuideline {
  id        String @id @default(uuid()) @db.VarChar(36)
  subjectSlug String @map("subject_slug") @db.VarChar(120)
  topic     String @db.VarChar(30)      // watering | light | feeding | pruning | temperature | ...
  placement Json?                        // applicable placements
  season    String? @db.VarChar(10)     // spring|summer|autumn|winter|null=all
  advice    Json
  sources   Json
  datasetVersion String @map("dataset_version") @db.VarChar(20)
  @@index([subjectSlug, topic])
  @@map("care_guidelines")
}

model ComputedWarning {
  id          String    @id @default(uuid()) @db.VarChar(36)
  userId      String    @map("user_id") @db.VarChar(36)
  warningKey  String    @map("warning_key") @db.VarChar(255)  // deterministic: type|ruleId|subjectPetId|targetPetId|scope
  type        String    @db.VarChar(30)                        // hazard | companion
  severity    String    @db.VarChar(10)
  ruleId      String    @map("rule_id") @db.VarChar(36)
  subjectPetId String?  @map("subject_pet_id") @db.VarChar(36)
  targetPetId String?   @map("target_pet_id") @db.VarChar(36)
  groupId     String?   @map("group_id") @db.VarChar(36)       // co-location scope that triggered it
  firstSeenAt DateTime  @default(now()) @map("first_seen_at")
  resolvedAt  DateTime? @map("resolved_at")                    // condition no longer holds
  @@unique([userId, warningKey])
  @@index([userId, resolvedAt])
  @@map("computed_warnings")
}

model WarningDismissal {
  id         String   @id @default(uuid()) @db.VarChar(36)
  userId     String   @map("user_id") @db.VarChar(36)
  warningKey String   @map("warning_key") @db.VarChar(255)
  reason     String?  @db.VarChar(300)
  createdAt  DateTime @default(now()) @map("created_at")
  @@unique([userId, warningKey])
  @@map("warning_dismissals")
}
```

`kb-sync` runs as a deploy step (after migrations): validates dataset, expands macros, upserts by natural keys, stamps version, prunes rows from removed rules.

## Rule Engines

### Hazard engine — "are a dangerous X and a vulnerable Y in the same scope?"

Scopes, strongest first:

1. **Same group** (tank, household, enclosure…) — direct co-location. Water-toxic rules require group type ∈ {TANK, POND}.
2. **Same household heuristic**: pets of one owner where both are `INDOOR`-placed (or animal with no placement) — a lily and an indoor cat under one roof.
3. **Reach heuristic**: `toxic_contact`/`toxic_ingestion` plant with placement INDOOR + any household animal target ⇒ warn at `caution` even without a group (conservative; dismissible).

Species matching walks the tree (`subjectMatch: descendants` ⇒ breeds/varieties inherit rules). Severity passes through; scope adds context to the message ("in tank «Living room aquarium»").

### Companion engine — plant×plant within planting contexts

Pairs of PLANT pets sharing a group whose type maps to a rule context (`PATCH/FIELD/GARDEN_BED → open_soil|patch`, `POT` semantics via HOUSEHOLD+INDOOR ⇒ `pot`, `TANK/POND → water`). `bad` ⇒ warning; `good` ⇒ positive suggestion (shown in recommendations, not warnings).

### Recommendations

`recommendation.service` composes, per pet: care guidelines filtered by species (tree-walk), placement, current season (hemisphere from location, default north), plus weather-aware nudges when located (e.g., watering guideline + 7-day dry forecast ⇒ elevated suggestion). Pure read-model — no materialization needed.

## API Endpoints

| Endpoint | Guard | Notes |
| -------- | ----- | ----- |
| `GET /api/v1/warnings` | authed | Active (unresolved, undismissed) + `?includeDismissed=1`; each with severity, message (locale), scope, rule sources |
| `POST /api/v1/warnings/:key/dismiss` / `DELETE …/dismiss` | authed | With optional reason; audit-logged |
| `GET /api/v1/pets/:id/recommendations` | VIEWER+ | Care guidelines + companion suggestions + weather nudges |
| `GET /api/v1/kb/rules/:id` | authed | Rule detail with sources (the "why" page) |

## Frontend Pages and Components

- **Dashboard panel "My green and fluffy"**: warning cards by severity (critical pulses), scope line, "why?" expands sources, dismiss with reason; empty state = green checkmark.
- **Pet page**: warnings ribbon (this pet as subject or target) + Recommendations tab (care topics accordion, seasonal badge, companion suggestions).
- **Group page**: group-scoped warnings (tank hazards) surfaced on the group header.
- Notification: new `warnings` category (Phase 6 matrix) — fires only on newly materialized warnings, digest-friendly.
- `SourceBadge` component links every claim to its citation — trust is the feature.

## Iteration Plan

| # | Work | Done when |
| - | ---- | --------- |
| 9.1 | Dataset schemas + validator extensions + initial curated dataset (~120 hazards, ~60 companions, ~50 care sets, 4-locale notes, sources) + `kb-sync` deploy step + KB tables migration `phase9_kb` | CI validates dataset; sync idempotent; row counts match dataset |
| 9.2 | Hazard engine: scope resolution (group/household/reach), tree-walk matching, macro-expanded targets; `ComputedWarning` materialization + event-driven refresh job | Unit matrix green (see testing); lily+cat household fixture produces critical warning |
| 9.3 | Companion engine + context mapping | Tomato+cabbage in patch fixture ⇒ bad-companion warning; good pairs ⇒ suggestions |
| 9.4 | Warnings API + dashboard panel + dismissals + "why" sources view | E2E: add lily to cat household → warning appears → dismiss with reason → hidden but listed under dismissed |
| 9.5 | Recommendations: service + pet tab + seasonal/placement filtering + weather nudges (graceful without location) | Monstera fixture shows watering advice; dry-week fixture elevates it |
| 9.6 | Contribution pipeline: `docs/kb-contributing.md` (rule format, source requirements, review checklist), PR template, CI dataset-diff summary comment | A sample rule PR passes the documented flow end-to-end |
| 9.7 | Warning notifications: dispatcher category, new-warning-only firing, resolution handling (warning disappears when condition clears — e.g., pet moved out of group) | Notification on new hazard; none on recompute of existing; resolved warnings close |

## Testing Strategy

- **Engine matrix**: (rule type × scope × placement × species-tree level) fixtures — the core of this phase's tests; golden-file expected warnings per fixture world.
- Idempotency: recompute of unchanged world ⇒ zero new/changed rows (guards notification spam).
- Lifecycle: condition clears ⇒ `resolvedAt` set ⇒ excluded from active; dismissal survives recompute (keyed by `warningKey`).
- Dataset CI: schema validity, slug resolution, locale completeness, source presence, macro expansion counts.
- E2E: the lily-and-cat story, tank story, companion story.

## Extendability Notes

- LLM-assisted rule *drafting* (Phase 17) feeds the same PR pipeline — the dataset stays curated and cited; LLM never answers users directly from this system.
- Community rule submissions = the 9.6 pipeline opened to external PRs (public repo advantage).
- New hazard types (noise, magnetic, temperature-conflict for tank mates) are dataset + engine-case additions, no schema change.
- Warning materialization gives future "safety score" and onboarding checks ("about to add a lily — you have cats!") a free query surface; the pre-add check is a natural quick win later (`GET /kb/precheck?speciesSlug=&scope=`).
