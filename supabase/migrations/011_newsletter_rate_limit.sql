-- 011: Per-IP rate limiting for newsletter-signup.
--
-- Bakgrunn (sikkerhetsgjennomgangen 08.08.2026): endepunktet er aapent og
-- kunne misbrukes til aa melde inn vilkaarlige e-poster som 'active' (uten
-- dobbel opt-in for quiz-leads), og duplicate-flagget avslorer om en adresse
-- staar paa lista. Flagget beholdes bevisst (UI-et bruker det), men naa maa
-- en angriper i det minste gjennom en rate limit: maks 5 forsok per IP per
-- time. Ekte brukere sender 1-2. Grensen ligger HER, i newsletter_rate_check
-- - ikke i TypeScript - saa den kan justeres uten redeploy av funksjonen.
--
-- Tabellen holdes liten ved opportunistisk sletting av rader eldre enn 24 t
-- ved hvert kall. Kun service_role kan lese/kalle noe av dette.

create table if not exists public.newsletter_signup_hits (
  id bigint generated always as identity primary key,
  ip text not null,
  ts timestamptz not null default now()
);
create index if not exists newsletter_signup_hits_ip_ts_idx
  on public.newsletter_signup_hits (ip, ts);
alter table public.newsletter_signup_hits enable row level security;
revoke all on public.newsletter_signup_hits from anon, authenticated, public;

create or replace function public.newsletter_rate_check(p_ip text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent integer;
begin
  -- Opportunistisk opprydning saa tabellen aldri vokser.
  delete from public.newsletter_signup_hits where ts < now() - interval '24 hours';

  select count(*) into recent
    from public.newsletter_signup_hits
   where ip = p_ip
     and ts > now() - interval '1 hour';

  if recent >= 5 then
    return false;
  end if;

  insert into public.newsletter_signup_hits (ip) values (p_ip);
  return true;
end;
$$;

revoke all on function public.newsletter_rate_check(text) from anon, authenticated, public;
grant execute on function public.newsletter_rate_check(text) to service_role;
