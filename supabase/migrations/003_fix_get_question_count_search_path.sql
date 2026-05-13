-- 003_fix_get_question_count_search_path.sql
-- Pins search_path on get_question_count to satisfy Supabase advisor 0011
-- (function_search_path_mutable). Empty search_path + fully-qualified
-- references is the strongest defense against search_path injection by a
-- same-schema malicious object. Behavior is identical to the previous
-- version. Applied to wenjugvnxjmvbvlgnnhh on 2026-05-13.

CREATE OR REPLACE FUNCTION public.get_question_count()
RETURNS TABLE(total_questions bigint, total_categories bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT
    (SELECT count(*) FROM public.questions)  AS total_questions,
    (SELECT count(*) FROM public.categories) AS total_categories;
$function$;
