-- 030: dagstak på log_side_last (11.11.2026, Frodes ja samme kveld).
--
-- HVORFOR: funksjonen fra 029 kan kalles av alle som har den åpne
-- anon-nøkkelen. Noen kan dermed skrive falske side_last-rader fra et skript.
-- De kan ikke lese eller endre noe, men de kan fylle tabellen. Taket stopper
-- det: maks 300 rader siste 24 timer, uansett side. Ekte trafikk er 5–10 om
-- dagen. Over taket gjør funksjonen ingenting, uten feilmelding.
--
-- Ingenting nytt lagres om besøkeren (ingen IP, ingen bruker-ID).

create index if not exists visit_events_side_last_created_idx
  on public.visit_events (created_at)
  where event = 'side_last';

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
  if p_path is null or p_path not in ('/a2/', '/sts/') then
    return;
  end if;
  -- Dagstak: maks 300 rader siste 24 timer, uansett side.
  if (select count(*) from public.visit_events
       where event = 'side_last'
         and created_at > now() - interval '24 hours') >= 300 then
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
