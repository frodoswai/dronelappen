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

    let existing = null
    try {
      existing = JSON.parse(localStorage.getItem(KEY) || 'null')
    } catch {
      existing = null
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
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* localStorage unavailable - skip silently */
  }
}

// Read the stored attribution for attaching to checkout. Returns {} if none.
export function getAttribution() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') || {}
  } catch {
    return {}
  }
}
