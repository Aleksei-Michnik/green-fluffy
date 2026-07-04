# Phase 6: Feeding & Care, Reminders, Notifications — Design Document

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Scheduling Engine](#scheduling-engine)
- [Notification Pipeline](#notification-pipeline)
- [API Endpoints](#api-endpoints)
- [Frontend Pages and Components](#frontend-pages-and-components)
- [Iteration Plan](#iteration-plan)
- [Testing Strategy](#testing-strategy)
- [Extendability Notes](#extendability-notes)

---

## Overview

Phase 6 makes the app *useful every day*: quick feeding/watering logging with a personal food catalog, recurring care and health reminders that respect timezones and DST, and the notification pipeline (email + send-only Telegram) that every later phase reuses (weather alerts, warnings, social). This phase also puts Redis/BullMQ into real service for the first time.

**Dependencies**: Phase 4 (roles), Phase 5 (diary integration, vaccination due dates). Phase 7 is independent.

## Architecture

```
apps/api/src/
  care/
    care.module.ts / controller / service      # FoodItem + CareEvent
  reminder/
    reminder.module.ts / controller / service
    scheduling/rrule-engine.ts                  # rrule lib + timezone handling
    jobs/occurrence-generator.job.ts            # BullMQ repeatable
  notification/
    notification.module.ts / dispatcher.service.ts
    channels/{email.channel.ts, telegram.channel.ts}   # Channel interface
    preferences/preference.service.ts
    jobs/notification-sender.job.ts
  queue/queue.module.ts                          # BullMQ wiring, dead-letter, dashboards
```

Key decisions:

- **RRULE strings** (RFC 5545 via `rrule` lib) for schedules — expressive (daily, every 3 days, Mon/Thu, monthly), portable, and UI-mappable. Each reminder stores its own IANA `timezone` (defaulted from the user, editable) — occurrences are computed in that zone, stored UTC.
- **Occurrence materialization**: a repeatable BullMQ job rolls a 14-day window of `ReminderOccurrence` rows forward (idempotent by `(reminderId, dueAt)` unique key). Materialized rows make "today" queries trivial and done/snooze auditable.
- **Channel abstraction**: `NotificationChannel.send(userId, notification)` — email and Telegram now; web push (future) plugs in without touching callers. All sends via queue with retry/backoff + dead-letter.
- Telegram send-only: a minimal bot client (the Phase 1.6 login bot) sending messages to users who linked Telegram **and** opted in; no interactive handlers (that's Phase 13).

## Database Schema

```prisma
enum CareEventType { FEEDING WATERING FERTILIZING MEDICATION GROOMING REPOTTING PRUNING CLEANING TRAINING WALK OTHER }

model FoodItem {
  id          String   @id @default(uuid()) @db.VarChar(36)
  ownerUserId String   @map("owner_user_id") @db.VarChar(36)   // personal catalog
  name        String   @db.VarChar(120)
  brand       String?  @db.VarChar(120)
  kind        String   @db.VarChar(20)      // food | fertilizer | supplement | medication | treat
  defaultUnit String?  @map("default_unit") @db.VarChar(10)
  notes       String?  @db.VarChar(500)
  archivedAt  DateTime? @map("archived_at")
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([ownerUserId, kind])
  @@map("food_items")
}

model CareEvent {
  id              String        @id @default(uuid()) @db.VarChar(36)
  petId           String?       @map("pet_id") @db.VarChar(36)     // XOR groupId (group in Phase 8)
  groupId         String?       @map("group_id") @db.VarChar(36)
  type            CareEventType
  foodItemId      String?       @map("food_item_id") @db.VarChar(36)
  quantity        Decimal?      @db.Decimal(10, 3)
  unit            String?       @db.VarChar(10)
  notes           String?       @db.VarChar(500)
  occurredAt      DateTime      @map("occurred_at")
  performedBy     String        @map("performed_by") @db.VarChar(36)
  occurrenceId    String?       @map("occurrence_id") @db.VarChar(36)  // when created from a reminder done-action
  createdAt       DateTime      @default(now()) @map("created_at")
  deletedAt       DateTime?     @map("deleted_at")

  @@index([petId, occurredAt])
  @@index([groupId, occurredAt])
  @@map("care_events")
}

enum ReminderKind { CARE HEALTH CUSTOM }
enum OccurrenceStatus { PENDING NOTIFIED DONE SNOOZED SKIPPED MISSED }

model Reminder {
  id           String       @id @default(uuid()) @db.VarChar(36)
  ownerUserId  String       @map("owner_user_id") @db.VarChar(36)
  petId        String?      @map("pet_id") @db.VarChar(36)         // XOR groupId
  groupId      String?      @map("group_id") @db.VarChar(36)
  kind         ReminderKind
  careType     CareEventType? @map("care_type")                     // for kind=CARE: done-action creates CareEvent
  title        String       @db.VarChar(200)
  notes        String?      @db.VarChar(500)
  rrule        String       @db.VarChar(500)                        // RFC 5545 RRULE (+DTSTART)
  timezone     String       @db.VarChar(50)                         // IANA
  channels     Json                                                  // ["email","telegram"]
  leadTime     Int          @default(0) @map("lead_time_minutes")    // notify N min before dueAt
  active       Boolean      @default(true)
  endsAt       DateTime?    @map("ends_at")
  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")

  occurrences  ReminderOccurrence[]
  @@index([ownerUserId, active])
  @@index([petId])
  @@map("reminders")
}

model ReminderOccurrence {
  id         String           @id @default(uuid()) @db.VarChar(36)
  reminderId String           @map("reminder_id") @db.VarChar(36)
  reminder   Reminder         @relation(fields: [reminderId], references: [id], onDelete: Cascade)
  dueAt      DateTime         @map("due_at")                        // UTC instant
  status     OccurrenceStatus @default(PENDING)
  notifiedAt DateTime?        @map("notified_at")
  doneAt     DateTime?        @map("done_at")
  doneBy     String?          @map("done_by") @db.VarChar(36)
  snoozedTo  DateTime?        @map("snoozed_to")
  careEventId String?         @map("care_event_id") @db.VarChar(36)

  @@unique([reminderId, dueAt])
  @@index([status, dueAt])
  @@map("reminder_occurrences")
}

model NotificationPreference {
  id       String  @id @default(uuid()) @db.VarChar(36)
  userId   String  @map("user_id") @db.VarChar(36)
  channel  String  @db.VarChar(20)     // email | telegram | webpush(future)
  category String  @db.VarChar(30)     // reminders | health | weather | warnings | social | system
  enabled  Boolean @default(true)
  @@unique([userId, channel, category])
  @@map("notification_preferences")
}
```

## Scheduling Engine

- **Generation job** (every 15 min, repeatable): for each active reminder, expand RRULE in the reminder's timezone over `[now, now+14d]`, upsert `ReminderOccurrence` rows (unique key makes it idempotent). Reminder edit ⇒ delete future PENDING occurrences and regenerate.
- **DST rule**: "08:00 daily" means 08:00 *wall clock* in the reminder's timezone on both sides of a DST switch (rrule expansion with `tzid` handles this; tests pin Israel + Ukraine transitions).
- **Dispatch job** (every minute): occurrences with `status=PENDING and dueAt - leadTime <= now` → enqueue notifications, mark `NOTIFIED`. `NOTIFIED` older than 24 h without action → `MISSED` (visible in history, no spam).
- **Done action**: sets `DONE`, and for `kind=CARE` creates the linked `CareEvent` (and thus history) in one transaction; for `kind=HEALTH` optionally deep-links to a pre-filled diary composer. **Snooze**: `snoozedTo` (+15 min/1 h/tomorrow presets) re-enters dispatch.
- Deploy safety: repeatable jobs registered by name+cron on boot (BullMQ dedupes); blue-green slot flip must not double-schedule — job keys deterministic, and a `queue:health` staging test asserts singleton scheduling after two deploys.

## Notification Pipeline

- `dispatcher.notify(userId, category, payload)` → checks `NotificationPreference` (default: email ON for reminders/health/system, telegram ON when linked, social OFF until Phase 10 prompts) → enqueues per-channel jobs.
- Email channel: reuses Phase 1 `MailModule` templates (×4 locales, user's locale).
- Telegram channel: bot `sendMessage` with localized text + deep link back to the web app; graceful skip when user has no linked Telegram.
- Retry ×3 exponential; failures → dead-letter queue + log alert; per-user rate cap (≤ 20 notifications/h) to prevent runaway loops.
- **Digest & quiet hours** (6.10): per-user quiet window in their timezone (default off); notifications due in-window are held and delivered as one digest at window end; optional daily-digest mode collapses reminder notifications into a morning summary.

## API Endpoints

| Endpoint | Guard | Notes |
| -------- | ----- | ----- |
| `POST/GET/PATCH/DELETE /api/v1/food-items` | authed (own catalog) | `?kind=` filter; archive instead of delete when referenced |
| `POST /api/v1/pets/:id/care-events` | CARETAKER+ | Quick-log; inline `newFoodItem` creation supported |
| `GET /api/v1/pets/:id/care-events` | VIEWER+ (public → section rule) | Cursor, `type[]`, date range |
| `PATCH/DELETE /api/v1/care-events/:id` | author or OWNER | Audit-logged |
| `POST/GET/PATCH/DELETE /api/v1/reminders` | owner of reminder; pet CARETAKER+ can view pet's reminders | RRULE validated server-side (parse + sane frequency ≥ hourly) |
| `GET /api/v1/reminders/today` | authed | All occurrences due today across pets/groups, in user timezone |
| `POST /api/v1/occurrences/:id/done` | CARETAKER+ on subject | Optional `{quantity, unit, foodItemId, notes}` for the auto CareEvent |
| `POST /api/v1/occurrences/:id/snooze` / `POST :id/skip` | CARETAKER+ | Presets or explicit `snoozedTo` |
| `GET/PUT /api/v1/users/me/notification-preferences` | authed | Channel × category matrix + quiet hours + digest mode |

## Frontend Pages and Components

```
app/[locale]/
  today/page.tsx                       # cross-pet "Today" board — becomes the logged-in home
  pets/[petId]/care/page.tsx           # care history + pet reminders
  settings/notifications/page.tsx      # preference matrix, quiet hours, digest
components/care/
  QuickLogButton.tsx (FAB on pet page) QuickLogSheet.tsx (type → food picker → qty → save, ≤3 taps)
  FoodPicker.tsx (search own catalog + inline create)  CareHistoryList.tsx
components/reminder/
  ReminderForm.tsx (schedule builder UI ↔ RRULE: presets daily/weekly/custom, time, channels, lead time)
  TodayBoard.tsx (grouped by pet, done/snooze swipe actions)  OccurrenceHistory.tsx  DueBadge.tsx
```

The **Today board** is the retention surface: reminders due, overdue, recently done; empty state celebrates "all done". Header shows a due-count badge.

## Iteration Plan

| # | Work | Done when |
| - | ---- | --------- |
| 6.1 | Schema `phase6_care` (FoodItem, CareEvent, Reminder, ReminderOccurrence, NotificationPreference) | Migration applied |
| 6.2 | Care log: API + QuickLogSheet + FoodPicker + history list; diary timeline shows care events inline (merged view toggle) | E2E: log feeding in ≤3 taps; history renders |
| 6.3 | Queue infra: BullMQ module, Redis wiring in all envs, dead-letter, `queue:health` endpoint, singleton-after-redeploy staging test | Jobs survive slot flip without duplication |
| 6.4 | Scheduling engine: RRULE validation, occurrence generator, dispatch/missed transitions; DST + timezone test battery | Occurrence tests green incl. DST transitions (Asia/Jerusalem, Europe/Kyiv) |
| 6.5 | Reminder API + ReminderForm + TodayBoard + done/snooze/skip flows (done → CareEvent tx) | E2E: create daily reminder → occurrence appears → done → care history entry exists |
| 6.6 | Email notifications: dispatcher + email channel + localized templates | Staging: reminder email delivered at due time (fixture with near-future occurrence) |
| 6.7 | Telegram channel: send-only client, opt-in toggle (auto-prompt when Telegram linked), deep links | Staging: Telegram message received |
| 6.8 | Preferences: matrix UI + enforcement in dispatcher + per-user rate cap | Preference off ⇒ channel silent (test) |
| 6.9 | Health reminders: "create reminder" action from vaccination registry (`nextDueAt` pre-fill), health templates (annual vaccination, monthly antiparasitic) | Registry → reminder round-trip E2E |
| 6.10 | Quiet hours + daily digest | Digest arrives at window end with held items (faked clock test) |

## Testing Strategy

- **Time is the risk**: all engine tests run with injected clock (`@nestjs/testing` + fake timers); battery covers DST both directions, leap day, `endsAt`, timezone change after creation, snooze past next occurrence.
- Idempotency: generator run twice ⇒ no duplicate occurrences; dispatch retry ⇒ no duplicate sends (job id = occurrence id + channel).
- Access matrix: care/reminder endpoints registered in the standing suite.
- E2E: full loop create→notify (mailpit inbox assert in dev/staging)→done→history.

## Extendability Notes

- Web push = new `NotificationChannel` + preference column value; zero caller changes.
- Group reminders (Phase 8) reuse `groupId` columns already present.
- Weather alerts (7.7), KB warnings (9.7), social (10.8) all call `dispatcher.notify` with their category — the matrix UI already shows the categories grayed until active.
- Sensor-triggered care events (Phase 16) write `CareEvent` with a device actor — schema already actor-agnostic (`performedBy`).
