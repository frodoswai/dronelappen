-- 021: funnel_events tillater 'upgrade_buy_click' og 'lead_skip' (08.10.2026).
--
-- KJØRT 08.10.2026 etter Frodes ja (apply_migration 021_funnel_events_upgrade_lead_skip).
--
-- Funnet 08.10.2026 da kjøpsknappen i UpgradePrompt skulle få egen hendelse:
-- funnel_events_event_check tillater bare de fem første hendelsene. 'lead_skip'
-- (OvingsplanA2, lagt til i koden 06.09.2026) har derfor aldri blitt lagret.
-- Innsettingen avvises, logFunnel svelger feilen, og hendelsen forsvinner stille.
-- Samme ville skjedd med den nye 'upgrade_buy_click'.

alter table public.funnel_events drop constraint if exists funnel_events_event_check;
alter table public.funnel_events add constraint funnel_events_event_check check (
  event = any (array[
    'paywall_view', 'paywall_buy_click', 'paywall_exit',
    'quiz_buy_click', 'home_buy_click',
    'lead_skip', 'upgrade_buy_click'
  ]::text[])
);
