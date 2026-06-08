<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Stream Pass is a Next.js 16 app. Cloud agents should use the repo-level environment in `.cursor/environment.json` (`npm install` on boot, `npm run dev` to start the dev server).

### Environment variables

Copy `.env.local.example` to `.env.local` if secrets are not already injected via Cursor Secrets. Required keys:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `TMDB_API_KEY`
- `STREAMPASS_ADMIN_KEY`

Optional (Spotify connect + music search): `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`.

Dev uses the remote **Northside Intelligence Brain** Supabase project (`kxijunwgbrlfzvgkhklo`) — no local Supabase stack.

### Run and verify

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`. First compile can take 30–90s.

```bash
npm run lint
npm run build
```

CI placeholder env vars are fine for `build`; real keys are needed for live API routes (search, recommendations, auth).

### Repo

GitHub: `northsideventuresllc-sketch/streampass` — push to `main` deploys to Vercel at `streampass.thenilabs.com`.
