# ───── Base Stage ─────
# Node 26 (Current line) + pnpm pinned to the repo's packageManager version.
# Node 26 no longer bundles corepack, so pnpm is installed via npm.
FROM node:26-alpine AS base
RUN npm install -g pnpm@11.9.0
WORKDIR /app

# ───── Dependencies Stage ─────
FROM base AS dependencies
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/eslint-config/package.json ./packages/eslint-config/
RUN pnpm install --frozen-lockfile

# ───── Development Stage ─────
FROM dependencies AS development
COPY . .
# Build the shared package and generate the Prisma client into the image so
# the dev server boots without any host-side build step. These land in
# node_modules / packages/shared/dist, preserved by the compose volumes.
RUN rm -f /app/packages/shared/tsconfig.tsbuildinfo && \
    pnpm --filter @green-fluffy/shared run build && \
    pnpm --filter @green-fluffy/api exec prisma generate
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["pnpm", "run", "start:dev"]

# ───── Build Stage ─────
FROM dependencies AS build
COPY . .
# Build shared package, generate Prisma client, then build the API.
# Clear stale incremental build info first (incremental builds skip emit otherwise).
RUN rm -f /app/packages/shared/tsconfig.tsbuildinfo \
      /app/apps/api/tsconfig.build.tsbuildinfo \
      /app/apps/api/tsconfig.tsbuildinfo && \
    pnpm --filter @green-fluffy/shared run build && \
    pnpm --filter @green-fluffy/api exec prisma generate && \
    pnpm --filter @green-fluffy/api run build

# ───── Production Stage ─────
FROM base AS production
LABEL org.opencontainers.image.source="https://github.com/Aleksei-Michnik/green-fluffy"
LABEL org.opencontainers.image.description="Green and Fluffy API Server"
LABEL org.opencontainers.image.licenses="UNLICENSED"
# Install wget for Docker health checks (BusyBox wget lacks --no-verbose/--tries flags)
RUN apk add --no-cache wget
WORKDIR /app
# Copy everything needed from the build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/prisma.config.ts ./apps/api/prisma.config.ts
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/main.js"]
