# Future Phases (13+) — Outlines

Not designed in detail yet — each gets its own `phase-N-design.md` when scheduled. Order here is the current best guess; re-evaluate after Phase 12 with real usage data.

## Phase 13: Telegram Bot (Interactive)

Adapt myfinpro's `apps/bot` scaffold (grammy.js + Fluent i18n — extend to ru/uk).

- Link account via the existing Telegram OAuth identity (users who log in with Telegram are pre-linked).
- Reminder interactions: done / snooze buttons directly on the Phase 6 notification messages (upgrade the send-only channel to interactive callbacks).
- Conversational quick-log: `/feed`, `/water` with pet picker; photo message → diary entry draft ("here are the yellow leaves") with type/pet confirmation.
- `/today` command mirroring the Today board.
- Design decisions to make then: webhook vs long-poll on the VDS; per-chat rate limits; bot-side locale detection.

## Phase 14: Telegram Mini App

- Mobile-first pet browser + quick logging + story viewing inside Telegram; JWT bridge from mini-app initData (validated server-side like the login widget).
- Reuses the web app's API client and components where possible (shared package or a slim build target — decide then; myfinpro faced the same question).

## Phase 15: Passkey / WebAuthn

- New capability (not in myfinpro — consider backporting there after it works here).
- `@simplewebauthn/server` + browser API; `WebAuthnCredential` model; register in settings (require existing session), login via discoverable credentials; fallback ordering on the login page.
- Threat-model note: passkeys become the phishing-resistant recommended method; email/password remains for recovery.

## Phase 16: Smart Systems & Sensors

- Device registry: sensor/actuator entities attributed to a pet or group (`SubjectAccessService` is the hook), with per-device API tokens (hashed, scoped, revocable).
- Ingestion: HTTPS endpoint first (simplest, works for DIY ESP32 setups); MQTT broker later if device count justifies it.
- Data: `SensorReading` time-series (MySQL partitioned table first; dedicated TSDB only if volume demands); readings feed the existing `Measurement` charts where types overlap (temperature, humidity).
- Threshold alerts through the Phase 6 dispatcher (`sensors` category); automated feeder/waterer runs logged as `CareEvent` with device actor (`performedBy` design anticipated this).
- Security: device tokens never in repo; per-device rate limits; firmware update guidance out of scope.

## Phase 17: AI Monitoring (Possible Paid Tier)

- Candidates: symptom photo triage ("does this look like overwatering?"), anomaly detection on measurement/sensor series, care-plan suggestions, KB rule *drafting* (into the Phase 9.6 curation pipeline — never directly to users).
- Architecture: LLM provider behind an interface + BullMQ jobs; strict data minimization (only the pet's relevant data in prompts, no cross-user context); user-visible "AI-generated" labeling; vet-disclaimer UX.
- Monetization: only after the free core proves valuable — subscription gating this tier; requires billing infra (Stripe or similar), entitlement checks, and a pricing decision none of which should leak complexity into earlier phases.

## Parking Lot

- Municipality as a real entity with its own accounts/roles (street trees co-managed by residents).
- Lost-pet chip lookup (needs its own privacy design).
- Historical weather × diary correlation view.
- Data import (from the Phase 12 export format) / migration from other pet apps.
- Public API + personal MCP server (mirroring myfinpro's MCP ambition) for AI-assistant access to one's own pets.
- Shared-nginx neutralization chore with the myfinpro repo (tracked in phase-0 design §Shared Nginx Integration).
