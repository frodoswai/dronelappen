-- TEMPLATE.sql — copy this when adding a new table to public.
-- Not auto-applied. See README.md in this folder for context.
--
-- Why explicit grants matter:
--   From 2026-05-30 (new projects) and 2026-10-30 (existing projects,
--   including wenjugvnxjmvbvlgnnhh), Supabase no longer auto-exposes new
--   public-schema tables to the Data API. PostgREST returns 42501 with the
--   exact GRANT statement to fix it. Tables created BEFORE Oct 30 keep
--   their existing grants — only NEW tables are affected.
--
--   Source: https://github.com/orgs/supabase/discussions/45329

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Table
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE public.your_table (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
  -- ... your columns
);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Explicit grants — required for Data API access post-2026-10-30
--    Pick only the privileges each role actually needs. Default to least.
-- ─────────────────────────────────────────────────────────────────────────

-- Anonymous (public, no JWT). Grant SELECT only if the table is meant to
-- be readable by logged-out visitors. Skip entirely otherwise.
-- GRANT SELECT ON public.your_table TO anon;

-- Signed-in users (typical case for user-scoped tables).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.your_table TO authenticated;

-- Service role (server-side, bypasses RLS). Almost always full CRUD.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.your_table TO service_role;

-- If your table uses a sequence (SERIAL/BIGSERIAL/IDENTITY), grant USAGE
-- on it to whichever roles can INSERT:
--   GRANT USAGE, SELECT ON SEQUENCE public.your_table_id_seq TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. RLS — always enable. Grants alone are not access control.
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Policies — narrow the grants to per-row access.
--    Pattern for user-scoped tables: auth.uid() = user_id
-- ─────────────────────────────────────────────────────────────────────────
CREATE POLICY "users read own rows" ON public.your_table
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own rows" ON public.your_table
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own rows" ON public.your_table
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE policy: add only if users are allowed to delete their own rows.

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Functions (if any) — always pin search_path. Use empty + qualified
--    references for the strongest defense against search_path injection.
-- ─────────────────────────────────────────────────────────────────────────
-- CREATE OR REPLACE FUNCTION public.your_function(...)
-- RETURNS ...
-- LANGUAGE sql
-- SECURITY DEFINER
-- SET search_path = ''
-- AS $function$
--   SELECT ... FROM public.your_table WHERE ...;
-- $function$;
--
-- GRANT EXECUTE ON FUNCTION public.your_function(...) TO authenticated;
