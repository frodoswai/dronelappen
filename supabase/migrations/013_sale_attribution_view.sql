-- 013: sale_attribution - hvert kjop koblet mot forste kjente kanal.
--
-- First touch, ikke last: sporsmaalet viewet svarer paa er "hvor oppdaget
-- kjoperen oss", og den forste kjente kanalen er den som skaffet dem. Hele
-- reisen (first OG last touch) ligger i Stripe-metadataen, som create-checkout
-- fyller fra getAttribution().
--
-- Merk skillet i source: referrer = '' betyr direkte trafikk (vi maalte, og
-- det var ingen henvisning), referrer IS NULL betyr at raden ble skrevet for
-- kanalloggingen fantes. To forskjellige svar - bare det forste er en maaling.

create or replace view public.sale_attribution
with (security_invoker = true) as
with first_touch as (
  select distinct on (user_id)
    user_id, utm_source, utm_medium, utm_campaign, utm_content,
    referrer, landing_path, created_at as first_event_at
  from public.funnel_events
  where utm_source is not null or referrer is not null
  order by user_id, created_at
)
select
  e.user_id,
  e.created_at as purchased_at,
  coalesce(f.utm_source, case
    when f.referrer = ''  then 'direct'
    when f.referrer is null then 'unknown'
    else 'referral'
  end) as source,
  f.utm_medium, f.utm_campaign, f.utm_content,
  f.referrer, f.landing_path, f.first_event_at,
  e.created_at - f.first_event_at as time_to_purchase
from public.entitlements e
left join first_touch f on f.user_id = e.user_id
where e.tier = 'paid';
