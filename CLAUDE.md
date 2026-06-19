# Plexo

Personal Plex media dashboard built with Next.js 16.3 (canary, Cache Components).

## Rules

- **Commit after every change** — each feature, fix, or refactor gets its own commit immediately.
- **No `as any`** — use proper types, generics, or type narrowing.
- **No inline imports** — all imports must be top-level, never `await import()` inside functions.
- **Branch**: `master` (not main).

## Tech Stack

- **Next.js 16.3 canary** with App Router, standalone output, **Cache Components** (`cacheComponents: true` — PPR, `use cache`, App Shell prefetching)
- **React 19**, **TypeScript 5.7+** (strict)
- **ESLint flat config** (`eslint.config.mjs`; `next lint` removed in 16 — use `pnpm lint` = `eslint .`)
- **Tailwind CSS v4** with `@tailwindcss/postcss`, dark-first amber theme (OKLCH)
- **shadcn/ui** — components in `src/components/ui/`, config in `components.json`
- **tRPC 11** — routers in `src/server/api/routers/`, client wiring in `src/trpc/`
- **TanStack Query 5** — `staleTime: 60s` (server cache is authoritative), `refetchInterval: 30min`
- **Recharts 3** — chart colors use CSS vars `--chart-1` through `--chart-5`
- **lucide-react** for icons
- **date-fns 4** for date formatting
- **Zod 3** for validation (not v4)
- **pnpm** package manager

## Project Layout

```
src/
├── app/              # Next.js pages and API routes
├── server/api/       # tRPC context, root router, routers (plex, tautulli, analytics)
├── trpc/             # Client wiring (react.tsx, server.tsx, query-client.ts)
├── lib/              # Utilities (plex.ts, tautulli.ts, cache-tags.ts, utils.ts)
├── server/cache/     # Shared 'use cache: remote' aggregation fns (stats.ts)
├── types/            # Plex and Tautulli response types
├── hooks/            # React hooks (use-debounce)
└── components/       # UI components (ui/, dashboard/, media/, analytics/)
cache-handlers/       # Redis + in-memory CacheHandler impls (.mjs, runtime-loaded)
```

## Key Patterns

- **Path alias**: `~/` maps to `./src/`
- **Env validation**: `src/env.ts` using `@t3-oss/env-nextjs` — vars: `PLEX_URL`, `PLEX_TOKEN`, `TAUTULLI_URL`, `TAUTULLI_API_KEY`, optional `TAUTULLI_USER_ID`; cache toggle `CACHE_DRIVER` (`memory`|`redis`, default `memory`) + optional `REDIS_URL`
- **User scoping**: `PLEX_TOKEN` determines which user's watch data (the token owner). `TAUTULLI_USER_ID` optionally filters Tautulli stats to one user (injected into every tautulliFetch call).
- **Server cache**: `'use cache: remote'` on the lib fetchers (`src/lib/{plex,tautulli}.ts`) and aggregation wrappers (`src/server/cache/`, router cached fns). Durations via `cacheLife` profiles in `next.config.ts`: `library` (1h), `metadata` (30m), `analytics` (15m), `activity` (5m). Tags in `src/lib/cache-tags.ts` (domain roots + scoped builders).
- **Cache backend**: chosen at **runtime** in `cache-handlers/remote-handler.mjs` — Redis (`CACHE_DRIVER=redis` + `REDIS_URL`) or in-memory fallback. Always registered in `next.config` (`cacheHandlers.remote`) so `redis` is traced into standalone and the backend flips via env with no rebuild (config is frozen at build in standalone).
- **Invalidation**: `POST /api/refresh` → `revalidateTag` per domain root (or `?scope=<root>`; `?hard=1` for immediate expiry). `GET` reports the active handler + roots + rate limits.
- **Image proxy**: `/api/plex-image?path=...&w=300&h=450` — streams from Plex with token server-side
- **tRPC procedures** all return `{ data: T; lastUpdatedAt: string }`. `lastUpdatedAt` is **served-at** (stamped in the resolver with `new Date()`, never inside a cache scope) — not data age.
- **RSC rendering (Cache Components)**: pages are static **App Shells**; runtime/dynamic data lives in `<Suspense>` (use a `connection()` child for prefetch-based sections) so it streams in. The RSC `caller`/`trpc` context is header-free; `generateMetadata` calls cached fns directly. Forbidden: `export const dynamic`/`runtime`/`fetchCache` (incompatible with `cacheComponents`), and `new Date()`/`Math.random()` in any prerender path or cache scope (`new Date(<ts>)` with an arg is fine).
- **Migration notes**: `docs/migration/cache-components-blueprint.md`

## Common Recharts Patterns

```tsx
// Bar chart
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
    <XAxis dataKey="name" stroke="var(--muted-foreground)" />
    <YAxis stroke="var(--muted-foreground)" />
    <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--foreground)" }} />
    <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>

// Pie chart (use PieLabelRenderProps for label typing)
<Pie data={data} dataKey="value" nameKey="name" label={({ name, percent }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}>
  {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
</Pie>

// Area chart
<Area type="monotone" dataKey="name" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.15} strokeWidth={2} />
```

## Tautulli API

All calls go through `src/lib/tautulli.ts` → `GET /api/v2?apikey=...&cmd=...`

- `get_history` → `TautulliHistoryData` (has `.data` array of items, `.total_duration`)
- `get_home_stats` → `TautulliHomeStatItem[]`
- `get_plays_by_date` → `{ categories: string[], series: { name, data[] }[] }`
- `get_plays_by_dayofweek` → same shape
- `get_plays_by_hourofday` → same shape

## Plex API

All calls go through `src/lib/plex.ts` → Plex server with `X-Plex-Token` header.

- Library sections: `GET /library/sections` → `Directory[]`
- Movies: `GET /library/sections/{id}/all?type=1` → `Metadata[]` (viewCount for watched)
- Shows: `GET /library/sections/{id}/all?type=2` → `Metadata[]` (viewedLeafCount/leafCount for progress)
- On deck: `GET /library/onDeck` → `Metadata[]`
- Genres: `GET /library/sections/{id}/genre` → `Directory[]`

## Docker & CI

- Multi-stage Dockerfile: deps → builder (SKIP_ENV_VALIDATION) → runner (Node 24 Alpine, port 3000)
- GitHub Actions: push to `master` → build and push to `ghcr.io/davidilie/plexo`
- Tag format: `{branch}-{sha8}-{timestamp}`
