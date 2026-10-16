-- 025: checkout_email_cancel i funnel_events (16.10.2026)
--
-- Hvorfor: anonyme kjøpere får en e-postdialog («steg 1 av 2») før Stripe
-- (dfed506, 13.10). Frode testet 16/10 og opplevde den som en popup i veien.
-- Vi kan ikke avgjøre om den koster kjøp, fordi avbrudd ikke logges: i dag
-- ser vi bare *_buy_click og så eventuelt en Stripe-økt. Dialogen logger nå
-- 'checkout_email_cancel' når brukeren lukker den uten å sende. Beslutning
-- om å fjerne dialogen tas 1.11.2026 på andelen cancel / buy_click.
--
-- Kjøres FØR frontend-deployen (ellers avviser constrainten inserten;
-- logFunnel svelger feilen stille, raden mangler bare).

alter table public.funnel_events drop constraint if exists funnel_events_event_check;
alter table public.funnel_events add constraint funnel_events_event_check check (
  event = any (array[
    'paywall_view', 'paywall_buy_click', 'paywall_exit',
    'quiz_buy_click', 'home_buy_click',
    'lead_skip', 'upgrade_buy_click', 'lead_bonus_granted',
    'payment_return', 'checkout_email_cancel'
  ]::text[])
);

-- Kontroll etterpå:
-- select pg_get_constraintdef(oid) from pg_constraint where conname = 'funnel_events_event_check';
