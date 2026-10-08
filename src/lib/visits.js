// Klikk -> økt per kampanje (06.10.2026, migrasjon 019).
//
// HVORFOR: etter STS-lanseringen hadde mailen 2 klikk i MailerLite og 0 spor i
// appen. Ingenting var i stykker, men vi hadde ingen måling som kunne svare:
// funnel_events fyres bare ved muren og kjøp og bærer FIRST touch, og
// quiz_sessions skrives først når en quiz er fullført. visit_events logger
// kanalen for DETTE besøket på to steder:
//   landing    - siden lastet med kjent kilde (UTM eller ekstern henvisning)
//   quiz_start - første spørsmål vises i en ny økt (ikke ved gjenopptak)
// Rapporten ligger i viewet campaign_click_to_session.
//
// Samme regler som funnel.js: feil svelges, logging skal aldri velte appen,
// og ingen persondata utover user_id.

import { supabase } from './supabase'
import { getCurrentVisitTouch, getLastTouch } from './attribution.js'

export const LANDING = 'landing'
export const QUIZ_START = 'quiz_start'

// Samme lengder som CHECK-constraintene i 019. En for lang verdi ville veltet
// hele innsettingen, og siden feil svelges, ville raden forsvunnet stille.
const LIMITS = {
  utm_source: 120,
  utm_medium: 120,
  utm_campaign: 200,
  utm_content: 200,
  utm_term: 200,
  referrer: 500,
  landing_path: 500,
}

function channelFields(touch) {
  const out = {}
  if (!touch) return out
  for (const [key, max] of Object.entries(LIMITS)) {
    const val = touch[key]
    if (typeof val === 'string' && val) out[key] = val.slice(0, max)
  }
  if (typeof touch.seen_at === 'string') out.touch_seen_at = touch.seen_at
  return out
}

// Første besøk har ingen sesjon før AuthContext har logget inn anonymt. Vent på
// den i stedet for å miste nettopp de nye besøkende, men gi opp etter 8 s.
function waitForUserId(timeoutMs = 8000) {
  return new Promise((resolve) => {
    let done = false
    let sub = null
    const finish = (uid) => {
      if (done) return
      done = true
      sub?.unsubscribe()
      resolve(uid || null)
    }
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user?.id) finish(session.user.id)
    })
    sub = data?.subscription
    supabase.auth.getSession()
      .then(({ data: d }) => { if (d?.session?.user?.id) finish(d.session.user.id) })
      .catch(() => {})
    setTimeout(() => finish(null), timeoutMs)
  })
}

// Roboter teller ikke som besøk (08.10.2026). Google gjennomgår landingssidene
// etter at en annonse er godkjent, og hvert slikt besøk fikk en anonym bruker
// og en landingsrad: lead-gruppa hadde 10 landinger på 3 klikk. Gjelder også
// våre egne headless-tester. navigator.webdriver fanger automatiserte nettlesere.
const BOT_UA = /bot|crawl|spider|slurp|adsbot|mediapartners|google-inspectiontool|lighthouse|headlesschrome|bingpreview|facebookexternalhit/i

function erRobot() {
  try {
    return navigator.webdriver === true || BOT_UA.test(navigator.userAgent || '')
  } catch {
    return false
  }
}

async function insertVisit(row) {
  if (erRobot()) return
  try {
    const uid = await waitForUserId()
    if (!uid) return
    await supabase.from('visit_events').insert({ user_id: uid, ...row })
  } catch {
    /* logging skal aldri velte flyten */
  }
}

// Kalles én gang ved sidelast, etter captureAttribution(). Logger bare når
// besøket har en kjent kilde, så vanlig intern klikking ikke blir støy.
let landingLogged = false
export function logLanding() {
  if (landingLogged) return
  landingLogged = true
  const touch = getCurrentVisitTouch()
  if (!touch) return
  insertVisit({ event: LANDING, ...channelFields(touch) })
}

// Kalles når en NY økt har fått spørsmålene sine (ikke ved gjenopptak etter
// refresh). Bærer siste kjente kilde, som kan være fra et tidligere besøk;
// touch_seen_at viser hvor gammel den er.
export function logQuizStart({ examType, mode }) {
  insertVisit({
    event: QUIZ_START,
    exam_type: examType ? String(examType).slice(0, 40) : null,
    mode,
    ...channelFields(getCurrentVisitTouch() || getLastTouch()),
  })
}
