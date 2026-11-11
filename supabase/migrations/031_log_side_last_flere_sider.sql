-- 031: log_side_last tar også /dronesertifikat-a2/ og /droneeksamen-oving/
-- (11.11.2026, Frodes ja samme kveld).
--
-- HVORFOR: de to sidene er også statiske og tok 10 av 69 annonseklikk
-- 27/10–11/11 (annonse før 31/10 og sitelinks). I motsetning til /a2/ og /sts/
-- er de indeksert og har organisk trafikk, så her logges bare besøk med
-- utm_source. Sjekken står både i sideskriptet og her. Dagstaket fra 030 står.

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
  if p_path is null or p_path not in ('/a2/', '/sts/', '/dronesertifikat-a2/', '/droneeksamen-oving/') then
    return;
  end if;
  -- Artikkelsidene har organisk trafikk. Der logges bare besøk med kjent kilde.
  if p_path in ('/dronesertifikat-a2/', '/droneeksamen-oving/')
     and nullif(p_utm_source, '') is null then
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
