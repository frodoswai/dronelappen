// Kilde for funksjonsstemmer (?src=sts-epost-2).
//
// Fanges ved innlasting i main.jsx, før noen side rydder URL-en, og huskes
// i 14 dager. Mange åpner e-posten, ser flisa og stemmer ikke før de kommer
// tilbake senere — de skal fortsatt telle som e-post-stemmer. Siste lenke
// vinner: kommer noen via sts-epost-3 etter sts-epost-2, er det den nyeste
// e-posten som fikk dem til å komme tilbake.
//
// Samme format som constrainten i 017_feature_votes_src.sql.

const KEY = 'dl_vote_src'
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000
const FMT = /^[a-z0-9-]{1,40}$/

export function captureVoteSource() {
  try {
    const raw = new URLSearchParams(window.location.search).get('src')
    if (!raw) return
    const src = raw.trim().toLowerCase()
    if (!FMT.test(src)) return
    localStorage.setItem(KEY, JSON.stringify({ src, at: Date.now() }))
  } catch (_) {
    /* private mode e.l. — stemmen telles uansett, bare uten kilde */
  }
}

export function getVoteSource() {
  try {
    const rec = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (!rec || !FMT.test(rec.src || '')) return null
    if (Date.now() - (rec.at || 0) > MAX_AGE_MS) return null
    return rec.src
  } catch (_) {
    return null
  }
}
