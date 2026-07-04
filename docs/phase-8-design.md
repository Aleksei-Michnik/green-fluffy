# Phase 8: Pet Groups — Patches, Fields, Tanks, Colonies — Design Document

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

Phase 8 introduces **groups of pets** — beings living and cared for together: a flower patch, a wheat field, a greenhouse bench, a fish tank, a bird cage, an apartment's cats, a stray dog pack, a lion family. Groups get their own locations (including **drawn polygon boundaries** for fields and habitats), group-level care events ("watered the field"), reminders, weather + alerts, sharing, and public pages. Groups also support a **headcount** for populations that don't warrant individual profiles ("~200 wheat plants", "12 guppies").

Deliberate reuse: groups plug into the *existing* care/reminder/weather/sharing machinery via the `groupId` columns and access patterns laid down in Phases 4–7 — this phase is mostly wiring, boundaries UI, and a second subject type, not new subsystems.

**Dependencies**: Phases 4, 6, 7. (The user-collaboration mechanics again mirror myfinpro's group module, as adapted in Phase 4.)

## Architecture

```
apps/api/src/
  pet-group/
    pet-group.module.ts / controller / service
    guards/group-access.guard.ts        # same shape as PetAccessGuard
    dto/
apps/web/src/
  app/[locale]/groups/                  # list, new, [groupId]/(page|edit|sharing|care|map)
  components/group/
    GroupCard.tsx  GroupForm.tsx  GroupTypeIcon.tsx  HeadcountEditor.tsx
    MemberPetsPanel.tsx (add/move pets)  BoundaryEditor.tsx (leaflet-geoman)
```

`SubjectAccessService` generalization: `PetAccessService` (Phase 4) is refactored to resolve roles for a *subject* = pet | group with identical role semantics (OWNER/CARETAKER/VIEWER/PUBLIC/NONE) and identical member/invite mechanics. One service, two subject tables — care, media, reminders, weather all consult the same resolver.

## Database Schema

```prisma
enum PetGroupType { PATCH FIELD GREENHOUSE GARDEN_BED TANK POND AVIARY CAGE ENCLOSURE HOUSEHOLD COLONY PACK HERD FLOCK OTHER }

model PetGroup {
  id                String       @id @default(uuid()) @db.VarChar(36)
  name              String       @db.VarChar(120)
  type              PetGroupType
  category          LifeCategory                       // ANIMAL | PLANT (dominant kind; mixed allowed via items)
  description       String?      @db.Text
  ownerUserId       String       @map("owner_user_id") @db.VarChar(36)
  headcount         Int?                                // uncounted populations
  headcountUnit     String?      @map("headcount_unit") @db.VarChar(30)   // "plants", "fish", "birds"
  speciesId         String?      @map("species_id") @db.VarChar(36)       // homogeneous groups (wheat field)
  placement         Placement    @default(UNKNOWN)
  locationId        String?      @map("location_id") @db.VarChar(36)
  areaSqM           Decimal?     @map("area_sq_m") @db.Decimal(12, 2)     // computed from polygon
  isPublic          Boolean      @default(false) @map("is_public")
  sectionVisibility Json?        @map("section_visibility")
  avatarMediaId     String?      @map("avatar_media_id") @db.VarChar(36)
  status            PetStatus    @default(ACTIVE)
  createdAt         DateTime     @default(now()) @map("created_at")
  updatedAt         DateTime     @updatedAt @map("updated_at")
  deletedAt         DateTime?    @map("deleted_at")

  @@index([ownerUserId, status])
  @@map("pet_groups")
}

model PetGroupItem {
  id       String   @id @default(uuid()) @db.VarChar(36)
  groupId  String   @map("group_id") @db.VarChar(36)
  petId    String   @map("pet_id") @db.VarChar(36)
  addedAt  DateTime @default(now()) @map("added_at")
  @@unique([groupId, petId])
  @@index([petId])
  @@map("pet_group_items")
}

model PetGroupMember {        // mirrors PetMember
  id        String   @id @default(uuid()) @db.VarChar(36)
  groupId   String   @map("group_id") @db.VarChar(36)
  userId    String   @map("user_id") @db.VarChar(36)
  role      PetRole
  invitedBy String   @map("invited_by") @db.VarChar(36)
  joinedAt  DateTime @default(now()) @map("joined_at")
  @@unique([groupId, userId])
  @@map("pet_group_members")
}

model PetGroupInviteToken {   // mirrors PetInviteToken
  id        String    @id @default(uuid()) @db.VarChar(36)
  groupId   String    @map("group_id") @db.VarChar(36)
  tokenHash String    @unique @map("token_hash") @db.VarChar(255)
  role      PetRole
  createdBy String    @map("created_by") @db.VarChar(36)
  expiresAt DateTime  @map("expires_at")
  usedAt    DateTime? @map("used_at")
  usedBy    String?   @map("used_by") @db.VarChar(36)
  @@index([groupId])
  @@map("pet_group_invite_tokens")
}
```

Semantics:

- A pet may belong to **multiple groups** (a cat is in "Apartment cats" household and "Balcony crew").
- Pet membership in a group grants **no user access** — user roles on a group and on its pets are independent (a field caretaker doesn't see the farmer's other pets; a group's public page lists only pets that are themselves public).
- `headcount` and individual `PetGroupItem`s coexist (a tank: 12 guppies headcount + one named betta with a profile).
- Existing `CareEvent.groupId`, `Reminder.groupId`, `WeatherAlertRule.groupId` columns (placed in Phases 6–7) activate with FKs now.

## API Endpoints

Mirrors the pet surface — same guard semantics via `SubjectAccessService`:

| Endpoint | Guard | Notes |
| -------- | ----- | ----- |
| `POST/GET/PATCH/DELETE /api/v1/groups` | authed / OWNER | CRUD; list = own + member groups |
| `POST /api/v1/groups/:id/pets` / `DELETE :id/pets/:petId` | OWNER (pet: own or managed) | Add requires caller has OWNER on the pet too |
| `GET /api/v1/groups/:id/pets` | VIEWER+ | Member pets (public callers: public pets only) |
| `PUT/DELETE /api/v1/groups/:id/location` | OWNER | Point **or polygon** (GeoJSON validated: closed ring, ≤500 vertices, area sanity); centroid + area computed server-side |
| `POST /api/v1/groups/:id/care-events`, `GET …` | CARETAKER+ | Same care API shape as pets |
| Reminders / weather / alert-rules for groups | as pets | Existing endpoints accept `groupId` subject |
| Invites/members/visibility for groups | as pets | Same flows, `pet-group` variants |
| `GET /api/v1/public/groups/:id` | anon | `PublicGroupDto`: coarse location only, public member pets, **no polygon** |

## Frontend Pages and Components

- **Groups list** (`/groups`): cards with type icon, headcount, member-pet avatars stack, location label.
- **Group page**: header (name, type badge, headcount), tabs: Pets (grid + add/move), Care (history + quick log), Map (members only: polygon/point via `BoundaryEditor`), Weather, Sharing.
- **BoundaryEditor**: leaflet-geoman draw/edit polygon, live area display (m²/ha), point fallback; privacy copy repeated here (boundaries are never public).
- **Quick-log at group level** reuses `QuickLogSheet` with subject switcher; pet pages of group members show inherited group events in history (labeled "via Wheat field").
- Public group page mirrors public pet page (coarse label, public pets, gallery if section public).
- Today board and dashboards gain group rows.

## Iteration Plan

| # | Work | Done when |
| - | ---- | --------- |
| 8.1 | Schema `phase8_groups` + FK activation for `groupId` columns | Migration applied |
| 8.2 | `SubjectAccessService` refactor (pets keep passing the standing matrix) + group CRUD API/UI + add/move pets | Group manageable; access matrix extended to groups and green |
| 8.3 | Group sharing: members/invites/visibility (ported flows) | Invite E2E on a group |
| 8.4 | Boundaries: polygon draw/edit/validate, centroid + area, map tab | Field boundary drawn, saved, area correct (fixture) |
| 8.5 | Group care events: API wiring + UI + inherited display on member pets | "Watered the field" appears on the field and its plants |
| 8.6 | Group reminders on Today board | Watering reminder for a patch round-trips |
| 8.7 | Group weather + alert rules (centroid-based) | Frost alert for a field fixture |
| 8.8 | Public group pages + `PublicGroupDto` + sitemap; geo sweep re-run (polygons must never leak) | Public tank page live; 7.8 sweep green incl. groups |

## Testing Strategy

- Access matrix now parameterized over subject type (pet, group) — double coverage for free.
- Polygon validation: self-intersection, open ring, vertex cap, absurd area, antimeridian (rejected with clear error).
- Independence tests: group role grants nothing on member pets and vice versa; public group lists only public pets.
- Inherited care display: event on group visible from pet with correct attribution, not duplicated in exports/counts.
- Geo sweep: polygon and centroid absent from all public surfaces.

## Extendability Notes

- `PetGroupType` is an enum of convenience — adding types is a one-liner; `OTHER` + name covers the tail.
- Group-of-groups (farm → fields) deliberately excluded; revisit only with real demand.
- Sensors (Phase 16) attach to subjects — the `SubjectAccessService` abstraction is the hook.
- Per-group species mix stats ("3 tomato + 2 basil") derivable from items; a `speciesSummary` cache column can come later if the query shows up in profiles.
