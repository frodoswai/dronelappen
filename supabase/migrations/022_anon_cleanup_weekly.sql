-- 022: anon-oppryddingen kjører ukentlig i stedet for 1. i måneden (10.10.2026).
--
-- KJØRT 10.10.2026 etter Frodes ja («Du får ja til å gjøre det hver søndag»),
-- via apply_migration 022_anon_cleanup_weekly. 020 er reservert av
-- mur-briefen (lead_bonus, mandag 12.10), derfor 022.
--
-- Bakgrunn: pg_cron-jobben anon-cleanup-monthly (010) slettet 975 skall 1/9 og
-- 406 skall 1/10. Kriteriet er riktig (kun anonyme kontoer eldre enn 14 dager
-- uten én eneste rad i noen tabell), men månedstakten gir et stup på
-- Besøkende-tallet i Mission Control (1 017 -> 615 natt til 1/10). Ukentlig
-- rydder 50-100 per gang og tallet blir jevnt.
--
-- Funksjonen public.cleanup_anon_shells() (sist endret i 019) røres IKKE.
-- Bare tidsplanen endres: '14 3 1 * *' -> '14 3 * * 0' (søndag 03:14 UTC,
-- 05:14 norsk sommertid / 04:14 vintertid). Jobbnavnet beholdes så loggen i
-- cron.job_run_details henger sammen.
--
-- Rollback: select cron.alter_job((select jobid from cron.job where jobname='anon-cleanup-monthly'), schedule := '14 3 1 * *');

select cron.alter_job(
  (select jobid from cron.job where jobname = 'anon-cleanup-monthly'),
  schedule := '14 3 * * 0'
);
