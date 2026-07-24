// Kjøpsintensjon på tvers av login-runden («mild variant», 2026-07-09).
//
// Problem: en utlogget bruker som klikker «Full tilgang»-knappen sendes til
// /login → magic link på e-post → tilbake på forsiden — og måtte selv finne
// kjøpsknappen igjen. Dødpunkt i salgsflyten.
//
// Løsning: klikket lagrer en intensjon i localStorage FØR login. Når brukeren
// er tilbake innlogget (samme enhet) og fortsatt ikke er betalt, viser Home
// et «fullfør kjøpet»-banner med én knapp rett til Stripe. Bevisst IKKE
// auto-redirect til betaling: e-postlenken kan klikkes lenge etterpå, og en
// overraskende betalingsside skremmer mer enn den konverterer.
//
// TTL 30 min: lenger enn en normal e-postrunde, kort nok til at banneret
// ikke spøker dager senere. Annen enhet → ingen intensjon → dagens flyt.

const KEY = 'dl-purchase-intent'
const TTL_MS = 30 * 60 * 1000

export function setPurchaseIntent() {
  try {
    localStorage.setItem(KEY, String(Date.now()))
  } catch (_) {
    /* private mode etc. — flyten degraderer til dagens oppførsel */
  }
}

export function hasPurchaseIntent() {
  try {
    const t = Number(localStorage.getItem(KEY))
    return Number.isFinite(t) && t > 0 && Date.now() - t < TTL_MS
  } catch (_) {
    return false
  }
}

export function clearPurchaseIntent() {
  try {
    localStorage.removeItem(KEY)
  } catch (_) {
    /* ignore */
  }
}
