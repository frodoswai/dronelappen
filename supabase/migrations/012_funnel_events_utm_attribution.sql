-- 012: Kanal (UTM/referrer) paa funnel_events.
--
-- Bakgrunn 13.08.2026: et salg kl. 13:15 gikk fra forste sporsmaal til betalt
-- paa 13 minutter, rent gjennom betalingsmuren. funnel_events kunne fortelle
-- HVOR i produktet det skjedde, men ikke hvor trafikken kom fra - tabellen
-- hadde ingen kanalfelt. Svaret laa i Stripe-metadataen (utm_source=droneavisa,
-- sts_guide/inline), men den finnes bare for dem som faktisk betalte. Uten
-- kanal paa trakthendelsene kan vi ikke regne konvertering per kanal: hvor
-- mange fra Droneavisa-guiden SAA muren kontra hvor mange som kjopte.
--
-- Alle felt er nullable. Historiske rader forblir NULL, og viewet i 013 leser
-- NULL som 'unknown' - ikke som 'direct'. Aa gjette pa historikken ville gjort
-- den verdilos.
--
-- Lengdesjekken er der for at en rar eller fabrikkert lenke ikke skal kunne
-- fylle tabellen. Klienten kutter paa de samme grensene
-- (getFunnelAttribution i src/lib/attribution.js) - holdes de to i utakt,
-- feiler innsettingen, og logFunnel svelger feilen slik at hendelsen
-- forsvinner uten spor.

alter table public.funnel_events
  add column if not exists utm_source   text,
  add column if not exists utm_medium   text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content  text,
  add column if not exists utm_term     text,
  add column if not exists referrer     text,
  add column if not exists landing_path text;

alter table public.funnel_events
  add constraint funnel_events_utm_len check (
    coalesce(length(utm_source),   0) <= 120 and
    coalesce(length(utm_medium),   0) <= 120 and
    coalesce(length(utm_campaign), 0) <= 200 and
    coalesce(length(utm_content),  0) <= 200 and
    coalesce(length(utm_term),     0) <= 200 and
    coalesce(length(referrer),     0) <= 500 and
    coalesce(length(landing_path), 0) <= 500
  );

create index if not exists funnel_events_utm_source_created_idx
  on public.funnel_events (utm_source, created_at desc);

-- Ingen policy-endring: 'funnel_events insert own' er kolonneagnostisk, saa
-- klienten skriver de nye feltene med samme auth.uid() = user_id-sjekk.
