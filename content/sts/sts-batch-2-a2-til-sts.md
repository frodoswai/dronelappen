# STS-spørsmålsbank - batch 2 (A2→STS-påbygget), 48 spørsmål

Utkast 2026-09-30. Kanonisk fil: `content/sts/sts-batch-2-a2-til-sts.json`. Ikke i Supabase. Nummerering 31-79 fortsetter batch 1.

DRONEA2STS (30 spm / 23 riktige). Emnene er verifisert mot EU 2020/639 Attachment A til kap. I pkt. (1)(b): den som har A2-bevis tar minst 30 spørsmål fordelt på emne (i)-(v): regelverk, menneskelige ytelsesbegrensninger, operasjonelle prosedyrer, tekniske og operasjonelle tiltak mot bakkerisiko, og generell UAS-kunnskap. Meteorologi, flygeytelse og luftrisiko (vi-viii) er ikke med i påbygget. Tidsgrense: ikke publisert av Luftfartstilsynet eller Statens vegvesen per 30.09.2026.

Kilder: se `meta.sources` i JSON-fila.

---

### 31. Regelverk og kategorier · vanskegrad 1

Et firma fikk bekreftet STS-01-deklarasjonen sin for to år og tre måneder siden og har ikke sendt inn noe siden. Kan de fortsatt fly på den?

- a) Ja, en deklarasjon gjelder til operatøren selv trekker den tilbake
- b) Nei, en deklarasjon gjelder i 2 år, så de må sende en ny ✅
- c) Ja, så lenge pilotenes kompetansebevis fortsatt er gyldige
- d) Nei, deklarasjonen må fornyes hvert år sammen med årsgebyret

*Forklaring:* UAS.SPEC.085 gir en operasjonell deklarasjon begrenset varighet på 2 år. Luftfartstilsynet skriver det samme: operatøren må sende inn en ny deklarasjon for å fortsette på STS. Pilotenes kompetansebevis (5 år) er en egen sak, og årsgebyret etter gebyrforskriften er ikke en fornyelse av deklarasjonen.

*Kilde:* EU 2019/947 UAS.SPEC.085 (innført ved EU 2020/639); luftfartstilsynet.no, «Søke om STS» (tidsbegrenset deklarasjon og årsgebyr etter gebyrforskriften)

---

### 32. Regelverk og kategorier · vanskegrad 1

Operatøren sendte STS-02-deklarasjonen i Altinn i morges. Når kan første flyging under scenarioet tidligst skje?

- a) Straks deklarasjonen er sendt, siden STS ikke krever tillatelse
- b) Etter at Luftfartstilsynet har vært på stedet og sett en prøveflyging
- c) Når operatøren har fått bekreftelse på at deklarasjonen er mottatt og fullstendig ✅
- d) Etter 14 dager, dersom Luftfartstilsynet ikke har kommet med innsigelser til deklarasjonen i mellomtiden

*Forklaring:* Myndigheten skal kontrollere at deklarasjonen har alle pliktige opplysninger og gi en bekreftelse på mottak og fullstendighet uten unødig opphold. Først når den bekreftelsen er mottatt, har operatøren rett til å starte. Det er ingen godkjenning av selve operasjonen, men heller ingen automatisk start ved innsending.

*Kilde:* EU 2019/947 UAS.SPEC.020 (3)-(4); luftfartstilsynet.no, «Søke om STS» (deklarasjon via Altinn)

---

### 33. Regelverk og kategorier · vanskegrad 2

Etter at STS-01-deklarasjonen er bekreftet, bytter operatøren til en C5-drone av en annen modell enn den som står i deklarasjonen. Hva sier regelverket?

- a) Ingenting, deklarasjonen gjelder operatøren og ikke dronen
- b) Operatøren må søke operasjonstillatelse for den nye modellen før den kan tas i bruk under STS
- c) Endringen tas med når deklarasjonen fornyes etter to år
- d) Operatøren skal uten opphold melde endringen til Luftfartstilsynet ✅

*Forklaring:* Deklarasjonsskjemaet inneholder produsent, modell og serienummer for dronen. UAS.SPEC.020 (5) krever at operatøren uten opphold varsler myndigheten om enhver endring i opplysningene i deklarasjonen. Et modellbytte innenfor C5 krever ikke operasjonstillatelse, men det skal meldes.

*Kilde:* EU 2019/947 UAS.SPEC.020 (5) og Appendix 2 (deklarasjonsskjemaet)

---

### 34. Regelverk og kategorier · vanskegrad 2

En STS-01-operasjon er planlagt i kontrollert luftrom. Hva krever regelverket for at operasjonen kan gjøres under en deklarasjon?

- a) Ingenting ekstra, STS-01 er VLOS og kan derfor brukes i alt luftrom under 120 m
- b) At den følger publiserte prosedyrer for området, slik at sannsynligheten for å møte bemannede luftfartøy er lav ✅
- c) Det går ikke, et STS kan bare deklareres for luftromsklasse G
- d) At operatøren har LUC, siden kontrollert luftrom krever sertifikat

*Forklaring:* UAS.SPEC.020 (1)(b) åpner for deklarasjon under 120 m i ukontrollert luftrom (klasse F eller G), eller i kontrollert luftrom når operasjonen følger publiserte prosedyrer for området, slik at sannsynligheten for å møte bemannede luftfartøy er lav. Den praktiske opplæringen for STS omfatter derfor også prosedyrer for kontakt med flygekontrollen og klarering når det trengs.

*Kilde:* EU 2019/947 UAS.SPEC.020 (1)(b); EU 2020/639 Attachment A til kap. I, tabell 1 (a)(i)(I)

---

### 35. Regelverk og kategorier · vanskegrad 2

Hvem kan utstede beviset på gjennomført praktisk opplæring (accreditation of completion) for STS-01?

- a) En opplæringsenhet anerkjent av myndigheten, eller en STS-01-operatør, som begge har erklært samsvar med Appendix 3 ✅
- b) Bare Luftfartstilsynet, etter en praktisk prøve med sensor fra tilsynet
- c) Trafikkstasjonen, samtidig med at teoriprøven blir bestått
- d) Enhver pilot som selv har STS-bevis og minst to års erfaring i spesifikk kategori

*Forklaring:* UAS.STS-01.020 (1)(e)(ii) nevner to utstedere: en enhet som har erklært samsvar med Appendix 3 og er anerkjent av myndigheten, eller en operatør som har deklarert STS-01 og i tillegg erklært samsvar med Appendix 3. Trafikkstasjonen tar bare teoriprøven.

*Kilde:* EU 2020/639 UAS.STS-01.020 (1)(e)(ii); Appendix 3

---

### 36. Regelverk og kategorier · vanskegrad 3

Hva gjør at en STS-deklarasjon ikke lenger regnes som fullstendig, selv om det er under to år siden den ble bekreftet?

- a) Tilsyn viser at operasjonen ikke gjennomføres i samsvar med deklarasjonen ✅
- b) Operatøren har ikke fløyet under scenarioet på seks måneder
- c) Operatøren tar inn en ny pilot med gyldig STS-bevis og praktisk opplæring
- d) Dronen har vært til service hos produsenten og fått nye propeller

*Forklaring:* UAS.SPEC.085 lister tre forhold: tilsynet finner at operasjonen ikke skjer i samsvar med deklarasjonen, forholdene har endret seg slik at deklarasjonen ikke lenger oppfyller kravene, eller myndigheten ikke får tilgang etter UAS.SPEC.090. Opphold i flygingen eller nye, kvalifiserte piloter påvirker ikke gyldigheten.

*Kilde:* EU 2019/947 UAS.SPEC.085 (1)-(3)

---

### 37. STS-01: rammer for VLOS · vanskegrad 2

En STS-01-operasjon har flight geography opp til 120 m over bakken, og det er ingen høye hindringer i nærheten. Hvor høyt kan operasjonsvolumet (flight geography pluss contingency-volumet) maksimalt gå?

- a) 120 m, contingency-volumet må ligge under grensen
- b) 135 m
- c) Det finnes ingen øvre grense for contingency-volumet
- d) 150 m ✅

*Forklaring:* Dronen skal holdes innenfor 120 m fra nærmeste punkt på bakken, men UAS.STS-01.010 (3) lar operasjonsvolumet gå inntil 30 m over den høyden som ellers er tillatt. 120 + 30 = 150 m. Det gir rom for contingency-prosedyrer over flight geography.

*Kilde:* EU 2020/639 UAS.STS-01.010 (1) og (3)

---

### 38. STS-01: rammer for VLOS · vanskegrad 1

Et STS-01-oppdrag skal dokumentere en stor øvelse fra to vinkler samtidig. To piloter flyr hver sin C5-drone i samme kontrollerte bakkeområde. Er det lov?

- a) Ja, kravet er at hver pilot bare opererer én drone om gangen ✅
- b) Nei, det kan bare være én drone i lufta i hvert kontrollerte bakkeområde
- c) Nei, den ene piloten må i så fall fly i åpen kategori A2
- d) Ja, men bare hvis den ene piloten styrer begge fra samme kontrollenhet

*Forklaring:* UAS.STS-01.040 (2)(d) sier at piloten bare skal operere ett ubemannet luftfartøy om gangen. Det samme gjelder i STS-02. Regelverket forbyr ikke flere droner i samme område, men hver drone må ha sin egen pilot, og kontrollen skal ikke overlates til en annen kontrollenhet. Koordineringen mellom pilotene bør stå i operasjonsmanualens kommunikasjonsprosedyrer.

*Kilde:* EU 2020/639 UAS.STS-01.040 (2)(d) og (f); UAS.STS-02.040 (2)(c); Appendix 5 pkt. (6)(c)(i)(E)

---

### 39. STS-01: rammer for VLOS · vanskegrad 1

C5-dronen har geo-awareness, og STS-01-oppdraget ligger i en geografisk sone som krever oppdaterte data i funksjonen. Hvem skal sørge for at dataene lastes opp?

- a) Luftfartstilsynet, når deklarasjonen bekreftes
- b) Produsenten, via automatiske oppdateringer
- c) Operatøren ✅
- d) Ingen, geo-awareness brukes ikke i spesifikk kategori

*Forklaring:* UAS.STS-01.030 (7) pålegger operatøren å laste opp oppdatert informasjon i geo-awareness-funksjonen, dersom dronen har den, når den geografiske sonen krever det. Piloten skal i tillegg hente oppdatert informasjon om geografiske soner før flyging.

*Kilde:* EU 2020/639 UAS.STS-01.030 (7); UAS.SPEC.060 (2)(a)

---

### 40. STS-02: BVLOS og observatører · vanskegrad 1

Hva krever STS-02 om dronens posisjon under oppskyting og landing?

- a) Utenfor syne er greit så lenge den følger den programmerte banen
- b) I pilotens syn, unntatt ved landing etter nødavslutning ✅
- c) Innenfor syn til nærmeste luftromsobservatør
- d) Det er ikke regulert i STS-02

*Forklaring:* Selv om STS-02 er BVLOS, krever UAS.STS-02.020 (4) at dronen er i syne for piloten under oppskyting og landing. Unntaket er når landingen er resultatet av en nødavslutning av flygingen.

*Kilde:* EU 2020/639 UAS.STS-02.020 (4)

---

### 41. STS-02: BVLOS og observatører · vanskegrad 3

Før en STS-02-flyging med tre luftromsobservatører langs en kraftlinje: hva må operatøren blant annet kontrollere?

- a) At observatørene har STS-bevis og praktisk opplæring for STS-02
- b) At observatørene står nøyaktig 1 km fra hverandre langs linjen
- c) At det ikke er hull mellom sonene observatørene dekker, og at terrenget ikke skjuler sikten for noen av dem ✅
- d) At hver observatør har sin egen kontrollenhet i tilfelle piloten mister linken

*Forklaring:* UAS.STS-02.030 (10) krever at operatøren før start sjekker plassering og antall observatører, sikt og avstand, at terrenget ikke skygger, at det ikke er hull mellom sonene, at kommunikasjonen virker, og at observatørene er orientert om rute og tidsplan. Observatørene trenger opplæring fra operatøren, ikke STS-bevis. Regelverket har ingen fast avstand mellom observatørene; grensene er maks 1 km fra dronen til nærmeste observatør og maks 1 km fra hver observatør til piloten. Kontrollen skal aldri overlates til en annen kontrollenhet.

*Kilde:* EU 2020/639 UAS.STS-02.030 (10); UAS.STS-02.020 (6); UAS.SPEC.050 (1)(e)

---

### 42. STS-02: BVLOS og observatører · vanskegrad 2

Hva skal piloten gjøre med dronens programmerbare flygevolum før en STS-02-flyging?

- a) Sette det lik yttergrensen for bakkerisikobufferen
- b) Sette det slik at dronen holdes innenfor flight geography ✅
- c) Ingenting, funksjonen aktiveres bare hvis C2-linken går tapt
- d) Slå det av, fordi det kan komme i konflikt med den programmerte banen

*Forklaring:* UAS.STS-02.040 (1)(a) krever at piloten setter dronens programmerbare flygevolum slik at dronen holdes innenfor flight geography. Piloten skal også kontrollere at funksjonen og flygeavslutningen virker, og at Remote ID er aktiv.

*Kilde:* EU 2020/639 UAS.STS-02.040 (1)(a)-(b); EU 2020/1058 Part 17 pkt. (4)

---

### 44. STS-02: BVLOS og observatører · vanskegrad 3

Luftromsobservatøren skal holde oversikt over hvor dronen er under en STS-02-flyging. Hva kan hun bruke til det?

- a) Direkte observasjon uten noen form for hjelpemidler
- b) Direkte observasjon eller elektroniske hjelpemidler, for eksempel det samme systemet piloten bruker ✅
- c) Radiomeldinger fra piloten om posisjonen, men ingen skjerm
- d) Kikkert med avstandsmåler, men ingen elektronisk posisjonsvisning

*Forklaring:* Observatørens skanning etter annen lufttrafikk er visuell og uten hjelpemidler, men for å vite hvor dronen er, tillater UAS.STS-02.050 (2) både direkte observasjon og elektroniske hjelpemidler. AMC sier at observatøren bør få dronens posisjon, fart og høyde, og kan bruke samme system som piloten.

*Kilde:* EU 2019/947 art. 2 (25); EU 2020/639 UAS.STS-02.050 (1)-(2); EASA AMC1 UAS.STS-02.050(2)

---

### 45. Kontrollert bakkeområde og bakkerisiko · vanskegrad 2

Tabellen i STS-01 gir 25 m bakkerisikobuffer for en drone med MTOM 6 kg som flyr inntil 120 m. Det blåser jevnt 9 m/s. Hva sier EASAs veiledning om tabellverdiene?

- a) De er faste verdier som verken skal økes eller reduseres
- b) De kan halveres hvis dronen har fallskjerm
- c) De gjelder bare i vindstille; i vind brukes 1:1-regelen i stedet
- d) De er minsteverdier, og vind og reaksjonstid kan kreve mer ✅

*Forklaring:* GM1 UAS.STS-01.020(1)(c) sier at tabellverdiene skal regnes som minimum, og at det bør legges til margin for faktorer som øker avstanden dronen kan bevege seg, for eksempel autorotasjon, vind og pilotens reaksjonstid. For en drone med MTOM inntil 10 kg i 120 m er minstebufferen 25 m.

*Kilde:* EU 2020/639 UAS.STS-01.020 (1)(c)(i)(C); EASA GM1 UAS.STS-01.020(1)(c) (ED Decision 2022/002/R)

---

### 46. Kontrollert bakkeområde og bakkerisiko · vanskegrad 1

Hva menes med operasjonsvolumet (operational volume)?

- a) Flight geography og contingency-volumet til sammen ✅
- b) Flight geography og bakkerisikobufferen til sammen
- c) Hele det kontrollerte bakkeområdet, inkludert bufferen
- d) Luftrommet innenfor pilotens synsrekkevidde

*Forklaring:* Etter definisjonene i art. 2 er operasjonsvolumet kombinasjonen av flight geography og contingency-volumet. Bakkerisikobufferen ligger på bakken rundt operasjonsvolumet og er ikke en del av det. Kontrollert bakkeområde er projeksjonen av både volumet og bufferen.

*Kilde:* EU 2019/947 art. 2 (28)-(33), innført ved EU 2020/639; UAS.STS-01.030 (2)

---

### 47. Kontrollert bakkeområde og bakkerisiko · vanskegrad 2

En STS-02-operasjon langs en rørgate har en del av bakkerisikobufferen i utkanten av et tettsted. Hva sier scenarioet?

- a) Det går så lenge ingen uinvolverte oppholder seg i den delen av bufferen mens dronen er i lufta
- b) Det går hvis dronen har fallskjerm som demper treffet
- c) Det går hvis en luftromsobservatør står ved tettstedet
- d) Det går ikke; hele det kontrollerte bakkeområdet skal ligge i spredt befolket miljø ✅

*Forklaring:* UAS.STS-02.020 (2) krever at det kontrollerte bakkeområdet, altså flight geography-området, contingency-området og bakkerisikobufferen, ligger helt i et spredt befolket miljø. At bufferen er tom for folk i øyeblikket, er ikke nok når den ligger i et befolket område. Befolket miljø med kontrollert bakkeområde er STS-01, og det er VLOS.

*Kilde:* EU 2020/639 UAS.STS-02.020 (2); luftfartstilsynet.no, «Søke om STS»

---

### 48. Kontrollert bakkeområde og bakkerisiko · vanskegrad 2

Hva må operatøren gjøre før en STS-02-flyging for å hindre at uinvolverte kommer inn i det kontrollerte bakkeområdet?

- a) Ingenting, i spredt befolket miljø regnes risikoen som akseptabel
- b) Ta hensiktsmessige tiltak mot inntrenging, og koordinere med myndighetene ved behov ✅
- c) Gjerde inn hele bakkerisikobufferen fysisk
- d) Sende skriftlig varsel til alle eiendommer innenfor 1 km og sette opp skilt ved innkjørselen

*Forklaring:* UAS.STS-02.030 (8) krever at alle hensiktsmessige tiltak for å redusere risikoen for at uinvolverte kommer inn i området er tatt før start, og at det er koordinert med relevante myndigheter når det kreves. Regelverket sier ikke hvilke tiltak; det beskrives i operasjonsmanualen.

*Kilde:* EU 2020/639 UAS.STS-02.030 (8); Appendix 5 pkt. (6)(c)(i)(G)

---

### 49. Operatøransvar og operasjonsmanual · vanskegrad 1

Et filmteam på tolv personer skal være inne i det kontrollerte bakkeområdet under en STS-01-innspilling. Hva må operatøren sikre før start?

- a) At alle står minst 30 m fra dronen, slik som i A2, eller minst 5 m hvis dronen flyr i lavhastighetsmodus
- b) At alle har gyldig A1/A3-kompetansebevis
- c) At alle bærer refleksvest og hjelm
- d) At alle er informert om risikoen, har fått sikkerhetsinstruks og uttrykkelig har sagt ja til å delta ✅

*Forklaring:* Personer inne i det kontrollerte bakkeområdet er ikke uinvolverte, men bare hvis operatøren har informert dem om risikoen, gitt dem instruks eller opplæring i sikkerhetstiltakene og fått deres uttrykkelige samtykke. Kravet står i både STS-01 og STS-02.

*Kilde:* EU 2020/639 UAS.STS-01.030 (9); UAS.STS-02.030 (9)

---

### 50. Operatøransvar og operasjonsmanual · vanskegrad 2

Hvor lenge skal operatøren minst ta vare på opplysninger om STS-operasjonene, inkludert uvanlige tekniske eller operative hendelser?

- a) 3 år ✅
- b) 1 år
- c) 5 år
- d) Til deklarasjonen utløper

*Forklaring:* UAS.SPEC.050 (1)(g) krever at operatøren i minst 3 år tar vare på opplysninger om operasjonene, inkludert uvanlige hendelser, og om vedlikehold. Opplysninger om kvalifikasjoner og kurs for personellet skal oppbevares i minst 3 år etter at personen har sluttet eller byttet stilling.

*Kilde:* EU 2019/947 UAS.SPEC.050 (1)(g)

---

### 51. Operatøransvar og operasjonsmanual · vanskegrad 2

Operatøren kjøper en C2-linktjeneste fra et teleselskap til et STS-oppdrag. Hva må operatøren sikre?

- a) Ingenting, leverandøren har hele ansvaret for sin egen tjeneste
- b) At leverandøren har eget STS-kompetansebevis
- c) At tjenesten har tilstrekkelig ytelse for operasjonen, og at roller og ansvar mellom operatør og leverandør er fordelt ✅
- d) At Luftfartstilsynet har godkjent leverandøren før bruk

*Forklaring:* EASA forstår en ekstern tjeneste som en tjeneste som er nødvendig for sikker flyging og leveres av en annen enn operatøren. En innkjøpt C2-linktjeneste er et eksempel. UAS.STS-01.030 (5)-(6) krever at operatøren sikrer at ytelsen er tilstrekkelig for operasjonen, og definerer fordelingen av roller og ansvar mellom operatøren og tjenesteleverandøren. Det samme står i STS-02.

*Kilde:* EU 2020/639 UAS.STS-01.030 (5)-(6) og UAS.STS-02.030 (5)-(6); EASA GM1 UAS.STS-01.030(5)&(6)

---

### 52. Operatøransvar og operasjonsmanual · vanskegrad 3

Hvilket av disse hører etter Appendix 5 til contingency-prosedyrene i operasjonsmanualen, ikke til nødprosedyrene?

- a) Håndtering av at dronen forlater operasjonsvolumet
- b) Nødberging (emergency recovery) av dronen
- c) Tiltak for å unngå, eller i det minste begrense, skade på tredjepart i lufta eller på bakken
- d) Håndtering av at eksterne systemer som støtter operasjonen, blir dårligere ✅

*Forklaring:* Appendix 5 skiller: contingency-prosedyrene dekker blant annet at dronen forlater flight geography, at uinvolverte kommer inn i området, ugunstige forhold, svikt i eksterne systemer, fraseologi med observatører og konfliktunngåelse. Nødprosedyrene dekker skade på tredjepart, at dronen forlater operasjonsvolumet, og nødberging.

*Kilde:* EU 2020/639 Appendix 5 pkt. (6)(d)-(e)

---

### 53. Operatøransvar og operasjonsmanual · vanskegrad 1

Operatøren skal bruke en luftromsobservatør i STS-02. Hvilken opplæring krever regelverket for observatøren?

- a) Opplæring på arbeidsplassen utviklet av operatøren, og kjennskap til manualen og prosedyrene ✅
- b) Samme STS-teoriprøve som piloten, tatt på trafikkstasjon, men uten krav om praktisk opplæring
- c) A2-kompetansebevis
- d) Ingen, rollen krever bare godt syn

*Forklaring:* UAS.SPEC.050 (1)(e) sier at personell med oppgaver som er avgjørende for operasjonen, utenom piloten, skal ha fullført opplæring på arbeidsplassen utviklet av operatøren, være informert om operasjonsmanualen og prosedyrene, og ha oppdatert informasjon om geografiske soner.

*Kilde:* EU 2019/947 UAS.SPEC.050 (1)(e)

---

### 54. Operatøransvar og operasjonsmanual · vanskegrad 2

En STS-01-operatør vil selv gi praktisk opplæring og vurdering av egne piloter. Hva er ett av kravene i Appendix 3?

- a) Et klart skille mellom opplæringen og annen operativ virksomhet, slik at vurderingen blir uavhengig ✅
- b) At opplæringen skjer på en godkjent flyplass
- c) At hver kandidat vurderes av en sensor fra Luftfartstilsynet som er til stede under den praktiske prøven
- d) At vurderingen er en enkelt avsluttende prøve på én dag

*Forklaring:* Appendix 3 krever blant annet et klart skille mellom opplæring og annen operativ virksomhet for å sikre uavhengig vurdering, en ansvarlig leder, kompetent og upartisk personell, opplæring i et miljø som er representativt for scenarioet, og at vurderingen er en løpende evaluering av kandidaten, ikke én enkelt prøve.

*Kilde:* EU 2020/639 Appendix 3 pkt. (1)-(7)

---

### 55. Operatøransvar og operasjonsmanual · vanskegrad 3

Operatøren har tre C5-droner fra to produsenter som skal brukes under STS-01, men aldri samtidig på samme sted. Hvordan håndteres det i deklarasjonen?

- a) Én deklarasjon per drone
- b) Én deklarasjon per produsent
- c) Én deklarasjon, med produsent, modell og serienummer for hver drone ✅
- d) Dronene oppgis ikke i det hele tatt, fordi deklarasjonen bare gjelder operatøren og scenarioet

*Forklaring:* EASAs veiledning til deklarasjonsskjemaet sier at operatøren ikke trenger egen deklarasjon for hver drone når de ulike dronene har riktig klassemerke og ikke brukes samtidig på samme sted. Produsent, modell og serienummer for hver drone føres i skjemaet. Droner som bare brukes til praktisk opplæring, skal også føres opp.

*Kilde:* EU 2020/639 Appendix 2; EASA GM1 Appendix 2 (ED Decision 2022/002/R)

---

### 56. Operatøransvar og operasjonsmanual · vanskegrad 2

Hva krever UAS.SPEC.050 av operatøren når det gjelder vedlikehold av dronene?

- a) At alt vedlikehold gjøres hos produsenten
- b) En årlig teknisk kontroll av hver drone hos Luftfartstilsynet
- c) Ingenting ut over produsentens anbefalinger, siden vedlikehold er pilotens ansvar før hver flyging
- d) Vedlikeholdsinstrukser, egnet vedlikeholdspersonell og logg over vedlikeholdet i minst 3 år ✅

*Forklaring:* Operatøren skal holde dronene i sikker stand ved minst å definere vedlikeholdsinstrukser og bruke tilstrekkelig opplært og kvalifisert vedlikeholdspersonell, føre en oppdatert liste over vedlikeholdspersonellet, og ta vare på logg over vedlikeholdet i minst 3 år. Operasjonsmanualen skal også inneholde vedlikeholdsinstrukser.

*Kilde:* EU 2019/947 UAS.SPEC.050 (1)(g)(ii), (1)(i) og (1)(k); Appendix 5 pkt. (5)

---

### 57. Pilotansvar og prosedyrer · vanskegrad 1

En landmåler vil følge en ny vei i STS-01 ved å kjøre sakte etter dronen med bil og fly fra passasjersetet. Er det lov?

- a) Ja, så lenge bilen holder under 5 m/s
- b) Ja, hvis en droneobservatør går langs veien
- c) Nei, dronen skal aldri opereres fra et kjøretøy i bevegelse ✅
- d) Nei, fordi STS-01 bare tillater flyging over ett fast område om gangen

*Forklaring:* UAS.STS-01.040 (2)(e) forbyr å operere dronen fra et kjøretøy i bevegelse. Det samme gjelder i STS-02. Grensen på 5 m/s gjelder dronens bakkehastighet, ikke kjøretøyet.

*Kilde:* EU 2020/639 UAS.STS-01.040 (2)(e); UAS.STS-02.040 (2)(d)

---

### 58. Pilotansvar og prosedyrer · vanskegrad 2

Under et STS-01-oppdrag på et industriområde begynner det å brenne i nabobygget, og brannvesenet rykker ut. Hva gjelder for piloten?

- a) Piloten kan fortsette, men bør tilby brannvesenet bildene
- b) Piloten skal lande, men kan starte igjen så snart brannbilene står på plass
- c) Piloten kan fortsette uten videre innenfor det deklarerte bakkeområdet
- d) Ikke fly nær eller inne i innsatsområdet uten tillatelse fra nødetatene ✅

*Forklaring:* UAS.SPEC.060 (3)(e) sier at piloten under flyging ikke skal fly nær eller inne i områder der en redningsinnsats pågår, med mindre de ansvarlige nødetatene har gitt tillatelse. Deklarasjonen endrer ikke dette.

*Kilde:* EU 2019/947 UAS.SPEC.060 (3)(e)

---

### 59. Pilotansvar og prosedyrer · vanskegrad 1

Politiet kontrollerer en pilot under en STS-01-flyging. Hva krever regelverket at piloten har med seg?

- a) Alltid bevis på egen kompetanse ✅
- b) Operatørens originale deklarasjon på papir
- c) Dronens typesertifikat
- d) En flygelogg signert av Luftfartstilsynet

*Forklaring:* UAS.SPEC.060 (1)(b) krever at piloten har den kompetansen scenarioet krever og har med bevis på kompetansen under flyging.

*Kilde:* EU 2019/947 UAS.SPEC.060 (1)(b)

---

### 60. Pilotansvar og prosedyrer · vanskegrad 2

Operasjonsområdet ligger i en geografisk sone der vilkårene krever at flygekontrollen varsles før flyging. Hvem har etter UAS.SPEC.060 plikt til å sørge for at det er gjort før start?

- a) Luftfartstilsynet, når deklarasjonen bekreftes
- b) Piloten ✅
- c) Ingen, deklarasjonen fungerer som varsel
- d) Dronens geo-awareness-funksjon, som varsler automatisk

*Forklaring:* Før start skal piloten sørge for at informasjon om operasjonen er gjort tilgjengelig for relevant lufttrafikktjeneste, andre luftromsbrukere og berørte parter, når tillatelsen eller vilkårene for den geografiske sonen krever det. Deklarasjonen er ikke et varsel om enkeltflyginger.

*Kilde:* EU 2019/947 UAS.SPEC.060 (2)(d)

---

### 61. Pilotansvar og prosedyrer · vanskegrad 2

Et vindkast får dronen til å drive ut av flight geography, men den er fortsatt godt innenfor contingency-volumet. Hva skal piloten gjøre?

- a) Utløse flygeavslutning straks
- b) Følge operatørens contingency-prosedyrer for å få dronen tilbake ✅
- c) Ingenting, contingency-volumet er en del av det tillatte området
- d) Aktivere automatisk retur (RTH), siden det alltid er første tiltak ved avvik

*Forklaring:* Regelverket har to terskler. Får piloten indikasjon på at dronen kan forlate flight geography, skal contingency-prosedyrene følges. Først når dronen kan komme til å forlate hele operasjonsvolumet, gjelder nødprosedyrene, der flygeavslutning inngår. Contingency-volumet er en buffer for avvik, ikke et vanlig arbeidsområde.

*Kilde:* EU 2020/639 UAS.STS-01.040 (2)(g)-(h); EU 2019/947 art. 2 (28)-(32)

---

### 62. Pilotansvar og prosedyrer · vanskegrad 2

Hva hører med i etterarbeidet etter en STS-flyging, etter kravene til praktisk opplæring?

- a) Bare lading av batterier og nedlasting av data
- b) Rapport til Luftfartstilsynet med flytid og område etter hver flyging
- c) Ny deklarasjon hvis flygingen varte over 30 minutter
- d) Inspeksjon, logg over dronens tilstand og mannskapets tretthet, debrief og ev. hendelsesrapport ✅

*Forklaring:* Attachment A lister etterarbeidet: slå av og sikre dronen, inspeksjon og registrering av relevante data om dronens tilstand og mannskapets tretthet, debrief, og å gjenkjenne når en hendelsesrapport er nødvendig og fylle den ut. Det finnes ikke krav om rapport til myndigheten etter hver flyging.

*Kilde:* EU 2020/639 Attachment A til kap. I, tabell 1 (c)

---

### 63. Pilotansvar og prosedyrer · vanskegrad 2

Når slipper piloten i STS-02 selv å gjøre grundig skanning av luftrommet rundt dronen?

- a) Når dronen følger en forhåndsprogrammert bane med aktiv geo-sperre
- b) Når dronen flyr lavere enn 60 m
- c) Når luftromsobservatører støtter operasjonen med skanningen ✅
- d) Aldri, piloten skal alltid skanne selv

*Forklaring:* UAS.STS-02.040 (2)(a) sier at piloten skal skanne luftrommet grundig, med mindre luftromsobservatører støtter operasjonen. Da er det observatørene som skanner og varsler piloten, jf. UAS.STS-02.050.

*Kilde:* EU 2020/639 UAS.STS-02.040 (2)(a); UAS.STS-02.050

---

### 64. Menneskelige faktorer · vanskegrad 1

Etter en lang arbeidsdag presser kunden på for å få de siste bildene før det blir mørkt. Piloten kjenner seg sliten og ukonsentrert. Hva er riktig?

- a) Fly ferdig raskt mens det fortsatt er lyst nok til å se dronen
- b) Fortsette, men bare med automatisk flymodus
- c) Avbryte eller utsette, fordi piloten ikke skal fly når tretthet gjør henne uskikket ✅
- d) Fortsette hvis en kollega står ved siden av som observatør

*Forklaring:* UAS.SPEC.060 (1)(a) sier at piloten ikke skal utføre oppgavene når hun er uskikket på grunn av skade, tretthet, medisiner, sykdom eller annet. EASAs veiledning nevner kommersielt press og lange arbeidsdager som fallgruver under tretthet. Automatikk eller en observatør fjerner ikke problemet.

*Kilde:* EU 2019/947 UAS.SPEC.060 (1)(a); EASA AMC1 UAS.SPEC.050(1)(d) (menneskelige begrensninger, tretthet)

---

### 65. Menneskelige faktorer · vanskegrad 2

Under en STS-01-flyging ser piloten nesten bare på kameraskjermen for å få riktig bildeutsnitt. Hva er den største risikoen, og hva er et godt tiltak?

- a) Hun mister oversikt over drone og luftrom; bruk en droneobservatør og veksle blikket fast mellom skjerm og luftrom ✅
- b) Batteriet tømmes raskere; bytt batteri oftere
- c) Ingen risiko, VLOS betyr bare at dronen er innenfor synsrekkevidde
- d) Bildene blir uskarpe; bytt til FPV-briller for bedre kontroll

*Forklaring:* I STS-01 skal dronen være i VLOS hele tiden, og piloten skal skanne luftrommet grundig. En droneobservatør kan hjelpe, med klar kommunikasjon. EASAs veiledning om oppmerksomhet peker på å fjerne distraksjoner og bruke skanneteknikk. Å stirre på skjermen er en typisk distraksjon.

*Kilde:* EU 2020/639 UAS.STS-01.040 (2)(a)-(b); EASA AMC1 UAS.SPEC.050(1)(d) (oppmerksomhet)

---

### 66. Menneskelige faktorer · vanskegrad 2

Ruten går rett mot lav kveldssol. Hvilken menneskelig begrensning er mest aktuell i planleggingen?

- a) Ingen, sola påvirker bare kameraet
- b) Varmen, fordi sola varmer opp batteriet slik at spenningen faller raskere enn normalt
- c) Blending, som kan hindre pilot og observatører i å se dronen og annen trafikk ✅
- d) Fargesyn, som er grunnen til at dronen har grønt blinklys

*Forklaring:* EASAs veiledning om menneskelige begrensninger nevner endret syn når man er vendt mot sola. For STS-02 sier veiledningen om flight visibility at sol eller sterkt lys som kan blende pilot og observatører, skal vurderes før start.

*Kilde:* EASA AMC1 UAS.SPEC.050(1)(d) (miljøfaktorer); EASA GM1 UAS.STS-02.020(3)

---

### 67. Menneskelige faktorer · vanskegrad 2

Hva skal operasjonsprosedyrene i en STS-manual inneholde for å redusere menneskelige feil?

- a) Krav om minst 50 loggførte flytimer for alle piloter før de får fly under operatørens deklarasjon
- b) En klar fordeling av oppgaver og en intern sjekkliste for å kontrollere at oppgavene blir gjort ✅
- c) Automatisk logging av alle kommandoer fra fjernkontrollen
- d) Forbud mot flyginger som varer mer enn 30 minutter

*Forklaring:* Appendix 5 pkt. (6)(a) sier at operasjonsprosedyrene, for å minimere menneskelige feil, skal ta hensyn til en klar fordeling og tildeling av oppgaver, og en intern sjekkliste for å kontrollere at personellet utfører oppgavene sine. Timekrav og tidsgrenser står ikke i regelverket.

*Kilde:* EU 2020/639 Appendix 5 pkt. (6)(a)

---

### 68. Menneskelige faktorer · vanskegrad 3

Operasjonsmanualen har mange nødprosedyrer. Hvilke bør piloten etter EASAs veiledning kunne utenat?

- a) De som står først i manualen; resten kan leses opp av en kollega under flygingen
- b) De som produsenten har merket som viktige i bruksanvisningen
- c) De som piloten har øvd på minst én gang under den praktiske opplæringen
- d) De som gjelder kritiske situasjoner med kort tid til å reagere; resten kan tas fra sjekkliste ✅

*Forklaring:* EASAs veiledning om opplæring i spesifikk kategori sier at piloten, avhengig av hvor kritisk situasjonen er og tiden som er tilgjengelig, bør memorere noen prosedyrer, mens andre kan tas fra sjekkliste. Veiledningen står i AMC om opplæring i spesifikk kategori generelt, men prinsippet gjelder like godt for nødprosedyrene i en STS-manual.

*Kilde:* EASA AMC3 UAS.SPEC.050(1)(d) (ED Decision 2022/002/R)

---

### 69. Menneskelige faktorer · vanskegrad 1

Hva krever UAS.SPEC.050 av grensesnittet mellom pilot og dronesystem (HMI)?

- a) At det begrenser risikoen for pilotfeil og ikke gir urimelig tretthet ✅
- b) At det er på norsk, slik at norske piloter forstår alle varsler
- c) At det har berøringsskjerm
- d) At det viser video i minst full HD, slik at piloten ser hindringer tydelig nok

*Forklaring:* UAS.SPEC.050 (1)(h) krever at grensesnittet mellom menneske og maskin er slik at det minimerer risikoen for pilotfeil og ikke gir urimelig tretthet. Menneskelige faktorer er altså også et krav til utstyret, ikke bare til piloten.

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

### 72. UAS-kunnskap: C5, C6 og flygeavslutning · vanskegrad 2

Operatøren har en C3-drone og kjøper et tilbehørssett som gjør den om til C5. Hva må være på plass før STS-01-flyging?

- a) Samsvarserklæring som viser C3 og tilbehørssettet, og C5-merke på tilbehøret ✅
- b) Bare C5-merket; samsvarserklæringen for C3 er ikke lenger relevant
- c) Luftfartstilsynet må godkjenne ombyggingen og utstede ny samsvarserklæring før første flyging
- d) Operatøren må oppgradere dronens programvare til en C5-versjon

*Forklaring:* En C5 kan være en C3 med tilbehørssett. Da skal C5-merket sitte på alt tilbehøret, og samsvarserklæringen skal vise til C3 og tilbehørssettet. Settet skal ikke endre programvaren til C3-dronen, og operatøren skal installere det etter produsentens instruks.

*Kilde:* EU 2020/1058 Part 16 pkt. (8); EU 2020/639 UAS.STS-01.030 (10)

---

### 73. UAS-kunnskap: C5, C6 og flygeavslutning · vanskegrad 3

En produsent vil lage en drone med forbrenningsmotor for bruk i standardscenario. Hvilken klasse kan den få?

- a) C5, så lenge den har en fallskjerm som demper virkningen av treffet
- b) C6, fordi C6 er unntatt kravet om ren elektrisk drift ✅
- c) Begge, drivstoffet er ikke regulert i klassene
- d) Ingen av dem, begge klassene krever elektrisk drift

*Forklaring:* Både C5 og C6 bygger på kravene til C3 i Part 4, der pkt. (7) krever ren elektrisk drift. C5 er bare unntatt pkt. (2) og (10), mens C6 er unntatt pkt. (2), (7) og (10). En C6 kan derfor ha forbrenningsmotor.

*Kilde:* EU 2020/1058 Part 4 pkt. (7); Part 16 og Part 17 (innledningen)

---

### 74. UAS-kunnskap: C5, C6 og flygeavslutning · vanskegrad 2

En produsent vil selge en tjoret fastvingedrone for STS-01. Kan den få C5-merking?

- a) Nei, C5 kan aldri være fastvinge
- b) Nei, tjorede droner får ikke klassemerke
- c) Ja, C5 utelukker fastvinge bare når dronen ikke er tjoret ✅
- d) Ja, men bare hvis vingespennet er under 1 m

*Forklaring:* Part 16 pkt. (1) sier at en C5 skal være et annet luftfartøy enn fastvinge, med mindre det er tjoret. En tjoret fastvinge er altså ikke utelukket, og C3-kravene til tjoret (under 50 m, styrke minst 10 ganger vekten) gjelder. Tilsvarende begrensning finnes ikke for C6.

*Kilde:* EU 2020/1058 Part 16 pkt. (1)

---

### 75. UAS-kunnskap: C5, C6 og flygeavslutning · vanskegrad 2

Hva skal en ikke-tjoret C5-drone gi piloten om kvaliteten på C2-linken?

- a) Løpende overvåking, med ett varsel når linken trolig blir tapt eller svekket, og ett når den er tapt ✅
- b) Bare ett varsel, når linken faktisk er tapt, slik at piloten kan starte prosedyren for tapt link med en gang
- c) Ingenting, C2-linken er produsentens ansvar
- d) En måling av signalstyrken før start

*Forklaring:* Part 16 pkt. (6) krever at piloten løpende kan overvåke kvaliteten på C2-linken og får et varsel når det er sannsynlig at linken blir tapt eller så svekket at sikker gjennomføring er i fare, og et nytt varsel når linken er tapt. C6 har samme krav i Part 17 pkt. (7).

*Kilde:* EU 2020/1058 Part 16 pkt. (6); Part 17 pkt. (7)

---

### 76. UAS-kunnskap: C5, C6 og flygeavslutning · vanskegrad 2

Hvilken fluginformasjon skal en C5-drone minst gi piloten under flyging, sammenlignet med en C6?

- a) C5: posisjon og fart. C6: bare høyde
- b) Begge: bare batterinivå og gjenværende flytid, siden posisjonen vises av Remote ID
- c) Begge: direkte video fra kameraet
- d) C5: høyde over bakken eller startpunktet. C6: i tillegg posisjon og fart ✅

*Forklaring:* Part 16 pkt. (3) krever at C5 gir klar informasjon om høyden over bakken eller startpunktet. Part 17 pkt. (3) krever at C6 gir geografisk posisjon, fart og høyde, fordi piloten ikke ser dronen i BVLOS-delen. Batterivarsel kreves også, gjennom C3-kravene, men er ikke det klassene skiller seg på her.

*Kilde:* EU 2020/1058 Part 16 pkt. (3); Part 17 pkt. (3); Part 4 pkt. (13)

---

### 77. UAS-kunnskap: C5, C6 og flygeavslutning · vanskegrad 3

En C5-drone skal brukes tjoret. Hvilket krav gjelder tjoret for en drone som er tyngre enn luft?

- a) Kortere enn 120 m, uten styrkekrav
- b) Kortere enn 50 m, og minst 10 ganger så sterkt som vekten av dronen ved maks masse ✅
- c) Nøyaktig 30 m, slik at bakkeområdet blir standard
- d) Minst 50 m langt, for å gi rom for manøvrering, og like sterkt som dronens egen vekt

*Forklaring:* C5 skal oppfylle C3-kravene i Part 4. Pkt. (4) sier at tjoret skal være kortere enn 50 m og ha en mekanisk styrke på minst 10 ganger vekten av luftfartøyet ved maks masse. En tjoret C5 er unntatt kravet om flygeavslutning og lavhastighetsmodus.

*Kilde:* EU 2020/1058 Part 4 pkt. (4); Part 16 pkt. (4)-(6)

---

### 78. UAS-kunnskap: C5, C6 og flygeavslutning · vanskegrad 1

Hva skal hver drone i spesifikk kategori være utstyrt med etter UAS.SPEC.050?

- a) En ADS-B-transponder som gjør dronen synlig for bemannede luftfartøy i nærheten
- b) Fallskjerm
- c) Minst ett grønt blinklys for synlighet om natta og aktiv, oppdatert Remote ID ✅
- d) Et varmesøkende kamera

*Forklaring:* UAS.SPEC.050 (1)(l) krever at hver drone har minst ett grønt blinkende lys for synlighet om natta og et aktivt og oppdatert fjernidentifikasjonssystem. Fallskjerm er ikke et generelt krav, men C5 skal ha midler som demper treffet ved flygeavslutning.

*Kilde:* EU 2019/947 UAS.SPEC.050 (1)(l); EU 2020/1058 Part 16 pkt. (5)(c)

---

### 79. UAS-kunnskap: C5, C6 og flygeavslutning · vanskegrad 2

Hva skal en ikke-tjoret C5-drone kunne gjøre hvis C2-linken blir borte?

- a) Prøve å få linken tilbake på en forutsigbar måte, ellers avslutte flygingen skånsomt for tredjepart ✅
- b) Lande rett ned der den er
- c) Fortsette oppdraget på autopilot til batteriet er tomt
- d) Sveve på stedet til piloten får kontakt igjen

*Forklaring:* Part 4 pkt. (5), som også gjelder C5, krever at dronen ved tapt C2-link har en pålitelig og forutsigbar metode for å gjenopprette linken, eller, hvis det ikke lykkes, avslutte flygingen slik at virkningen for tredjepart i lufta eller på bakken reduseres. Produsenten skal beskrive oppførselen ved tapt link i bruksanvisningen.

*Kilde:* EU 2020/1058 Part 4 pkt. (5) og (15)(a)

---
