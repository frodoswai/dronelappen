-- 026: checkout_remind_yes / checkout_remind_no i funnel_events (16.10.2026)
--
-- Hvorfor: e-postdialogen før Stripe («steg 1 av 2», 13/10) fjernes. Kjøp går
-- rett til Stripe. Påminnelse ved forlatt kjøp spørres i stedet når kunden
-- kommer tilbake på ?betalt=avbrutt (CheckoutRemindDialog). Svaret logges som
-- checkout_remind_yes / checkout_remind_no, og avbrudd-retur som
-- checkout_cancel_return, så 1/11-vurderingen kan telle: hvor mange kommer
-- tilbake uten å betale, og hvor mange av dem vil ha påminnelsen.
-- checkout_email_cancel beholdes for de historiske radene fra 16/10.
--
-- Kjøres FØR frontend-deployen.

alter table public.funnel_events drop constraint if exists funnel_events_event_check;
alter table public.funnel_events add constraint funnel_events_event_check check (
  event = any (array[
    'paywall_view', 'paywall_buy_click', 'paywall_exit',
    'quiz_buy_click', 'home_buy_click',
    'lead_skip', 'upgrade_buy_click', 'lead_bonus_granted',
    'payment_return', 'checkout_email_cancel',
    'checkout_cancel_return', 'checkout_remind_yes', 'checkout_remind_no'
  ]::text[])
);
