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

### 1. Clone & install

```bash
git clone https://github.com/northsideventuresllc-sketch/streampass.git
cd streampass
npm install
```

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin API only) |
| `ANTHROPIC_API_KEY` | Anthropic API key for recommendations |
| `STREAMPASS_ADMIN_KEY` | Admin key for passport updates |

### 3. Database setup

Run the migration in Supabase SQL Editor or via CLI:

```bash
# Using Supabase CLI
supabase db push
```

Or apply `supabase/migrations/001_initial_schema.sql` directly in the [Supabase Dashboard](https://supabase.com/dashboard/project/kxijunwgbrlfzvgkhklo/sql).

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

- Project ID: `kxijunwgbrlfzvgkhklo`
- All tables prefixed with `streampass_`
- Row Level Security enabled on all tables

## License

Proprietary — Northside Ventures LLC
