# STS-spørsmålsbank - batch 2 (A2→STS-påbygget), 48 spørsmål

Utkast 2026-09-30. Kanonisk fil: `content/sts/sts-batch-2-a2-til-sts.json`. Ikke i Supabase. Nummerering 31-79 fortsetter batch 1. n 31, 40 og 73 vises også som eksempler på /sts-eksamen/ (kopi i sts-smakebit.json). Endres de her, må landingssiden endres samme sted.

DRONEA2STS (30 spm / 23 riktige). Emnene er verifisert mot EU 2020/639 Attachment A til kap. I pkt. (1)(b): den som har A2-bevis tar minst 30 spørsmål fordelt på emne (i)-(v): regelverk, menneskelige ytelsesbegrensninger, operasjonelle prosedyrer, tekniske og operasjonelle tiltak mot bakkerisiko, og generell UAS-kunnskap. Meteorologi, flygeytelse og luftrisiko (vi-viii) er ikke med i påbygget. Tidsgrense: ikke publisert av Luftfartstilsynet eller Statens vegvesen per 30.09.2026.

Kilder: se `meta.sources` i JSON-fila. Runde 3 (30.09, Fable): n 35, 51, 65 og 79 justert, flere overlap_group (se `meta.revidert`).

Revidert 04.10.2026 (batch 3-briefen): ny vanskelighetsgrad, kortere svaralternativer, ny stamme i n 8 og 12, og nye overlap_group mot batch 3. Riktig svar er det samme. Listen står i MacMiniHub `notes/completion-pages/2026-10-04-sts-batch3-LIVE.md`.

---

### 31. Regelverk og kategorier · vanskegrad 1

Et firma fikk bekreftet STS-01-deklarasjonen sin for to år og tre måneder siden og har ikke sendt inn noe siden. Kan de fortsatt fly på den?

- a) Ja, en deklarasjon gjelder til operatøren selv trekker den tilbake
- b) Nei, en deklarasjon gjelder i 2 år, så de må sende en ny ✅
- c) Ja, så lenge pilotenes kompetansebevis fortsatt er gyldige
- d) Nei, deklarasjonen må fornyes hvert år sammen med årsgebyret

*Forklaring:* En deklarasjon gjelder i 2 år. Luftfartstilsynet skriver det samme: operatøren må sende inn en ny deklarasjon for å fortsette på STS. Pilotenes kompetansebevis (5 år) er en egen sak, og årsgebyret etter gebyrforskriften er ikke en fornyelse av deklarasjonen. (Regelen om varighet for deklarasjoner: UAS.SPEC.085)

*Kilde:* EU 2019/947 UAS.SPEC.085 (innført ved EU 2020/639); luftfartstilsynet.no, «Søke om STS» (tidsbegrenset deklarasjon og årsgebyr etter gebyrforskriften)

---

### 32. Regelverk og kategorier · vanskegrad 1

Operatøren sendte STS-02-deklarasjonen i Altinn i morges. Når kan første flyging under scenarioet tidligst skje?

- a) Med en gang den er sendt inn i Altinn
- b) Etter en prøveflyging for Luftfartstilsynet
- c) Når den er bekreftet mottatt og fullstendig ✅
- d) Etter 14 dager uten innsigelser fra tilsynet

*Forklaring:* Myndigheten skal kontrollere at deklarasjonen har alle pliktige opplysninger og gi en bekreftelse på mottak og fullstendighet uten unødig opphold. Først når den bekreftelsen er mottatt, har operatøren rett til å starte. Det er ingen godkjenning av selve operasjonen, men heller ingen automatisk start ved innsending.

*Kilde:* EU 2019/947 UAS.SPEC.020 (3)-(4); luftfartstilsynet.no, «Søke om STS» (deklarasjon via Altinn)

---

### 33. Regelverk og kategorier · vanskegrad 2

Etter at STS-01-deklarasjonen er bekreftet, bytter operatøren til en C5-drone av en annen modell enn den som står i deklarasjonen. Hva sier regelverket?

- a) Ingenting, deklarasjonen gjelder operatøren, ikke dronen
- b) Søke operasjonstillatelse for den nye modellen
- c) Endringen tas med når deklarasjonen fornyes etter to år
- d) Melde endringen til Luftfartstilsynet uten opphold ✅

*Forklaring:* Deklarasjonsskjemaet inneholder produsent, modell og serienummer for dronen. Reglene for deklarasjoner sier at operatøren uten opphold skal varsle myndigheten om enhver endring i opplysningene. Et modellbytte innenfor C5 krever ikke operasjonstillatelse, men det skal meldes. (UAS.SPEC.020 punkt 5)

*Kilde:* EU 2019/947 UAS.SPEC.020 (5) og Appendix 2 (deklarasjonsskjemaet)

---

### 34. Regelverk og kategorier · vanskegrad 2

En STS-01-operasjon er planlagt i kontrollert luftrom. Hva krever regelverket for at operasjonen kan gjøres under en deklarasjon?

- a) Ingenting, VLOS under 120 m er lov i alt luftrom
- b) At den følger publiserte prosedyrer for området ✅
- c) Det går ikke, STS gjelder bare luftromsklasse G
- d) At operatøren har et operatørsertifikat (LUC)

*Forklaring:* Reglene for deklarasjoner åpner for STS under 120 m i ukontrollert luftrom (klasse F eller G), eller i kontrollert luftrom når operasjonen følger publiserte prosedyrer for området, slik at sannsynligheten for å møte bemannede luftfartøy er lav. Den praktiske opplæringen for STS omfatter derfor også prosedyrer for kontakt med flygekontrollen og klarering når det trengs. (UAS.SPEC.020 punkt 1 b)

*Kilde:* EU 2019/947 UAS.SPEC.020 (1)(b); EU 2020/639 Attachment A til kap. I, tabell 1 (a)(i)(I)

---

### 35. Regelverk og kategorier · vanskegrad 3

Hvem kan utstede beviset på gjennomført praktisk opplæring (accreditation of completion) for STS-01?

- a) En anerkjent droneskole eller en STS-01-operatør med deklarert opplæring ✅
- b) Bare Luftfartstilsynet, etter en praktisk prøve med sensor fra tilsynet
- c) Trafikkstasjonen, samtidig med at teoriprøven blir bestått
- d) Enhver pilot med STS-bevis og minst to års erfaring

*Forklaring:* Driftsreglene for STS-01 nevner to som kan utstede beviset: en enhet som har erklært at den oppfyller kravene til opplæringsenheter, og som er anerkjent av myndigheten, eller en operatør som har deklarert STS-01 og i tillegg erklært samsvar med de samme kravene. Trafikkstasjonen tar bare teoriprøven. I Norge viser Luftfartstilsynet til praktisk trening hos droneskoler som har deklarert for STS-opplæring. (Driftsreglene for STS-01: UAS.STS-01.020 punkt 1 e. Kravene til opplæringsenheter: Appendix 3)

*Kilde:* EU 2020/639 UAS.STS-01.020 (1)(e)(ii); Appendix 3; luftfartstilsynet.no, «Søke om STS» og «Droneregler» (droneskoler som har deklarert for STS-opplæring)

---

### 36. Regelverk og kategorier · vanskegrad 3

Hva gjør at en STS-deklarasjon ikke lenger regnes som fullstendig, selv om det er under to år siden den ble bekreftet?

- a) Tilsyn viser at operasjonen ikke gjennomføres i samsvar med deklarasjonen ✅
- b) Operatøren har ikke fløyet under scenarioet på seks måneder
- c) Operatøren tar inn en ny pilot med gyldig STS-bevis og praktisk opplæring
- d) Dronen har vært til service hos produsenten og fått nye propeller

*Forklaring:* Regelverket lister tre forhold: tilsynet finner at operasjonen ikke skjer slik deklarasjonen sier, forholdene har endret seg slik at deklarasjonen ikke lenger oppfyller kravene, eller myndigheten ikke får tilgang til operatøren for tilsyn. Opphold i flygingen eller nye, kvalifiserte piloter påvirker ikke gyldigheten. (Regelen om gyldighet for deklarasjoner: UAS.SPEC.085)

*Kilde:* EU 2019/947 UAS.SPEC.085 (1)-(3)

---

### 37. STS-01: rammer for VLOS · vanskegrad 2

Under en STS-01-operasjon skal dronen fly opp til 120 m over bakken, og det er ingen høye hindringer i nærheten. Hvor høyt kan operasjonsvolumet, altså flygeområdet pluss contingency-volumet, maksimalt gå?

- a) 120 m, contingency-volumet må ligge under grensen
- b) 135 m
- c) Det finnes ingen øvre grense for contingency-volumet
- d) 150 m ✅

*Forklaring:* Dronen skal holdes innenfor 120 m fra nærmeste punkt på bakken, men de generelle reglene for STS-01 lar operasjonsvolumet gå inntil 30 m over den høyden som ellers er tillatt. 120 + 30 = 150 m. Det gir rom for contingency-prosedyrer over flygeområdet. (UAS.STS-01.010 punkt 3)

*Kilde:* EU 2020/639 UAS.STS-01.010 (1) og (3)

---

### 38. STS-01: rammer for VLOS · vanskegrad 1

Et STS-01-oppdrag skal dokumentere en stor øvelse fra to vinkler samtidig. To piloter flyr hver sin C5-drone i samme kontrollerte bakkeområde. Er det lov?

- a) Ja, kravet er at hver pilot bare opererer én drone om gangen ✅
- b) Nei, det kan bare være én drone i lufta i hvert kontrollerte bakkeområde
- c) Nei, den ene piloten må i så fall fly i åpen kategori A2
- d) Ja, men bare hvis den ene piloten styrer begge fra samme kontrollenhet

*Forklaring:* Pilotens plikter i STS-01 sier at piloten bare skal operere én drone om gangen. Det samme gjelder i STS-02. Regelverket forbyr ikke flere droner i samme område, men hver drone må ha sin egen pilot, og kontrollen skal ikke overlates til en annen kontrollenhet. Koordineringen mellom pilotene bør stå i operasjonsmanualens kommunikasjonsprosedyrer. (UAS.STS-01.040)

*Kilde:* EU 2020/639 UAS.STS-01.040 (2)(d) og (f); UAS.STS-02.040 (2)(c); Appendix 5 pkt. (6)(c)(i)(E)

---

### 39. STS-01: rammer for VLOS · vanskegrad 1

C5-dronen har geo-awareness, og STS-01-oppdraget ligger i en geografisk sone som krever oppdaterte data i funksjonen. Hvem skal sørge for at dataene lastes opp?

- a) Luftfartstilsynet, når deklarasjonen bekreftes
- b) Produsenten, via automatiske oppdateringer
- c) Operatøren ✅
- d) Ingen, geo-awareness brukes ikke i spesifikk kategori

*Forklaring:* Operatørens plikter i STS-01 sier at operatøren skal laste opp oppdatert informasjon i geo-awareness-funksjonen, dersom dronen har den, når den geografiske sonen krever det. Piloten skal i tillegg hente oppdatert informasjon om geografiske soner før flyging. (UAS.STS-01.030)

*Kilde:* EU 2020/639 UAS.STS-01.030 (7); UAS.SPEC.060 (2)(a)

---

### 40. STS-02: BVLOS og observatører · vanskegrad 1

Hva krever STS-02 om dronens posisjon under oppskyting og landing?

- a) Utenfor syne er greit så lenge den følger den programmerte banen
- b) I pilotens syn, unntatt ved landing etter nødavslutning ✅
- c) Innenfor syn til nærmeste luftromsobservatør
- d) Det er ikke regulert i STS-02

*Forklaring:* Selv om STS-02 er flyging utenfor synsrekkevidde, sier driftsreglene at piloten skal se dronen under oppskyting og landing. Unntaket er når landingen er resultatet av en nødavslutning av flygingen. (Driftsreglene for STS-02, punkt 4: UAS.STS-02.020)

*Kilde:* EU 2020/639 UAS.STS-02.020 (4)

---

### 41. STS-02: BVLOS og observatører · vanskegrad 3

Før en STS-02-flyging med tre luftromsobservatører langs en kraftlinje: hva må operatøren blant annet kontrollere?

- a) At observatørene har eget STS-kompetansebevis
- b) At de står nøyaktig 1 km fra hverandre
- c) At sonene deres henger sammen og terrenget ikke skygger ✅
- d) At hver observatør har egen kontrollenhet for nødsituasjoner

*Forklaring:* Operatørens plikter i STS-02 sier at operatøren før start skal sjekke plassering og antall observatører, sikt og avstand, at terrenget ikke skygger, at det ikke er hull mellom sonene, at kommunikasjonen virker, og at observatørene er orientert om rute og tidsplan. Observatørene trenger opplæring fra operatøren, ikke STS-bevis. Regelverket har ingen fast avstand mellom observatørene; grensene er maks 1 km fra dronen til nærmeste observatør og maks 1 km fra hver observatør til piloten. Kontrollen skal aldri overlates til en annen kontrollenhet. (UAS.STS-02.030)

*Kilde:* EU 2020/639 UAS.STS-02.030 (10); UAS.STS-02.020 (6); UAS.SPEC.050 (1)(e)

---

### 42. STS-02: BVLOS og observatører · vanskegrad 3

Hva skal piloten gjøre med dronens programmerbare flygevolum før en STS-02-flyging?

- a) Sette det lik yttergrensen for bakkerisikobufferen
- b) Sette det slik at dronen holdes innenfor flygeområdet ✅
- c) Ingenting, funksjonen aktiveres bare hvis C2-linken går tapt
- d) Slå det av, fordi det kan komme i konflikt med den programmerte banen

*Forklaring:* Pilotens plikter i STS-02 sier at piloten skal sette dronens programmerbare flygevolum slik at dronen holdes innenfor flygeområdet (flight geography). Piloten skal også kontrollere at funksjonen og flygeavslutningen virker, og at Remote ID er aktiv. (UAS.STS-02.040)

*Kilde:* EU 2020/639 UAS.STS-02.040 (1)(a)-(b); EU 2020/1058 Part 17 pkt. (4)

---

### 44. STS-02: BVLOS og observatører · vanskegrad 3

Luftromsobservatøren skal holde oversikt over hvor dronen er under en STS-02-flyging. Hva kan hun bruke til det?

- a) Bare direkte observasjon, uten hjelpemidler
- b) Direkte observasjon eller elektroniske hjelpemidler ✅
- c) Radiomeldinger fra piloten om posisjonen, men ingen skjerm
- d) Kikkert med avstandsmåler, men ingen skjerm

*Forklaring:* Observatørens skanning etter annen lufttrafikk er visuell og uten hjelpemidler. Men for å vite hvor dronen er, tillater observatørens plikter både direkte observasjon og elektroniske hjelpemidler. EASAs veiledning sier at observatøren bør få dronens posisjon, fart og høyde, og kan bruke samme system som piloten. (UAS.STS-02.050)

*Kilde:* EU 2019/947 art. 2 (25); EU 2020/639 UAS.STS-02.050 (1)-(2); EASA AMC1 UAS.STS-02.050(2)

---

### 45. Kontrollert bakkeområde og bakkerisiko · vanskegrad 3

Tabellen i STS-01 gir 25 m bakkerisikobuffer for en drone med MTOM 6 kg som flyr inntil 120 m. Det blåser jevnt 9 m/s. Hva sier EASAs veiledning om tabellverdiene?

- a) De er faste verdier som verken skal økes eller reduseres
- b) De kan halveres hvis dronen har fallskjerm
- c) De gjelder bare i vindstille; i vind brukes 1:1-regelen i stedet
- d) De er minsteverdier, og vind og reaksjonstid kan kreve mer ✅

*Forklaring:* EASAs veiledning til STS-01 sier at tabellverdiene skal regnes som minimum, og at det bør legges til margin for faktorer som øker avstanden dronen kan bevege seg, for eksempel autorotasjon, vind og pilotens reaksjonstid. For en drone med MTOM inntil 10 kg i 120 m er minstebufferen 25 m. (GM1 til UAS.STS-01.020)

*Kilde:* EU 2020/639 UAS.STS-01.020 (1)(c)(i)(C); EASA GM1 UAS.STS-01.020(1)(c) (ED Decision 2022/002/R)

---

### 46. Kontrollert bakkeområde og bakkerisiko · vanskegrad 1

Hva menes med operasjonsvolumet (operational volume)?

- a) Flygeområdet og contingency-volumet til sammen ✅
- b) Flygeområdet og bakkerisikobufferen til sammen
- c) Hele det kontrollerte bakkeområdet, inkludert bufferen
- d) Luftrommet innenfor pilotens synsrekkevidde

*Forklaring:* Etter definisjonene i droneregelverket er operasjonsvolumet kombinasjonen av flygeområdet (flight geography) og contingency-volumet. Bakkerisikobufferen ligger på bakken rundt operasjonsvolumet og er ikke en del av det. Kontrollert bakkeområde er projeksjonen av både volumet og bufferen. (Forordning 2019/947, artikkel 2)

*Kilde:* EU 2019/947 art. 2 (28)-(33), innført ved EU 2020/639; UAS.STS-01.030 (2)

---

### 47. Kontrollert bakkeområde og bakkerisiko · vanskegrad 2

En STS-02-flyging langs en kraftlinje har en del av bakkerisikobufferen i et boligfelt i utkanten av et tettsted. Er det lov?

- a) Det går hvis den delen av bufferen er tom for folk
- b) Det går hvis dronen har fallskjerm som demper treffet
- c) Det går hvis en luftromsobservatør står ved tettstedet
- d) Det går ikke; hele området skal være spredt befolket ✅

*Forklaring:* Driftsreglene for STS-02 krever at det kontrollerte bakkeområdet, altså flygeområdet, contingency-området og bakkerisikobufferen, ligger helt i et spredt befolket miljø. At bufferen er tom for folk i øyeblikket, er ikke nok når den ligger i et befolket område. Befolket miljø med kontrollert bakkeområde er STS-01, og det er VLOS. (UAS.STS-02.020)

*Kilde:* EU 2020/639 UAS.STS-02.020 (2); luftfartstilsynet.no, «Søke om STS»

---

### 48. Kontrollert bakkeområde og bakkerisiko · vanskegrad 2

Hva må operatøren gjøre før en STS-02-flyging for å hindre at uinvolverte kommer inn i det kontrollerte bakkeområdet?

- a) Ingenting, bakkerisikobufferen er nok i seg selv
- b) Ta egnede tiltak og koordinere med myndighetene ved behov ✅
- c) Gjerde inn hele bakkerisikobufferen fysisk før start
- d) Varsle alle eiendommer innenfor 1 km skriftlig på forhånd

*Forklaring:* Operatørens plikter i STS-02 sier at alle hensiktsmessige tiltak for å redusere risikoen for at uinvolverte kommer inn i området skal være tatt før start, og at det er koordinert med relevante myndigheter når det kreves. Regelverket sier ikke hvilke tiltak; det beskrives i operasjonsmanualen. (UAS.STS-02.030)

*Kilde:* EU 2020/639 UAS.STS-02.030 (8); Appendix 5 pkt. (6)(c)(i)(G)

---

### 49. Operatøransvar og operasjonsmanual · vanskegrad 1

Et filmteam på tolv personer skal være inne i det kontrollerte bakkeområdet under en STS-01-innspilling. Hva må operatøren sikre før start?

- a) At alle står minst 30 m fra dronen, som i A2
- b) At alle har gyldig A1/A3-kompetansebevis
- c) At alle bærer refleksvest og hjelm
- d) At alle er informert, instruert og har sagt ja ✅

*Forklaring:* Personer inne i det kontrollerte bakkeområdet er ikke uinvolverte, men bare hvis operatøren har informert dem om risikoen, gitt dem instruks eller opplæring i sikkerhetstiltakene og fått deres uttrykkelige samtykke. Kravet står i både STS-01 og STS-02.

*Kilde:* EU 2020/639 UAS.STS-01.030 (9); UAS.STS-02.030 (9)

---

### 50. Operatøransvar og operasjonsmanual · vanskegrad 3

Hvor lenge skal operatøren minst ta vare på opplysninger om STS-operasjonene, inkludert uvanlige tekniske eller operative hendelser?

- a) 3 år ✅
- b) 1 år
- c) 5 år
- d) Til deklarasjonen utløper

*Forklaring:* Operatørens plikter i spesifikk kategori sier at opplysninger om operasjonene, inkludert uvanlige hendelser, og om vedlikehold skal tas vare på i minst 3 år. Opplysninger om kvalifikasjoner og kurs for personellet skal oppbevares i minst 3 år etter at personen har sluttet eller byttet stilling. (UAS.SPEC.050)

*Kilde:* EU 2019/947 UAS.SPEC.050 (1)(g)

---

### 51. Operatøransvar og operasjonsmanual · vanskegrad 3

Til et STS-oppdrag leier operatøren styre- og kontrollforbindelsen til dronen (C2-linken) som en tjeneste fra et teleselskap. Hva må operatøren sikre?

- a) Ingenting, leverandøren har hele ansvaret
- b) At leverandøren har eget STS-kompetansebevis
- c) At ytelsen er god nok og ansvaret er fordelt ✅
- d) At Luftfartstilsynet har godkjent leverandøren

*Forklaring:* EASA forstår en ekstern tjeneste som en tjeneste som er nødvendig for sikker flyging og leveres av en annen enn operatøren. En innkjøpt C2-linktjeneste er et eksempel. Operatørens plikter i STS-01 sier at operatøren skal sikre at ytelsen er tilstrekkelig for operasjonen, og definere fordelingen av roller og ansvar mellom operatøren og tjenesteleverandøren. Det samme står i STS-02. (UAS.STS-01.030)

*Kilde:* EU 2020/639 UAS.STS-01.030 (5)-(6) og UAS.STS-02.030 (5)-(6); EASA GM1 UAS.STS-01.030(5)&(6)

---

### 52. Operatøransvar og operasjonsmanual · vanskegrad 3

Operasjonsmanualen skiller mellom avviksprosedyrer (contingency) og nødprosedyrer. Hvilken av disse hører til avviksprosedyrene?

- a) Håndtering av at dronen forlater hele operasjonsvolumet
- b) Nødberging (emergency recovery) av dronen
- c) Tiltak som begrenser skade på tredjepart
- d) Håndtering av at eksterne systemer blir dårligere ✅

*Forklaring:* Utenom de vanlige prosedyrene har manualen to trinn. Avviksprosedyrene (contingency) brukes i unormale situasjoner, for eksempel når piloten ser at dronen kan komme ut av det planlagte flygeområdet. Hit hører også uinvolverte som kommer inn i det kontrollerte bakkeområdet, dårlige forhold, eksterne systemer som støtter operasjonen og blir dårligere, fraseologien med luftromsobservatørene, og det å unngå konflikt med annen lufttrafikk. Nødprosedyrene brukes i nødsituasjoner, for eksempel når piloten ser at dronen kan forlate hele operasjonsvolumet. Hit hører det å unngå eller begrense skade på andre, at dronen forlater operasjonsvolumet, og nødberging av dronen. (Innholdet i operasjonsmanualen: Appendix 5 punkt 6 d og e. Pilotens plikter: UAS.STS-01.040 og UAS.STS-02.040 punkt 2 g og h)

*Kilde:* EU 2020/639 Appendix 5 pkt. (6)(d)-(e); UAS.STS-01.040 (2)(g)-(h) og UAS.STS-02.040 (2)(g)-(h)

---

### 53. Operatøransvar og operasjonsmanual · vanskegrad 3

Operatøren skal bruke en luftromsobservatør i STS-02. Hvilken opplæring krever regelverket for observatøren?

- a) Opplæring fra operatøren og kjennskap til manualen ✅
- b) Samme STS-teoriprøve på trafikkstasjon som piloten
- c) Et A2-kompetansebevis fra trafikkstasjonen
- d) Ingen opplæring, bare godt syn og hørsel

*Forklaring:* Operatørens plikter i spesifikk kategori sier at personell med oppgaver som er avgjørende for operasjonen, utenom piloten, skal ha fullført opplæring på arbeidsplassen utviklet av operatøren, være informert om operasjonsmanualen og prosedyrene, og ha oppdatert informasjon om geografiske soner. (UAS.SPEC.050)

*Kilde:* EU 2019/947 UAS.SPEC.050 (1)(e)

---

### 54. Operatøransvar og operasjonsmanual · vanskegrad 3

En STS-01-operatør vil selv gi praktisk opplæring og vurdering av egne piloter. Hva er ett av kravene til slik opplæring?

- a) Et klart skille mellom opplæring og annen drift ✅
- b) At opplæringen skjer på en godkjent flyplass
- c) At en sensor fra Luftfartstilsynet er til stede
- d) At vurderingen er én avsluttende prøve på én dag

*Forklaring:* Kravene til opplæringen omfatter blant annet et klart skille mellom opplæring og annen operativ virksomhet for å sikre uavhengig vurdering, en ansvarlig leder, kompetent og upartisk personell, opplæring i et miljø som er representativt for scenarioet, og at vurderingen er en løpende evaluering av kandidaten, ikke én enkelt prøve. (Kravene til opplæringsenheter: Appendix 3)

*Kilde:* EU 2020/639 Appendix 3 pkt. (1)-(7)

---

### 55. Operatøransvar og operasjonsmanual · vanskegrad 3

Operatøren har tre C5-droner fra to produsenter som skal brukes under STS-01, men aldri samtidig på samme sted. Hvordan håndteres det i deklarasjonen?

- a) Én deklarasjon for hver av de tre dronene
- b) Én deklarasjon for hver av de to produsentene
- c) Én deklarasjon som lister alle tre dronene ✅
- d) Ingen droner oppgis, bare operatøren

*Forklaring:* EASAs veiledning til deklarasjonsskjemaet sier at operatøren ikke trenger egen deklarasjon for hver drone når de ulike dronene har riktig klassemerke og ikke brukes samtidig på samme sted. Produsent, modell og serienummer for hver drone føres i skjemaet. Droner som bare brukes til praktisk opplæring, skal også føres opp.

*Kilde:* EU 2020/639 Appendix 2; EASA GM1 Appendix 2 (ED Decision 2022/002/R)

---

### 56. Operatøransvar og operasjonsmanual · vanskegrad 3

Hva krever regelverket for spesifikk kategori av operatøren når det gjelder vedlikehold av dronene?

- a) At alt vedlikehold gjøres hos produsenten
- b) Årlig teknisk kontroll av hver drone hos Luftfartstilsynet
- c) Ingenting, vedlikehold er pilotens ansvar
- d) Instrukser, kvalifisert personell og logg i 3 år ✅

*Forklaring:* Operatøren skal holde dronene i sikker stand ved minst å definere vedlikeholdsinstrukser og bruke tilstrekkelig opplært og kvalifisert vedlikeholdspersonell, føre en oppdatert liste over vedlikeholdspersonellet, og ta vare på logg over vedlikeholdet i minst 3 år. Operasjonsmanualen skal også inneholde vedlikeholdsinstrukser. (Operatørens plikter: UAS.SPEC.050)

*Kilde:* EU 2019/947 UAS.SPEC.050 (1)(g)(ii), (1)(i) og (1)(k); Appendix 5 pkt. (5)

---

### 57. Pilotansvar og prosedyrer · vanskegrad 1

En landmåler vil følge en ny vei i STS-01 ved å kjøre sakte etter dronen med bil og fly fra passasjersetet. Er det lov?

- a) Ja, så lenge bilen holder under 5 m/s
- b) Ja, hvis en droneobservatør går langs veien
- c) Nei, dronen skal aldri opereres fra et kjøretøy i bevegelse ✅
- d) Nei, fordi STS-01 bare tillater flyging over ett fast område om gangen

*Forklaring:* Pilotens plikter i STS-01 forbyr å operere dronen fra et kjøretøy i bevegelse. Det samme gjelder i STS-02. Grensen på 5 m/s gjelder dronens bakkehastighet, ikke kjøretøyet. (UAS.STS-01.040)

*Kilde:* EU 2020/639 UAS.STS-01.040 (2)(e); UAS.STS-02.040 (2)(d)

---

### 58. Pilotansvar og prosedyrer · vanskegrad 2

Under et STS-01-oppdrag på et industriområde begynner det å brenne i nabobygget, og brannvesenet rykker ut. Hva gjelder for piloten?

- a) Piloten kan fortsette, men bør tilby brannvesenet bildene
- b) Piloten skal lande, men kan starte igjen så snart brannbilene står på plass
- c) Piloten kan fortsette uten videre innenfor det deklarerte bakkeområdet
- d) Ikke fly nær eller inne i innsatsområdet uten tillatelse fra nødetatene ✅

*Forklaring:* Pilotens plikter i spesifikk kategori sier at piloten under flyging ikke skal fly nær eller inne i områder der en redningsinnsats pågår, med mindre de ansvarlige nødetatene har gitt tillatelse. Deklarasjonen endrer ikke dette. (UAS.SPEC.060)

*Kilde:* EU 2019/947 UAS.SPEC.060 (3)(e)

---

### 59. Pilotansvar og prosedyrer · vanskegrad 1

Politiet kontrollerer en pilot under en STS-01-flyging. Hva krever regelverket at piloten har med seg?

- a) Alltid bevis på egen kompetanse ✅
- b) Operatørens originale deklarasjon på papir
- c) Dronens typesertifikat
- d) En flygelogg signert av Luftfartstilsynet

*Forklaring:* Pilotens plikter i spesifikk kategori sier at piloten skal ha den kompetansen scenarioet krever og ha med bevis på kompetansen under flyging. (UAS.SPEC.060)

*Kilde:* EU 2019/947 UAS.SPEC.060 (1)(b)

---

### 60. Pilotansvar og prosedyrer · vanskegrad 2

Operasjonsområdet ligger i en geografisk sone der vilkårene krever at flygekontrollen varsles før flyging. Hvem har plikt til å sørge for at det er gjort før start?

- a) Luftfartstilsynet, når deklarasjonen bekreftes
- b) Piloten ✅
- c) Ingen, deklarasjonen fungerer som varsel
- d) Dronens geo-awareness-funksjon, som varsler automatisk

*Forklaring:* Før start skal piloten sørge for at informasjon om operasjonen er gjort tilgjengelig for relevant lufttrafikktjeneste, andre luftromsbrukere og berørte parter, når tillatelsen eller vilkårene for den geografiske sonen krever det. Huskeregel: deklarasjonen går til Luftfartstilsynet og er ikke et varsel til flygekontrollen. Krever sonen at flygekontrollen varsles, er det piloten som sørger for det før start. (Pilotens plikter: UAS.SPEC.060 punkt 2 d)

*Kilde:* EU 2019/947 UAS.SPEC.060 (2)(d)

---

### 61. Pilotansvar og prosedyrer · vanskegrad 2

Et vindkast får dronen til å drive ut av flygeområdet, men den er fortsatt godt innenfor contingency-volumet. Hva skal piloten gjøre?

- a) Utløse flygeavslutning straks
- b) Følge operatørens contingency-prosedyrer for å få dronen tilbake ✅
- c) Ingenting, contingency-volumet er en del av det tillatte området
- d) Aktivere automatisk retur (RTH), siden det alltid er første tiltak ved avvik

*Forklaring:* Regelverket har to terskler. Får piloten indikasjon på at dronen kan forlate flygeområdet, skal contingency-prosedyrene følges. Først når dronen kan komme til å forlate hele operasjonsvolumet, gjelder nødprosedyrene, der flygeavslutning inngår. Contingency-volumet er en buffer for avvik, ikke et vanlig arbeidsområde.

*Kilde:* EU 2020/639 UAS.STS-01.040 (2)(g)-(h); EU 2019/947 art. 2 (28)-(32)

---

### 62. Pilotansvar og prosedyrer · vanskegrad 2

Hva hører med i etterarbeidet etter en STS-flyging, etter kravene til praktisk opplæring?

- a) Bare lading av batterier og nedlasting av data
- b) Rapport til Luftfartstilsynet etter hver flyging
- c) Ny deklarasjon etter flyginger over 30 minutter
- d) Inspeksjon, logg, debrief og ev. hendelsesrapport ✅

*Forklaring:* Kravene til den praktiske opplæringen lister etterarbeidet: slå av og sikre dronen, inspeksjon og registrering av relevante data om dronens tilstand og mannskapets tretthet, debrief, og å gjenkjenne når en hendelsesrapport er nødvendig og fylle den ut. Det finnes ikke krav om rapport til myndigheten etter hver flyging. (Den praktiske opplæringen: Attachment A til kapittel I, tabell 1 c)

*Kilde:* EU 2020/639 Attachment A til kap. I, tabell 1 (c)

---

### 63. Pilotansvar og prosedyrer · vanskegrad 2

Når slipper piloten i STS-02 selv å gjøre grundig skanning av luftrommet rundt dronen?

- a) Når dronen følger en forhåndsprogrammert bane med aktiv geo-sperre
- b) Når dronen flyr lavere enn 60 m
- c) Når luftromsobservatører støtter operasjonen med skanningen ✅
- d) Aldri, piloten skal alltid skanne selv

*Forklaring:* Pilotens plikter i STS-02 sier at piloten skal skanne luftrommet grundig, med mindre luftromsobservatører støtter operasjonen. Da er det observatørene som skanner og varsler piloten. (UAS.STS-02.040 og UAS.STS-02.050)

*Kilde:* EU 2020/639 UAS.STS-02.040 (2)(a); UAS.STS-02.050

---

### 64. Menneskelige faktorer · vanskegrad 1

Etter en lang arbeidsdag presser kunden på for å få de siste bildene før det blir mørkt. Piloten kjenner seg sliten og ukonsentrert. Hva er riktig?

- a) Fly ferdig raskt før det blir mørkt
- b) Fortsette, men bare med automatisk flymodus
- c) Avbryte eller utsette, fordi hun er uskikket ✅
- d) Fortsette med en kollega som observatør

*Forklaring:* Pilotens plikter i spesifikk kategori sier at piloten ikke skal utføre oppgavene når hun er uskikket på grunn av skade, tretthet, medisiner, sykdom eller annet. EASAs veiledning nevner kommersielt press og lange arbeidsdager som fallgruver under tretthet. Automatikk eller en observatør fjerner ikke problemet. (UAS.SPEC.060)

*Kilde:* EU 2019/947 UAS.SPEC.060 (1)(a); EASA AMC1 UAS.SPEC.050(1)(d) (menneskelige begrensninger, tretthet)

---

### 65. Menneskelige faktorer · vanskegrad 2

Under en STS-01-flyging ser piloten nesten bare på kameraskjermen for å få riktig bildeutsnitt. Hva er den største risikoen, og hva er et godt tiltak?

- a) Hun mister oversikten; bruk observatør og skann jevnlig ✅
- b) Batteriet tømmes fortere; planlegg flere batteribytter
- c) Ingen, skjermen viser alt piloten trenger i VLOS
- d) Bildene blir uskarpe; bytt til FPV-briller i stedet

*Forklaring:* I STS-01 skal dronen være i VLOS hele tiden, og piloten skal skanne luftrommet grundig. En droneobservatør kan hjelpe, med klar kommunikasjon. EASAs veiledning om oppmerksomhet peker på å fjerne distraksjoner og bruke skanneteknikk. Å stirre på skjermen er en typisk distraksjon.

*Kilde:* EU 2020/639 UAS.STS-01.040 (2)(a)-(b); EASA AMC1 UAS.SPEC.050(1)(d) (oppmerksomhet)

---

### 66. Menneskelige faktorer · vanskegrad 2

Ruten går rett mot lav kveldssol. Hvilken menneskelig begrensning er mest aktuell i planleggingen?

- a) Ingen, sola påvirker bare kameraet
- b) Varme, som får batterispenningen til å falle
- c) Blending, som kan hindre piloten i å se dronen ✅
- d) Fargesyn, som er grunnen til det grønne lyset

*Forklaring:* EASAs veiledning om menneskelige begrensninger nevner endret syn når man er vendt mot sola. For STS-02 sier veiledningen om flygesikt at sol eller sterkt lys som kan blende pilot og observatører, skal vurderes før start.

*Kilde:* EASA AMC1 UAS.SPEC.050(1)(d) (miljøfaktorer); EASA GM1 UAS.STS-02.020(3)

---

### 67. Menneskelige faktorer · vanskegrad 2

Hva skal operasjonsprosedyrene i en STS-manual inneholde for å redusere menneskelige feil?

- a) Minst 50 loggførte flytimer for alle piloter
- b) Klar oppgavefordeling og en intern sjekkliste ✅
- c) Automatisk logging av alle kommandoer
- d) Forbud mot flyginger over 30 minutter

*Forklaring:* Kravene til operasjonsmanualen sier at operasjonsprosedyrene, for å minimere menneskelige feil, skal ta hensyn til en klar fordeling og tildeling av oppgaver, og en intern sjekkliste for å kontrollere at personellet utfører oppgavene sine. Timekrav og tidsgrenser står ikke i regelverket. (Innholdet i operasjonsmanualen: Appendix 5 punkt 6 a)

*Kilde:* EU 2020/639 Appendix 5 pkt. (6)(a)

---

### 68. Menneskelige faktorer · vanskegrad 3

Operasjonsmanualen har mange nødprosedyrer. Hvilke bør piloten etter EASAs veiledning kunne utenat?

- a) De som står først i nødkapittelet i manualen
- b) De som produsenten har merket som viktige i bruksanvisningen
- c) De som piloten har øvd på i opplæringen
- d) De kritiske, der det er kort tid til å reagere ✅

*Forklaring:* EASAs veiledning om opplæring i spesifikk kategori sier at piloten, avhengig av hvor kritisk situasjonen er og tiden som er tilgjengelig, bør memorere noen prosedyrer, mens andre kan tas fra sjekkliste. Veiledningen er skrevet for opplæring til operasjoner med tillatelse i spesifikk kategori, men prinsippet passer like godt for nødprosedyrene i en STS-manual. (EASAs veiledning: AMC3 UAS.SPEC.050(1)(d))

*Kilde:* EASA AMC3 UAS.SPEC.050(1)(d) (ED Decision 2022/002/R)

---

### 69. Menneskelige faktorer · vanskegrad 1

Hva krever regelverket for spesifikk kategori av grensesnittet mellom pilot og dronesystem (HMI)?

- a) At det begrenser pilotfeil og urimelig tretthet ✅
- b) At alle varsler vises på pilotens eget språk
- c) At det har berøringsskjerm med store knapper
- d) At videoen vises i minst full HD-oppløsning

*Forklaring:* Operatørens plikter i spesifikk kategori sier at grensesnittet mellom menneske og maskin skal minimere risikoen for pilotfeil og ikke gi urimelig tretthet. Menneskelige faktorer er altså også et krav til utstyret, ikke bare til piloten. (UAS.SPEC.050)

*Kilde:* EU 2019/947 UAS.SPEC.050 (1)(h)

---

### 70. Menneskelige faktorer · vanskegrad 2

Luftromsobservatøren roper «ned, ned!» på radioen. Piloten vet ikke om det betyr «senk dronen» eller «et fly kommer lavt». Hva i operasjonsmanualen skal hindre slike misforståelser?

- a) Krav om at observatøren står ved siden av piloten
- b) Fastsatt fraseologi mellom pilot og luftromsobservatører ✅
- c) At bare piloten får snakke på radioen
- d) At observatøren bruker avtalte håndsignaler i stedet for radio

*Forklaring:* Når luftromsobservatører brukes, skal contingency-prosedyrene i manualen inneholde fraseologien som skal brukes. Den praktiske opplæringen for STS-02 omfatter et konfliktløsningsopplegg med fraseologi, koordinering og kommunikasjonsmidler. Observatøren i STS-02 står gjerne langt fra piloten, så håndsignaler og samlokalisering er ikke løsningen.

*Kilde:* EU 2020/639 Appendix 5 pkt. (6)(d)(v); Attachment A til kap. II, tabell 1 (a)(i)(B)

---

### 71. Menneskelige faktorer · vanskegrad 2

Hvorfor er situasjonsforståelse ekstra krevende i BVLOS-delen av en STS-02-flyging?

- a) Fordi dronen flyr fortere i BVLOS enn i VLOS
- b) Fordi piloten må styre dronen manuelt uten GNSS-støtte i BVLOS-delen
- c) Den er ikke mer krevende enn i VLOS
- d) Fordi piloten ikke ser dronen og må bygge bildet fra skjerm og observatører ✅

*Forklaring:* EASAs veiledning om menneskelige begrensninger nevner persepsjon og situasjonsforståelse i BVLOS spesielt. Derfor krever C6-klassen at piloten får dronens posisjon, fart og høyde, og STS-02 krever robuste og effektive kommunikasjonsmidler mellom pilot og observatører. Maksfarten 50 m/s er en øvre grense, ikke normal fart.

*Kilde:* EASA AMC1 UAS.SPEC.050(1)(d) (persepsjon); EU 2020/1058 Part 17 pkt. (1) og (3); EU 2020/639 UAS.STS-02.020 (6)(e)

---

### 72. UAS-kunnskap: C5, C6 og flygeavslutning · vanskegrad 3

Operatøren har en C3-drone og kjøper et tilbehørssett som gjør den om til C5. Hva må være på plass før STS-01-flyging?

- a) Samsvarserklæring for C3 og settet, og C5-merke på settet ✅
- b) Bare C5-merket, C3-erklæringen gjelder ikke lenger
- c) Godkjenning av ombyggingen hos Luftfartstilsynet
- d) Ny programvare fra produsenten, som gjør C3-dronen til en C5

*Forklaring:* En C5 kan være en C3 med tilbehørssett. Da skal C5-merket sitte på alt tilbehøret, og samsvarserklæringen skal vise til C3 og tilbehørssettet. Settet skal ikke endre programvaren til C3-dronen, og operatøren skal installere det etter produsentens instruks.

*Kilde:* EU 2020/1058 Part 16 pkt. (8); EU 2020/639 UAS.STS-01.030 (10)

---

### 73. UAS-kunnskap: C5, C6 og flygeavslutning · vanskegrad 3

En produsent vil lage en drone med forbrenningsmotor for bruk i standardscenario. Kan den få klasse C5 eller C6?

- a) C5, så lenge den har en fallskjerm som demper virkningen av treffet
- b) C6, fordi C6 er unntatt kravet om ren elektrisk drift ✅
- c) Begge, drivstoffet er ikke regulert i C5 og C6
- d) Ingen av dem, både C5 og C6 krever elektrisk drift

*Forklaring:* Både C5 og C6 bygger på kravene til C3, og ett av C3-kravene er ren elektrisk drift. C5 er bare unntatt to av C3-kravene, mens C6 i tillegg er unntatt kravet om elektrisk drift. En C6 kan derfor ha forbrenningsmotor. (Klassekravene i forordning 2019/945: del 4 for C3, punkt 7, og del 16 og 17 for C5 og C6)

*Kilde:* Forordning 2019/945 del 4 punkt 7 (C3), del 16 og del 17 (C5 og C6, innført ved EU 2020/1058)

---

### 74. UAS-kunnskap: C5, C6 og flygeavslutning · vanskegrad 3

En produsent vil selge en tjoret fastvingedrone for STS-01. Kan den få C5-merking?

- a) Nei, C5 kan aldri være fastvinge
- b) Nei, tjorede droner får ikke klassemerke
- c) Ja, C5 kan være fastvinge når den er tjoret ✅
- d) Ja, men bare hvis vingespennet er under 1 m

*Forklaring:* Kravene til C5 sier at dronen skal være et annet luftfartøy enn fastvinge, med mindre det er tjoret. En tjoret fastvinge er altså ikke utelukket, og C3-kravene til lina (under 50 m, styrke minst 10 ganger vekten) gjelder. Tilsvarende begrensning finnes ikke for C6. (Kravene til C5: forordning 2019/945, del 16 punkt 1)

*Kilde:* EU 2020/1058 Part 16 pkt. (1)

---

### 75. UAS-kunnskap: C5, C6 og flygeavslutning · vanskegrad 3

Hvordan skal en C5-drone som ikke er tjoret, holde piloten oppdatert om signalkvaliteten på C2-linken?

- a) Løpende, med varsel før og når linken faller ut ✅
- b) Ett varsel, først når linken faktisk er tapt
- c) Ikke i det hele tatt, det er produsentens sak
- d) Bare med en måling av signalstyrken før start

*Forklaring:* C2-linken er styre- og kontrollforbindelsen mellom kontrollenheten (for eksempel fjernkontrollen) og dronen. Kravene til C5 sier at piloten løpende skal kunne overvåke kvaliteten på C2-linken, få et varsel når det er sannsynlig at linken blir tapt eller så svekket at sikker gjennomføring er i fare, og få et nytt varsel når linken er tapt. C6 har samme krav. (Forordning 2019/945, del 16 punkt 6 og del 17 punkt 7)

*Kilde:* EU 2020/1058 Part 16 pkt. (6); Part 17 pkt. (7)

---

### 76. UAS-kunnskap: C5, C6 og flygeavslutning · vanskegrad 3

Hvilken informasjon om flygingen skal C5 og C6 minst gi piloten underveis?

- a) C5: posisjon og fart. C6: bare høyde
- b) Begge: bare batterinivå og gjenværende flytid
- c) Begge: direkte video fra kameraet
- d) C5: høyde. C6: høyde, posisjon og fart ✅

*Forklaring:* Kravene til C5 sier at dronen skal gi klar informasjon om høyden over bakken eller startpunktet. Kravene til C6 sier at dronen skal gi geografisk posisjon, fart og høyde, fordi piloten ikke ser dronen i BVLOS-delen. Batterivarsel kreves også, gjennom C3-kravene, men er ikke det klassene skiller seg på her. (Forordning 2019/945, del 16 punkt 3 og del 17 punkt 3)

*Kilde:* EU 2020/1058 Part 16 pkt. (3); Part 17 pkt. (3); Part 4 pkt. (13)

---

### 77. UAS-kunnskap: C5, C6 og flygeavslutning · vanskegrad 3

Du skal fly en C5-multirotor tjoret, altså festet til bakken med en line. Hvilke krav gjelder for lina?

- a) Kortere enn 120 m, uten styrkekrav
- b) Under 50 m og minst 10 ganger dronens maksvekt ✅
- c) Nøyaktig 30 m, så bakkeområdet blir standard
- d) Minst 50 m, og like sterkt som dronens vekt

*Forklaring:* C5 skal oppfylle kravene til C3. Der står det at lina skal være kortere enn 50 m. For en drone som er tyngre enn luft, som en multirotor, skal den også tåle minst 10 ganger vekten av dronen ved maks masse. En tjoret C5 er unntatt kravet om flygeavslutning og lavhastighetsmodus. (Kravene til C3: forordning 2019/945, del 4 punkt 4)

*Kilde:* EU 2020/1058 Part 4 pkt. (4); Part 16 pkt. (4)-(6)

---

### 78. UAS-kunnskap: C5, C6 og flygeavslutning · vanskegrad 1

Hva skal hver drone i spesifikk kategori være utstyrt med?

- a) En ADS-B-transponder for bemannet trafikk
- b) Fallskjerm som demper treffet ved fall
- c) Grønt blinklys og aktiv, oppdatert Remote ID ✅
- d) Et varmesøkende kamera for nattflyging

*Forklaring:* Operatørens plikter i spesifikk kategori sier at hver drone skal ha minst ett grønt blinkende lys for synlighet om natta og et aktivt og oppdatert fjernidentifikasjonssystem. Fallskjerm er ikke et generelt krav, men C5 skal ha noe som demper treffet ved flygeavslutning, for eksempel fallskjerm. (UAS.SPEC.050)

*Kilde:* EU 2019/947 UAS.SPEC.050 (1)(l); EU 2020/1058 Part 16 pkt. (5)(c)

---

### 79. UAS-kunnskap: C5, C6 og flygeavslutning · vanskegrad 2

Hva skal en ikke-tjoret C5-drone kunne gjøre hvis C2-linken blir borte?

- a) Hente linken tilbake, ellers avslutte skånsomt for tredjepart ✅
- b) Lande rett ned, uansett hva som er under
- c) Fortsette ruten på autopilot til batteriet er tomt
- d) Sveve på stedet til kontakten er tilbake eller batteriet er tomt

*Forklaring:* Kravene til C3, som også gjelder C5, sier at dronen ved tapt C2-link skal ha en pålitelig og forutsigbar metode for å gjenopprette linken, eller, hvis det ikke lykkes, avslutte flygingen slik at virkningen for tredjepart i lufta eller på bakken reduseres. Produsenten skal beskrive oppførselen ved tapt link i bruksanvisningen. (Kravene til C3: forordning 2019/945, del 4 punkt 5)

*Kilde:* EU 2020/1058 Part 4 pkt. (5) og (15)(a)

---
