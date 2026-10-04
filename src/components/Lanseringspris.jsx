import { isExamEnabled } from '../lib/exams'

// «Lanseringspris» ved kjøpsknappene (Frode 04.10.2026). Vises bare når STS er
// på (STS_LIVE eller forhåndsvisning), så ingen ser løftet før STS finnes.
// Fra desember/januar blir det to nivåer (A2 349 / full pakke med STS 449), se
// MacMiniHub/notes/briefs/2026-10-04-dronelappen-prisnivaer-sts.md. Ikke skriv
// «prisen går opp» her før datoen er bestemt.
export default function Lanseringspris({ className = '' }) {
  if (!isExamEnabled('A2_STS')) return null
  return (
    <p className={`text-[12.5px] text-da-navy leading-[1.5] ${className}`}>
      <strong className="font-semibold">Lanseringspris:</strong> alt er med, også det nye STS-påbygget.
    </p>
  )
}
