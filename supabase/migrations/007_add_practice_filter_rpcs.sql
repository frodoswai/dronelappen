-- 007: Målrettet læring — feilbank + kategorifilter (2026-07-18)
-- Anvendt i prod via Supabase MCP (apply_migration: add_practice_filter_rpcs).
--
-- To små RPC-er som gjør Læring filtrerbar:
--   get_mistake_question_ids()  → spørsmål der brukerens SISTE svar var feil
--                                 («øv på det du har bommet på»)
--   get_category_question_ids() → alle spørsmåls-IDer i én kategori
--                                 (score-kortets «svakest: X» blir handlingsrettet)
--
-- Samme sikkerhetsmodell som get_readiness (006): SECURITY DEFINER fordi
-- questions/user_progress er RLS-låst, men funksjonene lekker kun UUID-er
-- (aldri spørsmålsinnhold), og feilbanken filtrerer alltid på auth.uid().
-- Klienten SNITTER disse ID-ene mot settet fra get-questions-funksjonen,
-- så gratis-brukere kan aldri nå spørsmål utenfor free_pool via filtrene.

create or replace function public.get_mistake_question_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select question_id from (
    select distinct on (up.question_id) up.question_id, up.correct
    from user_progress up
    where up.user_id = auth.uid()
    order by up.question_id, up.answered_at desc
  ) latest
  where not latest.correct
    and auth.uid() is not null;
$$;

revoke all on function public.get_mistake_question_ids() from public;
-- anon får kalle den også: auth.uid() er null → tomt sett, og klienten
-- viser «logg inn og øv litt først»-tilstanden i stedet for en feil.
grant execute on function public.get_mistake_question_ids() to authenticated, anon;

create or replace function public.get_category_question_ids(
  p_exam_type text,
  p_category text
)
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select q.id
  from questions q
  join categories c on c.id = q.category_id
  where q.exam_type = p_exam_type
    and c.name = p_category;
$$;

revoke all on function public.get_category_question_ids(text, text) from public;
grant execute on function public.get_category_question_ids(text, text) to authenticated, anon;
