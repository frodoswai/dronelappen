import { PRICE, TIERS, PRICE_A2_STS, PRICE_STS_UPGRADE } from '../lib/pricing'
import ANTALL from '../lib/antall.json'

// Synlig FAQ på forsiden (08.10.2026). Speiler FAQPage-skjemaet i
// index.html, som Google krever at står synlig på siden. Endrer du et
// svar her, endre det samme svaret i index.html (og omvendt).
const FAQ = [
  ['Hva er DroneLappen?',
   `DroneLappen (dronelappen.app) er en norsk quiz-app for å øve til droneeksamen i kategori A1/A3 og A2, og til STS-påbygget. Du øver på ${ANTALL.total} spørsmål basert på norsk pensum og gjør deg klar til den offisielle prøven.`],
  ['Hvor mange spørsmål har DroneLappen?',
   `${ANTALL.total} øvingsspørsmål som dekker A1/A3, A2 og STS-påbygget, basert på det offisielle pensumet.`],
  ['Er det gratis å prøve DroneLappen?',
   TIERS
     ? `Ja. Alle A1/A3-spørsmålene er gratis uten innlogging, og du kan prøve 25 A2-spørsmål gratis. A2 koster ${PRICE} kr, og A2 + STS koster ${PRICE_A2_STS} kr.`
     : `Ja. Alle A1/A3-spørsmålene er gratis uten innlogging, og du kan prøve 25 A2-spørsmål gratis. Full tilgang til A2 og STS koster ${PRICE} kr.`],
  TIERS
    ? ['Hva koster DroneLappen?',
       `A2 koster ${PRICE} kr og A2 + STS koster ${PRICE_A2_STS} kr. Begge er engangsbetaling for 12 måneders tilgang med alle moduser, uten abonnement. Har du A2, kan du legge til STS for ${PRICE_STS_UPGRADE} kr.`]
    : ['Hva koster full tilgang?',
       `Full tilgang koster ${PRICE} kr som engangsbetaling og gir 12 måneders tilgang til alle ${ANTALL.total} spørsmål og alle moduser.`],
  ['Dekker DroneLappen både A1/A3 og A2?',
   TIERS
     ? 'Ja. DroneLappen dekker A1/A3, A2 og STS-påbygget i samme app. A1/A3 er gratis, A2 er eget kjøp, og STS får du i A2 + STS eller som påbygg.'
     : 'Ja. DroneLappen dekker A1/A3, A2 og STS-påbygget i samme app. A1/A3 er gratis, og A2 og STS følger med i full tilgang.'],
  ['Har DroneLappen spørsmål til STS-eksamen?',
   TIERS
     ? `Ja. Til påbygget «Utvidelse av A2 til STS» har DroneLappen over 90 egne spørsmål, med eksamensmodus på 30 spørsmål der 23 riktige gir bestått. STS er med i A2 + STS (${PRICE_A2_STS} kr), eller legges til A2 for ${PRICE_STS_UPGRADE} kr.`
     : 'Ja. Til påbygget «Utvidelse av A2 til STS» har DroneLappen over 90 egne spørsmål, med eksamensmodus på 30 spørsmål der 23 riktige gir bestått. STS er med i full tilgang.'],
  ['Hvilke treningsmoduser har DroneLappen?',
   'Prøveeksamen i ekte format, en øvings-/læringsmodus og en tempomodus. Etter hver økt får du resultat med prosent og kan gå gjennom spørsmålene du svarte feil på.'],
]

export default function HomeFaq() {
  return (
    <section aria-label="Ofte stilte spørsmål" className="rise-in rise-d4 mt-5 mb-6">
      <h2 className="text-[13px] font-semibold tracking-[0.08em] uppercase text-da-text-muted mb-1">Ofte stilte spørsmål</h2>
      <div className="divide-y divide-[#DCE4EA] border-b border-[#DCE4EA]">
        {FAQ.map(([q, a]) => (
          <details key={q} className="group py-3.5">
            <summary className="cursor-pointer list-none flex items-start justify-between gap-3 text-[16px] font-medium text-da-navy-dark">
              <span>{q}</span>
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#083554"
                strokeWidth="2.2"
                strokeLinecap="round"
                className="shrink-0 mt-0.5 group-open:rotate-45 transition-transform"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </summary>
            <p className="mt-2 text-[15px] leading-[1.5] text-da-text-body">{a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
