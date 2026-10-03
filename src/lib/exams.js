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

// Testlenke (03.10.2026): dronelappen.app/?sts-test=1 skrur på
// forhåndsvisningen i nettleseren som åpner lenken, ?sts-test=0 skrur den av.
// Kalles én gang ved oppstart (main.jsx). Slik kan testere på mobil slippe
// nettleserkonsollen. Ingen effekt når STS_LIVE er true.
export function captureStsPreview() {
  try {
    const v = new URLSearchParams(window.location.search).get('sts-test')
    if (v === '1') localStorage.setItem(STS_PREVIEW_KEY, '1')
    if (v === '0') localStorage.removeItem(STS_PREVIEW_KEY)
  } catch (_) {
    // blokkert lagring: ingen forhåndsvisning
  }
}

// Før lansering ligger STS-spørsmålene i banken, men er ikke åpne ennå.
// Der totalen vises, legger vi da til hvor mange som gjelder A1/A3 og A2
// (Frode 03.10.2026). Tom streng etter lansering eller når totalen ikke
// inneholder STS.
export function antallParentes(total, a1a3PlussA2) {
  if (STS_LIVE || !total || !a1a3PlussA2 || total <= a1a3PlussA2) return ''
  return ` (${a1a3PlussA2} på A1/A3 og A2)`
}

// Bryter på Min side (03.10.2026) for testere i den installerte appen, der
// adressefeltet ikke kan redigeres. Vises bare så lenge STS_LIVE er false.
export function stsPreviewOn() {
  return stsPreview()
}
export function setStsPreview(on) {
  try {
    if (on) localStorage.setItem(STS_PREVIEW_KEY, '1')
    else localStorage.removeItem(STS_PREVIEW_KEY)
  } catch (_) {
    // blokkert lagring: ingenting å gjøre
  }
}
