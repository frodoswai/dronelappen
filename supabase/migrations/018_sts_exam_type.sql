-- 018: STS-påbygget (A2_STS) som ny eksamenstype (2026-09-30)
-- Anvendt i prod via Supabase MCP (apply_migration: sts_exam_type).
--
-- Bakgrunn: Frode besluttet 30.09.2026 at STS-banken bygges, med
-- påbygget «Utvidelse av A2 til STS» (DRONEA2STS, 30 spm / 23 riktige /
-- 60 min) som første lansering. Brief: MacMiniHub/notes/briefs/
-- 2026-09-30-dronelappen-sts-banken.md, del B.
--
-- Denne migrasjonen er INERT: den utvider bare det som er lov å lagre.
-- Ingen kategorier eller spørsmål legges inn her. Det gjør
-- supabase/seed-sts.mjs på lanseringsdagen, slik at tellingen
-- (get_question_count, antall.json) og readiness først endrer seg da.
--
-- 1. CHECK-constraintene på categories og questions tillater 'A2_STS'.
--    (quiz_sessions har ikke lenger CHECK på exam_type i prod.)
-- 2. questions.overlap_group: spørsmål med samme verdi avslører
--    hverandre og skal ikke trekkes i samme eksamensrunde. Nullable,
--    brukes foreløpig bare av STS-banken (8 grupper).

alter table public.categories drop constraint if exists categories_exam_type_check;
alter table public.categories
  add constraint categories_exam_type_check
  check (exam_type = any (array['A1_A3'::text, 'A2'::text, 'A2_STS'::text]));

alter table public.questions drop constraint if exists questions_exam_type_check;
alter table public.questions
  add constraint questions_exam_type_check
  check (exam_type = any (array['A1_A3'::text, 'A2'::text, 'A2_STS'::text]));

alter table public.questions
  add column if not exists overlap_group text;

alter table public.questions drop constraint if exists questions_overlap_group_fmt;
alter table public.questions
  add constraint questions_overlap_group_fmt
  check (overlap_group is null or overlap_group ~ '^[a-z0-9-]{1,60}$');

comment on column public.questions.overlap_group is
  'Spørsmål med samme verdi avslører hverandre og skal ikke trekkes i samme eksamensrunde (Quiz.jsx). null = ingen gruppe. Innført 30.09.2026 for STS-banken.';
