# DroneLappen

Drone exam prep quiz PWA for Norwegian drone pilots (A1/A3 and A2 categories).

## Stack
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Supabase (Postgres, JSONB options, RLS)
- **Hosting:** Vercel (auto-deploy from GitHub)
- **Repo:** github.com/frodoswai/dronelappen — git remote has token baked in, `git push origin main` works directly.
- **Supabase project:** wenjugvnxjmvbvlgnnhh (eu-west-1), API URL: https://wenjugvnxjmvbvlgnnhh.supabase.co

## Deploy Workflow
Two deploy paths. Pick by what you changed.

### React app (src/, vercel.json, config) — ALWAYS via git push
1. Make code changes
2. `npm run build` — must pass before pushing
3. `git add . && git commit -m "description"`
4. `git push origin main` — triggers Vercel auto-deploy
5. **NEVER** deploy the app via `npx vercel --prod` directly — this breaks repo sync

### Static blog (content/blogg/*.md) — via Vercel CLI, then commit source
`/blogg` is a separate static site, independent of the app bundle. Runbook: `~/Projects/MacMiniHub/notes/reference/dronelappen-blogg-runbook.md`.
1. Add/edit `content/blogg/<slug>.md` (frontmatter: `title`, `description`, `date`); image in `content/blogg/assets/`
2. `npm run build` — runs `scripts/build-blogg.mjs` (generates gitignored `public/blogg/`) then `vite build`
3. Deploy: `source .env && npx vercel --prod --yes --token "$VERCEL_TOKEN"`
4. Commit the source: `git add -A && git commit -m "..." && git push`
- `npx vercel --prod` is the intended method **for the blog only** — it does not break repo sync because the published output is generated, not committed.

## Credentials
- `.env` at project root (gitignored): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VERCEL_TOKEN, GITHUB_TOKEN
- Service role key in `~/Projects/MacMiniHub/.config/supabase.env`

## Branding
- "DroneLappen — powered by Droneavisa.no"
- Primary color: aviation blue `#1a365d`
- Norwegian (bokmål) language throughout

## Key Architecture
- Questions stored in Supabase with JSONB `options` column: `[{"id": "a", "text": "..."}]`
- `correct_option_id` field (not `correct_answer`)
- Env vars use `VITE_` prefix for client-side access via `import.meta.env`
- `/blogg` is a static markdown site (separate from React app): `content/blogg/*.md` → `scripts/build-blogg.mjs` → gitignored `public/blogg/`. Vercel serves filesystem before the SPA rewrite in vercel.json. Sitemap at `dronelappen.app/blogg/sitemap.xml`.

## Database Tables
- **categories** (13)
- **questions** (238, JSONB options `{id, text}` + `correct_option_id`)
- **user_progress**
- **quiz_sessions**
- **newsletter_subscribers**
- All RLS enabled

## Rules
- Always API/CLI first, never browser workarounds or dashboards
- Build must pass before pushing
- Question seed script at `supabase/seed.js`
- Options are Fisher-Yates shuffled on quiz load
- Exam pass threshold: 75% (23/30)
- Use Desktop Commander shell for git operations, not sandbox tools
- Don't modify Supabase schema without asking Frodo first
- Mobile-first design

## Project Structure
```
src/
  components/Footer.jsx — Droneavisa branding footer
  lib/supabase.js       — Supabase client
  pages/Home.jsx        — Landing page with exam cards + newsletter signup
  pages/Quiz.jsx        — Quiz engine (exam + practice mode)
  pages/Results.jsx     — Results with pass/fail, exam label + explanations
  App.jsx               — React Router + Footer layout
  main.jsx              — Entry point
supabase/
  migrations/           — SQL schema
  seed.js               — Question bank seeder
scripts/
  build-blogg.mjs       — Static blog generator (marked) → public/blogg/
content/
  blogg/                — Published articles (*.md) + assets/
  blogg-drafts/         — Staged drafts (not built until moved to blogg/)
```
