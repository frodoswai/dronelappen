-- 023: 10 ekstra A2-spørsmål til den som gir e-post på muren (Frode 05.10.2026,
-- brief notes/briefs/2026-10-05-dronelappen-mur-10-ekstra-mot-epost.md).
-- KJØRT 13.10.2026 23:11 via Supabase MCP apply_migration etter Frodes ja i chat
-- (verifisert: 10 bonus, 0 i free_pool, RLS på, 0 policyer). Nummerert 023 fordi 021 og 022 kom etter briefen.

-- 1. Hvem som har fått bonusen. Bare service role (edge-funksjonene) leser og
--    skriver. RLS på, ingen policyer.
create table public.lead_bonus (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now(),
  source     text not null default 'quiz_paywall',
  extra      int  not null default 10
);
alter table public.lead_bonus enable row level security;
grant select, insert, update on public.lead_bonus to service_role;

-- 2. Flagget som peker ut de 10 bonusspørsmålene (bare A2, ingen av dem i free_pool).
alter table public.questions add column bonus_pool boolean not null default false;
update public.questions set bonus_pool = true where exam_type = 'A2' and free_pool = false and id in (
  'e1309474-3bd0-4222-b015-63f4aa76c997',
  '1bc25886-ecbc-4dc3-b7a1-a36fa01dab3b',
  'a1fc41b3-15ac-4587-a000-f152d57b60fe',
  '0979a60b-a400-4f21-9fa8-851ff65b8f4f',
  '78991fde-9f9d-4e35-8ae5-74b50c382a98',
  'aa227513-d04c-4eba-8c0c-394860937a83',
  '6e2acbbc-baef-4752-9d24-65e63fb4078b',
  'adda7d87-7a08-4782-9659-ef39ad1e8127',
  'ee9e3b3e-6d38-418a-ae7e-205fcadf4f03',
  '2b70d384-c241-4a80-a3ec-b0bafb67c6ad'
);

-- 3. Traktverdi for målingen (lib/funnel.js LEAD_BONUS_GRANTED).
alter table public.funnel_events drop constraint if exists funnel_events_event_check;
alter table public.funnel_events add constraint funnel_events_event_check check (
  event = any (array[
    'paywall_view', 'paywall_buy_click', 'paywall_exit',
    'quiz_buy_click', 'home_buy_click',
    'lead_skip', 'upgrade_buy_click', 'lead_bonus_granted'
  ]::text[])
);

-- Kontroll etterpå (brief, verifikasjon 1):
--   select count(*) from public.questions where bonus_pool;                      -- 10
--   select count(*) from public.questions where bonus_pool and free_pool;        -- 0
--   select relrowsecurity from pg_class where relname = 'lead_bonus';            -- t
--   select count(*) from pg_policies where tablename = 'lead_bonus';             -- 0
