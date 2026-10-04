import { Link } from 'react-router-dom'
import ModePillRow from './ModePillRow'

// STS-påbygget som ekte eksamenskort på forsiden (30.09.2026). Står på
// stemmeflisas plass (StsVoteCard) når STS er skrudd på, se lib/exams.js og
// Home.jsx. Samme oppbygning som A1/A3-kortet: hele kortet lenker til
// modusvalget (overleggslenke, z-10), og moduspillene ligger over (z-20) som
// direktelenker til hver modus. STS har ingen gratis-pool, så gratisbrukere
// møter betalingsmuren når de starter en modus.
export default function StsExamCard() {
  return (
    <div className="quiz-option group rise-in rise-d3 relative bg-white border-[0.5px] border-da-navy/30 rounded-lg px-4 pt-3.5 pb-3 mb-3 transition-all shadow-[0_1px_3px_rgba(8,53,84,0.05)] hover:border-da-navy/50 hover:shadow-[0_2px_4px_rgba(8,53,84,0.06),0_6px_18px_rgba(8,53,84,0.10)] hover:-translate-y-[1px] active:scale-[0.99]">
      <Link
        to="/exam/A2_STS"
        aria-label="STS-påbygget, velg modus"
        className="absolute inset-0 z-10 rounded-lg"
      />
      <div className="font-mono text-[12px] font-medium text-da-gold tracking-[0.12em] mb-1">
        trafikkstasjonen
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-1.5">
        <div className="text-xl font-medium text-da-navy leading-none tracking-tight">
          STS-påbygget
        </div>
        <span className="font-mono text-[10.5px] font-medium text-da-gold-text bg-da-cream px-2 py-0.5 rounded-[3px]">
          Med i full tilgang
        </span>
      </div>
      <p className="text-[12.5px] text-da-text-body leading-[1.5] mb-1">
        For deg som har A2 og skal ta «Utvidelse av A2 til STS».
      </p>
      {/* «Over 90» (Frode 04.10.2026), likt lanseringsmailen. Stemmer så lenge
          A2_STS har minst 91 spørsmål (93 per 04.10). */}
      <p className="text-[11.5px] text-da-text-muted leading-[1.5] mb-2.5">
        Over 90 spørsmål · 30 på prøven · 23 riktige for å bestå
      </p>
      <div className="relative z-20">
        <ModePillRow variant="muted" examType="A2_STS" />
      </div>
      <div className="flex justify-end mt-2.5">
        <span className="font-mono text-[11px] tracking-[0.1em] bg-white border-[0.5px] border-da-navy/40 text-da-navy px-3.5 py-2 rounded-[5px] group-hover:border-da-navy/70 transition-colors">
          Start STS her
        </span>
      </div>
    </div>
  )
}
