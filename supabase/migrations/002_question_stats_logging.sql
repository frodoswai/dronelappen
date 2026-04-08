-- 002_question_stats_logging.sql
-- Per-question aggregate stats for analytics (no user identifiers).
-- All writes flow through log_question_answer() RPC (SECURITY DEFINER).
-- Applied to wenjugvnxjmvbvlgnnhh on 2026-04-08.

CREATE TABLE public.question_stats (
  question_id UUID PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE,
  times_shown INTEGER NOT NULL DEFAULT 0,
  times_correct INTEGER NOT NULL DEFAULT 0,
  times_wrong INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.question_stats ENABLE ROW LEVEL SECURITY;

-- No direct INSERT/UPDATE policies — all writes go through the RPC below.
-- SELECT policy: allow anon read so we can build a "stats" view later.
CREATE POLICY "anon can read stats" ON public.question_stats
  FOR SELECT TO anon USING (true);

-- Secure RPC for anon increment (SECURITY DEFINER bypasses RLS safely).
CREATE OR REPLACE FUNCTION public.log_question_answer(
  p_question_id UUID,
  p_was_correct BOOLEAN
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.question_stats (question_id, times_shown, times_correct, times_wrong)
  VALUES (
    p_question_id,
    1,
    CASE WHEN p_was_correct THEN 1 ELSE 0 END,
    CASE WHEN p_was_correct THEN 0 ELSE 1 END
  )
  ON CONFLICT (question_id) DO UPDATE SET
    times_shown = question_stats.times_shown + 1,
    times_correct = question_stats.times_correct + CASE WHEN p_was_correct THEN 1 ELSE 0 END,
    times_wrong = question_stats.times_wrong + CASE WHEN p_was_correct THEN 0 ELSE 1 END,
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_question_answer(UUID, BOOLEAN) TO anon;
