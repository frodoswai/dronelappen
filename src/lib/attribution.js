// First-touch attribution capture.
// Stores UTM params + referrer on the first KNOWN-channel visit so the source
// survives the funnel (try free -> return -> buy) and can be attached to the
// Stripe checkout. Lets us see which channel (feed/reels/retargeting/organic)
// actually produces paying customers.

const KEY = 'dl-attribution'
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']

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
export function getAttribution() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') || {}
  } catch {
    return {}
  }
}
