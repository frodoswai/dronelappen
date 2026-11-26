-- 034: entitlements.sts, nivå for STS-tilgang (26.11.2026, Frodes ja i chat).
--
-- HVORFOR: fra 1.12.2026 selges to nivåer: A2 (349 kr) og A2 + STS (449 kr),
-- pluss STS-påbygg (149 kr) for dem som har A2. tier ('free' | 'paid') sier
-- ikke hvilket nivå kunden har. sts = true betyr at tilgangen omfatter
-- STS-banken (exam_type A2_STS).
--
-- Backfill: alle som har kjøpt før byttet har STS i hele perioden sin
-- (Frode 4/10), så alle betalte rader settes til true. Kjøp mellom denne
-- migrasjonen og 1.12 får true av stripe-webhook (session.created før
-- STS_TIER_AT), så backfillen trenger ikke kjøres på nytt.
--
-- Leses av: get-questions (v14), create-checkout, AuthContext (kommer).
-- Skrives av: stripe-webhook. Eier leser kolonnen via eksisterende policy
-- «users read own entitlement»; tabellgranten dekker den nye kolonnen.
-- Viewet sale_attribution er uberørt (filtrerer på tier).
--
-- Kjørt 26.11.2026 via Supabase MCP apply_migration: 64 rader, alle sts = true.
-- Rollback: alter table public.entitlements drop column sts;
--           (deploy først forrige versjon av de tre edge-funksjonene:
--            MacMiniHub/.config/dronelappen-*-backup-20261126.ts)

alter table public.entitlements add column if not exists sts boolean not null default false;

update public.entitlements set sts = true where tier = 'paid';

comment on column public.entitlements.sts is
  'true = tilgangen omfatter STS (A2_STS). Alle kjop for 2026-12-01 har true. Settes av stripe-webhook.';
