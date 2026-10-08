import { PRICE } from '../lib/pricing'
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
   `Ja. Alle A1/A3-spørsmålene er gratis uten innlogging, og du kan prøve 25 A2-spørsmål gratis. Full tilgang til A2 og STS koster ${PRICE} kr.`],
  ['Hva koster full tilgang?',
   `Full tilgang koster ${PRICE} kr som engangsbetaling og gir 12 måneders tilgang til alle ${ANTALL.total} spørsmål og alle moduser.`],
  ['Dekker DroneLappen både A1/A3 og A2?',
   'Ja. DroneLappen dekker A1/A3, A2 og STS-påbygget i samme app. A1/A3 er gratis, og A2 og STS følger med i full tilgang.'],
  ['Har DroneLappen spørsmål til STS-eksamen?',
   'Ja. Til påbygget «Utvidelse av A2 til STS» har DroneLappen over 90 egne spørsmål, med eksamensmodus på 30 spørsmål der 23 riktige gir bestått. STS er med i full tilgang.'],
  ['Hvilke treningsmoduser har DroneLappen?',
   'Prøveeksamen i ekte format, en øvings-/læringsmodus og en tempomodus. Etter hver økt får du resultat med prosent og kan gå gjennom spørsmålene du svarte feil på.'],
]

export default function HomeFaq() {
  return (
    <section aria-label="Ofte stilte spørsmål" className="rise-in rise-d4 mb-6">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="flex-1 h-px bg-da-navy/20" />
        <span className="font-mono text-[12px] font-medium text-da-navy/60 tracking-[0.1em]">
          ofte stilte spørsmål
        </span>
        <div className="flex-1 h-px bg-da-navy/20" />
      </div>
      <div className="divide-y divide-da-navy/10 border-y border-da-navy/10">
        {FAQ.map(([q, a]) => (
          <details key={q} className="group py-2.5">
            <summary className="cursor-pointer list-none flex items-start justify-between gap-3 text-[14px] font-medium text-da-navy">
              <span>{q}</span>
              <span aria-hidden="true" className="font-mono text-da-navy/50 group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="mt-1.5 text-[13px] leading-relaxed text-da-text-muted">{a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
