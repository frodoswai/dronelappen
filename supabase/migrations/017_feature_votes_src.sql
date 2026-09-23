-- 017: feature_votes.src — hvor stemmen kom fra.
--
-- Bakgrunn (23.09.2026): første STS-e-post gikk ut uten sporing, så vi kan
-- ikke skille stemmer fra e-posten fra dem som fant flisa selv. Neste
-- e-post får lenke med ?src=sts-epost-2. Appen fanger parameteren ved
-- innlasting (lib/voteSource.js) og sender den med stemmen.
--
-- Settes bare når stemmen avgis første gang (on conflict do nothing som
-- før), så en senere besøk via en annen lenke overskriver ikke kilden.
-- Eksisterende rader får null = ukjent kilde (før sporingen fantes).
--
-- Formatet er låst til korte slug-verdier. Klienten saniterer også, men
-- constrainten er fasiten: ugyldig src lagres som null i stedet for at
-- stemmen feiler.

alter table public.feature_votes
  add column if not exists src text;

alter table public.feature_votes
  drop constraint if exists feature_votes_src_fmt;
alter table public.feature_votes
  add constraint feature_votes_src_fmt
  check (src is null or src ~ '^[a-z0-9-]{1,40}$');

comment on column public.feature_votes.src is
  'Kilde fra ?src= i lenken brukeren kom inn via (f.eks. sts-epost-2). null = ukjent / før 23.09.2026.';

-- Ny signatur med valgfri p_src. Den gamle (text) droppes så det ikke
-- finnes to overloads PostgREST må velge mellom; kall med bare p_feature
-- treffer fortsatt via default.
drop function if exists public.cast_feature_vote(text);

create or replace function public.cast_feature_vote(p_feature text, p_src text default null)
returns table (has_voted boolean, has_note boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_anon  boolean;
  v_tier  text;
  v_src   text := lower(btrim(coalesce(p_src, '')));
begin
  if v_uid is null then
    raise exception 'ingen sesjon';
  end if;

  if p_feature not in ('sts') then
    raise exception 'ukjent funksjon: %', p_feature;
  end if;

  -- Ugyldig kilde skal aldri koste en stemme.
  if v_src !~ '^[a-z0-9-]{1,40}$' then
    v_src := null;
  end if;

  select u.is_anonymous into v_anon
  from auth.users u where u.id = v_uid;

  select case
           when e.tier = 'paid'
            and (e.expires_at is null or e.expires_at > now())
           then 'paid' else 'free'
         end
    into v_tier
  from public.entitlements e where e.user_id = v_uid;

  insert into public.feature_votes (user_id, feature, tier, is_anonymous, src)
  values (v_uid, p_feature, coalesce(v_tier, 'free'), coalesce(v_anon, true), v_src)
  on conflict (user_id, feature) do nothing;

  return query
    select true, (v.note is not null)
    from public.feature_votes v
    where v.user_id = v_uid and v.feature = p_feature;
end;
$$;

revoke all on function public.cast_feature_vote(text, text) from anon, authenticated, public;
grant execute on function public.cast_feature_vote(text, text) to authenticated;

notify pgrst, 'reload schema';
