-- 009_tighten_rpc_grants.sql — sikkerhetsstramming 08.08.2026
--
-- Supabase-advisor 0028 flagget at SECURITY DEFINER-RPC-ene kunne kalles av
-- `anon` (uinnlogget, kun anon-nøkkel — ingen sesjon). Appen gir ALLE
-- besøkende en sesjon (signInAnonymously i AuthContext), så alle reelle kall
-- skjer som `authenticated`. Disse revokene endrer derfor ingenting for
-- brukere, men stenger drive-by-misbruk uten sesjon:
--
--   * log_question_answer: uinnlogget curl-spam kunne forgifte question_stats
--     (grunnlaget for vanskelighetsgrad-statistikken). Klienten sluker feil
--     (fire-and-forget), så i verste fall mister en sesjonsløs bruker bare
--     statistikklogging — aldri quizen.
--   * get_readiness / get_mistake_question_ids: returnerte uansett tomt for
--     anon (auth.uid() IS NULL) — ren lint-hygiene, null atferdsendring.
--
-- Beholdt anon-tilgang med vilje:
--   * get_question_count: kalles fra Home.jsx via REST uten Authorization-
--     header, og lekker bare totaltall.
--   * get_category_question_ids: brukes i Quiz (kast-feil-sti, ikke sluk), og
--     lekker bare UUID-er — questions-tabellen selv er RLS-låst uten policyer.
--
-- NB: REVOKE fra PUBLIC er nødvendig i tillegg til anon — Postgres gir
-- EXECUTE til PUBLIC som standard, og anon arver via den.

REVOKE EXECUTE ON FUNCTION public.log_question_answer(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_question_answer(uuid, boolean) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_readiness() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_readiness() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_mistake_question_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_mistake_question_ids() TO authenticated, service_role;
