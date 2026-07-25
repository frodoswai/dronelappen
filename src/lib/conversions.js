/**
 * Google Ads-konverteringer, samlet ett sted.
 *
 * send_to-strengene er ugjennomsiktige («AW-18330796641/v4XgCIjwwtYcEOGE56RE»)
 * og umulige å se feil på med det blotte øyet. Ligger de spredt i komponentene,
 * er det bare et spørsmål om tid før én av dem blir skrevet av feil og en
 * konvertering stille slutter å telle. Derfor står de her, med navn.
 *
 * gtag lastes alltid (Consent Mode v2, se index.html), men med lagring satt til
 * 'denied' til brukeren samtykker. Hendelsene sendes derfor uansett: med
 * samtykke måles de eksakt, uten samtykke går de cookieløst og redigert til
 * Googles modellering. Det er hele poenget — vi mister ikke signalet fra de
 * ~9 av 10 som aldri trykker «Godta alle».
 */

export const AW_ID = 'AW-18330796641'

// Kjøp. Primær konvertering — den budgivningen skal styres av.
export const CONV_KJOP = `${AW_ID}/6u5JCN72_tQcEOGE56RE`

// E-postpåmelding. SEKUNDÆR i Google Ads (primaryForGoal=false): den
// registreres og rapporteres, men styrer ikke budgivningen. Med vilje —
// gjorde vi den primær ved siden av kjøp, ville algoritmen jaget den billige
// hendelsen og salgene kunne tørket inn. Speiler Metas «Lead»-hendelse, og
// fyres de samme tre stedene: /a2-ovingsplan, resultatskjermen og paywallen.
export const CONV_EPOST = `${AW_ID}/v4XgCIjwwtYcEOGE56RE`

/**
 * Send en konverteringshendelse til Google Ads.
 * Alltid best-effort: gtag kan være blokkert av en utvidelse, og en
 * annonsemåling skal aldri kunne velte det brukeren faktisk holder på med.
 */
export function googleKonvertering(sendTo, params = {}) {
  try {
    window.gtag?.('event', 'conversion', { send_to: sendTo, ...params })
  } catch {
    // gtag ikke lastet eller blokkert — ignorer.
  }
}
