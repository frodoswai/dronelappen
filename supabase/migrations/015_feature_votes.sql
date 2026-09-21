-- 015: feature_votes — etterspørselsmåling for funksjoner vi vurderer å bygge.
--
-- Første bruk er STS-spørsmålsbanken (feature = 'sts'). Bakgrunn i
-- notes/handoffs/2026-09-21-ed269-retting-publiseringsstopp-sts.md: STS-
-- etterspørselen er dokumentert (Eivind Gaertner besto teoriprøven 10/9 og
-- øvde med Copilot fordi vi ikke dekker STS), men ett kundetilfelle er ikke
-- grunnlag for 80-100 nye spørsmål. Flisa i appen måler i stedet for å gjette.
--
-- TERSKELEN ER SATT FØR LANSERING, ikke etter: 25 stemmer fra innloggede
-- eller betalende brukere på 30 dager = bygg hele settet. Under det: bare
-- guiden på Droneavisa. Å sette terskelen etterpå er å lese tallet man
-- ønsker seg.
--
-- ─── To feller denne migrasjonen er bygget rundt ───────────────────────
--
-- (1) INGEN FK MOT auth.users. Alle andre FK-er i dette skjemaet er
--     ON DELETE CASCADE, og 010_anon_cleanup_cron sletter anonyme skall
--     månedlig (anon_cleanup_log hadde 976 rader per 21.09.2026). En
--     cascade ville stille slettet stemmer; en FK uten cascade ville
--     blokkert oppryddingsjobben. Derfor står user_id som bar uuid, og
--     cleanup_anon_shells får i tillegg et nytt not-exists-ledd nedenfor
--     så en konto som HAR stemt ikke slettes — ellers ville samme person
--     kunne stemme på nytt etter opprydningen.
--
-- (2) ANONYME KAN STEMME FLERE GANGER. «Én stemme per bruker» holder bare
--     per auth-bruker, og en anonym bruker som tømmer storage får en ny
--     user_id. Det er ikke til å unngå uten innloggingskrav. Derfor lagres
--     tier og is_anonymous PÅ STEMMETIDSPUNKTET, så betalende stemmer kan
--     telles for seg — og det er de tallene terskelen måles mot.
--     Snapshot, ikke oppslag: en gratisbruker som stemmer og kjøper dagen
--     etter skal fortsatt telle som den han var da han stemte.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Tabell
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.feature_votes (
  user_id       uuid        not null,
  feature       text        not null,
  tier          text        not null,
  is_anonymous  boolean     not null,
  -- Ett valgfritt fritekstfelt, stilt rett etter stemmen («Hva trenger du
  -- STS til?»). Dette er grunnen til at vi slipper å sende en egen
  -- spørreundersøkelse. Kappet på 500 tegn.
  note          text,
  note_at       timestamptz,
  voted_at      timestamptz not null default now(),
  primary key (user_id, feature),
  constraint feature_votes_note_len check (note is null or char_length(note) <= 500)
);

comment on table public.feature_votes is
  'Én rad per bruker per funksjon. tier og is_anonymous er snapshot fra stemmetidspunktet. Ingen FK mot auth.users med vilje — se 015_feature_votes.sql.';

-- Terskelmålingen filtrerer på feature + voted_at + is_anonymous.
create index if not exists feature_votes_feature_voted_at_idx
  on public.feature_votes (feature, voted_at desc);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Grants — ingen direkte tabelltilgang for klienten.
--    All skriving og lesing går via RPC-ene nedenfor, så PostgREST trenger
--    ingen rettigheter på selve tabellen.
-- ─────────────────────────────────────────────────────────────────────────
revoke all on public.feature_votes from anon, authenticated, public;
grant select, insert, update, delete on public.feature_votes to service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. RLS — på, uten policies. Uten policy og uten grant kommer ingen klient
--    til tabellen direkte; security definer-funksjonene går utenom RLS.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.feature_votes enable row level security;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Funksjoner
-- ─────────────────────────────────────────────────────────────────────────

-- Avgi stemme. Idempotent: andre kall fra samme bruker gjør ingenting, så
-- en dobbeltklikk eller en refresh ikke teller to ganger. Returnerer
-- tilstanden UI-et trenger.
create or replace function public.cast_feature_vote(p_feature text)
returns table (has_voted boolean, has_note boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_anon  boolean;
  v_tier  text;
begin
  if v_uid is null then
    raise exception 'ingen sesjon';
  end if;

  -- Hvitliste. Hindrer at en klient fyller tabellen med vilkårlige
  -- feature-navn.
  if p_feature not in ('sts') then
    raise exception 'ukjent funksjon: %', p_feature;
  end if;

  select u.is_anonymous into v_anon
  from auth.users u where u.id = v_uid;

  -- Samme regel som AuthContext: paid teller bare hvis den ikke er utløpt.
  select case
           when e.tier = 'paid'
            and (e.expires_at is null or e.expires_at > now())
           then 'paid' else 'free'
         end
    into v_tier
  from public.entitlements e where e.user_id = v_uid;

  insert into public.feature_votes (user_id, feature, tier, is_anonymous)
  values (v_uid, p_feature, coalesce(v_tier, 'free'), coalesce(v_anon, true))
  on conflict (user_id, feature) do nothing;

  return query
    select true, (v.note is not null)
    from public.feature_votes v
    where v.user_id = v_uid and v.feature = p_feature;
end;
$$;

-- Lagre (eller tømme) fritekstsvaret. Kommer etter stemmen, så raden
-- finnes allerede; uten rad gjør den ingenting.
create or replace function public.set_feature_vote_note(p_feature text, p_note text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_txt text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if v_uid is null then
    raise exception 'ingen sesjon';
  end if;

  update public.feature_votes v
     set note    = left(v_txt, 500),
         note_at = case when v_txt is null then null else now() end
   where v.user_id = v_uid and v.feature = p_feature;

  return found;
end;
$$;

-- Har denne brukeren stemt? Brukes til å rendre flisa riktig ved
-- innlasting, så kvitteringen overlever en refresh.
create or replace function public.get_feature_vote_state(p_feature text)
returns table (has_voted boolean, has_note boolean)
language sql
security definer
set search_path = ''
as $$
  select true, (v.note is not null)
  from public.feature_votes v
  where v.user_id = auth.uid() and v.feature = p_feature;
$$;

-- Telling. IKKE eksponert for klienten: et lavt tall på flisa ville
-- dempet videre stemming, og tallet er uansett til intern beslutning.
-- Kjøres av Frode/Dobby med service_role.
create or replace function public.count_feature_votes(p_feature text, p_days integer default 30)
returns table (
  totalt          bigint,
  betalende       bigint,
  innlogget_gratis bigint,
  anonyme         bigint,
  med_fritekst    bigint
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
    and v.voted_at > now() - make_interval(days => p_days);
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Funksjonsrettigheter
-- ─────────────────────────────────────────────────────────────────────────
revoke all on function public.cast_feature_vote(text)            from anon, authenticated, public;
revoke all on function public.set_feature_vote_note(text, text)  from anon, authenticated, public;
revoke all on function public.get_feature_vote_state(text)       from anon, authenticated, public;
revoke all on function public.count_feature_votes(text, integer) from anon, authenticated, public;

-- Anonyme innlogginger får rollen `authenticated` med is_anonymous = true,
-- så dette dekker både dem og ekte brukere. Rollen `anon` (helt uten JWT)
-- skal ikke kunne stemme.
grant execute on function public.cast_feature_vote(text)           to authenticated;
grant execute on function public.set_feature_vote_note(text, text) to authenticated;
grant execute on function public.get_feature_vote_state(text)      to authenticated;

-- Tellingen er intern.
grant execute on function public.count_feature_votes(text, integer) to service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- 6. Vern mot opprydningsjobben (felle 1 over)
--    cleanup_anon_shells sletter anonyme skall uten rader i noen tabell.
--    feature_votes var ikke i lista, så et skall som hadde stemt ville
--    blitt slettet — og personen kunne stemt på nytt ved neste besøk.
-- ─────────────────────────────────────────────────────────────────────────
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
    returning u.id, u.created_at
  )
  insert into public.anon_cleanup_log (user_id, user_created_at)
  select id, created_at from slettet;
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.cleanup_anon_shells() from anon, authenticated, public;
