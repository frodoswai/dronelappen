-- 014: sale_attribution skal ikke ligge i PostgREST-skjemaet.
--
-- Viewet arvet Supabases standard-grants til anon/authenticated. Med
-- security_invoker = true lekker det ingenting - RLS paa entitlements slipper
-- bare brukerens egen rad gjennom - men et analyseview ingen klient bruker
-- skal heller ikke staa eksponert. service_role og dobby_daily beholder sine.

revoke all on public.sale_attribution from anon, authenticated;
