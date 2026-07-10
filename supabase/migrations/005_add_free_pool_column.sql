-- 005: Kuratert gratis-pool (2026-07-08)
-- Anvendt i prod via Supabase MCP (apply_migration: add_free_pool_column).
--
-- Bakgrunn: get-questions Edge Function ga gratis-brukere «de 25 første
-- etter id» per eksamenstype — deterministisk (ingen pumpe-lekkasje),
-- men ukuratert. Nå flagges et håndplukket sett i DB i stedet, og
-- funksjonen (v8) henter .eq('free_pool', true).limit(25).
--
-- Utvalgskriterier v1 (2026-07-08): round-robin per kategori, lengst
-- forklaring først. RE-KURATERT v2 (2026-07-10): vanskelighet DESC før
-- forklaringslengde — traktdata viste snitt 21,6/25 og 86 % bestått på
-- gratisprøven (for lett → ingen kjøpsgrunn). Ny mix: A2 = 19×diff3 +
-- 6×diff2; A1/A3 = 7×diff3 + 15×diff2 + 3×diff1. Fortsatt full
-- kategorispredning via round-robin.

ALTER TABLE questions ADD COLUMN IF NOT EXISTS free_pool boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN questions.free_pool IS 'Kuratert gratis-pool: de 25 spørsmålene per eksamenstype som anonyme/gratis-brukere får via get-questions. Kuratert 2026-07-08.';

-- Utvalget (data, ikke DDL) — kjøres på nytt ved re-kuratering:
-- BEGIN;
-- UPDATE questions SET free_pool = false;
-- WITH ranked AS (
--   SELECT q.id, q.exam_type,
--          row_number() OVER (PARTITION BY q.exam_type, q.category_id
--                             ORDER BY length(coalesce(q.explanation,'')) DESC, q.id) AS rn,
--          count(*) OVER (PARTITION BY q.exam_type, q.category_id) AS cat_n
--   FROM questions q
-- ), picked AS (
--   SELECT id, row_number() OVER (PARTITION BY exam_type ORDER BY rn, cat_n DESC, id) AS pick_rank
--   FROM ranked
-- )
-- UPDATE questions SET free_pool = true
-- WHERE id IN (SELECT id FROM picked WHERE pick_rank <= 25);
-- COMMIT;
