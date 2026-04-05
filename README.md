# DroneLappen

Quiz app for Norwegian drone pilot exams (A1/A3 and A2).

## Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Supabase (Postgres + RLS + Auth)
- **Deployment:** Vercel (auto-deploy from main)

## Supabase

- **Project ID:** wenjugvnxjmvbvlgnnhh
- **Region:** eu-west-1 (Ireland)
- **API URL:** https://wenjugvnxjmvbvlgnnhh.supabase.co

## Local Development

```bash
npm install
npm run dev
```

Create a `.env` file with:
```
VITE_SUPABASE_URL=<your supabase url>
VITE_SUPABASE_ANON_KEY=<your anon key>
```

## Database Tables

- **categories** — Exam topic categories (A1/A3, A2)
- **questions** — Question bank with options, explanations, difficulty
- **user_progress** — Per-question answer tracking
- **quiz_sessions** — Full exam simulation sessions

## Security TODO

RLS policies on `user_progress` and `quiz_sessions` currently use `USING (true)`
for all operations (device-ID based, no auth). When adding Supabase Auth, update
policies to filter on `auth.uid() = user_id`.

## Related

- **Droneavisa.no** — Guide article: https://droneavisa.no/droneeksamen-norge-guide-a1-a3-a2/
- **Pricing:** 149–249 kr freemium (25 free questions)
