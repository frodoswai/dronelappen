import { Link } from 'react-router-dom'

/**
 * /kontakt — Kontaktinformasjon.
 * Placeholder for ENK details marked with [___].
 */
export default function Kontakt() {
  return (
    <div className="min-h-screen bg-da-bg flex flex-col">
      {/* Dark hero — compact */}
      <div className="bg-da-navy-dark px-6 pt-3 pb-5">
        <div className="pt-8">
          <h1 className="text-[28px] font-medium text-da-bg leading-none tracking-tight mb-1">
            Kontakt
          </h1>
          <p className="font-serif italic text-sm text-da-dark-slogan">
            Vi hører gjerne fra deg
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

          <section>
            <h2 className="text-lg font-medium text-da-navy mb-2">E-post</h2>
            <p>
              For spørsmål om tjenesten, kontoen din, betaling eller personvern:
            </p>
            <p className="mt-2">
              <a
                href="mailto:kontakt@dronelappen.app"
                className="font-mono text-[14px] text-da-navy underline underline-offset-2 hover:text-da-gold transition-colors"
              >
                kontakt@dronelappen.app
              </a>
            </p>
            <p className="mt-2 text-da-text-muted text-[13px]">
              Vi svarer normalt innen 1–2 virkedager.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-da-navy mb-2">Feil i spørsmålsbanken?</h2>
            <p>
              Har du funnet en feil i et spørsmål eller en forklaring? Send oss
              en e-post med spørsmåls-ID eller en beskrivelse, så fikser vi det
              raskt. Alle tilbakemeldinger hjelper oss med å gjøre DroneLappen
              bedre for alle piloter.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-da-navy mb-2">Om oss</h2>
            <p>
              DroneLappen drives av [FORETAKSNAVN], org.nr. [ORG-NUMMER].
            </p>
            <p className="mt-2">
              Tjenesten er utviklet i samarbeid med{' '}
              <a
                href="https://droneavisa.no"
                target="_blank"
                rel="noopener noreferrer"
                className="text-da-navy underline underline-offset-2"
              >
                Droneavisa.no
              </a>{' '}
              — Norges nettavis for dronepiloter.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-da-navy mb-2">Angrerett og klager</h2>
            <p>
              For angrerett, se våre{' '}
              <Link to="/vilkar" className="text-da-navy underline underline-offset-2">
                vilkår
              </Link>.
              For personvernsaker, se{' '}
              <Link to="/personvern" className="text-da-navy underline underline-offset-2">
                personvernerklæringen
              </Link>.
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
