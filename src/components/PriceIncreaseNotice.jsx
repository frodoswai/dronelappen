import { PRICE_AFTER, PRICE_INCREASE_LABEL, showIncreaseNotice } from '../lib/pricing'

/**
 * Varsel om varslet prisøkning. Vises kun FØR skiftedatoen — etter den
 * forsvinner den av seg selv, slik at vi aldri står med et utdatert
 * «prisen øker snart» på siden (som ville vært villedende).
 *
 * Bevisst nøktern formulering: et faktum om en kommende prisendring,
 * ikke et «tilbud». Vi bruker ikke ord som «kampanje», «rabatt» eller
 * «spar» — det ville utløst førpriskravene i prisopplysningsforskriften.
 */
export default function PriceIncreaseNotice({ className = '', compact = false }) {
  if (!showIncreaseNotice()) return null

  if (compact) {
    return (
      <p className={`font-mono text-[11px] uppercase tracking-wide text-da-gold ${className}`}>
        Prisen øker til {PRICE_AFTER} kr {PRICE_INCREASE_LABEL}
      </p>
    )
  }

  return (
    <p className={`text-[13px] leading-relaxed text-da-navy/75 ${className}`}>
      <span className="font-semibold text-da-navy">
        Prisen øker til {PRICE_AFTER} kr {PRICE_INCREASE_LABEL}.
      </span>{' '}
      Kjøper du før det, beholder du dagens pris i hele tilgangsperioden.
    </p>
  )
}
