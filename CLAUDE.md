# Plexo

Personal Plex media dashboard built with Next.js 16.

## Rules

- **Commit after every change** — each feature, fix, or refactor gets its own commit immediately.
- **No `as any`** — use proper types, generics, or type narrowing.
- **Branch**: `master` (not main).

## Tech Stack

- **Next.js 16** with App Router, standalone output
- **React 19**, **TypeScript 5.7+** (strict)
- **Tailwind CSS v4** with `@tailwindcss/postcss`, dark-first amber theme (OKLCH)
- **shadcn/ui** — components in `src/components/ui/`, config in `components.json`
- **tRPC 11** — routers in `src/server/api/routers/`, client wiring in `src/trpc/`
- **TanStack Query 5** — `staleTime: 5min`, `refetchInterval: 30min`
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
├── lib/              # Utilities (cache.ts, plex.ts, tautulli.ts, utils.ts)
├── types/            # Plex and Tautulli response types
├── hooks/            # React hooks (use-debounce)
└── components/       # UI components (ui/, dashboard/, media/, analytics/)
```

## Key Patterns

- **Path alias**: `~/` maps to `./src/`
- **Env validation**: `src/env.ts` using `@t3-oss/env-nextjs` — vars: `PLEX_URL`, `PLEX_TOKEN`, `TAUTULLI_URL`, `TAUTULLI_API_KEY`
- **Cache**: In-memory TTL cache in `src/lib/cache.ts`, 30min default, `POST /api/refresh` clears all
- **Image proxy**: `/api/plex-image?path=...&w=300&h=450` — streams from Plex with token server-side
- **tRPC procedures** all return `{ data: T; lastUpdatedAt: string }` for freshness display
- **Server prefetch**: Use `caller` for direct RSC calls, `trpc.X.queryOptions()` + `queryClient.prefetchQuery()` for hydration

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
