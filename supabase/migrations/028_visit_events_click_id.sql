-- 028: visit_events får Google klikk-ID (26.10.2026).
--
-- HVORFOR: Google Ads talte 0 av 2 annonsesalg i oktober. iPhone/iPad-salget
-- 25/10 hadde gbraid, men klikk-IDen levde bare i fanens minne
-- (src/lib/attribution.js). Kjøperen landet 19:05/19:10 og kjøpte 21:01 etter
-- å ha åpnet appen på nytt, så create-checkout fikk ingen ID, og referrer-
-- feltet kappes ved 300 tegn midt i gbraid-verdien. IDen fantes ikke noe sted.
--
-- Nå sendes klikk-IDen med landingsraden og lagres her, server-side. Ingenting
-- nytt lagres på enheten, så samtykkeløftet (ad_storage denied,
-- url_passthrough) holdes. create-checkout slår opp nyeste ID for brukeren
-- (30 dager) når klienten ikke sender en selv.
--
-- 027 er reservert for entitlements_sts (to-nivå-briefen 24/10), derfor 028.
-- Ingen backfill: verdien finnes ikke i gamle rader.
-- Grants/RLS uendret: tabell-grant for insert dekker nye kolonner, og
-- policyen «visit_events insert own» gjelder fortsatt.

alter table public.visit_events
  add column if not exists click_id_name text
    check (click_id_name in ('gclid', 'gbraid', 'wbraid')),
  add column if not exists click_id text
    check (char_length(click_id) <= 200);

-- Begge eller ingen. En ID uten navn kan ikke brukes i success_url eller
-- Stripe-metadata, og et navn uten ID er støy.
alter table public.visit_events
  drop constraint if exists visit_events_click_id_pair;
alter table public.visit_events
  add constraint visit_events_click_id_pair
    check ((click_id is null) = (click_id_name is null));

-- Oppslaget i create-checkout: nyeste rad med klikk-ID per bruker.
create index if not exists visit_events_user_click_idx
  on public.visit_events (user_id, created_at desc)
  where click_id is not null;
