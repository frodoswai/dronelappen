-- 016: eierens egen stemme skal ikke telle mot terskelen.
--
-- Bakgrunn: da STS-flisa gikk live 21.09.2026 var den første stemmen i
-- feature_votes Frodes egen, avgitt mens han så på flisa på mobilen.
-- Terskelen er 5 stemmer fra innloggede eller betalende. En egen stemme er
-- da 20 % av en terskel han selv satte, og beslutningen ville delvis hvile
-- på ham selv. Beslutningen 21/9 er at stemmene faktisk avgjør — og at vi
-- sier offentlig at det var stemmene som avgjorde — så tallet må være rent.
--
-- Raden SLETTES IKKE. Den er ekte data, han mener det han stemte, og
-- fritekstsvaret hans er like nyttig som alle andres når spørsmålene skal
-- skrives. Den ekskluderes bare fra tellingen. Reversibelt ved å fjerne
-- not exists-leddet.
--
-- Hvorfor e-post og ikke hardkodet uuid: en uuid i kildekoden sier ingenting
-- om hvem det er, og neste leser ville ikke kunnet vurdere om den fortsatt
-- stemmer.

create or replace function public.count_feature_votes(p_feature text, p_days integer default 30)
returns table (
  totalt           bigint,
  betalende        bigint,
  innlogget_gratis bigint,
  anonyme          bigint,
  med_fritekst     bigint
)
language sql
security definer
set search_path = ''
as $$
  select
    count(*)                                                        as totalt,
    count(*) filter (where v.tier = 'paid')                         as betalende,
    count(*) filter (where v.tier <> 'paid' and not v.is_anonymous) as innlogget_gratis,
    count(*) filter (where v.is_anonymous)                          as anonyme,
    count(*) filter (where v.note is not null)                      as med_fritekst
  from public.feature_votes v
  where v.feature = p_feature
    and v.voted_at > now() - make_interval(days => p_days)
    -- Eierkontoer teller ikke mot en terskel eieren selv satte.
    and not exists (
      select 1 from auth.users u
      where u.id = v.user_id
        and u.email in ('frode74@gmail.com', 'frode@droneavisa.no', 'kontakt@droneavisa.no')
    );
$$;

revoke all on function public.count_feature_votes(text, integer) from anon, authenticated, public;
grant execute on function public.count_feature_votes(text, integer) to service_role;
