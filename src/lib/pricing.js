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

/**
 * Lanseringsprisen med STS inkludert gjelder til og med 30. november 2026
 * (Frode 13.10.2026, etter salgsanalysen samme dag). Fra 1. desember blir det
 * to nivåer for nye kunder: A2 med A1/A3 349 kr, full pakke med STS 449 kr
 * (besluttet 4/10, se MacMiniHub/notes/briefs/2026-10-04-dronelappen-prisnivaer-sts.md).
 *
 * JURIDISK: datoen er nå annonsert, så nivåbyttet MÅ gjennomføres 1/12
 * (mfl. § 7). Selve byttet (Stripe, create-checkout, entitlements) bygges i
 * november etter prisnivå-briefen. Fristteksten slukker av seg selv ved
 * STS_TIER_AT, så ingen må huske å deploye den bort.
 */
export const STS_TIER_AT = '2026-12-01T00:00:00+01:00'
export const STS_TIER_LABEL = '30. november'
export const STS_TIER_LABEL_FULL = '30. november 2026'
export const PRICE_FULL_AFTER = 449

/**
 * Klokka nivålogikken leser. I produksjon er det alltid nå. I dev-serveren
 * (`npm run dev`) kan den stilles for å se appen slik den blir etter byttet:
 *   http://localhost:5173/?naa=2026-12-01T10:00   (huskes i fanen)
 *   ?naa=0 nullstiller.
 * Bare UI-et flytter seg. Hva kunden belastes avgjør create-checkout.
 */
function naa() {
  if (import.meta.env?.DEV) {
    try {
      const v = new URLSearchParams(window.location.search).get('naa')
      if (v === '0') sessionStorage.removeItem('dl-test-naa')
      else if (v) sessionStorage.setItem('dl-test-naa', v)
      const lagret = sessionStorage.getItem('dl-test-naa')
      if (lagret && !Number.isNaN(new Date(lagret).getTime())) return new Date(lagret)
    } catch {
      /* ingen lagring: vanlig klokke */
    }
  }
  return new Date()
}

export function stsTierDone(now = naa()) {
  return now.getTime() >= new Date(STS_TIER_AT).getTime()
}

/**
 * TO NIVÅER FRA 1. DESEMBER 2026 (bygd 26.11.2026).
 *
 *   a2           349 kr  A2 med A1/A3. Hovedtilbudet (Frode 26.11).
 *   a2_sts       449 kr  A2, A1/A3 og STS.
 *   sts_upgrade  149 kr  STS-påbygg for kunde med aktiv A2. Arver
 *                        utløpsdatoen fra A2-kjøpet, ingen ny periode.
 *
 * Til og med 30.11 finnes ett kjøp: 349 kr med STS. Alle som kjøper før
 * byttet har STS i hele perioden sin.
 *
 * Speiler supabase/functions/create-checkout/index.ts, som er kilden til
 * sannhet for hva kunden belastes. Endres den ene, endres den andre.
 */
export const PRICE_A2 = 349
export const PRICE_A2_STS = 449
export const PRICE_STS_UPGRADE = 149

/** true fra 1.12.2026. Leses ved oppstart, på samme måte som PRICE. */
export const TIERS = stsTierDone()

/** Planen hurtigkjøpsknappene sender. Før byttet finnes bare pakken. */
export const DEFAULT_PLAN = TIERS ? 'a2' : 'a2_sts'

/** Navnet på det hurtigkjøpsknappene selger. */
export const BUY_LABEL = TIERS ? 'A2' : 'Full tilgang'

export const PLAN_LABEL = { a2: 'A2', a2_sts: 'A2 + STS', sts_upgrade: 'STS-påbygg' }

/** Beløpet create-checkout belaster for en plan akkurat nå, i hele kroner. */
export function planPrice(plan) {
  if (plan === 'sts_upgrade') return PRICE_STS_UPGRADE
  if (!TIERS) return PRICE
  return plan === 'a2_sts' ? PRICE_A2_STS : PRICE_A2
}

/** Beløpet for en plan slik Stripe sendte kunden tilbake med den (?plan=). */
export function paidPlanPrice(plan) {
  if (plan === 'a2') return PRICE_A2
  if (plan === 'a2_sts') return PRICE_A2_STS
  if (plan === 'sts_upgrade') return PRICE_STS_UPGRADE
  return PRICE
}

/** Skal vi vise «lanseringspris til 30. november»-fristen? Kun før byttet. */
export function showLaunchPriceNotice(now = naa()) {
  return !stsTierDone(now)
}
