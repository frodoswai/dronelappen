import { isExamEnabled } from '../lib/exams'
import { PRICE, PRICE_FULL_AFTER, STS_TIER_LABEL, showLaunchPriceNotice } from '../lib/pricing'

// «Lanseringspris» ved kjøpsknappene (Frode 04.10.2026). Vises bare når STS er
// på (STS_LIVE eller forhåndsvisning), så ingen ser løftet før STS finnes.
// Fristen 30. november og 449 kr for full pakke fra 1. desember: Frode 13.10.2026.
// Slukker av seg selv ved STS_TIER_AT (src/lib/pricing.js). Ingen før-pris-
// påstander her: 349 kr er prisen nå, 449 kr er den kommende prisen for pakken
// med STS. A2 alene forblir 349 kr.
export default function Lanseringspris({ className = '' }) {
  if (!isExamEnabled('A2_STS')) return null
  if (!showLaunchPriceNotice()) return null
  return (
    <p className={`text-[12.5px] text-da-navy leading-[1.5] ${className}`}>
      <strong className="font-semibold">Lanseringspris til {STS_TIER_LABEL}:</strong> {PRICE} kr for 12 måneder med
      alt, også STS. Fra 1. desember koster pakken med STS {PRICE_FULL_AFTER} kr. Kjøper du før det, har du STS
      med i hele perioden.
    </p>
  )
}
