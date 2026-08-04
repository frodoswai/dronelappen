import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CONV_EPOST, googleKonvertering } from '../lib/conversions'
import { getLeadAttribution } from '../lib/attribution'

/**
 * /a2-ovingsplan — dedikert landingsside for lead-annonsen på Meta.
 *
 * HVORFOR DENNE FINNES, OG HVORFOR ORDLYDEN ER SOM DEN ER
 *
 * Salgsannonsene våre lover «prøv 25 spørsmål gratis». Skal vi be om e-post
 * FØR folk får noe, kan annonsen ikke love det samme — da sier annonsen én
 * ting og siden en annen. Det er en utelatelse av en betingelse der den skulle
 * stått (mfl. §§ 6-8), og Meta straffer mismatch mellom annonse og side i
 * auksjonen. Lead-annonsen har derfor sin egen tekst som matcher denne siden.
 *
 * BELØNNINGEN ER TO TING, IKKE ÉN. Frode 25.07: «når de gir eposten gir vi
 * dobbelt, 25 spørsmål og 1 øvingsplan». Det er hele byttehandelen, og den
 * skal være synlig FØR feltet — ikke som en overraskelse etterpå. Én e-post
 * inn, to ting ut.
 *
 * Siden har BEVISST ingen 15.08-prisfrist. To oppfordringer om samme klikk
 * svekker begge. Fristen kommer i nurture-e-post 3, til noen som allerede har
 * sagt ja én gang.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newsletter-signup`
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

// Egen source-verdi så disse leadene kan skilles fra dem som kommer fra
// Resultat-skjermen og paywallen i MailerLite. Ruter til «DroneLappen leads».
const SOURCE = 'quiz_landing'

// Hvor de sendes videre. /practice/A2 er øvingsmodus (ikke eksamen med klokke).
const NESTE = '/practice/A2'
const REDIRECT_MS = 2500

export default function OvingsplanA2() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState('')

  // Etter vellykket påmelding: send dem videre av seg selv. De har fått løftet
  // sitt, og skal ikke måtte lete etter neste steg.
  useEffect(() => {
    if (status !== 'success') return
    const t = setTimeout(() => navigate(NESTE), REDIRECT_MS)
    return () => clearTimeout(t)
  }, [status, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const value = email.trim().toLowerCase()
    if (!EMAIL_RE.test(value)) {
      setErrorMsg('Skriv inn en gyldig e-postadresse.')
      setStatus('error')
      return
    }

    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          apikey: ANON,
          Authorization: `Bearer ${ANON}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: value, source: SOURCE, attribution: getLeadAttribution() }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.status === 'ok') {
        // Samme lead-signal til begge annonseplattformene. Denne siden er
        // trafikkmålet for lead-annonsen, så det er her det betyr mest.
        if (!data.duplicate) {
          window.fbq?.('track', 'Lead', { content_name: SOURCE })
          googleKonvertering(CONV_EPOST)
        }
        setStatus('success')
      } else {
        setErrorMsg(data.message || 'Noe gikk galt. Prøv igjen senere.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Noe gikk galt. Prøv igjen senere.')
      setStatus('error')
    }
  }

  const sending = status === 'sending'

  return (
    <div className="min-h-screen bg-da-bg flex flex-col">
      {/* Mørk hero. Overskriften navngir BEGGE tingene de får — annonsen lover
          øvingsplan + 25 spørsmål, og siden må bekrefte det umiddelbart. */}
      <div className="bg-da-navy-dark px-6 pt-3 pb-7">
        <div className="pt-8 max-w-2xl mx-auto">
          <div className="font-mono text-[11px] text-da-gold tracking-[0.14em] uppercase mb-3">
            gratis · to ting med én gang
          </div>
          <h1 className="text-[30px] sm:text-[34px] font-medium text-da-bg leading-[1.12] tracking-tight mb-3">
            Gratis øvingsplan <span className="text-da-gold">+</span> 25 A2-spørsmål
          </h1>
          <p className="text-[15px] text-da-dark-slogan leading-[1.55] max-w-lg">
            Skriv inn e-posten, så får du begge deler med én gang: planen i
            innboksen, og 25 spørsmål du kan starte på direkte.
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

          {status === 'success' ? (
            <div className="bg-da-cream/50 border-[0.5px] border-da-navy/20 border-l-2 border-l-da-gold rounded-lg px-6 py-6">
              <div className="font-mono text-[11px] font-medium text-da-gold tracking-[0.12em] mb-2">
                begge deler er på vei
              </div>
              <h2 className="text-[19px] font-medium text-da-navy leading-snug mb-3">
                Takk! Øvingsplanen ligger i innboksen om et minutt.
              </h2>
              <p className="text-[14px] text-da-text-body leading-[1.6] mb-5">
                Og her er del to — vi sender deg til de 25 A2-spørsmålene nå, så
                du kan komme i gang med én gang.
              </p>
              <Link
                to={NESTE}
                className="quiz-option bg-da-navy hover:bg-da-navy-mid text-da-bg font-medium py-2.5 px-5 rounded-lg transition-colors text-[13.5px] inline-flex items-center gap-2"
              >
                <span>Start de 25 spørsmålene nå</span>
                <span className="font-mono text-[12px] text-da-gold">→</span>
              </Link>
            </div>
          ) : (
            <>
              {/* Byttehandelen, eksplisitt og FØR feltet: én e-post inn, to
                  ting ut. Ingen skal skrive noe før de vet både hva de gir og
                  hva de får. */}
              <div className="bg-da-cream/50 border-[0.5px] border-da-navy/20 border-l-2 border-l-da-gold rounded-lg px-6 py-5 mb-7">
                <div className="font-mono text-[11px] font-medium text-da-gold tracking-[0.12em] mb-3">
                  du får begge deler
                </div>

                <div className="space-y-2.5 mb-5">
                  <div className="flex gap-3 items-start">
                    <span className="font-mono text-[12px] text-da-navy/50 mt-[3px] shrink-0">01</span>
                    <p className="text-[14px] text-da-text-body leading-[1.5]">
                      <strong className="text-da-navy">Øvingsplanen</strong> — hva du
                      skal øve på, i hvilken rekkefølge, og når du er klar til å
                      booke prøven. Kommer på e-post.
                    </p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="font-mono text-[12px] text-da-navy/50 mt-[3px] shrink-0">02</span>
                    <p className="text-[14px] text-da-text-body leading-[1.5]">
                      <strong className="text-da-navy">25 A2-spørsmål</strong> — ekte
                      eksamensspørsmål med forklaring på hvert svar. Starter med
                      én gang, uten innlogging.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="din@epost.no"
                    aria-label="E-postadresse"
                    disabled={sending}
                    autoFocus
                    className="flex-1 bg-white border-[0.5px] border-da-navy/30 focus:border-da-navy/60 outline-none rounded-lg px-4 py-3 text-[15px] text-da-navy placeholder:text-da-text-muted transition-colors disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="quiz-option bg-da-navy hover:bg-da-navy-mid text-da-bg font-medium py-3 px-6 rounded-lg transition-colors text-[14px] flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <span>{sending ? 'Sender…' : 'Send meg begge deler'}</span>
                    {!sending && <span className="font-mono text-[12px] text-da-gold">→</span>}
                  </button>
                </form>

                {status === 'error' && (
                  <p role="alert" className="mt-2.5 text-[12.5px] text-amber-700 leading-[1.4]">
                    {errorMsg}
                  </p>
                )}

                {/* Samtykkegrunnlaget. Aktivt og spesifikt — ingen forhåndskrysset
                    boks — og det sier hva de får og at de kan melde seg av. */}
                <p className="mt-3 text-[11.5px] text-da-text-muted leading-[1.5]">
                  Du får øvingsplanen nå, og deretter noen få e-poster om temaene
                  folk oftest bommer på. Meld deg av når som helst. Se{' '}
                  <Link to="/personvern" className="underline hover:text-da-navy transition-colors">
                    personvern
                  </Link>
                  .
                </p>
              </div>

              <div className="border-t border-da-navy/10 pt-6">
                <div className="bg-white border-[0.5px] border-da-navy/15 rounded-lg px-5 py-4 mb-5">
                  <div className="font-mono text-[10.5px] text-da-gold tracking-[0.12em] uppercase mb-2">
                    verdt å vite
                  </div>
                  <p className="text-[14px] text-da-text-body leading-[1.6]">
                    A2-eksamen koster{' '}
                    <strong className="text-da-navy">970 kr per forsøk</strong> hos
                    Statens vegvesen, og du må ha bestått A1/A3 først. Stryker du,
                    betaler du på nytt — i tillegg til ny timebestilling og
                    ventetid. Sørg for å bestå på første.
                  </p>
                </div>

                <p className="text-[13px] text-da-text-muted leading-[1.6]">
                  Over 300 piloter øver på DroneLappen allerede. Appen har 241
                  norske spørsmål for A1/A3 og A2, og er laget av{' '}
                  <a
                    href="https://droneavisa.no"
                    rel="noopener"
                    className="underline hover:text-da-navy transition-colors"
                  >
                    Droneavisa.no
                  </a>
                  .
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
