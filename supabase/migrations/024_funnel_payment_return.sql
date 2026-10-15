-- 024: payment_return i funnel_events (15.10.2026)
--
-- Hvorfor: 14/10 traff en betalt kunde muren igjen 72 min etter kjøpet og
-- startet en ny Stripe-økt. Vi kunne ikke se om kunden hadde kommet tilbake
-- fra Stripe (?betalt=ok) eller ikke. PaymentReturn logger nå 'payment_return'
-- når suksess-URL-en treffer appen. Et salg i sale_attribution uten
-- payment_return for samme user_id = kunden kom aldri tilbake.
--
-- Kjøres FØR frontend-deployen som logger eventet; ellers avviser
-- constrainten inserten (logFunnel svelger feilen stille, så ingenting
-- velter, men raden mangler).

alter table public.funnel_events drop constraint if exists funnel_events_event_check;
alter table public.funnel_events add constraint funnel_events_event_check check (
  event = any (array[
    'paywall_view', 'paywall_buy_click', 'paywall_exit',
    'quiz_buy_click', 'home_buy_click',
    'lead_skip', 'upgrade_buy_click', 'lead_bonus_granted',
    'payment_return'
  ]::text[])
);

-- Kontroll etterpå:
-- select pg_get_constraintdef(oid) from pg_constraint where conname = 'funnel_events_event_check';
