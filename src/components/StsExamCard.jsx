import ModePillRow from './ModePillRow'
import { useAuth } from '../contexts/AuthContext'
import { TIERS, PRICE_STS_UPGRADE } from '../lib/pricing'

// STS-kortet på forsiden. B2-drakt 14.11.2026: samme oppsett som A2 og A1/A3,
// med tre knapper rett inn i modusene.
export default function StsExamCard() {
  const { tier, sts, loading } = useAuth()
  // Fra 1.12.2026: STS ligger i nivået A2 + STS, og er påbygg for A2-kunder.
  const merke =
    tier !== 'paid'
      ? TIERS ? 'Med i A2 + STS' : 'Med i full tilgang'
      : !loading && !sts
      ? `Påbygg ${PRICE_STS_UPGRADE} kr`
      : ''
  return (
    <section className="rise-in rounded-2xl border border-[#C9D3DC] p-4 mb-3.5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-2">
        <h3 className="font-cond text-[30px] font-bold text-da-navy leading-none">
          STS-påbygget
        </h3>
        {merke && (
          <span className="px-2.5 py-1 rounded-lg bg-[#EEF3F7] text-da-navy text-[13px] font-semibold whitespace-nowrap">
            {merke}
          </span>
        )}
      </div>
      {/* «Over 90» (Frode 04.10.2026), likt lanseringsmailen. Stemmer så lenge
          A2_STS har minst 91 spørsmål. */}
      <p className="text-[15px] text-da-text-body leading-[1.4] mb-3">
        For deg som har A2 og skal ta «Utvidelse av A2 til STS». Over 90 spørsmål,
        30 på prøven, 23 riktige for å bestå.
      </p>
      <ModePillRow examType="A2_STS" />
    </section>
  )
}
