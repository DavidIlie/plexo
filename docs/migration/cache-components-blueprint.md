# Plexo → Next.js 16.3 Cache Components — FINAL Implementation Blueprint

**Audience:** a single engineer executing top-to-bottom. Every numbered item is one commit. Honor repo rules: commit after every change, no `as any`, no inline `await import()` inside functions, branch `master`.

This is the authoritative, post-review version. All reviewer critiques that survived doc verification are folded in. See the **Adjudication** section at the end for what was accepted, what was rejected, and why — every claim is checked against the live Next docs (`use-cache`, `use-cache-remote`, `cacheHandlers`) v16.2.9, which are authoritative for the API shapes 16.3-canary.58 relies on (canary.58 only bumps bundled React + Turbopack fixes — no cache-API changes).

---

## CRITICAL CORRECTION vs the draft: build-green staging is impossible pre-flag

The single most important fix from review: **`use cache` and `use cache: remote` BOTH require `cacheComponents: true`.** The docs state it verbatim for each directive. Therefore the draft's premise — "Phase 3 adds `use cache` while the flag is off; commit 15 is the only risky flip; everything bisects to one commit" — is **false**. Any commit that adds a directive while the flag is off is a hard build error.

**Resolution:** flip `cacheComponents: true` BEFORE the first directive lands. The green-window narrative is rewritten:

- Commits 1–6 build green with the flag **off** (deps, env, inert handler files, config skeleton, tags module — none use a directive).
- Commit 7-pre lands RSC Suspense/header refactors (still flag off, backward-compatible).
- Commit 8 flips `cacheComponents: true` **with zero directives yet present** — this is the isolated risky flip; if it breaks, it breaks on dynamic-render issues (`headers()`/`searchParams`/`new Date()` outside Suspense), not on caching.
- Commits 9–13 add directives; each builds green because the flag is already on. Failures here bisect to a single directive-adding commit.

The flag flip and the RSC Suspense/header refactors are the genuine risk window. The Redis handler, tags, and directives are individually bisectable after the flip.

---

## Resolved decisions

- **Stay on `react@^19.2.3` / `react-dom@^19.2.3`.** Verified: `next@16.3.0-canary.58` peer is `^18.2.0 || ... || ^19.0.0` — satisfied. Next bundles its own RSC React; the app's public React is unchanged.
- **Imports are UNPREFIXED:** `import { cacheLife, cacheTag } from "next/cache"`, `import { revalidateTag, updateTag } from "next/cache"`. The `unstable_`-prefixed spelling was Next 15 experimental and is **gone** under Cache Components. (Reviewer B1 — accepted; doc-confirmed in both directive pages.)
- **`cacheHandlers.remote` only, env-gated at the CONFIG layer.** Docs: *"If you don't configure `cacheHandlers`, Next.js uses an in-memory LRU."* So the clean fallback is to simply **not register the handler** when `REDIS_URL` is unset. The handler module unconditionally exports the Redis handler; there is **no** `await import("next/dist/...default.js")` (that internal path is unstable + breaks standalone tracing + violates the spirit of the no-dynamic-import rule). (Reviewer M2 — accepted.)
- **`default` handler omitted** — plain `use cache` keeps Next's built-in in-memory LRU. Hot path stays in-process; only `use cache: remote` hits Redis.
- **`lastUpdatedAt` is stamped in the uncached resolver = "served-at", NOT "data-age".** `new Date()` is non-deterministic and forbidden inside any cache scope, so it cannot live in the cached fn. **Behavior change, called out explicitly** (see M4 below): after migration `lastUpdatedAt` updates on every request even on a cache hit. The freshness UI copy is adjusted to "Checked at" rather than implying data age. (Reviewer M4 — accepted as documented behavior change.)
- **Refresh route uses `revalidateTag(tag, profile)`** where profile is `'max'` (soft) or `{ expire: 0 }` (hard). `expireTag` does NOT exist. `{ expire: 0 }` is correct here because `/api/refresh` is an external-webhook-style Route Handler; never use `{ expire: 0 }` from a Server Action (use `updateTag` there). (Reviewer m3 — accepted.)
- **`partialPrefetching: true`; `appShells: true`.** `varyParams`/`cachedNavigations`/`optimisticRouting` are not standalone config keys — don't add.
- **Serializable-types rule RELAXED.** Docs: Dates, Maps, Sets, TypedArrays, ArrayBuffers are all supported as both arguments and return values. The real ban is **class instances, functions, Symbols, WeakMap/WeakSet, and `URL` instances**. The draft's blanket "no Date/Set/Map" was over-cautious and wrong. The only Date rule that holds: you may **pass/return** an existing Date, but you may not **create** `new Date()` inside a cache scope (non-deterministic). (Reviewer "got right" — accepted.)

---

## Cache-tag taxonomy

| Tag | Pattern | Attached by | Revalidated when |
|---|---|---|---|
| `plex` / `tautulli` / `analytics` / `recommend` / `tmdb` / `overseerr` / `geo` | roots | every cached fn in that domain | full refresh |
| `plex:sections` | global | `getLibrarySections` | sections change |
| `plex:section:{id}` | per-section | listings/genres/recentlyAdded for section | section rescanned |
| `plex:item:{rk}` | per-item | `getMetadata`, `getChildren` | one title changes |
| `plex:genres:{sectionId}` | per-section | `getGenres` | genres change |
| `plex:onDeck` / `plex:recentlyAdded` | global | `getOnDeck` / `getRecentlyAdded` | playback / new media |
| `tautulli:history` | global | `getHistoryPage` (fixed-window only) | new play |
| `tautulli:homeStats` / `…playsByDate` / `…ByDayOfWeek` / `…ByHourOfDay` / `…mostWatched` | global | respective fns | activity/analytics refresh |
| `tautulli:item:{rk}` / `tautulli:user:{id}` | per-item / per-user | item-history fn / user-scoped fns | that item/user changes |
| `geo:{ip}` | per-IP | `cachedGeo(ip)` | rarely |
| `analytics:{name}` | per-aggregation | each analytics wrapper | targeted recompute |
| `tmdb:search` / `recommend:libraryTitles` / `recommend:wishlist` | global | respective fns | refresh |

`ALL_ROOTS = ["plex","tautulli","analytics","recommend","tmdb","overseerr","geo"]`.

**Not tagged / not cached:** `getWatchlist` (catch-path returns `[]` — caching a transient empty array poisons the cache), cursor-driven history reads (see B3 below), and all mutations.

## cacheLife profiles

| Profile | Old tier | stale (client) | revalidate (server) | expire (TTL) |
|---|---|---|---|---|
| `library` | LIBRARY 1h | 300 | 3600 | 7200 |
| `metadata` | METADATA 30m | 300 | 1800 | 3600 |
| `analytics` | ANALYTICS 15m | 300 | 900 | 1800 |
| `activity` | ACTIVITY 5m | 300 | 300 | 600 |

All four profiles set `revalidate < expire` deliberately to get stale-while-revalidate: past `revalidate` the entry is stale-but-served and refreshed in background; only past `expire` is it dead. The Redis handler honors this (see B4/M1).

## Per-route prefetch table

All `'auto'` + global `partialPrefetching: true` + `appShells: true`. Navbar unchanged (all `<Link>` default `'auto'`; zero `prefetch={true}` to warn on).

| Route | prefetch | Reason |
|---|---|---|
| `/` | `'auto'` | mixed cached shell + live holes; App-Shell |
| `/movies` `/tv` `/music` | `'auto'` | cached listings stream on nav |
| `/music/[ratingKey]` | `'auto'` | param route; `'allow-runtime'` only if measured slow |
| `/activity` | `'auto'` | highly live; shell-only |
| `/analytics` | `'auto'` | searchParams-driven; never force-static |

---

# Commits

## Phase 1 — Upgrade & baseline (flag OFF, builds green)

**1. `chore(deps): upgrade to Next 16.3 canary + ESLint flat config`** — `package.json`: `next` → `16.3.0-canary.58` (exact pin, no caret); devDeps `eslint@^9.39.4` (pin major 9, not 10) + `eslint-config-next@16.3.0-canary.58`; `"lint"` → `"eslint ."`. `react`/`react-dom` stay `^19.2.3`; all third-party libs unchanged. Create `eslint.config.mjs` (flat config re-exporting `eslint-config-next/core-web-vitals` + `/typescript` + `globalIgnores`). Commands: `pnpm add next@16.3.0-canary.58; pnpm add -D eslint@^9.39.4 eslint-config-next@16.3.0-canary.58; pnpm install`. **Do NOT run the broad `@next/codemod upgrade`** — the codebase already uses async request APIs; it would rewrite hand-managed code. Targeted edits only.

**2. `chore: baseline typecheck/lint/build on canary`** — add `"typecheck": "tsc --noEmit"`. Gate: `pnpm typecheck && pnpm exec eslint . && pnpm build` with **cacheComponents OFF**. This isolates upgrade breakage from cache breakage — if this is red, the problem is the version bump, not caching.

## Phase 2 — Cache infra (inert, flag OFF, builds green)

**3. `feat(env): add optional REDIS_URL`** — `src/env.ts` server block: `REDIS_URL: z.string().url().optional()`.

**4. `feat(cache): add Redis remote cache handler (env-gated, inert)`** — `pnpm add redis` (node-redis v5). Create:
- `cache-handlers/redis-impl.mjs` — full handler (code below). Mirrors the doc's **distributed tag-coordination example verbatim** for the tag path: `updateTags` writes `plexo:tag:{t}` timestamps + adds to `plexo:revalidated-tags` set; `refreshTags` reads that set and syncs a local `Map`; `getExpiration` returns `Math.max(...timestamps, 0)`; `get` does **NOT** re-check tags (Next compares timestamps via `getExpiration`). `get` hard-misses only past `expire`; freshness/SWR is driven by `revalidate`+`getExpiration`. `set` uses Redis `EX` only when `expire` is finite and ≤ Redis max (`2^31 - 1`).
- `cache-handlers/remote-handler.mjs` — thin entry that **unconditionally** exports the Redis handler (no fallback import; env-gating is at config layer).
- `cache-handlers/remote-handler.d.ts` — ambient `RemoteCacheHandler` / `CacheEntry` types.

`.mjs` because handlers are `require.resolve`'d and loaded by Node outside Turbopack; raw `.ts` isn't Node-loadable under `bundler` resolution.

**5. `feat(config): register cacheLife profiles + env-gated remote cacheHandler`** — `next.config.ts`: add `cacheLife` (4 profiles), **conditionally** spread `cacheHandlers: { remote: require.resolve(...) }` only when `process.env.REDIS_URL` is set, `serverExternalPackages: [...,"redis"]`, `outputFileTracingIncludes` for `cache-handlers/**` + `node_modules/redis|@redis`. **NOT** `cacheComponents` yet. Two hazards to watch on this canary:
   - `require` in ESM `next.config.ts`: the official cacheHandlers doc example uses `require.resolve(...)` directly in `next.config.ts`, so Next shims `require` during config load. **Verify on build.** If it throws "require is not defined", swap to `new URL("./cache-handlers/remote-handler.mjs", import.meta.url).pathname`.
   - If the build errors that `cacheHandlers` requires `cacheComponents`, defer the `cacheHandlers` block to Commit 8 (where the flag flips).

**6. `feat(cache): cache-tag taxonomy module`** — create `src/lib/cache-tags.ts`: `CACHE_TAGS` const (roots, globals, builder fns `section`/`plexItem`/`genres`/`tautulliItem`/`user`/`geoIp`/`analytics`), `ALL_ROOTS`, `scope(name)`.

## Phase 3 — RSC dynamic-render prep (flag still OFF; all backward-compatible)

These must land **before** the flag flip so the flip fails only on real caching issues, not on un-Suspense'd dynamic reads.

**7-pre. `refactor(rsc): header-free caller + Suspense paths + footer year`** — *(this is the draft's old commit 14, moved earlier)*:
   1. `src/trpc/server.tsx`: add `createStaticContext` (no `headers()`) used by `caller` + `trpc` for RSC render; the HTTP route keeps its header-reading context. Both wrapped in React `cache()`.
   2. `src/components/footer.tsx`: move `new Date().getFullYear()` into a `'use client'` child (client-only Date read — no `suppressHydrationWarning` needed; the year is a stable client value). Path is `src/components/footer.tsx` (not `dashboard/`).
   3. `src/app/page.tsx`: wrap `<DashboardStats/>` in `<Suspense>` + grid skeleton fallback.
   4. `src/app/music/[ratingKey]/page.tsx`: drop server-side `notFound()` + `getMetadata` call from the page body; keep only `await params` + `generateMetadata`; wrap `<ArtistDetail/>` in `<Suspense>` (it does its own fetch/notFound).
   5. `src/app/analytics/page.tsx`: move `searchParams` parse + the 3 period-keyed prefetches into a Suspense'd server child. `new Date()` calls in `src/app/analytics/search-params.ts` stay where they are — they run in the resolver/router layer and only a derived **number** (`days`) crosses any cache boundary, never a Date object or a cache scope.
   6. `src/app/api/trpc/[trpc]/route.ts`: remove `fetchCache` export (route handlers are dynamic by default under cacheComponents).

All of the above are no-ops with the flag off and remain correct with it on.

## Phase 4 — Flip the flag (THE risk window)

**8. `feat(config): enable cacheComponents + partialPrefetching + appShells`** — add `cacheComponents: true`, `partialPrefetching: true`, `experimental.appShells: true` (+ the deferred `cacheHandlers` block if it was punted from Commit 5). **No directives exist yet**, so failures isolate to dynamic-render. Run `NEXT_PRIVATE_DEBUG_CACHE=1 pnpm build`. Triage map:
   - *"used `headers()`/`searchParams` ... without Suspense"* → a missed wrap from commit 7-pre.
   - *`new Date()` in static shell* → the footer/analytics Date didn't move.
   - *50s "Filling a cache during prerender timed out"* → would only appear after Phase 5 directives; should be clean here.

## Phase 5 — Data layer directives (flag ON, each commit builds green)

Standing import (verified unprefixed): `import { cacheLife, cacheTag } from "next/cache"`.

**9. `refactor(plex): use cache: remote on lib/plex.ts fetchers`** — add `"use cache: remote"` + `cacheLife(profile)` + `cacheTag(...)` to the **read** fetchers. Profiles: `getLibrarySections`/`getGenres`/`getSectionTotalSize`/`getSectionItems`/`getAlbumCount`/`getTrackCount` → `library`; `getMovies`/`getShows`/`getArtists`/`getMetadata`/`getChildren` → `metadata`; `getOnDeck`/`getRecentlyAdded` → `activity`. `plexFetch` stays uncached. **`getWatchlist` stays UNcached** — its catch path returns `[]`, and caching a transient empty array under any TTL poisons the cache (B3). The unbounded `while(true)` aggregate loopers (`getSectionTotalSize`/`getSectionItems`) ARE cacheable as wholes (they return finite serializable arrays/numbers); only the leaf `plexFetch` they call is uncached. No `URL` crosses any boundary (the `URL` is built and consumed inside `plexFetch`).

**10. `refactor(tautulli): use cache: remote on lib/tautulli.ts read fetchers`** — `getHomeStats` → `activity`; `getLibraryMediaInfo` → `library`; `getPlaysByDate`/`getPlaysByDayOfWeek`/`getPlaysByHourOfDay`/`getMostWatched` → `analytics`; `getGeoipLookup` → `library`. Add `CACHE_TAGS.user(env.TAUTULLI_USER_ID)` when set (closure-captured deploy-time constant → fine; just never let an env boolean change the return *shape* inside a cache scope). **History caching split (B3):**
   - Add a new `getHistoryPage()` carrying `"use cache: remote"` + `activity` + `tautulli:history` for the **fixed-window analytics pull only** (e.g. `length=5000, start=0`). The analytics router calls this.
   - Leave the **cursor-driven `getHistory(length, start, mediaType)`** UNcached for the browse path — runtime cursor values would make every page a distinct key, ballooning Redis to near-zero utilization (doc: *"cache keys with mostly unique values → cache utilization near-zero"*). If a cached browse is later desired, fetch a fixed window via `getHistoryPage` and slice/paginate in memory (the doc's "filter in memory" pattern).

**11. `refactor(tmdb,overseerr): use cache: remote on read fetchers`** — `searchMedia`/`getMediaDetail`/`getWishlist` (the TMDB/Overseerr wishlist read, NOT the Plex `getWatchlist`) only; never `createRequest` or any mutation.

**12. `refactor(server): cached aggregation wrappers in src/server/cache/`** — create `analytics.ts` / `recommend.ts` / `geo.ts`. Named async fns each opening with `"use cache: remote"` + `cacheLife` + `cacheTag`, containing the exact closure bodies (`cachedGeo(ip)`, `computeLibraryTitles`, `computeDashboardStats`, etc.). Rules:
   - Return plain serializable data. **Date/Set/Map are allowed** to cross the boundary (doc-confirmed); the bans are class instances, functions, Symbols, WeakMap/Set, and `URL`.
   - Do **not** call `new Date()` / `Math.random()` / read `headers()` inside these (non-deterministic / forbidden).
   - Env-guard branches that change return shape stay OUT (in the resolver); env constants used only as cache-key inputs are fine.

**13. `refactor(routers): call cached wrappers, retire getCachedOrFetch`** — all 4 routers + `og/route.tsx`: replace `getCachedOrFetch(...)` with direct cached calls. Resolvers stamp `{ data, lastUpdatedAt: new Date().toISOString() }` (served-at — see M4 behavior note). Keep dynamic (uncached, in resolver): cursor math, `inLibrary` merge, env guards, per-IP geo loop, all mutations (`submit`/`resetRateLimit`/`testNotification` reading `x-forwarded-for`).

## Phase 6 — Tag-based refresh, then delete old cache

**14. `feat(api): tag-based revalidation in /api/refresh`** — `src/app/api/refresh/route.ts`:
   - POST: auth, then `revalidateTag(tag, profile)` where `profile = req.nextUrl.searchParams.get("hard") ? { expire: 0 } : 'max'`; tags = `?scope=X` → `[CACHE_TAGS.scope(X)]` else `ALL_ROOTS` (loop). `{ expire: 0 }` is correct for this webhook-style route handler.
   - GET: drop `getCacheStats()` (the Map is gone; there is no public introspection API for the remote handler — confirmed). Return `{ handler: process.env.REDIS_URL ? "redis" : "default", tags: ALL_ROOTS, rateLimits: getRateLimitStats() }`.
   - **Keep `export const dynamic = "force-dynamic"`** — a route handler calling `revalidateTag` must run dynamically; it's redundant-but-safe under cacheComponents and avoids any static-inference surprise (m4).
   - Update `src/components/refresh-dialog.tsx`: new `CacheStats` interface (drop `entries`, add `handler`), remove `tierFromKey` and any `entries`-rendering (verify no dead references remain), swap `window.location.reload()` → `router.refresh()` + `queryClient.invalidateQueries()` (preserves chart fade per memory — never a full reload).

**15. `refactor(cache): delete src/lib/cache.ts`** — **must follow Commit 14** (the refresh route imported `invalidateAll`/`getCacheStats` from it). After 14, `grep -rn 'lib/cache"' src/` must be empty. Then delete the file.

## Phase 7 — Prefetch & client tuning

**16. `feat(prefetch): per-route prefetch + lower client staleTime`** — optional `export const prefetch` per the route table; `src/trpc/query-client.ts` `staleTime` → `60_000`; keep `gcTime` + `shouldDehydrateQuery` including `"pending"` status (required for hydration without a blank flash — preserves chart-persistence memory).

## Phase 8 — Docker

**17. `build(docker): trace cache-handlers + redis into standalone`** — Dockerfile runner stage: `COPY --from=builder /home/node/app/cache-handlers ./cache-handlers`. Post-build verify `.next/standalone/cache-handlers` exists, and (only when building with `REDIS_URL`) `.next/standalone/node_modules/redis`. Because the handler no longer dynamically imports a Next internal, there is no hidden default-handler tracing hole.

## Phase 9 — Verification

**18. `docs: cache-components migration notes`** — commit this blueprint.

**Final verification matrix:**
- `pnpm typecheck` clean; `pnpm exec eslint .` clean.
- `NEXT_PRIVATE_DEBUG_CACHE=1 pnpm build` with `REDIS_URL` **unset** → no 50s hang, no serialize errors; `GET /api/refresh` → `{ handler: "default" }`.
- `pnpm start` smoke all routes: shells render instantly, dynamic holes stream in, charts **fade** (not blank) on refetch.
- `POST /api/refresh` (plain, `?scope=plex`, `?hard=1`) → corresponding data recomputes.
- Redis branch: `REDIS_URL=redis://... pnpm build && pnpm start` → verify keys `plexo:cache:*`, `plexo:tag:*`, `plexo:revalidated-tags`; `GET /api/refresh` → `{ handler: "redis" }`; multi-instance tag invalidation reflected after `refreshTags` runs.
- Docker build both with and without `REDIS_URL`; confirm standalone contents.

---

## Final `next.config.ts`

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   output: "standalone",
   cacheComponents: true,
   partialPrefetching: true,
   compiler: {
      removeConsole:
         process.env.NODE_ENV === "production"
            ? { exclude: ["error", "warn"] }
            : false,
   },
   cacheLife: {
      library:   { stale: 300, revalidate: 3600, expire: 7200 },
      metadata:  { stale: 300, revalidate: 1800, expire: 3600 },
      analytics: { stale: 300, revalidate: 900,  expire: 1800 },
      activity:  { stale: 300, revalidate: 300,  expire: 600 },
   },
   // Env-gated at the CONFIG layer: when REDIS_URL is unset we register NO
   // remote handler, and Next falls back to its built-in in-memory LRU for
   // `use cache: remote`. This is the clean fallback per the cacheHandlers
   // docs — no fragile import of Next internals inside the handler module.
   ...(process.env.REDIS_URL
      ? {
           cacheHandlers: {
              // require.resolve is shimmed by Next during config load; if this
              // canary throws "require is not defined", swap to:
              // new URL("./cache-handlers/remote-handler.mjs", import.meta.url).pathname
              remote: require.resolve("./cache-handlers/remote-handler.mjs"),
           },
        }
      : {}),
   experimental: {
      optimizePackageImports: ["lucide-react", "date-fns", "recharts"],
      appShells: true,
   },
   images: {
      formats: ["image/avif", "image/webp"],
      remotePatterns: [
         { protocol: "https", hostname: "plex.davidhome.ro" },
         { protocol: "https", hostname: "image.tmdb.org" },
      ],
   },
   serverExternalPackages: ["@takumi-rs/image-response", "redis"],
   outputFileTracingIncludes: {
      "/**": [
         "./cache-handlers/**/*.mjs",
         "./node_modules/redis/**/*",
         "./node_modules/@redis/**/*",
      ],
   },
};

export default nextConfig;
```

---

## Full Redis handler — `cache-handlers/redis-impl.mjs`

Faithful to the doc's **distributed tag-coordination example**: `updateTags` writes per-tag timestamps + a `revalidated-tags` set; `refreshTags` syncs the local `Map`; `getExpiration` returns `Math.max(...timestamps, 0)`; `get` does NOT re-check tags (Next does the comparison via `getExpiration`). Hard-miss in `get` is gated on `expire`, not `revalidate`, so stale-but-serveable entries are returned and Next revalidates them in the background (SWR). `set` uses Redis `EX` only for finite, in-range `expire`.

```js
// @ts-check
import { createClient } from "redis";

/** @typedef {import("redis").RedisClientType} RedisClientType */
/** @typedef {import("./remote-handler.js").CacheEntry} CacheEntry */

const KEY = (/** @type {string} */ k) => `plexo:cache:${k}`;
const TAG = (/** @type {string} */ t) => `plexo:tag:${t}`;
const REVALIDATED_SET = "plexo:revalidated-tags";

// Redis EX accepts a 32-bit signed seconds value; anything larger (or the
// `use cache` "never expires" sentinel) must be stored without a TTL.
const REDIS_MAX_TTL_SECONDS = 2 ** 31 - 1;

/** @param {string} url */
export function createRedisRemoteHandler(url) {
   /** @type {RedisClientType} */
   const client = createClient({ url });
   client.on("error", (e) => console.error("[remote-cache] redis error:", e));
   // Connect lazily; every method awaits `ready` so a slow connect never
   // throws synchronously into a render.
   const ready = client
      .connect()
      .catch((e) => console.error("[remote-cache] connect failed:", e));

   // Local mirror of tag -> last-revalidated timestamp (ms), synced from Redis
   // in refreshTags(). Mirrors the doc's distributed example exactly.
   /** @type {Map<string, number>} */
   const localTags = new Map();

   /** @param {ReadableStream<Uint8Array>} stream */
   async function streamToBase64(stream) {
      /** @type {Uint8Array[]} */
      const chunks = [];
      const reader = stream.getReader();
      try {
         for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) chunks.push(value);
         }
      } finally {
         reader.releaseLock();
      }
      return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("base64");
   }

   /** @param {string} b64 */
   function base64ToStream(b64) {
      const buf = Buffer.from(b64, "base64");
      return new ReadableStream({
         start(c) {
            c.enqueue(new Uint8Array(buf));
            c.close();
         },
      });
   }

   return {
      /**
       * @param {string} cacheKey
       * @param {string[]} _softTags soft tags handled via getExpiration
       */
      async get(cacheKey, _softTags) {
         try {
            await ready;
            const raw = await client.get(KEY(cacheKey));
            if (!raw) return undefined;
            const e = JSON.parse(raw);
            // Hard-miss only past `expire` (dead). Entries past `revalidate`
            // are STALE-BUT-SERVEABLE: we return them so Next serves stale and
            // triggers a background revalidate (stale-while-revalidate). This
            // preserves the "never a blank skeleton on refetch" rule.
            if (Date.now() > e.timestamp + e.expire * 1000) return undefined;
            // Tag freshness is NOT checked here — Next compares the entry's
            // timestamp against getExpiration(tags). (Matches the distributed
            // example; avoids the draft's inconsistent hybrid.)
            return {
               value: base64ToStream(e.value),
               tags: e.tags,
               stale: e.stale,
               timestamp: e.timestamp,
               expire: e.expire,
               revalidate: e.revalidate,
            };
         } catch (err) {
            // Next does NOT wrap get() in try/catch — an unhandled throw becomes
            // a render error. Swallow and signal a clean miss.
            console.error("[remote-cache] get error:", err);
            return undefined;
         }
      },

      /**
       * @param {string} cacheKey
       * @param {Promise<CacheEntry>} pendingEntry
       */
      async set(cacheKey, pendingEntry) {
         try {
            await ready;
            const entry = await pendingEntry; // may still be generating
            const value = await streamToBase64(entry.value);
            const payload = JSON.stringify({
               value,
               tags: entry.tags,
               stale: entry.stale,
               timestamp: entry.timestamp,
               expire: entry.expire,
               revalidate: entry.revalidate,
            });
            // Only set a Redis TTL for a finite, in-range `expire`. The
            // `use cache` default profile is "never expires by time", which
            // arrives as a huge/Infinite value — store it with no EX.
            const ttl = Math.ceil(entry.expire);
            if (Number.isFinite(ttl) && ttl > 0 && ttl <= REDIS_MAX_TTL_SECONDS) {
               await client.set(KEY(cacheKey), payload, { EX: ttl });
            } else {
               await client.set(KEY(cacheKey), payload);
            }
         } catch (err) {
            // set() runs after the response is already flowing; a failure just
            // means the next request re-renders. Best-effort.
            console.error("[remote-cache] set error (best-effort):", err);
         }
      },

      // Called before each request; pull recent invalidations into localTags.
      async refreshTags() {
         try {
            await ready;
            const tags = await client.sMembers(REVALIDATED_SET);
            if (!tags.length) return;
            const vals = await client.mGet(tags.map(TAG));
            tags.forEach((t, i) => {
               if (vals[i] != null) localTags.set(t, Number(vals[i]));
            });
         } catch (err) {
            console.error("[remote-cache] refreshTags error:", err);
         }
      },

      /** @param {string[]} tags */
      async getExpiration(tags) {
         // Doc-exact: most recent revalidation across the tags, else 0.
         const timestamps = tags.map((t) => localTags.get(t) ?? 0);
         return Math.max(...timestamps, 0);
      },

      /**
       * @param {string[]} tags
       * @param {{ expire?: number } | undefined} durations
       */
      async updateTags(tags, durations) {
         try {
            await ready;
            const now = Date.now();
            const m = client.multi();
            for (const t of tags) {
               m.set(
                  TAG(t),
                  String(now),
                  durations?.expire ? { EX: durations.expire } : {},
               );
               m.sAdd(REVALIDATED_SET, t);
               localTags.set(t, now);
            }
            await m.exec();
         } catch (err) {
            console.error("[remote-cache] updateTags error:", err);
         }
      },
   };
}
```

`cache-handlers/remote-handler.mjs` — unconditional export; env-gating lives in `next.config.ts`:

```js
// @ts-check
import { createRedisRemoteHandler } from "./redis-impl.mjs";

// This module is only `require.resolve`'d by next.config.ts when REDIS_URL is
// set, so the URL is guaranteed present here. No fallback import of Next
// internals — when REDIS_URL is unset the config never references this file and
// Next uses its built-in in-memory LRU for `use cache: remote`.
const handler = createRedisRemoteHandler(
   /** @type {string} */ (process.env.REDIS_URL),
);

export default handler;
```

`cache-handlers/remote-handler.d.ts`:

```ts
export interface CacheEntry {
   value: ReadableStream<Uint8Array>;
   tags: string[];
   stale: number;
   timestamp: number;
   expire: number;
   revalidate: number;
}

export interface RemoteCacheHandler {
   get(cacheKey: string, softTags: string[]): Promise<CacheEntry | undefined>;
   set(cacheKey: string, pendingEntry: Promise<CacheEntry>): Promise<void>;
   refreshTags(): Promise<void>;
   getExpiration(tags: string[]): Promise<number>;
   updateTags(tags: string[], durations?: { expire?: number }): Promise<void>;
}

declare const handler: RemoteCacheHandler;
export default handler;
```

---

## Reviewer adjudication

**Accepted (folded in):**

- **B1** — Imports are unprefixed `cacheLife`/`cacheTag`/`revalidateTag`/`updateTag`. Doc-confirmed in both directive pages. The draft's `unstable_` import would not compile.
- **B2** — `use cache` AND `use cache: remote` require `cacheComponents: true`. Doc-confirmed verbatim. The whole "green Phase 3 / single flip at 15" staging was wrong; re-sequenced so the flag flips (Commit 8) before any directive, with RSC Suspense prep moved ahead of it (Commit 7-pre).
- **B3** — `getWatchlist` excluded from caching (catch-path `[]` poisons cache); history split into a cached fixed-window `getHistoryPage` (analytics) vs an uncached cursor-driven `getHistory` (browse). Codebase-confirmed shapes.
- **B4** — `set` TTL gated on `Number.isFinite` + Redis 32-bit max, not a hand-picked hex sentinel. `get` hard-miss moved to `expire` (preserves SWR), revalidation driven by `revalidate` + `getExpiration`.
- **M1** — Dropped the inconsistent hybrid. `getExpiration` returns `Math.max(...timestamps, 0)`; `get` no longer re-checks tags. Mirrors the doc's distributed example exactly → correct multi-instance coordination.
- **M2** — Env-gate moved to the config layer; handler exports Redis unconditionally; removed the fragile `await import("next/dist/...default.js")`. Doc-confirmed ("no cacheHandlers config → built-in LRU"). Also fixes the standalone-tracing hole for the no-Redis path.
- **M3** — `require.resolve` in ESM `next.config.ts` flagged as a build-time landmine with the `import.meta.url` fallback documented inline. (Docs themselves use `require.resolve`, so it stays as the default.)
- **M4** — `lastUpdatedAt` served-at vs data-age called out explicitly as a behavior change; UI copy adjusted to "Checked at".
- **m3** — `{ expire: 0 }` is correct for the webhook-style refresh route; `updateTag` reserved for Server Actions. Noted.
- **m4** — `export const dynamic = "force-dynamic"` kept on the refresh route; `fetchCache` removed from the tRPC route handler.
- **Type rule relaxed** — Date/Set/Map/TypedArray/ArrayBuffer are serializable across cache boundaries (doc-confirmed). Bans narrowed to class instances, functions, Symbols, WeakMap/Set, URL. The only Date rule retained: no `new Date()` *creation* inside a cache scope.
- **Footer path** — confirmed `src/components/footer.tsx`.

**Rejected (with reason):**

- **B4's framing that checking `revalidate` in `get()` is a flat bug** — Overstated. The official **basic** Redis handler example in the cacheHandlers doc returns `undefined` when `now > timestamp + revalidate*1000`. So the draft's original `get` matched a documented example; it was not "provably wrong." The reviewer's *improvement* (gate hard-miss on `expire` for true SWR) is genuinely better and is adopted — but credited as an enhancement, not a correctness fix to a doc-compliant baseline.
- **M5's hydration-mismatch worry** — The reviewer retracts it themselves ("this one is OK"). A `'use client'` child reading `new Date().getFullYear()` renders the year on the client only; no `suppressHydrationWarning` is required because the server never renders a competing value. Kept the draft's approach unchanged.
- **Implication that the `default` handler should also be wired to Redis** — Not raised this round, but reaffirmed rejected: plain `use cache` stays in-process (in-memory LRU); only `use cache: remote` hits Redis. The official 3-step tag coordination is built for the remote slot.

**Verified-correct from the draft (unchanged):**

- `react@^19.2.3` stays — `next@16.3.0-canary.58` peer `^19.0.0` satisfied (verified via `npm view`).
- `expireTag` does not exist; use `revalidateTag(tag, profile)`.
- `URL` is unserializable across a cache boundary; `plexFetch`/`tautulliFetch` build and consume `URL` internally — none crosses a boundary.
- `.mjs` handler files (resolved outside Turbopack, Node-loaded).
- Not running the broad `@next/codemod upgrade`.
- `partialPrefetching: true` global; `appShells: true`; no `varyParams` key.

## Risk register

1. **Two-stage risk window, not one.** Commit 8 (flag flip, no directives) catches dynamic-render issues; Commits 9–13 (directives) catch caching issues. Each directive commit bisects independently because the flag is already on.
2. **`require` in ESM `next.config.ts`** — verify on canary.58; `import.meta.url` fallback documented inline (Commit 5).
3. **`cacheHandlers` may demand `cacheComponents`** in some canaries — if Commit 5 errors, defer the `cacheHandlers` block to Commit 8.
4. **Commit 15 (delete cache.ts) MUST follow Commit 14** — refresh route imports from it. Run 14 → 15.
5. **`new Date()` forbidden in any cache scope** — lives only in resolvers (`lastUpdatedAt`), `analytics/search-params.ts` (router layer, only a number crosses), and client code.
6. **Unserializable across boundary = class instances / functions / Symbols / WeakMap·Set / URL.** Date/Map/Set are fine. Clean in libs.
7. **Chart-persistence memory** — Suspense around server shells only; client charts stay `useQuery`; refresh uses `router.refresh()` + `invalidateQueries()`, never a full reload; `shouldDehydrateQuery` keeps `"pending"`.
8. **`lastUpdatedAt` is now served-at**, not data-age — intentional, UI copy updated.
9. **Standalone tracing** — `serverExternalPackages:["redis"]` + `outputFileTracingIncludes` + Dockerfile `COPY cache-handlers`; verify all three in `.next/standalone`. No hidden default-handler import to trace anymore.
10. **Don't run the broad codemod** — codebase already async.
