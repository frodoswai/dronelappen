import { Link } from 'react-router-dom'

/**
 * /personvern — Personvernerklæring (GDPR).
 * Placeholder for ENK details marked with [___].
 */
export default function Personvern() {
  return (
    <div className="min-h-screen bg-da-bg flex flex-col">
      {/* Dark hero — compact */}
      <div className="bg-da-navy-dark px-6 pt-3 pb-5">
        <div className="pt-8">
          <h1 className="text-[28px] font-medium text-da-bg leading-none tracking-tight mb-1">
            Personvern
          </h1>
          <p className="font-serif italic text-sm text-da-dark-slogan">
            Personvernerklæring for DroneLappen
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
            <h2 className="text-lg font-medium text-da-navy mb-2">1. Behandlingsansvarlig</h2>
            <p>
              [FORETAKSNAVN], org.nr. [ORG-NUMMER], er behandlingsansvarlig for
              personopplysninger som samles inn via DroneLappen. Kontakt oss på{' '}
              <a href="mailto:kontakt@dronelappen.app" className="text-da-navy underline underline-offset-2">
                kontakt@dronelappen.app
              </a>{' '}
              ved spørsmål om personvern.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-da-navy mb-2">2. Hvilke opplysninger vi samler inn</h2>
            <p>Vi behandler følgende personopplysninger:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Kontoinformasjon:</strong> e-postadresse (brukt til innlogging og kommunikasjon)</li>
              <li><strong>Fremgangsdata:</strong> hvilke spørsmål du har besvart, resultater og tidsstempler</li>
              <li><strong>Betalingsinformasjon:</strong> håndteres av Stripe — vi lagrer ikke kortnummer eller bankdetaljer</li>
              <li><strong>Tekniske data:</strong> IP-adresse, nettlesertype og enhetsinfo (via serverlogger)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-da-navy mb-2">3. Formål og behandlingsgrunnlag</h2>
            <p>Vi bruker opplysningene dine til å:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Levere tjenesten og lagre fremgangen din (behandlingsgrunnlag: avtale, GDPR art. 6(1)(b))</li>
              <li>Behandle betalinger (avtale, GDPR art. 6(1)(b))</li>
              <li>Sende viktige tjenestevarsler (berettiget interesse, GDPR art. 6(1)(f))</li>
              <li>Forbedre tjenesten gjennom anonymisert statistikk (berettiget interesse, GDPR art. 6(1)(f))</li>
            </ul>
            <p className="mt-2">
              Vi sender aldri markedsføring uten ditt samtykke (GDPR art. 6(1)(a)).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-da-navy mb-2">4. Databehandlere</h2>
            <p>Vi bruker følgende tredjepartstjenester som behandler data på våre vegne:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Supabase</strong> (database og autentisering) — EU-region (eu-west-1)</li>
              <li><strong>Vercel</strong> (hosting) — edge-servere globalt, konfigurert for EU</li>
              <li><strong>Stripe</strong> (betaling) — PCI DSS-sertifisert</li>
              <li><strong>Cloudflare</strong> (DNS og e-postruting)</li>
            </ul>
            <p className="mt-2">
              Vi har databehandleravtaler med alle leverandører. Data lagres
              primært i EU/EØS.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-da-navy mb-2">5. Lagring og sletting</h2>
            <p>
              Kontoinformasjon og fremgangsdata lagres så lenge kontoen din er aktiv.
              Betalingstransaksjoner oppbevares i henhold til bokføringsloven (5 år).
              Når du sletter kontoen din, fjerner vi alle personopplysninger innen
              30 dager, unntatt det vi er lovpålagt å beholde.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-da-navy mb-2">6. Dine rettigheter</h2>
            <p>Du har rett til å:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Innsyn</strong> — be om kopi av opplysningene vi har om deg</li>
              <li><strong>Retting</strong> — korrigere uriktige opplysninger</li>
              <li><strong>Sletting</strong> — be om at opplysningene dine slettes</li>
              <li><strong>Dataportabilitet</strong> — motta dine data i et maskinlesbart format</li>
              <li><strong>Protestere</strong> — mot behandling basert på berettiget interesse</li>
            </ul>
            <p className="mt-2">
              For å utøve rettighetene dine, kontakt oss på{' '}
              <a href="mailto:kontakt@dronelappen.app" className="text-da-navy underline underline-offset-2">
                kontakt@dronelappen.app
              </a>.
              Vi svarer innen 30 dager.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-da-navy mb-2">7. Informasjonskapsler</h2>
            <p>
              DroneLappen bruker kun nødvendige informasjonskapsler for innlogging
              og sesjonshåndtering. Vi bruker ikke tredjeparts sporingsverktøy
              eller annonsecookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-da-navy mb-2">8. Klagerett</h2>
            <p>
              Hvis du mener vi behandler personopplysningene dine i strid med
              personvernregelverket, kan du klage til Datatilsynet:{' '}
              <a
                href="https://www.datatilsynet.no"
                target="_blank"
                rel="noopener noreferrer"
                className="text-da-navy underline underline-offset-2"
              >
                datatilsynet.no
              </a>.
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
