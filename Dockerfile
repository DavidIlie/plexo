ARG NODE_VERSION=24

# syntax=docker/dockerfile:1.6
FROM node:${NODE_VERSION}-alpine AS deps
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apk add --no-cache libc6-compat
WORKDIR /home/node/app
COPY pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm fetch

FROM node:${NODE_VERSION}-alpine AS builder
RUN apk add --no-cache git libc6-compat
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /home/node/app
ENV PNPM_STORE_PATH=/pnpm/store

# Install deps using cached pnpm store first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/pnpm/store,id=pnpm-store \
    corepack enable && pnpm install --frozen-lockfile --prefer-offline --ignore-scripts

# Copy the rest of the sources after installing deps to maximize cache hits
COPY . .

# Now run install again to execute lifecycle scripts
RUN --mount=type=cache,target=/pnpm/store,id=pnpm-store \
    pnpm install --frozen-lockfile --prefer-offline

# Persist Next.js compiler cache between CI builds using BuildKit cache mounts
RUN --mount=type=cache,target=/home/node/app/.next/cache,id=next-cache \
    NEXT_PUBLIC_VERSION="$(git rev-parse --short=12 HEAD 2>/dev/null || printf dev)" \
    SKIP_ENV_VALIDATION=true \
    pnpm build

FROM node:${NODE_VERSION}-alpine AS runner

WORKDIR /home/node/app

ENV NODE_ENV production

COPY --from=builder /home/node/app/next.config.ts ./
COPY --from=builder /home/node/app/public ./public
COPY --from=builder /home/node/app/package.json ./package.json

COPY --from=builder --chown=node:node /home/node/app/.next/standalone ./
COPY --from=builder --chown=node:node /home/node/app/.next/static ./.next/static

# The cache handler is loaded at runtime via require.resolve from next.config,
# so Next traces cache-handlers/*.mjs and the `redis` client into .next/standalone
# automatically. This explicit copy is a safety net in case tracing changes;
# redis stays in the standalone node_modules. Toggle the backend with the
# CACHE_DRIVER / REDIS_URL runtime env vars — no rebuild required.
COPY --from=builder --chown=node:node /home/node/app/cache-handlers ./cache-handlers

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
