# Green and Fluffy 🌱🐾

Care for any living being you love — animals **and** plants: at home, in the garden, on the farm, or on the street.

Pet & plant profiles, Instagram-like albums and stories, health diaries, feeding/watering logs and reminders, locations with weather monitoring, and safety recommendations ("is this plant dangerous for my cat?").

**Production**: `green-fluffy.michnik.pro` *(not yet configured)* · **Staging**: `stage-green-fluffy.michnik.pro` *(not yet configured)*

## Documentation

- [User Stories / Use Cases](SPECIFICATION-USER-STORIES.md)
- [Implementation Plan](IMPLEMENTATION-PLAN.md)
- Phase design documents: [docs/](docs/)

## Sister Project

Authentication (email, Google, Telegram), user management, timezone handling, and the deployment infrastructure are reused from [myfinpro](https://github.com/Aleksei-Michnik/myfinpro), which shares the same VDS and architectural conventions.

## Tech Stack

pnpm + Turborepo monorepo · NestJS API · Next.js web · TypeScript · Prisma + MySQL · next-intl (en, he, ru, uk) · Docker Compose + shared Nginx (blue-green deploys) · GitHub Actions CI/CD.

## Security

This is a **public repository**. No API keys, secrets, passwords, or tokens are ever committed — all secrets live in GitHub Actions secrets and server-side environment variables. See the security sections of the [implementation plan](IMPLEMENTATION-PLAN.md).
