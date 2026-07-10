# Phase 7: Locations, Maps & Weather — Design Document

## Table of Contents

- [Overview](#overview)
- [Architecture & External Services](#architecture--external-services)
- [Database Schema](#database-schema)
- [Geo Privacy Enforcement](#geo-privacy-enforcement)
- [Weather Integration](#weather-integration)
- [API Endpoints](#api-endpoints)
- [Frontend Pages and Components](#frontend-pages-and-components)
- [Iteration Plan](#iteration-plan)
- [Testing Strategy](#testing-strategy)
- [Extendability Notes](#extendability-notes)

---

## Overview

Phase 7 attaches **where** to pets: a map-picked location (point now; polygons arrive with groups in Phase 8 but the schema lands here), sun/shade placement, live weather and forecasts from Open-Meteo, and weather-driven alerts (frost, heat, storm, dry spell) through the Phase 6 notification pipeline. Geo is the most sensitive data in the app — the privacy rules from plan §4.4 are implemented and _proven_ here.

**Dependencies**: Phase 4 (visibility model), Phase 6 (notification pipeline for alerts; if Phase 7 is built first, 7.7 waits for 6.x). Only open solutions: Leaflet + OSM tiles, Nominatim, Open-Meteo (**no API keys anywhere** — consistent with the public repo).

## Architecture & External Services

```
apps/api/src/
  location/location.module.ts / controller / service
    geocoding/nominatim.client.ts      # search + reverse; 1 rps throttle, UA header, Redis cache
  weather/
    weather.module.ts / controller / service
    open-meteo.client.ts               # forecast + daily; Redis cache
    jobs/weather-alert.job.ts          # hourly rule evaluation
apps/web/src/components/map/           # client-only (dynamic import, no SSR)
  MapPicker.tsx  LocationSearch.tsx  CoarseLocationLabel.tsx  MapView.tsx
```

| Service          | Use                                                                              | Constraints honored                                                                                     |
| ---------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| OSM raster tiles | map display                                                                      | attribution, browser-side loading only, low volume                                                      |
| Nominatim        | address search + reverse geocode                                                 | ≤1 req/s (server-side queue), custom User-Agent, results cached in Redis 30 d + persisted coarse fields |
| Open-Meteo       | current/forecast/daily (temp, humidity, wind, precipitation, UV, sunrise/sunset) | free non-commercial, no key; cache per rounded coordinate                                               |

All third-party calls go through the API (server-side) — the browser talks only to our API and OSM tile servers.

## Database Schema

```prisma
model Location {
  id          String   @id @default(uuid()) @db.VarChar(36)
  kind        String   @db.VarChar(10)      // point | polygon
  lat         Decimal? @db.Decimal(9, 6)    // point or polygon centroid
  lng         Decimal? @db.Decimal(9, 6)
  polygon     Json?                          // GeoJSON Polygon (Phase 8 draws these)
  address     String?  @db.VarChar(500)     // full address — PRIVATE
  // Coarse fields: resolved once at save time; the ONLY geo ever exposed publicly
  city        String?  @db.VarChar(100)
  region      String?  @db.VarChar(100)
  countryCode String?  @map("country_code") @db.VarChar(2)
  timezone    String?  @db.VarChar(50)      // IANA, from reverse geocode; used for weather + daylight
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("locations")
}
```

- Activate `Pet.locationId` FK (Phase 2 column); `PetGroup.locationId` comes in Phase 8. Locations are owned-by-subject (no sharing of Location rows between subjects) — deleting the subject deletes the location.
- `Pet.placement` (Phase 2 enum: OPEN_SUN / PARTIAL_SHADE / SHADE / INDOOR / UNKNOWN) gets its editing UI here.
- Weather cache lives in Redis (`weather:<lat1dp>,<lng1dp>` → 30 min TTL for current, 3 h for daily), not in MySQL.

```prisma
model WeatherAlertRule {
  id          String   @id @default(uuid()) @db.VarChar(36)
  ownerUserId String   @map("owner_user_id") @db.VarChar(36)
  petId       String?  @map("pet_id") @db.VarChar(36)      // XOR groupId (Phase 8)
  groupId     String?  @map("group_id") @db.VarChar(36)
  type        String   @db.VarChar(20)                      // frost | heat | storm | dry_spell
  threshold   Json                                           // e.g. { tempBelowC: 0 } / { tempAboveC: 35 } / { windAboveKmh: 60 } / { daysWithoutRain: 7 }
  active      Boolean  @default(true)
  lastFiredAt DateTime? @map("last_fired_at")               // dedupe window: ≥12h between fires per rule
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([active])
  @@map("weather_alert_rules")
}
```

Default rules are offered (not forced) when an outdoor plant/group gets a location: frost < 0 °C, heat > 35 °C, storm wind > 60 km/h.

## Geo Privacy Enforcement

Layered, per plan §4.4 — all four layers land in this phase:

1. **Type level**: `PublicPetDto.coarseLocation` is `{city?, region?, countryCode?}` — no lat/lng/address/polygon fields exist on any public DTO. Compile-time guarantee.
2. **Save-time resolution**: on location create/update the API reverse-geocodes once and persists coarse fields; public reads never touch raw coordinates (no on-the-fly derivation that could leak precision).
3. **Serving**: precise fields only for VIEWER+ (`PetAccessService`); the map picker page itself is owner/member-gated.
4. **Verification (7.8)**: automated sweep asserting no precise geo in: public API responses (schema walk for numeric pairs), SSR HTML of public pages, sitemap, OpenGraph tags, error payloads, logs (pino redaction of `lat`/`lng`/`address` keys at warn+ levels).

Plus: EXIF GPS already stripped at upload (Phase 3); audit log on location changes (who, when, coarse-only in the log details).

## Weather Integration

- `GET weather for subject`: resolve location → rounded coords → Redis-cached Open-Meteo fetch → normalized DTO `{current, hourly[24], daily[7], daylight{sunrise,sunset,lengthMin}, uvIndex}` with units per user locale (metric default; imperial toggle later).
- **Alert job** (hourly, BullMQ): for each active rule, evaluate against cached/fetched forecast for the subject's location; fire ⇒ `dispatcher.notify(owner+caretakers, 'weather', payload)` with 12 h per-rule dedupe (`lastFiredAt`). Frost/heat check next-24 h forecast minima/maxima (proactive, not reactive); dry-spell checks trailing precipitation days.
- Failure isolation: Open-Meteo/Nominatim outages degrade gracefully (stale-cache-if-error, UI shows "weather unavailable"); circuit breaker with 10-min cool-off; never blocks core flows.

## API Endpoints

| Endpoint                                            | Guard   | Notes                                                                   |
| --------------------------------------------------- | ------- | ----------------------------------------------------------------------- |
| `PUT /api/v1/pets/:id/location`                     | OWNER   | `{lat,lng,address?}` → saves + resolves coarse; audit                   |
| `DELETE /api/v1/pets/:id/location`                  | OWNER   |                                                                         |
| `GET /api/v1/pets/:id/location`                     | VIEWER+ | Precise (public callers get coarse via the pet DTOs, not this endpoint) |
| `GET /api/v1/geocode/search?q=`                     | authed  | Proxied Nominatim search (throttled, cached) for the picker             |
| `PATCH /api/v1/pets/:id` (placement)                | OWNER   | Existing endpoint; placement enum                                       |
| `GET /api/v1/pets/:id/weather`                      | VIEWER+ | Normalized weather DTO; 404 if no location                              |
| `POST/GET/PATCH/DELETE /api/v1/weather-alert-rules` | owner   | Per pet (group in Phase 8)                                              |

## Frontend Pages and Components

- **MapPicker** (dynamic import, `ssr:false`): Leaflet map + draggable pin + `LocationSearch` (debounced ≥3 chars against our geocode proxy) + "use my position" (browser geolocation, with clear privacy copy) + OSM attribution.
- Pet page **Location & Weather** section (members): map thumbnail, address, placement selector; (public): `CoarseLocationLabel` ("Haifa, Israel") only — never a map.
- **WeatherCard**: current conditions, 7-day strip, daylight length, UV badge; prominent for outdoor plants (placement ≠ INDOOR).
- **AlertRulesPanel**: rule list with threshold editors + suggested defaults banner on first location set.
- Settings/notifications: `weather` category row activates (Phase 6 matrix).

## Iteration Plan

| #   | Work                                                                                                                                   | Done when                                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 7.1 | Schema `phase7_geo` (Location, WeatherAlertRule, Pet FK)                                                                               | Migration applied                                                                                                 |
| 7.2 | Map picker: Leaflet setup, pin, geocode search proxy (throttle+cache), save/delete location; owner-gated page                          | E2E: set location by search and by pin-drag                                                                       |
| 7.3 | Reverse geocoding: save-time coarse resolution + `CoarseLocationLabel` on public page; Nominatim client hardening (queue, UA, cache)   | Public page shows city/country only; Nominatim called once per save (cache test)                                  |
| 7.4 | Placement UI + display; suggested-defaults hook for alert rules                                                                        | Placement editable; shown on profile                                                                              |
| 7.5 | Open-Meteo client: normalized DTO, Redis cache, circuit breaker, unit handling                                                         | Contract tests against recorded fixtures; cache-hit ratio visible in logs                                         |
| 7.6 | WeatherCard on pet page (+ Today board strip for located outdoor plants)                                                               | Card renders forecast + daylight for a Haifa fixture                                                              |
| 7.7 | Alert rules: CRUD + hourly evaluation job + dedupe + notifications via dispatcher                                                      | Staging: frost alert fires for a fixture location with sub-zero forecast (mocked provider on CI, real on staging) |
| 7.8 | **Geo privacy verification sweep**: response-schema walker, SSR/OG/sitemap scans, log redaction, audit coverage — added to standing CI | Sweep green; deliberately-planted leak in a test branch is caught                                                 |

## Testing Strategy

- Provider clients tested against recorded fixtures (no live calls in CI); rate-limit and cache behavior unit-tested with fake timers.
- Alert engine: threshold matrix × forecast fixtures (frost tonight / heat in 3 days / storm / dry spell), dedupe window, multi-recipient (owner + caretakers).
- Geo privacy: the 7.8 sweep is the crown — it must also run against Phases 8–12 surfaces as they appear (part of the standing suite, like the access matrix).
- E2E: location set → weather card renders → coarse label public → alert rule created.

## Extendability Notes

- Polygon support is schema-ready; Phase 8 adds drawing + centroid-based weather.
- `Location.timezone` enables per-location daylight/care logic independent of the user's home timezone (a greenhouse abroad).
- Historical weather (Open-Meteo archive API) can later correlate diary symptoms with weather — schema needs nothing new.
- Tile serving can move to a self-hosted/paid provider behind `MapView` if volume ever strains OSM policy.
