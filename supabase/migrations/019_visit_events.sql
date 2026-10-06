-- 019: visit_events - klikk -> økt per kampanje (06.10.2026).
--
-- HVORFOR: STS-lanseringen 6/10 viste 0 i begge tellerne vi hadde. Ingen av
-- dem var i stykker, men ingen av dem kunne svare på «blir klikkene til økter?»:
--   * funnel_events fyres bare ved muren og kjøp, og bærer FIRST touch. En
--     leser som fikk lanseringsmailen, men kom til oss via Google i august,
--     står alltid som Google der. Mailens kampanje kan aldri dukke opp.
--   * quiz_sessions skrives først når en quiz er FULLFØRT.
-- Denne tabellen logger to ting med kanalen for DETTE besøket (last touch):
--   landing    - en sidevisning med kjent kilde (UTM eller ekstern henvisning)
--   quiz_start - en quiz der første spørsmål faktisk vises
--
-- EGEN TABELL, IKKE funnel_events, av to grunner:
--   1. sale_attribution plukker brukerens tidligste rad med kilde fra
--      funnel_events. Last-touch-rader der ville endret svaret på «hvor
--      oppdaget kjøperen oss».
--   2. cleanup_anon_shells (010/015) sparer alle anonyme brukere med en rad i
--      funnel_events. En landingsrad for hver besøkende ville stoppet hele
--      oppryddingen (~35 tomme skall per dag).
--
-- ON DELETE SET NULL, ikke CASCADE: oppryddingen sletter anonyme skall uten
-- annen aktivitet etter 14 dager. Det er nettopp de som landet og forsvant, og
-- de skal fortsatt telle i klikk -> økt. Raden mister koblingen til brukeren,
-- men tallet består. Ingen persondata: user_id, kanal og sti.
-- En bruker med quiz_start spares av oppryddingen (punkt 6), så koblingen
-- landing -> quiz_start aldri brytes for dem som faktisk startet.

-- 1. Tabell
create table if not exists public.visit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete set null,
  event text not null check (event in ('landing', 'quiz_start')),
  exam_type text check (char_length(exam_type) <= 40),
  mode text check (mode in ('eksamen', 'laering', 'tempo')),
  utm_source text check (char_length(utm_source) <= 120),
  utm_medium text check (char_length(utm_medium) <= 120),
  utm_campaign text check (char_length(utm_campaign) <= 200),
  utm_content text check (char_length(utm_content) <= 200),
  utm_term text check (char_length(utm_term) <= 200),
  referrer text check (char_length(referrer) <= 500),
  landing_path text check (char_length(landing_path) <= 500),
  -- Når kilden ble sett. For quiz_start kan den være dager gammel (last touch
  -- fra et tidligere besøk), og da er det rapporten som avgjør vinduet.
  touch_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists visit_events_campaign_created_idx
  on public.visit_events (utm_campaign, created_at desc);
create index if not exists visit_events_event_created_idx
  on public.visit_events (event, created_at desc);
create index if not exists visit_events_user_idx
  on public.visit_events (user_id, created_at);

-- 2. Grants: klienten skal bare kunne skrive, aldri lese.
revoke all on public.visit_events from anon, authenticated, public;
grant insert on public.visit_events to authenticated;
grant select, insert, update, delete on public.visit_events to service_role;

-- 3. RLS
alter table public.visit_events enable row level security;

-- 4. Policy: bare egne rader (anonyme brukere har også rollen authenticated).
drop policy if exists "visit_events insert own" on public.visit_events;
create policy "visit_events insert own" on public.visit_events
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- 5. Rapport: per dag og kampanje, hvor mange som landet, hvor mange av dem
-- som startet en quiz innen 24 timer, og alle quiz-starter med samme kilde.
-- Bare service_role leser (security_invoker + ingen grant til klienter).
create or replace view public.campaign_click_to_session
with (security_invoker = true) as
with landing as (
  -- Én rad per besøkende, kampanje og dag. Rader der brukeren er ryddet bort
  -- (user_id null) telles hver for seg via id, ikke slått sammen til én.
  select distinct on (coalesce(user_id, id), utm_campaign, (created_at at time zone 'Europe/Oslo')::date)
    user_id, coalesce(utm_source, '(henvisning)') as utm_source,
    coalesce(utm_campaign, '(ingen)') as utm_campaign,
    (created_at at time zone 'Europe/Oslo')::date as dag, created_at
  from public.visit_events
  where event = 'landing'
  order by coalesce(user_id, id), utm_campaign, (created_at at time zone 'Europe/Oslo')::date, created_at
),
starts as (
  select user_id, coalesce(utm_campaign, '(ingen)') as utm_campaign, created_at
  from public.visit_events
  where event = 'quiz_start'
)
select
  l.dag,
  l.utm_source,
  l.utm_campaign,
  count(*) as landet,
  count(*) filter (where exists (
    select 1 from starts s
    where s.user_id = l.user_id
      and s.created_at >= l.created_at
      and s.created_at < l.created_at + interval '24 hours'
  )) as startet_quiz_24t
from landing l
group by 1, 2, 3;

revoke all on public.campaign_click_to_session from anon, authenticated, public;
grant select on public.campaign_click_to_session to service_role;

-- 6. Oppryddingen: spar brukere som har startet en quiz. Ellers identisk med
-- 015. Brukere med bare en landingsrad ryddes som før (raden blir stående
-- uten user_id og teller fortsatt som «landet, startet ikke»).
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
      and not exists (select 1 from public.feature_votes v where v.user_id = u.id)
      and not exists (select 1 from public.visit_events ve
                      where ve.user_id = u.id and ve.event = 'quiz_start')
    returning u.id, u.created_at
  )
  insert into public.anon_cleanup_log (user_id, user_created_at)
  select id, created_at from slettet;
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.cleanup_anon_shells() from anon, authenticated, public;
