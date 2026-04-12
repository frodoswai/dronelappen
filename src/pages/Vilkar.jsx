import { Link } from 'react-router-dom'

/**
 * /vilkar — Kjøpsvilkår og bruksvilkår.
 * Placeholder for ENK details (name + org number) marked with [___].
 * Static prose page, no interactivity.
 */
export default function Vilkar() {
  return (
    <div className="min-h-screen bg-da-bg flex flex-col">
      {/* Dark hero — compact */}
      <div className="bg-da-navy-dark px-6 pt-3 pb-5">
        <div className="pt-8">
          <h1 className="text-[28px] font-medium text-da-bg leading-none tracking-tight mb-1">
            Vilkår
          </h1>
          <p className="font-serif italic text-sm text-da-dark-slogan">
            Kjøpsvilkår og bruksvilkår for DroneLappen
          </p>
        </div>
      </div>

      {/* Fade */}
      <div
        className="h-7 shrink-0"
        style={{
          background:
            'linear-gradient(to bottom, #0a1628 0%, #2a3a50 25%, #7e8a9c 55%, #cfd6df 80%, #fafbfc 100%)',
        }}
      />

      {/* Content */}
      <div className="px-6 pt-4 pb-10 bg-da-bg">
        <div className="max-w-2xl mx-auto space-y-6 text-[14px] leading-[1.7] text-da-text-body">

          <p className="font-mono text-[11px] text-da-text-muted tracking-[0.1em]">
            Sist oppdatert: april 2026
          </p>

          <section>
            <h2 className="text-lg font-medium text-da-navy mb-2">1. Om tjenesten</h2>
            <p>
              DroneLappen er en nettbasert øvingsplattform for dronepiloter som
              forbereder seg til teorieksamen hos Luftfartstilsynet. Tjenesten
              tilbys av [FORETAKSNAVN], org.nr. [ORG-NUMMER] («vi», «oss»).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-da-navy mb-2">2. Brukervilkår</h2>
            <p>
              Ved å opprette en konto eller bruke tjenesten godtar du disse vilkårene.
              Tjenesten er ment som et supplement til offisiell pensumlitteratur og
              erstatter ikke godkjent opplæring. Vi garanterer ikke at innholdet
              dekker alle emner som kan forekomme på eksamen.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-da-navy mb-2">3. Gratisversjon og PRO-tilgang</h2>
            <p>
              Gratisversjonen gir tilgang til et begrenset utvalg øvingsspørsmål.
              PRO-tilgang gir tilgang til hele spørsmålsbanken og låses opp ved betaling.
              Priser oppgis inkludert merverdiavgift der det er aktuelt.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-da-navy mb-2">4. Betaling og angrerett</h2>
            <p>
              Betaling skjer via Stripe. Du har 14 dagers angrerett fra kjøpsdato
              i henhold til angrerettloven. Dersom du aktivt har brukt den digitale
              tjenesten og samtykket til at levering starter før angrefristen utløper,
              kan angreretten falle bort helt eller delvis. For å benytte angreretten,
              kontakt oss på{' '}
              <a href="mailto:kontakt@dronelappen.app" className="text-da-navy underline underline-offset-2">
                kontakt@dronelappen.app
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-da-navy mb-2">5. Immaterielle rettigheter</h2>
            <p>
              Alt innhold på DroneLappen — inkludert spørsmål, forklaringer, design
              og kode — tilhører oss eller våre lisensgivere. Du får en personlig,
              ikke-overførbar rett til å bruke innholdet for eget studieformål.
              Kopiering, videredistribusjon eller systematisk uttrekk er ikke tillatt.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-da-navy mb-2">6. Ansvarsbegrensning</h2>
            <p>
              DroneLappen leveres «som den er». Vi er ikke ansvarlige for indirekte tap,
              tapt fortjeneste eller konsekvenser av feil i spørsmålsbanken. Vårt
              samlede erstatningsansvar er begrenset til beløpet du har betalt for
              tjenesten de siste 12 månedene.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-da-navy mb-2">7. Endringer</h2>
            <p>
              Vi kan oppdatere disse vilkårene. Vesentlige endringer varsles via
              e-post eller i appen. Fortsatt bruk etter varsling anses som aksept.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-da-navy mb-2">8. Lovvalg og tvister</h2>
            <p>
              Vilkårene reguleres av norsk lov. Eventuelle tvister skal forsøkes
              løst i minnelighet, og deretter avgjøres ved brukerens alminnelige
              verneting.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-da-navy mb-2">9. Kontakt</h2>
            <p>
              [FORETAKSNAVN], org.nr. [ORG-NUMMER]<br />
              E-post:{' '}
              <a href="mailto:kontakt@dronelappen.app" className="text-da-navy underline underline-offset-2">
                kontakt@dronelappen.app
              </a>
            </p>
          </section>

          <div className="pt-4 border-t-[0.5px] border-da-navy/15">
            <Link
              to="/"
              className="font-mono text-[12px] text-da-text-muted hover:text-da-navy tracking-[0.05em] transition-colors"
            >
              ← Tilbake til hjem
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
