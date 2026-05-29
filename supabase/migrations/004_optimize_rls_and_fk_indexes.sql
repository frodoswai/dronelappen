-- 004_optimize_rls_and_fk_indexes.sql
-- Applied to wenjugvnxjmvbvlgnnhh as migration
-- `optimize_rls_initplan_and_fk_indexes` on 2026-05-29.
--
-- Performance-only changes (no behavior / no security surface change):
--
-- 1. auth_rls_initplan (advisor 0003): wrap auth.uid() in (select auth.uid())
--    so Postgres evaluates it once per query instead of once per row.
--    ALTER POLICY preserves the existing roles and command — it only
--    rewrites the USING / WITH CHECK expressions.
--
-- 2. unindexed_foreign_keys (advisor 0001): add covering indexes for the
--    two foreign keys that lacked them.

ALTER POLICY "users read own entitlement" ON public.entitlements
  USING ((select auth.uid()) = user_id);

ALTER POLICY "users read own sessions" ON public.quiz_sessions
  USING ((select auth.uid()) = user_id);
ALTER POLICY "users insert own sessions" ON public.quiz_sessions
  WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "users update own sessions" ON public.quiz_sessions
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

ALTER POLICY "users read own progress" ON public.user_progress
  USING ((select auth.uid()) = user_id);
ALTER POLICY "users insert own progress" ON public.user_progress
  WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "users update own progress" ON public.user_progress
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id
  ON public.quiz_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_question_id
  ON public.user_progress (question_id);
