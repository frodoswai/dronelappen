-- 029: visit_events får hendelsen side_last fra kjøpssidene (11.11.2026).
--
-- HVORFOR: Ads viste 69 klikk 27/10–11/11, visit_events 23 brukere. Gapet er
-- ikke et tap: /a2/ og /sts/ er statiske sider uten logging, og en landingsrad
-- skrives først når besøkeren klikker seg inn i appen. To av tre betalte klikk
-- stoppet dermed på en side vi ikke målte. Prisen og kjøpsknappen står øverst
-- på sidene, så «siden lastet» betyr i praksis «så prisen».
--
-- De statiske sidene har ingen Supabase-klient og ingen bruker. Derfor en
-- SECURITY DEFINER-funksjon som anon kan kalle, i stedet for å åpne tabellen
-- for anon. Funksjonen skriver bare side_last, bare for de to kjøpssidene, og
-- bare kanalfeltene. user_id er alltid null, og klikk-ID lagres ikke her.
--
-- Viewet campaign_click_to_session filtrerer på event = 'landing' og
-- 'quiz_start' og påvirkes ikke.

alter table public.visit_events
  drop constraint if exists visit_events_event_check;
alter table public.visit_events
  add constraint visit_events_event_check
    check (event in ('landing', 'quiz_start', 'side_last'));

create or replace function public.log_side_last(
  p_path text,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_utm_content text default null,
  p_utm_term text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  -- Ukjent sti: gjør ingenting, uten feilmelding.
  if p_path is null or p_path not in ('/a2/', '/sts/') then
    return;
  end if;
  insert into public.visit_events
    (user_id, event, landing_path, utm_source, utm_medium, utm_campaign, utm_content, utm_term)
  values (
    null, 'side_last', p_path,
    nullif(left(p_utm_source, 120), ''),
    nullif(left(p_utm_medium, 120), ''),
    nullif(left(p_utm_campaign, 200), ''),
    nullif(left(p_utm_content, 200), ''),
    nullif(left(p_utm_term, 200), '')
  );
end;
$function$;

revoke all on function public.log_side_last(text, text, text, text, text, text) from public;
grant execute on function public.log_side_last(text, text, text, text, text, text) to anon, authenticated, service_role;
