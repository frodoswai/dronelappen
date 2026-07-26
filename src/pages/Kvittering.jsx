import { Link, useLocation } from 'react-router-dom'

/**
 * /bestilt og /bestatt — landingssider for de to merkelenkene i kjøper-e-post 3.
 *
 * HVORFOR DE FINNES
 *
 * E-post 3 spør kjøperen hvor hun er i løpet, og e-post 4 (dag 28) skal bare gå
 * til dem som ennå ikke har bestilt eller bestått. MailerLite kan trigge på
 * lenkeklikk, men ikke på e-postsvar — så «svar og fortell» gir oss ingen
 * merkelapp å segmentere på. Klikket gjør det.
 *
 * Sidene er derfor primært et målepunkt. Men et målepunkt som viser en blank
 * side eller kaster brukeren rett inn i appen føles som en felle, så de
 * kvitterer for det brukeren nettopp fortalte oss, og gir henne ett naturlig
 * neste steg.
 *
 * INGEN SALG HER. Den som lander på disse har allerede betalt. Eneste
 * oppfordring er inn i appen, eller — på /bestatt — å svare på e-posten.
 */

const VARIANTER = {
  bestilt: {
    etikett: 'notert',
    tittel: 'Bra — da er datoen satt.',
    ingress:
      'Vi slutter å minne deg på å bestille. Nå er det bare øvingen igjen.',
    raad: [
      'Øv mot datoen, ikke mot en følelse av å være klar. Å ha en time i kalenderen er den enkleste måten å holde kontinuiteten på.',
      'Sikt mot 27 av 30 riktige flere ganger på rad i eksamensmodus. Du trenger 23 for å bestå, så 27 gir deg margin for et par vanskelige spørsmål.',
    ],
    knapp: 'Fortsett øvingen',
    hale: null,
  },
  bestatt: {
    etikett: 'gratulerer',
    tittel: 'Gratulerer med bestått prøve.',
    ingress:
      'Det var hele poenget. Du har fortsatt tilgang til banken ut perioden, så bruk den gjerne til å holde regelverket friskt.',
    raad: [
      'Reglene endrer seg. Banken oppdateres når regelverket gjør det, og tilgangen din følger med — du trenger ikke gjøre noe.',
      'Skal du fly i A1 eller A3 også, ligger de 110 spørsmålene der klare.',
    ],
    knapp: 'Tilbake til appen',
    hale:
      'Og har du to minutter: svar på e-posten og fortell hvordan prøven gikk. Vi leser alle svar, og det er den eneste måten vi får vite om øvingen faktisk traff.',
  },
}

export default function Kvittering() {
  const { pathname } = useLocation()
  const v = VARIANTER[pathname === '/bestatt' ? 'bestatt' : 'bestilt']

  return (
    <div className="min-h-screen bg-da-bg flex flex-col">
      <div className="bg-da-navy-dark px-6 pt-3 pb-7">
        <div className="pt-8 max-w-2xl mx-auto">
          <div className="font-mono text-[11px] text-da-gold tracking-[0.14em] uppercase mb-3">
            {v.etikett}
          </div>
          <h1 className="text-[30px] sm:text-[34px] font-medium text-da-bg leading-[1.12] tracking-tight mb-3">
            {v.tittel}
          </h1>
          <p className="text-[15px] text-da-dark-slogan leading-[1.55] max-w-lg">
            {v.ingress}
          </p>
        </div>
      </div>

      <div
        className="h-7 shrink-0"
        style={{
          background:
            'linear-gradient(to bottom, #0a1628 0%, #2a3a50 25%, #7e8a9c 55%, #cfd6df 80%, #fafbfc 100%)',
        }}
      />

      <div className="px-6 pt-3 pb-12 bg-da-bg">
        <div className="max-w-2xl mx-auto">
          <div className="bg-da-cream/50 border-[0.5px] border-da-navy/20 border-l-2 border-l-da-gold rounded-lg px-6 py-5 mb-7">
            <div className="space-y-3 mb-5">
              {v.raad.map((tekst, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="font-mono text-[12px] text-da-navy/50 mt-[3px] shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="text-[14px] text-da-text-body leading-[1.55]">{tekst}</p>
                </div>
              ))}
            </div>

            <Link
              to="/"
              className="quiz-option bg-da-navy hover:bg-da-navy-mid text-da-bg font-medium py-2.5 px-5 rounded-lg transition-colors text-[13.5px] inline-flex items-center gap-2"
            >
              <span>{v.knapp}</span>
              <span className="font-mono text-[12px] text-da-gold">→</span>
            </Link>
          </div>

          {v.hale && (
            <p className="text-[13.5px] text-da-text-body leading-[1.6] border-t border-da-navy/10 pt-6">
              {v.hale}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
