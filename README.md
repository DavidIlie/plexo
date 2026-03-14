# Plexo

Personal media dashboard for your Plex library. Track your movies, TV shows, watch history, and viewing patterns — all in one dark-themed, self-hosted interface.

Built with Next.js 16, tRPC, Tailwind CSS v4, and Recharts.

## Features

- **Dashboard** — stat cards (total movies, shows, watched, hours), continue watching (on-deck), recently watched, inline charts
- **Movies** — full library grid with genre/watched/unwatched filters and search
- **TV Shows** — library grid with episode progress bars and completion status filters
- **Analytics** — 6 chart visualizations: genre distribution, most watched genres, watch time by day/hour, monthly trends, movies vs TV ratio
- **Image proxy** — Plex poster images served through a server-side proxy (keeps your token off the client)
- **Cache** — in-memory 30-minute TTL cache with manual refresh button
- **Docker** — multi-stage build, pushes to GHCR via GitHub Actions

## Screenshots

_Coming soon — run locally to see your own data._

## Setup

### 1. Get your API keys

#### Plex Token

1. Sign in to Plex Web (`app.plex.tv`) or your server's web UI
2. Open any media item and click **Get Info** (or **View XML**)
3. In the URL bar you'll see `X-Plex-Token=xxxxxxxxxxxx` — that's your token
4. Alternatively, open your browser's dev tools → Network tab → load any Plex page → find a request to your server and look for the `X-Plex-Token` query param or header

#### Tautulli API Key

1. Open your Tautulli web UI
2. Go to **Settings** → **Web Interface**
3. Your API key is shown under **API Key** — copy it
4. If you don't have one, click **Generate** to create a new key

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
