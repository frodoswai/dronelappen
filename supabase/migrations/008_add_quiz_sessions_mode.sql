-- 008: Scoreboard — mode-kolonne på quiz_sessions (2026-07-31)
-- Anvendt i prod via Supabase MCP (apply_migration: add_quiz_sessions_mode).
--
-- «Min side» (/min-side) viser eksamenshistorikk, og quiz_sessions skilte
-- tidligere ikke mellom tempo-, eksamens- og læringsøkter. Nullable:
-- historiske rader (før 31.07.2026) har ukjent modus og holdes utenfor
-- historikken. Klientene setter mode ved insert (Rapid: 'tempo',
-- Quiz: 'eksamen'/'laering').
alter table public.quiz_sessions add column if not exists mode text
  check (mode is null or mode in ('tempo', 'eksamen', 'laering'));
