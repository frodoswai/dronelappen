# DroneLappen

Drone exam prep quiz PWA for Norwegian drone pilots (A1/A3 and A2 categories).

## Stack
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Supabase (Postgres, JSONB options, RLS)
- **Hosting:** Vercel (auto-deploy from GitHub)
- **Repo:** github.com/frodoswai/dronelappen — git remote has token baked in, `git push origin main` works directly.
- **Supabase project:** wenjugvnxjmvbvlgnnhh (eu-west-1), API URL: https://wenjugvnxjmvbvlgnnhh.supabase.co

## Deploy Workflow (ALWAYS follow this order)
1. Make code changes
2. `npm run build` — must pass before pushing
3. `git add . && git commit -m "description"`
4. `git push origin main` — triggers Vercel auto-deploy
5. **NEVER** deploy via `npx vercel --prod` directly — this breaks repo sync

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
```
