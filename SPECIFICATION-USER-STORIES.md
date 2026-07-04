# Green and Fluffy — User Stories / Use Cases

An application to care for any living being you love — animals and plants, at home, in the garden, on the farm, or on the street. Profiles, photo albums and stories, health diaries, feeding and care reminders, locations and weather, and safety recommendations ("is this plant dangerous for my cat?").

**Terminology**: throughout this document, a **"pet"** means any tracked living being — an animal *or* a plant, owned or not (a street tree, a stray dog, a wheat field, a lion family). A **"member"** is a user granted access to a private pet by its owner. A **"group"** is a collection of pets managed together (a flower patch, a fish tank, a cat colony, a field of wheat).

**Scope decisions** (confirmed):

- Architecture mirrors the sister project [myfinpro](https://github.com/Aleksei-Michnik/myfinpro); its auth (email, Google, Telegram), user management, and timezone functionality are reused.
- Passkey/WebAuthn login is a backlog phase, not v1.
- Social features (albums, 24h stories, likes, comments, discovery feed) are in the initial scope.
- Species knowledge base for warnings/recommendations is a curated, versioned dataset shipped in the repo.
- Public pet pages are visible to anonymous visitors; precise locations are never exposed publicly — only a coarse region.
- Locales: English, Hebrew (RTL), Russian, Ukrainian — fully translated from day one.
- Media stored on VDS local filesystem with per-user quotas behind a storage-adapter interface (S3-ready).
- Telegram interactive bot, smart sensors/feeders integration, and AI monitoring are later phases. Monetization: none for now.

---

## Visitor (Anonymous)

- As a visitor, I can open a public pet page via a shared link so that I can see the pet's profile, photos, and public diary entries without registering.
- As a visitor, I can see only a coarse location (city/region level) on public pet pages so that the owner's precise geo data stays private.
- As a visitor, I can view public pet pages that are SEO-friendly (server-rendered, with proper meta/OpenGraph tags) so that pets can be found and shared on the web and social media.
- As a visitor, I can register or log in with email, Google, or Telegram so that I can create my own pets and interact with public ones.
- As a visitor, I cannot see private pets, private diary entries, member lists, precise locations, or documents under any circumstances.

## Account & Profile

- As a user, I can register and log in with email + password, Google, or Telegram so that I can choose my preferred method.
- As a user, I can link multiple login methods (email, Google, Telegram) to one account so that I can log in any way I like.
- As a user, I can confirm my email, reset a forgotten password, and change my password so that my account stays secure and recoverable.
- As a user, I can set my timezone and locale (English, Hebrew, Russian, Ukrainian) so that dates, reminders, and the interface match my context; Hebrew renders right-to-left.
- As a user, I can edit my profile (name, avatar, bio) so that other users recognize me.
- As a user, I can delete my account with a grace period so that I can change my mind; after the grace period my personal data is removed and my pets are either deleted or transferred as I chose.
- As a user, I can export my data (pets, diaries, media) so that I own my information.

## Pet Profiles (Animals & Plants)

### Creating and Editing

- As a user, I can add a pet and specify whether it is an animal or a plant so that both are first-class citizens.
- As a user, I can select the pet's kind/species from a structured catalog (e.g., cat → Maine Coon; plant → Monstera deliciosa) with free-text fallback so that unknown species are never a blocker.
- As a user, I can set the pet's owner: myself, another user, a municipality/community (e.g., a street tree), or "no owner" (stray or wild animal) so that any living being can be tracked.
- As a user, I can give the pet a name (or several names/aliases), birth/planting date (exact or approximate), sex where applicable, and a description so that its profile is complete.
- As an owner, I can record identity data: passports, microchip numbers, tags, pedigrees — with scans/photos of the documents so that everything official is in one place.
- As an owner, I can archive a pet (deceased, sold, released, plant removed) so that its history is preserved without cluttering my active list.

### Privacy & Sharing

- As an owner, I can make a pet's page public or private so that I control who sees it.
- As an owner, I can invite other users to a private pet as members with a role — caretaker (can add diary/feeding entries, photos) or viewer (read-only) so that family, co-owners, or vets can participate appropriately.
- As an owner, I can revoke a member's access at any time so that I stay in control.
- As an owner, I can choose per-section visibility for a public pet (e.g., photos public, health diary private, documents always private) so that public doesn't mean everything is exposed.
- As a member, I can see the private pets shared with me in my list so that I can participate in their care.

## Media: Albums & Stories

- As an owner or caretaker, I can upload photos (and short videos) of a pet so that I can build its visual history.
- As an owner, I can organize photos into Instagram-like albums with captions and a cover so that the gallery is browsable and beautiful.
- As an owner or caretaker, I can publish stories — short-lived posts (24 hours) with a photo/video and caption — so that I can share moments; expired stories are archived to the pet's story archive visible to those with access.
- As a user, I can attach any photo from a diary/feeding/health entry to the pet's gallery so that a single upload serves both records and the album.
- As a user, I can see my storage usage against my quota so that I know when to clean up; images are automatically resized/optimized and served as thumbnails where appropriate.
- As an owner, I can delete any photo or album of my pet so that I control the content; deleted media is removed from storage, not just hidden.

## Health Diary

- As an owner or caretaker, I can add diary entries of different types — condition/diagnosis, symptom (yellow leaves, fast breathing, bad appetite), measurement, treatment, vaccination, vet visit, observation, or free-form note/thought — so that the pet's whole health story lives in one timeline.
- As an owner or caretaker, I can attach photos, dates, and structured details (weight, height, temperature, dosage) to a diary entry so that entries are precise and comparable over time.
- As an owner or caretaker, I can record weight/height (or trunk girth/plant height) measurements and see them charted over time so that trends are visible.
- As an owner, I can attach vet documents — medical records, lab results, prescriptions — to diary entries or the pet itself, as scans/PDFs/photos, so that paperwork is attributed and findable.
- As an owner or caretaker, I can edit and delete my diary entries so that mistakes can be fixed; changes are audit-logged.
- As an owner, I can filter and search the diary by entry type, date range, and text so that I can find "when did we last deworm her" quickly.

## Feeding, Watering & Care

- As an owner or caretaker, I can log a feeding/watering event, selecting the food/fertilizer from my catalog or adding a new one (name, brand, notes) so that entries are fast and consistent.
- As an owner or caretaker, I can see the feeding/watering history per pet or group so that anyone in the household knows what happened and when.
- As an owner, I can create recurring care reminders — feeding, watering, medication, grooming, repotting, pruning — with schedules honoring my timezone so that nothing is forgotten.
- As an owner, I can create vet & health reminders (vaccination due, checkup, antiparasitic treatment) so that preventive care happens on time.
- As a user, I receive reminders via email and Telegram notifications (and web push later) with the option per reminder, so that I get notified where it suits me.
- As an owner or caretaker, I can mark a reminder occurrence as done (optionally auto-creating the corresponding diary/feeding entry) or snooze it so that the history reflects reality.

## Location & Environment

- As an owner, I can set a pet's or group's location — a point on a map or an address — so that environmental context is attached; for plants in open soil this is essential.
- As an owner, I can mark a plant's placement as open sunlight / partial shade / shadow / indoors so that recommendations account for light conditions.
- As an owner, I can see current and forecast weather for a located pet/group — temperature, humidity, wind, precipitation, daylight length, UV/sun intensity — so that I can plan care (watering, frost protection, shading).
- As an owner, I can receive weather-driven alerts for located outdoor plants/groups (frost warning, heatwave, storm) so that I can act before damage happens.
- As a user, precise locations are visible only to me and members; public pages show at most a city/region name so that geo privacy is guaranteed.
- Maps use open solutions (OpenStreetMap-based tiles with an open-source map library) so that the app doesn't depend on proprietary map services.

## Groups (Patches, Fields, Tanks, Colonies)

- As a user, I can create a group of pets — a flower patch, a wheat field, a greenhouse bench, a fish tank, an apartment's cats, a cage of birds, a stray dog pack, a lion family — with a type, name, and description so that beings living together are managed together.
- As a user, I can add pets to a group and move them between groups so that membership reflects reality; a group can also track a headcount for uncounted populations (e.g., "~200 wheat plants", "12 guppies") without individual profiles.
- As an owner, I can draw a group's boundary on a map (polygon for a field/patch/habitat) or set a point so that its territory is defined; boundaries use open map solutions.
- As an owner or caretaker, I can log care events at the group level — watering the field, fertilizing the patch, feeding the tank — so that one entry covers all members.
- As an owner, I can set group-level reminders and see group-level weather (based on the group's location) so that field work is planned like individual care.
- As an owner, I can make a group public or private and invite members with roles, same as individual pets, so that sharing works uniformly.

## Recommendations & Warnings ("My Green and Fluffy")

- As a user, I can see warnings when a combination I own is risky — a plant toxic to cats within a cat household, a plant dangerous to fish placed in a tank/pond group, a poisonous flower reachable by pets — so that accidents are prevented.
- As a user, I can see plant-to-plant compatibility warnings (bad companions in the same pot, patch, or open soil) and suggestions (good companions) so that my plantings thrive.
- As a user, I can see care recommendations based on species, placement (sun/shade, indoor/outdoor), season, and local weather so that I get actionable advice, not generic text.
- As a user, I can view the reason/source behind each warning so that I can trust and verify it.
- Warnings are computed from a curated, versioned species knowledge base shipped with the app (compiled from public sources such as ASPCA toxicity lists and companion-planting references); as the catalog grows, warnings improve for everyone.
- As a user, I can dismiss a specific warning ("my cat never enters that room") so that my dashboard stays relevant; dismissed warnings remain viewable.

## Social & Discovery

- As a user, I can browse a discovery feed of public pets' recent photos, stories, and milestones so that I can enjoy and learn from other people's green and fluffy.
- As a user, I can follow public pets (and users) so that my feed prioritizes what I care about.
- As a user, I can like public photos, stories, and diary entries that their owner made public so that I can show appreciation.
- As a user, I can comment on public content, and as an owner I can moderate (delete) comments on my pets' content and block users from commenting so that discussions stay healthy.
- As an owner, I can turn comments/likes off per pet so that a quiet page stays quiet.
- As a user, I can report inappropriate content so that moderators can act; reported content is queued for review.

## Web App Experience

- As a web app user, I can use the app comfortably on mobile, tablet, and desktop (responsive, mobile-first) so that quick logging at the vet or in the garden is easy.
- As a web app user, I can switch between dark and light themes so that the appearance suits me.
- As a web app user, I can use the app in English, Hebrew (RTL), Russian, or Ukrainian — fully translated — so that language is never a barrier.
- As a web app user, I have a dashboard: my pets and groups, today's reminders, active warnings, recent activity of pets shared with me so that one screen orients my day.
- As a web app user, I can manage notification preferences per channel (email, Telegram, web push later) and per category (reminders, social, weather alerts) so that I control the noise.

## Later Phases (Planned, Not in Initial Scope)

### Telegram Bot & Mini App

- As a Telegram user, I can receive reminders and alerts via the bot so that notifications reach me where I chat. *(Send-only notifications arrive earlier — see Feeding & Care.)*
- As a Telegram user, I can log a feeding or diary entry conversationally, including sending a photo ("here are the yellow leaves") so that logging is instant.
- As a Telegram user, I can open a mini app to browse my pets and history on mobile.

### Passkey

- As a user, I can register a passkey (WebAuthn) and log in without a password so that login is phishing-resistant.

### Smart Systems & Sensors

- As an owner, I can connect smart feeders/waterers and sensors (light, air humidity/temperature, soil humidity) and attribute them to a pet or group so that conditions are monitored automatically.
- As an owner, I can see sensor data charted on the pet/group page and receive threshold alerts (soil too dry, tank too warm) so that intervention is timely.
- As an owner, automated feeder/waterer runs are logged into the feeding/watering history so that manual and automatic care form one timeline.

### AI Monitoring (Future Paid Tier)

- As a user, I can get AI-assisted insights: symptom photo triage ("do these leaves look like overwatering?"), anomaly detection in measurements and sensor data, and care plan suggestions.
- Monetization approaches (e.g., monthly subscription gating AI monitoring) will be considered only after the free core proves valuable.

## Non-Functional Requirements

### Security & Privacy

- The repository is public: no API keys, secrets, passwords, or tokens are ever committed; all secrets live in environment variables / GitHub Actions secrets / server-side env files.
- Personal data (especially geo locations) is treated as sensitive: precise coordinates are never exposed on public pages or in public API responses; access control is enforced server-side on every endpoint, not in the UI.
- All traffic is HTTPS; auth follows the myfinpro model (JWT access + refresh with rotation, httpOnly cookies, rate-limited auth endpoints, audit logging).
- Uploaded files are validated (MIME whitelist, size limits), stored outside the web root, and served only through authorization-checked endpoints; private media URLs are not guessable.
- GDPR-style rights: data export and account deletion with grace period.

### Platform

- Runs on the shared VDS alongside myfinpro (Docker Compose behind the shared Nginx) under `green-fluffy.michnik.pro`, with a staging environment, until load justifies dedicated/cloud hosting.
- Automated backups of database and media with restore verification.
- CI/CD via GitHub Actions: typecheck, lint, unit/integration/E2E tests, and deploy — every phase ships deployable increments.
