-- 010: Maanedlig opprydning av tomme anonyme brukerskall (pg_cron).
--
-- Bakgrunn (se notes/completion-pages/2026-08-08-dronelappen-anon-opprydning-LIVE.md):
-- hver besokende faar en anonym auth-konto via signInAnonymously, og ~35/dag
-- blir liggende som skall uten en eneste rad i noen tabell. Forste manuelle
-- runde 08.08.2026 slettet 589. Denne jobben gjentar det maanedlig, inne i
-- Postgres, saa den aldri er avhengig av en ekstern sesjon med tilgang.
--
-- Kriteriet er bevisst strengt: KUN skall med null rader i entitlements,
-- user_progress, quiz_sessions OG funnel_events, eldre enn 14 dager og uten
-- innlogging siste 14 dager. Alle FK-er mot auth.users er ON DELETE CASCADE,
-- saa et bredere kriterium ville radert ovingshistorikk og trakt-analytikk.
-- Et slettet skall som kommer tilbake faar bare en ny anonym konto - null
-- progresjon fantes, saa opplevelsen er identisk.

create extension if not exists pg_cron;

-- Logg over hva jobben har slettet (id-er, ikke persondata).
create table if not exists public.anon_cleanup_log (
  user_id uuid primary key,
  user_created_at timestamptz not null,
  deleted_at timestamptz not null default now()
);
alter table public.anon_cleanup_log enable row level security;
revoke all on public.anon_cleanup_log from anon, authenticated, public;

create or replace function public.cleanup_anon_shells()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  with slettet as (
    delete from auth.users u
    where u.is_anonymous
      and u.email is null
      and u.created_at < now() - interval '14 days'
      and coalesce(u.last_sign_in_at, u.created_at) < now() - interval '14 days'
      and not exists (select 1 from public.entitlements e where e.user_id = u.id)
      and not exists (select 1 from public.user_progress p where p.user_id = u.id)
      and not exists (select 1 from public.quiz_sessions q where q.user_id = u.id)
      and not exists (select 1 from public.funnel_events f where f.user_id = u.id)
    returning u.id, u.created_at
  )
  insert into public.anon_cleanup_log (user_id, user_created_at)
  select id, created_at from slettet;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Kun jobben (og admin) skal kunne kjore denne.
revoke all on function public.cleanup_anon_shells() from anon, authenticated, public;

-- Kjorer 1. i maaneden 03:14 UTC (05:14 norsk sommertid). Idempotent:
-- unschedule forst hvis jobben finnes fra for.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'anon-cleanup-monthly') then
    perform cron.unschedule('anon-cleanup-monthly');
  end if;
  perform cron.schedule('anon-cleanup-monthly', '14 3 1 * *',
                        'select public.cleanup_anon_shells()');
end;
$$;
