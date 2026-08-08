# syntax=docker/dockerfile:1.6
ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-alpine AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /home/node/app
ENV PNPM_STORE_PATH=/pnpm/store

# Install deps using cached pnpm store first for better layer caching.
# .pnpmfile.cjs must be present (typescript-eslint TS6 pin).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .pnpmfile.cjs ./
RUN --mount=type=cache,target=/pnpm/store,id=pnpm-store \
    pnpm install --frozen-lockfile --prefer-offline --ignore-scripts

# Copy the rest of the sources after installing deps to maximize cache hits
COPY . .

# Run lifecycle scripts (e.g. sharp) against the already-installed node_modules
RUN --mount=type=cache,target=/pnpm/store,id=pnpm-store \
    pnpm rebuild

# Version is injected by CI (git sha); falls back to "dev" for local builds.
ARG NEXT_PUBLIC_VERSION=dev

# Persist Next.js compiler cache between CI builds using BuildKit cache mounts
RUN --mount=type=cache,target=/home/node/app/.next/cache,id=next-cache \
    NEXT_PUBLIC_VERSION="$NEXT_PUBLIC_VERSION" \
    SKIP_ENV_VALIDATION=true \
    pnpm build

FROM node:${NODE_VERSION}-alpine AS runner

WORKDIR /home/node/app

ENV NODE_ENV=production

COPY --from=builder --chown=node:node /home/node/app/public ./public
COPY --from=builder --chown=node:node /home/node/app/.next/standalone ./
COPY --from=builder --chown=node:node /home/node/app/.next/static ./.next/static

# The cache handler is loaded at runtime via require.resolve from next.config,
# so Next traces cache-handlers/*.mjs and the `@redis/client` package into
# .next/standalone automatically. This explicit copy is a safety net in case
# tracing changes; @redis/client stays in the standalone node_modules. Toggle
# the backend with the CACHE_DRIVER / REDIS_URL runtime env vars — no rebuild
# required.
COPY --from=builder --chown=node:node /home/node/app/cache-handlers ./cache-handlers

EXPOSE 3000

ENV PORT=3000 HOSTNAME=0.0.0.0

USER node

# NOTE: APP_URL is REQUIRED at runtime (production env validation) —
# SKIP_ENV_VALIDATION above only bypasses it at build time.
# /icon.svg is an unauthenticated static asset served by next start — a 200
# proves the server process is up without touching Plex/Tautulli upstreams.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
    CMD wget -q --spider http://127.0.0.1:3000/icon.svg || exit 1

CMD ["node", "server.js"]
