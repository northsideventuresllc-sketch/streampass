# Stream Pass

Cross-platform streaming aggregator and command center — a metadata, social, and intelligence layer on top of all streaming platforms.

**Domain:** [streampass.thenilabs.com](https://streampass.thenilabs.com)  
**A Northside Intelligence Project · Sector 1B**

## Stack

- Next.js 15+ (App Router)
- React 19
- Supabase (Auth, Database, Realtime)
- Tailwind CSS
- TypeScript
- Claude API (`claude-sonnet-4-20250514`) for recommendations

## Features

- **Auth** — Email/password signup with auto profile creation
- **Universal Watchlist** — Cross-platform queue with drag-to-reorder, status tracking, and deep links
- **AI Recommendations** — Cross-platform recs based on watch history
- **Subscription Intelligence** — Track costs, idle services (14+ days), savings opportunities
- **Content Passport** — Track titles, get alerts on platform changes or expiring content
- **Watch Party Rooms** — Shareable rooms with real-time chat and sync countdown

## Getting Started

### 1. Prerequisites

- **Node.js** 20.9+ (LTS recommended)
- **npm** 10+

### 2. Clone & install

```bash
git clone https://github.com/northsideventuresllc-sketch/streampass.git
cd streampass
npm install
```

### 3. Environment variables

Copy `.env.local.example` to `.env.local` and fill in real values from the Supabase dashboard:

```bash
cp .env.local.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (username login + admin API) |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for AI recommendations |
| `TMDB_API_KEY` | Yes | TMDB API key for search/discover |
| `STREAMPASS_ADMIN_KEY` | Yes | Admin key for passport updates |
| `SPOTIFY_CLIENT_ID` | No | Spotify OAuth (music connect + search) |
| `SPOTIFY_CLIENT_SECRET` | No | Spotify OAuth secret |

Local dev uses the **remote** Northside Intelligence Brain Supabase project — no local Supabase stack required.

### 4. Supabase auth (one-time)

In [Supabase → Authentication → URL Configuration](https://supabase.com/dashboard/project/kxijunwgbrlfzvgkhklo/auth/url-configuration), ensure redirect URLs include:

- `http://localhost:3000/**`
- `http://127.0.0.1:3000/**`

See `supabase/README.md` for table reference and CLI linking.

### 5. Run locally

```bash
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

**First load** can take 30–90 seconds while Next.js compiles middleware and the home page. Subsequent navigations are much faster.

#### Useful scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (webpack, `127.0.0.1:3000`) |
| `npm run dev:turbo` | Dev server with Turbopack |
| `npm run dev:clean` | Clear `.next` cache, then start dev |
| `npm run build` | Production build |
| `npm run start` | Serve production build |

#### Troubleshooting

- **Port 3000 in use** — stop the other process (`lsof -ti :3000 | xargs kill`) or run `npm run dev:clean`.
- **Stale dev server / hung requests** — run `npm run dev:clean`.
- **"Another next dev server is already running"** — kill the PID shown in the error, then restart.
- **Very slow compiles** — the repo path is deeply nested; moving the project to a shorter path (e.g. `~/Projects/streampass`) speeds up file watching.

## Project Structure

```
src/
├── app/
│   ├── (app)/          # Authenticated routes with sidebar
│   │   ├── dashboard/
│   │   ├── watchlist/
│   │   ├── discover/
│   │   ├── subscriptions/
│   │   ├── passport/
│   │   └── rooms/
│   ├── api/
│   │   ├── recommendations/   # Claude AI recs
│   │   └── admin/tracked-titles/
│   ├── admin/passport/        # Admin passport tool
│   ├── login/
│   └── signup/
├── components/
└── lib/
    ├── supabase/
    ├── constants.ts
    └── types.ts
supabase/migrations/
```

## Admin Tools

Update tracked title platform status at `/admin/passport`. Requires `STREAMPASS_ADMIN_KEY` in the Authorization header.

```bash
curl -X PATCH https://streampass.thenilabs.com/api/admin/tracked-titles \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id": "uuid", "current_platform": "Hulu", "expires_at": "2026-07-01T00:00:00Z"}'
```

## Deployment

Deploy to Vercel connected to `northsideventuresllc-sketch/streampass`. Push to `main` triggers deployment.

Set all environment variables in Vercel project settings. Point `streampass.thenilabs.com` to the Vercel deployment.

## Supabase Project

- **Northside Intelligence Brain** — `kxijunwgbrlfzvgkhklo` (us-east-1)
- GitHub: [northsideventuresllc-sketch/streampass](https://github.com/northsideventuresllc-sketch/streampass)
- All tables prefixed with `streampass_`
- Row Level Security enabled on all tables

## License

Proprietary — Northside Ventures LLC
