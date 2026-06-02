# Stream Pass on Northside Intelligence Brain

Stream Pass runs on the **shared** Supabase project **Northside Intelligence Brain** alongside other NI apps (NI Brain core tables, ARM3, ReplyFlow, etc.).

| Field | Value |
|-------|--------|
| **Project name** | Northside Intelligence Brain |
| **Project ID** | `kxijunwgbrlfzvgkhklo` |
| **Region** | us-east-1 |
| **API URL** | `https://kxijunwgbrlfzvgkhklo.supabase.co` |
| **Dashboard** | [Open project](https://supabase.com/dashboard/project/kxijunwgbrlfzvgkhklo) |

## Stream Pass tables (`streampass_*`)

All tables use Row Level Security (RLS) scoped to `auth.uid()`.

| Table | Purpose |
|-------|---------|
| `streampass_profiles` | User profile (auto-created on signup) |
| `streampass_user_services` | Subscribed streaming services + costs |
| `streampass_watchlist` | Universal watchlist + priority |
| `streampass_tracked_titles` | Content passport / platform alerts |
| `streampass_watch_rooms` | Watch party rooms |
| `streampass_room_members` | Room membership |
| `streampass_room_messages` | Realtime chat (Realtime enabled) |

## Migrations applied (remote)

- `initial_schema`
- `user_services_watchlist`
- `tracked_titles_rooms`
- `triggers_realtime`

Local source: `migrations/001_initial_schema.sql` (consolidated reference).

## Link this repo to the project

```bash
# Install Supabase CLI, then from repo root:
supabase link --project-ref kxijunwgbrlfzvgkhklo
```

## Auth redirect URLs

Configure in Supabase Dashboard → Authentication → URL Configuration:

- Site URL: `https://streampass.thenilabs.com`
- Redirect URLs: `http://localhost:3000/**`, `https://streampass.thenilabs.com/**`

## Environment variables

See `.env.local.example` in the repo root. Never commit `.env.local`.
