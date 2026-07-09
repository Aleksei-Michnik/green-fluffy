# ───── Base Stage ─────
# Node 26 (Current line) + pnpm pinned to the repo's packageManager version.
FROM node:26-alpine AS base
RUN npm install -g pnpm@11.9.0
WORKDIR /app

# ───── Dependencies Stage ─────
FROM base AS dependencies
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/eslint-config/package.json ./packages/eslint-config/
RUN pnpm install --frozen-lockfile

# ───── Development Stage ─────
FROM dependencies AS development
COPY . .
# Build the shared package into the image so `next dev` can resolve
# @green-fluffy/shared without a host-side build step.
RUN rm -f /app/packages/shared/tsconfig.tsbuildinfo && \
    pnpm --filter @green-fluffy/shared run build
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "run", "dev"]

# ───── Build Stage ─────
FROM dependencies AS build
COPY . .
# Remove stale tsbuildinfo (incremental builds skip emit if present without dist)
RUN rm -f /app/packages/shared/tsconfig.tsbuildinfo && \
    pnpm --filter @green-fluffy/shared run build && \
    pnpm --filter @green-fluffy/web run build

# ───── Production Stage ─────
FROM node:26-alpine AS production
LABEL org.opencontainers.image.source="https://github.com/Aleksei-Michnik/green-fluffy"
LABEL org.opencontainers.image.description="Green and Fluffy Web Application"
LABEL org.opencontainers.image.licenses="UNLICENSED"
# Install wget for Docker health checks (BusyBox wget lacks --no-verbose/--tries flags)
RUN apk add --no-cache wget
RUN npm install -g pnpm@11.9.0
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/tsconfig/package.json ./packages/tsconfig/
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "run", "start"]
