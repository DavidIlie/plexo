# Plexo

Personal media dashboard for your Plex library. Track your movies, TV shows, watch history, and viewing patterns — all in one dark-themed, self-hosted interface.

Built with Next.js 16, tRPC, Tailwind CSS v4, and Recharts.

## Features

- **Dashboard** — stat cards (total movies, shows, watched, hours), continue watching (on-deck), recently watched, inline charts
- **Movies** — full library grid with genre/watched/unwatched filters and search
- **TV Shows** — library grid with episode progress bars and completion status filters
- **Analytics** — 6 chart visualizations: genre distribution, most watched genres, watch time by day/hour, monthly trends, movies vs TV ratio
- **Image proxy** — Plex poster images served through a server-side proxy (keeps your token off the client)
- **Smart caching** — tiered TTLs: library metadata (1hr), media details (30min), analytics (15min), activity (5min), with manual refresh
- **Docker** — multi-stage build, pushes to GHCR via GitHub Actions

## Screenshots

_Coming soon — run locally to see your own data._

## Setup

### 1. Get your API keys

#### Plex Token

Your Plex token determines **which user's** watch data you see. The token is tied to a specific Plex account — whoever owns the token, their watched/unwatched status is what Plexo displays.

**To get your token:**

1. Sign in to Plex Web (`app.plex.tv`) or your server's web UI
2. Open any media item and click **Get Info** (or **View XML**)
3. In the URL bar you'll see `X-Plex-Token=xxxxxxxxxxxx` — that's your token
4. Alternatively: browser dev tools → Network tab → load any Plex page → look for `X-Plex-Token` in any request to your server

**For a managed/home user:**

If you have Plex Home with multiple users and want to see a specific user's watch data (not the admin's):

1. Sign in to Plex Web **as that user** (switch user from the top-right menu)
2. Grab the token from the network tab as described above — each user has their own token
3. Use that user's token as `PLEX_TOKEN`

> The server admin token shows the admin's watch status. A managed user's token shows that user's watch status. The library content (movies, shows) is the same regardless — only watch progress differs.

#### Tautulli API Key

1. Open your Tautulli web UI
2. Go to **Settings** → **Web Interface**
3. Your API key is shown under **API Key** — copy it
4. If you don't have one, click **Generate** to create a new key

#### Tautulli User ID (optional)

By default, Tautulli shows stats for **all users** on your server. To scope it to a single user (matching your Plex token):

1. In Tautulli, go to **Users**
2. Click on the user you want
3. The URL will be something like `tautulli.yourdomain.com/user?user_id=12345678` — that number is the user ID
4. Set `TAUTULLI_USER_ID=12345678` in your `.env`

Leave `TAUTULLI_USER_ID` empty to see combined stats for all users.

### 2. Clone and configure

```bash
git clone https://github.com/davidilie/plexo.git
cd plexo
cp .env.example .env
```

Edit `.env` with your values:

```env
PLEX_URL=https://plex.yourdomain.com
PLEX_TOKEN=your-plex-token
TAUTULLI_URL=https://tautulli.yourdomain.com
TAUTULLI_API_KEY=your-tautulli-api-key
TAUTULLI_USER_ID=           # optional, leave empty for all users
```

### 3. Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Docker

```bash
docker build -t plexo .
docker run -p 3000:3000 \
  -e PLEX_URL=https://plex.yourdomain.com \
  -e PLEX_TOKEN=your-plex-token \
  -e TAUTULLI_URL=https://tautulli.yourdomain.com \
  -e TAUTULLI_API_KEY=your-tautulli-api-key \
  plexo
```

Or pull the pre-built image from GHCR:

```bash
docker pull ghcr.io/davidilie/plexo:latest
```

## Caching

Plexo uses an in-memory cache with tiered TTLs to minimize API calls:

| Data Type | TTL | Examples |
|-----------|-----|---------|
| Library | 1 hour | Library sections, genre lists |
| Metadata | 30 min | Movie/show listings with watch status |
| Analytics | 15 min | Genre distribution, watch patterns, trends |
| Activity | 5 min | On-deck, watch history, home stats |

Hit the **Refresh** button in the navbar to clear all caches and pull fresh data.

## Tech Stack

| Tool | Version |
|------|---------|
| Next.js | 16 |
| React | 19 |
| TypeScript | 5.7+ |
| Tailwind CSS | v4 |
| shadcn/ui | latest |
| tRPC | 11 |
| TanStack Query | 5 |
| Recharts | 3 |
| lucide-react | latest |
| date-fns | 4 |

## License

MIT
