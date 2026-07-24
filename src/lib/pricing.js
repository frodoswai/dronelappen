/**
 * Én kilde til sannhet for prisen på full tilgang.
 *
 * BAKGRUNN (24.07.2026): Meta-annonsene kostet 387 kr per salg på et
 * 249 kr-produkt. Prisen økes til 349 kr for å gjøre betalt trafikk
 * bærekraftig. 349 kr er fortsatt 36 % av ett A2-eksamensforsøk (970 kr).
 *
 * JURIDISK — VIKTIG:
 *  - Når vi først har annonsert datoen, MÅ økningen gjennomføres. Én
 *    utsettelse gjør markedsføringen villedende (mfl. § 7).
 *  - Ny pris må bli stående. Ikke selg «349 → 249» som tilbud senere med
 *    mindre 349 faktisk har vært prisen i minst 30 dager
 *    (prisopplysningsforskriften § 9a).
 *
 * DERFOR er byttet datostyrt og ikke manuelt: prisen skifter av seg selv
 * ved midnatt, uten at noen må huske å deploye. Samme dato og samme to
 * priser er speilet i supabase/functions/create-checkout/index.ts, som er
 * kilden til sannhet for hva kunden faktisk belastes.
 */

// Skiftetidspunkt, norsk tid (CEST = UTC+2 i august).
export const PRICE_INCREASE_AT = '2026-08-15T00:00:00+02:00'
export const PRICE_INCREASE_LABEL = '15. august'
export const PRICE_INCREASE_LABEL_FULL = '15. august 2026'

export const PRICE_BEFORE = 249
export const PRICE_AFTER = 349
export const ACCESS_MONTHS = 12

export function priceIncreaseDone(now = new Date()) {
  return now.getTime() >= new Date(PRICE_INCREASE_AT).getTime()
}

export function currentPrice(now = new Date()) {
  return priceIncreaseDone(now) ? PRICE_AFTER : PRICE_BEFORE
}

/** Gjeldende pris i hele kroner. Bruk denne overalt i UI-et. */
export const PRICE = currentPrice()

/** Skal vi vise «prisen øker …»-varselet? Kun før skiftet. */
export function showIncreaseNotice(now = new Date()) {
  return !priceIncreaseDone(now)
}
