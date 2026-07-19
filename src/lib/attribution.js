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

// Skriv last-touch-record. Kalles ved hvert besøk som har en identifiserbar
// kilde: enten UTM-parametre eller en ekstern henvisning (f.eks. MailerLites
// klikk-domene, Google, Facebook).
function recordLastTouch(cur, hasUtm) {
  const ref = document.referrer || ''
  if (!hasUtm && !isExternalReferrer(ref)) return
  try {
    const data = {
      ...cur,
      referrer: ref.slice(0, 300),
      landing_path: (window.location.pathname || '/').slice(0, 200),
      seen_at: new Date().toISOString(),
    }
    localStorage.setItem(LAST_KEY, JSON.stringify(data))
  } catch {
    /* localStorage unavailable - skip silently */
  }
}

// Call once on app load (before the user reaches checkout).
export function captureAttribution() {
  try {
    const params = new URLSearchParams(window.location.search)
    const cur = {}
    for (const k of UTM_KEYS) {
      const v = params.get(k)
      if (v) cur[k] = v.slice(0, 200)
    }
    const hasUtm = !!cur.utm_source
    // Meta klikk-ID fra annonse-URL-en. I motsetning til UTM (first touch)
    // gjelder SISTE klikk for CAPI-attribusjon, så denne oppdateres ved
    // hvert besøk med fbclid — også når first-touch-recorden er låst.
    const fbclid = params.get('fbclid')

    // Last touch registreres ALLTID (før first-touch-låsen under), slik at vi
    // ser hva som faktisk brakte brukeren tilbake denne gangen.
    recordLastTouch(cur, hasUtm)

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
      landing_path: (window.location.pathname || '/').slice(0, 200),
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
