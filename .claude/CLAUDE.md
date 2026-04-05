# DroneLappen

Norwegian drone pilot exam prep quiz app (A1/A3 and A2 categories).

## Stack
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Supabase (Postgres, JSONB options, RLS)
- **Hosting:** Vercel (auto-deploy from GitHub)
- **Repo:** github.com/frodoswai/dronelappen (main branch)

## Key Architecture
- Questions stored in Supabase with JSONB `options` column: `[{"id": "a", "text": "..."}]`
- `correct_option_id` field (not `correct_answer`)
- Env vars use `VITE_` prefix for client-side access via `import.meta.env`
- `.env` at project root (gitignored): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VERCEL_TOKEN

## Deployment
- All Vercel operations via CLI token — never use dashboard
- Push to `main` triggers auto-deploy
- Vercel env vars already set (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

## Rules
- Norwegian (bokmål) for all UI text
- RLS policies are a TODO — currently permissive (no auth yet)
- Don't modify Supabase schema without asking Frodo first
- Mobile-first design, aviation blue (#1a365d) primary color

## Project Structure
```
src/
  lib/supabase.js      — Supabase client
  pages/Home.jsx       — Landing page with exam cards
  pages/Quiz.jsx       — Quiz engine (exam + practice mode)
  pages/Results.jsx    — Results with pass/fail + explanations
  App.jsx              — React Router
  main.jsx             — Entry point
supabase/
  migrations/          — SQL schema
  seed.js              — Question bank seeder
```
