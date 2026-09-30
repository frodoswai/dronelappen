// Eksamenstypene i appen, samlet på ett sted (30.09.2026, STS-påbygget).
//
// Alt som skiller eksamenstypene fra hverandre leses herfra: gyldige ruter
// (App.jsx), antall spørsmål og klokke i eksamensmodus (Quiz.jsx), låst
// modus uten gratis-pool (Quiz.jsx, Rapid.jsx), etiketter i header, resultat,
// Min side, beredskapskortet og fortsett-stripa, og teksten på modusvalget
// (ExamSelect.jsx).
//
// Felter per eksamenstype:
//   short            kort etikett: Min side, beredskap, fortsett-stripa, Tempo
//   display          visningsnavn i headere: quiz, resultat, modusvalg
//   examCount        antall spørsmål i eksamensmodus (Læring er alltid 30)
//   timerMinutes     klokke i eksamensmodus, null = ingen tidsgrense
//   paidOnly         ingen gratis-pool: gratisbrukere møter betalingsmuren
//   paywallTitle     overskrift på muren når paidOnly stenger (Paywall.jsx)
//   tag              stikkord over tittelen på modusvalget
//   intro            valgfri innledning under tittelen på modusvalget
//   examDescription  teksten på Eksamen-kortet, per tilgang (paid / free)
//
// Bestå-grensen er 75 % for alle typene og regnes i Results.jsx ut fra antall
// spørsmål: A1/A3 30 av 40, A2 og STS 23 av 30.

// STS er skjult til lansering. Settes til true på lanseringsdagen, etter at
// spørsmålene er lastet inn (supabase/seed-sts.mjs --apply). I motsatt
// rekkefølge får betalende en tom STS-runde, fordi get-questions ikke har
// noe å gi dem ennå.
export const STS_LIVE = false

// Forhåndsvisning for testere før lansering. I nettleserkonsollen:
//   localStorage.setItem('dl-sts-forhandsvisning', '1')   skrur den på
//   localStorage.removeItem('dl-sts-forhandsvisning')     skrur den av
// og last siden på nytt. Bare synligheten styres herfra; hvilke spørsmål
// brukeren får, avgjør get-questions på serveren som før.
const STS_PREVIEW_KEY = 'dl-sts-forhandsvisning'

export const EXAMS = {
  A1_A3: {
    short: 'A1/A3',
    display: 'A1 / A3',
    // Den offisielle nettprøven på flydrone.no har 40 spørsmål (verifisert
    // 2026-07-08) og er selvgående uten dokumentert tidsgrense (verifisert
    // 2026-06-10), så ingen klokke.
    examCount: 40,
    timerMinutes: null,
    paidOnly: false,
    tag: 'online, gratis',
    examDescription: {
      paid: 'Realistisk simulering. 40 spørsmål, 30 riktige for å bestå — som den offisielle prøven.',
      free: 'Simulering med 25 gratis spørsmål, 75 % for å bestå. Den offisielle prøven har 40 spørsmål.',
    },
  },
  A2: {
    short: 'A2',
    display: 'A2',
    // Den ekte A2-prøven på trafikkstasjonen: 30 spørsmål, 60 minutter.
    examCount: 30,
    timerMinutes: 60,
    paidOnly: false,
    tag: 'trafikkstasjonen',
    examDescription: {
      paid: 'Realistisk simulering. 30 spørsmål, 60 min, 23 riktige for å bestå.',
      free: 'Simulering med 25 gratis spørsmål, 60 min, 19 riktige for å bestå.',
    },
  },
  A2_STS: {
    short: 'STS',
    display: 'STS-påbygg',
    // «Utvidelse av A2 til STS» (DRONEA2STS): 30 spørsmål, 23 riktige.
    // Luftfartstilsynet oppgir ingen tidsgrense, så Frode satte 60 min som
    // på A2 (30.09.2026). Ingen gratis-pool: STS er med i full tilgang.
    examCount: 30,
    timerMinutes: 60,
    paidOnly: true,
    paywallTitle: 'STS-påbygget er med i full tilgang.',
    tag: 'trafikkstasjonen',
    intro:
      'Prøven «Utvidelse av A2 til STS» (kode DRONEA2STS) har 30 spørsmål, og du må ha minst 23 riktige. Luftfartstilsynet oppgir ikke tidsgrensen, så eksamensmodusen gir deg 60 minutter, som på A2.',
    examDescription: {
      paid: 'Realistisk simulering. 30 spørsmål, 60 min, 23 riktige for å bestå.',
      free: 'Realistisk simulering. 30 spørsmål, 60 min, 23 riktige for å bestå. Med i full tilgang.',
    },
  },
}

function stsPreview() {
  try {
    return localStorage.getItem(STS_PREVIEW_KEY) === '1'
  } catch (_) {
    return false // privat modus eller blokkert lagring: ingen forhåndsvisning
  }
}

// Eksamenstypene som vises og kan åpnes nå, i fast rekkefølge.
export function enabledExamTypes() {
  const types = ['A1_A3', 'A2']
  if (STS_LIVE || stsPreview()) types.push('A2_STS')
  return types
}

export function isExamEnabled(type) {
  return enabledExamTypes().includes(type)
}

// Oppsettet for en eksamenstype, eller null for en ukjent type.
export function examConfig(type) {
  return Object.prototype.hasOwnProperty.call(EXAMS, type) ? EXAMS[type] : null
}

// Kort etikett: 'A1/A3', 'A2', 'STS'. En ukjent type vises som den er.
export function examLabel(type) {
  return examConfig(type)?.short ?? (type || '')
}

// Visningsnavn: 'A1 / A3', 'A2', 'STS-påbygg'. En ukjent type vises som den er.
export function examDisplay(type) {
  return examConfig(type)?.display ?? (type || '')
}
