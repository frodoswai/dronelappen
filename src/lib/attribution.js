// Attribution capture: FIRST touch + LAST touch.
//
// First touch answers "hvor oppdaget de oss?" and survives the whole funnel
// (try free -> return -> buy). Last touch answers "hva utløste kjøpet?".
// Vi trenger begge: 19.07.2026 kom et salg 70 minutter etter at Ukerapporten
// gikk ut, men Stripe-metadataen viste bare first-touch fra 10 dager før, så
// det var umulig å avgjøre om nyhetsbrevet faktisk utløste kjøpet.
//
// Begge settene sendes til Stripe ved checkout: first touch under sine egne
// nøkler (utm_source, ...) og last touch prefikset `lt_` (lt_utm_source, ...).
// create-checkout videresender alle nøkler generisk, så dette krever ingen
// endring i edge-funksjonen.

const KEY = 'dl-attribution'
const LAST_KEY = 'dl-attribution-last'
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']

// Er henvisningen ekstern? Intern klikking skal ikke overskrive last touch.
function isExternalReferrer(ref) {
  if (!ref) return false
  try {
    return new URL(ref).hostname !== window.location.hostname
  } catch {
    return false
  }
}

// Henvisning fra VÅRT eget domene, som URL-objekt. Null ellers.
//
// De statiske landingssidene (/dronesertifikat-a2/, /droneeksamen-oving/,
// /pris/) serveres FØR SPA-rewriten. Et annonseklikk lander med UTM-ene på den
// statiske siden, brukeren går videre inn i appen, og da står det bare «/» i
// adressefeltet: location.search er tom mens document.referrer fortsatt bærer
// hele annonse-URL-en.
//
// Oppdaget 28.07.2026: to Google Ads-salg (Emil 24/7, Chris 28/7) lå i Stripe
// helt uten utm_source, med parametrene synlige bare i referrer-feltet. Google
// ble dermed undertalt i hvert kanalregnskap vi har laget.
//
// Vi leser BARE fra samme domene. En ekstern URL kan bære noen andres
// UTM-parametre, og de er ikke våre å påberope oss.
function sameOriginReferrer() {
  const ref = document.referrer || ''
  if (!ref) return null
  try {
    const u = new URL(ref)
    return u.hostname === window.location.hostname ? u : null
  } catch {
    return null
  }
}

// Skriv last-touch-record. Kalles ved hvert besøk som har en identifiserbar
// kilde: enten UTM-parametre eller en ekstern henvisning (f.eks. MailerLites
// klikk-domene, Google, Facebook).
function recordLastTouch(cur, hasUtm, entryPath) {
  const ref = document.referrer || ''
  if (!hasUtm && !isExternalReferrer(ref)) return
  try {
    const data = {
      ...cur,
      referrer: ref.slice(0, 300),
      landing_path: (entryPath || window.location.pathname || '/').slice(0, 200),
      seen_at: new Date().toISOString(),
    }
    localStorage.setItem(LAST_KEY, JSON.stringify(data))
  } catch {
    /* localStorage unavailable - skip silently */
  }
}

// Google klikk-ID (gclid/gbraid/wbraid), holdt KUN I MINNET for denne fanen.
//
// HVORFOR IKKE localStorage: samtykkebanneret vårt lover at vi ikke lagrer noe
// på enheten før brukeren sier ja (se index.html — Consent Mode v2 kjører med
// ad_storage 'denied', og url_passthrough bærer gclid i URL-en nettopp for å
// slippe lagring). Legger vi klikk-IDen i localStorage, bryter vi det løftet
// for alle som har avslått. En modulvariabel lever i fanen og forsvinner med
// den, akkurat som url_passthrough.
//
// HVA DEN LØSER (31.08.2026): kjøpskonverteringen fyres i PaymentReturn når
// nettleseren kommer tilbake fra Stripe. Uten cookie-samtykke er URL-en eneste
// bærer av klikk-IDen, og den overlever ikke turen ut til Stripe — Google fikk
// derfor ingenting å knytte kjøpet til. Nå sendes IDen med til create-checkout,
// som baker den inn i success_url. Målt: to av tre ads-salg i august manglet i
// Google Ads av nettopp denne grunn.
//
// Samme landingsside-felle som for UTM/fbclid: annonseklikket kan lande på en
// statisk side som ligger foran SPA-rewriten, så vi leser også fra en
// henvisning på vårt eget domene.
const GOOGLE_CLICK_PARAMS = ['gclid', 'gbraid', 'wbraid']
let googleClick = null // { name, value } eller null

function captureGoogleClick(params, refUrl) {
  for (const name of GOOGLE_CLICK_PARAMS) {
    const value = params.get(name) || (refUrl && refUrl.searchParams.get(name))
    if (value) return { name, value: value.slice(0, 200) }
  }
  return null
}

// Klikk-IDen slik den skal sendes til create-checkout. Null hvis dette besøket
// ikke kom fra et Google-annonseklikk.
export function getGoogleClick() {
  return googleClick
}

// Call once on app load (before the user reaches checkout).
export function captureAttribution() {
  try {
    const params = new URLSearchParams(window.location.search)
    const refUrl = sameOriginReferrer()
    const cur = {}
    for (const k of UTM_KEYS) {
      const v = params.get(k)
      if (v) cur[k] = v.slice(0, 200)
    }

    // Er adressefeltet uten kilde, men henvisningen er vår egen landingsside
    // med annonseparametre? Da hentes de derfra. Vi krever utm_source i
    // henvisningen før noe overtas, så en vanlig intern klikking (uten
    // parametre) aldri kan forkludre en ekte kilde. Eksisterende verdier i
    // adressefeltet vinner alltid.
    let entryPath = null
    if (!cur.utm_source && refUrl) {
      const fraRef = {}
      for (const k of UTM_KEYS) {
        const v = refUrl.searchParams.get(k)
        if (v) fraRef[k] = v.slice(0, 200)
      }
      if (fraRef.utm_source) {
        for (const [k, v] of Object.entries(fraRef)) {
          if (!cur[k]) cur[k] = v
        }
        // Den ekte landingssiden var den statiske siden, ikke «/».
        entryPath = (refUrl.pathname || '/').slice(0, 200)
      }
    }

    const hasUtm = !!cur.utm_source
    // Meta klikk-ID fra annonse-URL-en. I motsetning til UTM (first touch)
    // gjelder SISTE klikk for CAPI-attribusjon, så denne oppdateres ved
    // hvert besøk med fbclid — også når first-touch-recorden er låst.
    // Samme landingsside-fellen gjelder her, så samme fallback.
    const fbclid = params.get('fbclid') || (refUrl && refUrl.searchParams.get('fbclid')) || null

    // Google klikk-ID: kun i minnet, se kommentaren over captureAttribution.
    // Et besøk uten klikk-ID skal ikke nulle ut en ID fra samme fane-økt
    // (SPA-navigasjon kaller denne på nytt uten parametre i adressefeltet).
    googleClick = captureGoogleClick(params, refUrl) || googleClick

    // Last touch registreres ALLTID (før first-touch-låsen under), slik at vi
    // ser hva som faktisk brakte brukeren tilbake denne gangen.
    recordLastTouch(cur, hasUtm, entryPath)

    let existing = null
    try {
      existing = JSON.parse(localStorage.getItem(KEY) || 'null')
    } catch {
      existing = null
    }

    if (existing && fbclid) {
      existing.fbclid = fbclid.slice(0, 200)
      existing.fbclid_ts = Date.now()
      localStorage.setItem(KEY, JSON.stringify(existing))
    }

    // Keep the first KNOWN-channel touch. If a real channel is already stored,
    // don't overwrite. Otherwise store the current visit, and upgrade a previous
    // "direct" (no utm_source) record the moment a real channel shows up.
    if (existing && existing.utm_source) return
    if (existing && !hasUtm) return

    const data = {
      ...cur,
      referrer: (document.referrer || '').slice(0, 300),
      landing_path: (entryPath || window.location.pathname || '/').slice(0, 200),
      first_seen: (existing && existing.first_seen) || new Date().toISOString(),
    }
    if (fbclid) {
      data.fbclid = fbclid.slice(0, 200)
      data.fbclid_ts = Date.now()
    } else if (existing && existing.fbclid) {
      data.fbclid = existing.fbclid
      data.fbclid_ts = existing.fbclid_ts
    }
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* localStorage unavailable - skip silently */
  }
}

// Meta browser-ID-er (fbp/fbc) for CAPI, lest ved checkout-tidspunkt.
// _fbp/_fbc-cookiene settes av pixelen, som bare lastes etter samtykke.
// Uten _fbc rekonstruerer vi fbc fra lagret fbclid (Meta-format:
// fb.1.<ms-timestamp>.<fbclid>). Hele funksjonen er samtykke-gatet:
// har brukeren ikke godtatt cookies, sender vi ingenting — å omgå
// avslaget via fbclid ville brutt tilliten samtykkebanneret lover.
export function getMetaIds() {
  const out = {}
  try {
    if (localStorage.getItem('dl-cookie-consent') !== 'accepted') return out
    const cookies = {}
    for (const part of document.cookie.split(';')) {
      const i = part.indexOf('=')
      if (i > 0) cookies[part.slice(0, i).trim()] = part.slice(i + 1).trim()
    }
    if (cookies._fbp) out.fbp = cookies._fbp.slice(0, 200)
    if (cookies._fbc) out.fbc = cookies._fbc.slice(0, 200)
    if (!out.fbc) {
      const a = getAttribution()
      if (a.fbclid) out.fbc = `fb.1.${a.fbclid_ts || Date.now()}.${a.fbclid}`
    }
  } catch {
    /* ignore */
  }
  return out
}

// Read the stored attribution for attaching to checkout. Returns {} if none.
// First touch beholder sine opprinnelige nøkkelnavn (utm_source, first_seen,
// ...) så historiske Stripe-rader forblir sammenlignbare. Last touch legges
// ved siden av, prefikset `lt_`, slik at en rad kan leses som:
//   utm_source=droneavisa   -> oppdaget oss via guiden
//   lt_utm_source=newsletter -> men det var nyhetsbrevet som utløste kjøpet
export function getAttribution() {
  let first = {}
  let last = {}
  try {
    first = JSON.parse(localStorage.getItem(KEY) || '{}') || {}
  } catch {
    first = {}
  }
  try {
    last = JSON.parse(localStorage.getItem(LAST_KEY) || '{}') || {}
  } catch {
    last = {}
  }

  const out = { ...first }
  for (const [k, v] of Object.entries(last)) {
    if (v == null || v === '') continue
    out[`lt_${k}`] = v
  }
  return out
}

// Attribusjonen vi sender med e-postpåmeldinger. Bevisst mindre enn det Stripe
// får: MailerLite trenger bare å svare på «hvilken kanal skaffet denne
// adressen», ikke hele reisen. Derfor bare FIRST touch — se kommentaren i
// newsletter-signup om hvorfor opprinnelsen ikke skal overskrives ved
// gjenpåmelding.
//
// Bakgrunn 04.08.2026: Meta-lead-annonsen hadde brukt 372 kr og registrert
// null leads i Metas egen måling, mens lista vokste med 16 personer samme uke.
// Uten kilde på abonnenten var det umulig å avgjøre om annonsen virket.
const LEAD_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'landing_path']

export function getLeadAttribution() {
  const all = getAttribution()
  const out = {}
  for (const key of LEAD_KEYS) {
    const val = all[key]
    if (typeof val === 'string' && val) out[key] = val
  }
  return out
}

// Kanalfeltene som `funnel_events` faktisk har kolonner for (migrasjon
// 20260813203301). Lagt til 13.08.2026, samme dag som et salg kl. 13:15 ikke
// kunne tilskrives noen kanal fra Supabase alene — Stripe-metadataen viste at
// kjøperen kom fra Droneavisa-guiden, men trakten visste ingenting.
//
// FIRST touch, ikke last. `sale_attribution`-viewet plukker den tidligste raden
// med kjent kilde per bruker, så alle rader for samme bruker må bære samme
// kilde for at «hvor kom kjøperen fra» skal bli stabilt. Hele reisen (first
// OG last) ligger uansett i Stripe-metadataen, som create-checkout fyller fra
// getAttribution().
//
// Lengdene under er DATABASENS, ikke localStorages: tabellen har en
// CHECK-constraint på 120/120/200/200/200/500/500. getAttribution() kutter på
// 200/300, så en lang utm_source ville brutt constrainten og veltet hele
// innsettingen — og siden logFunnel svelger feil, ville trakthendelsen
// forsvunnet uten et pip.
const FUNNEL_LIMITS = {
  utm_source: 120,
  utm_medium: 120,
  utm_campaign: 200,
  utm_content: 200,
  utm_term: 200,
  referrer: 500,
  landing_path: 500,
}

export function getFunnelAttribution() {
  const out = {}
  try {
    const first = JSON.parse(localStorage.getItem(KEY) || '{}') || {}
    for (const [key, max] of Object.entries(FUNNEL_LIMITS)) {
      const val = first[key]
      // Tom streng slippes gjennom med vilje: viewet leser referrer = '' som
      // «direkte» og referrer IS NULL som «ukjent». Det er to forskjellige
      // svar, og bare det første er en kanal vi faktisk har målt.
      if (typeof val !== 'string') continue
      out[key] = val.slice(0, max)
    }
  } catch {
    /* localStorage utilgjengelig - logg hendelsen uten kanal */
  }
  return out
}
