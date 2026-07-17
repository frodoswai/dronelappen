-- 006: «Er du klar?»-score — get_readiness() RPC (2026-07-15)
-- Anvendt i prod via Supabase MCP (apply_migration: add_get_readiness_rpc).
--
-- Aggregert beredskap per eksamenstype/kategori for innlogget bruker
-- (inkl. anonyme sesjoner). SECURITY DEFINER fordi questions-tabellen er
-- RLS-låst — funksjonen lekker INGEN spørsmålsdata, kun tellinger, og
-- filtrerer alltid på auth.uid(). «Siste svar per spørsmål» teller, slik
-- at scoren måler mestring nå, ikke gamle feil.

create or replace function public.get_readiness()
returns table(exam_type text, category text, total_questions int, answered int, correct int)
language sql
security definer
set search_path = public
stable
as $$
  with latest as (
    select distinct on (up.question_id) up.question_id, up.correct
    from user_progress up
    where up.user_id = auth.uid()
    order by up.question_id, up.answered_at desc
  )
  select q.exam_type::text,
         c.name::text,
         count(q.id)::int as total_questions,
         count(l.question_id)::int as answered,
         count(*) filter (where l.correct)::int as correct
  from questions q
  join categories c on c.id = q.category_id
  left join latest l on l.question_id = q.id
  where auth.uid() is not null
  group by q.exam_type, c.name
  order by q.exam_type, c.name;
$$;

revoke all on function public.get_readiness() from public;
grant execute on function public.get_readiness() to authenticated, anon;
