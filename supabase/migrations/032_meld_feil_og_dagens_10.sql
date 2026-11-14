-- 032: «Meld feil i spørsmålet» og «Dagens 10» (14.11.2026, Frodes ja i chat).
--
-- 1) question_reports: brukere kan melde feil i et spørsmål fra forklaringen
--    i Læring og fra fasitgjennomgangen. Skrives bare gjennom report_question()
--    (SECURITY DEFINER). Tabellen har RLS uten policyer, så ingen kan lese
--    eller skrive den med anon-nøkkelen direkte.
--    Vern mot fylling: maks 100 meldinger siste 24 timer totalt, og maks 5 per
--    innlogget bruker. Over taket gjør funksjonen ingenting, uten feilmelding.
--    Merknaden kuttes til 500 tegn. user_id lagres når brukeren har en økt,
--    ellers null. Ingen IP lagres.
--
-- 2) get_answered_question_ids(): ID-ene brukeren har svart på. Brukes av
--    «Dagens 10» (?dagens=1 i Læring) til å blande gamle feil med usette
--    spørsmål. Samme sikkerhetsmodell som get_mistake_question_ids (007):
--    lekker bare UUID-er, filtrerer alltid på auth.uid().
--
-- Rollback: drop function public.report_question(uuid, text);
--           drop function public.get_answered_question_ids();
--           drop table public.question_reports;

create table if not exists public.question_reports (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid,
  note text,
  created_at timestamptz not null default now(),
  handled_at timestamptz
);
alter table public.question_reports enable row level security;
revoke all on public.question_reports from anon, authenticated;
create index if not exists question_reports_created_idx on public.question_reports (created_at);

create or replace function public.report_question(p_question_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if p_question_id is null
     or not exists (select 1 from public.questions where id = p_question_id) then
    return;
  end if;
  if (select count(*) from public.question_reports
       where created_at > now() - interval '24 hours') >= 100 then
    return;
  end if;
  if auth.uid() is not null and
     (select count(*) from public.question_reports
       where user_id = auth.uid()
         and created_at > now() - interval '24 hours') >= 5 then
    return;
  end if;
  insert into public.question_reports (question_id, user_id, note)
  values (p_question_id, auth.uid(), nullif(left(btrim(coalesce(p_note, '')), 500), ''));
end;
$function$;

revoke all on function public.report_question(uuid, text) from public;
grant execute on function public.report_question(uuid, text) to anon, authenticated, service_role;

create or replace function public.get_answered_question_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select distinct up.question_id
  from user_progress up
  where up.user_id = auth.uid()
    and auth.uid() is not null;
$$;

revoke all on function public.get_answered_question_ids() from public;
grant execute on function public.get_answered_question_ids() to authenticated, anon;
