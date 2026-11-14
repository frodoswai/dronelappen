-- 033: source_public, kilden som vises under forklaringen (14.11.2026, Frodes ja).
--
-- HVORFOR: source er et internt arbeidsfelt. For 88 spørsmål står det
-- «Gemini/EASA», «Custom», «Meteorologi» eller «Egen eksamenserfaring», og det
-- kan ikke vises til kunder. source_public er visningsteksten. Null betyr at
-- appen ikke viser noen kilde. get-questions v13 sender bare source_public.
--
-- Fylt ut 14.11.2026 med regelen under. Nye spørsmål må få source_public satt
-- for hånd, ellers vises ingen kilde.
-- Rollback: alter table public.questions drop column source_public;
--           (og ta source_public ut av select i get-questions).

alter table public.questions add column if not exists source_public text;

update public.questions set source_public = case
  when source is null or btrim(source)='' then null
  when source in ('Gemini/EASA','Custom','Meteorologi','Egen eksamenserfaring') then null
  when source ~ '^(Regnestykke|Definisjonen av knop|LiPo-kjemi|Generell meteorologi)' then null
  when source='luftfartstilsynet.no' then 'Luftfartstilsynet (luftfartstilsynet.no)'
  when source='flydrone.no kurs' then 'A1/A3-kurset på flydrone.no'
  when source='flydrone.no A2 kurs' then 'A2-kurset på flydrone.no'
  when source='flydrone.no egenerklæring' then 'Egenerklæringen for A2 på flydrone.no'
  when source='Tabell åpen kategori' then 'Luftfartstilsynet, tabellen «Regler i åpen kategori»'
  when source='sjekkliste åpen kategori' then 'Luftfartstilsynet, sjekkliste for åpen kategori'
  when source='transportstyrelsen.se A2' then 'Transportstyrelsen (Sverige), A2-pensum'
  when source='EASA A2 syllabus' then 'EASA, pensum for A2'
  when source='EASA FAQ Drones (UAS)' then 'EASA, spørsmål og svar om droner'
  when source='EASA C4 leaflet' then 'EASA, informasjonsark for klasse C4'
  when source='avinor.no' then 'Avinor (avinor.no)'
  when source='datatilsynet.no' then 'Datatilsynet (datatilsynet.no)'
  when source='nsm.no' then 'NSM (nsm.no)'
  when source='miljodirektoratet.no' then 'Miljødirektoratet (miljodirektoratet.no)'
  when source='luftfartstilsynet.no / EASA' then 'Luftfartstilsynet og EASA'
  when source='EASA EAR art. 14(5) / NPA-research 2026-06' then 'Forordning (EU) 2019/947 art. 14(5)'
  when source='EASA EAR / NPA-research 2026-06' then 'Forordning (EU) 2019/947'
  else regexp_replace(regexp_replace(source, '\mLT,? ', 'Luftfartstilsynet, ', 'g'), '\mEU (20\d\d/\d+)', 'Forordning (EU) \1', 'g')
end;
