import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createCheckout } from '../lib/supabase'
import { logFunnel, PAYWALL_VIEW, PAYWALL_BUY_CLICK, PAYWALL_EXIT } from '../lib/funnel'
import LeadCapture from './LeadCapture'
import PriceIncreaseNotice from './PriceIncreaseNotice'
import Lanseringspris from './Lanseringspris'
import { PRICE } from '../lib/pricing'
import ANTALL from '../lib/antall.json'
import { examConfig, antallParentes } from '../lib/exams'
import HarTilgangLoggInn from './HarTilgangLoggInn'

// Vises som tekstmerker under kjøpsknappen. Må speile det som faktisk er på i
// Stripe → Betalingsmetoder (kort, Apple Pay, Google Pay, Link per 15.10.2026).
const BETALINGSMAATER = ['Kort', 'Apple Pay', 'Google Pay']

/**
 * Full-screen paywall shown when a FREE user reaches the end of the
 * 25-question free pool (the server-side FREE_LIMIT in get-questions).
 * A1/A3 kommer ikke hit fra 08.10.2026: hele A1/A3 er gratis (A2 og STS har mur).
 *
 * This is the highest-intent conversion moment: the user has just worked
 * through all 25 free questions and wants more. Buy is the primary action;
 * "Se resultatene mine" stays available so we never trap the user's own
 * session data behind the wall (hostile paywalls kill trust).
 *
 * Fires InitiateCheckout so the attempt is countable in Meta, and surfaces
 * CheckoutError the same way Home/UpgradePrompt do, keeping the funnel
 * instrumentation consistent (jf. anon-email-bug 2026-07-01).
 *
 * lockedExam (30.09.2026): eksamenstype uten gratis-pool (STS). Da vises
 * muren før brukeren har svart på noe, så overskriften hentes fra
 * lib/exams.js (paywallTitle), eksamenstypen følger med i trakt-loggingen,
 * og utveien er en lenke til forsiden i stedet for resultatene. Uten
 * lockedExam er muren som før.
 *
 * bonus / onBonus (14.10.2026, Frode 05.10): e-post på muren gir 10 ekstra
 * A2-spørsmål. `bonus` er serverens svar fra get-questions (brukeren har
 * allerede tatt tilbudet): da vises ikke skjemaet igjen, bare at planen er på
 * vei. `onBonus` kalles fra LeadCapture når newsletter-signup svarer
 * bonus: true, og siden henter de nye spørsmålene og fortsetter økta.
 * Kjøpsboksen over er uendret; de to flatene skal ikke blandes.
 */
export default function Paywall({ answered = 25, onContinue, lockedExam = null, bonus = false, onBonus = null, onPaid = null }) {
  const { user, refreshTier } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const locked = examConfig(lockedExam)

  // 15.10.2026: betalt kunde skal ikke se muren. Fanen (eller en lagret
  // quiz-økt med fetchedTier 'free') kan være eldre enn kjøpet, så les
  // tilgangen på nytt før muren telles som vist. Er den betalt, går vi
  // videre uten paywall_view: ellers teller en betalt kunde som «anonym som
  // så muren» i mur-målingen. Uten onPaid: last siden på nytt, så
  // get-questions gir hele banken.
  const handlePaid = () => {
    if (onPaid) onPaid()
    else window.location.reload()
  }

  // Serverside visning av muren. Pikselen er samtykke-gatet, denne er ikke —
  // og bare denne kan spørres per bruker. Tom dependency: én gang per visning.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const fersk = await refreshTier()
      if (cancelled) return
      if (fersk === 'paid') { handlePaid(); return }
      logFunnel(PAYWALL_VIEW, { answered, examType: lockedExam })
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleBuy = async () => {
    if (busy) return
    setErr('')
    // Fersk tilgang før kjøpsklikket telles: en betalt kunde skal verken
    // logges som kjøpsklikk eller sendes til Stripe (15.10.2026).
    if ((await refreshTier()) === 'paid') { handlePaid(); return }
    // Ventes på: rett etter dette redirecter vi til Stripe, og en
    // fire-and-forget-insert rekker ikke å sende før siden lastes ut.
    // logFunnel gir uansett kontrollen tilbake innen 800 ms.
    await logFunnel(PAYWALL_BUY_CLICK, { answered, examType: lockedExam })
    window.fbq?.('track', 'InitiateCheckout', { value: PRICE, currency: 'NOK' })
    if (!user) {
      navigate('/login')
      return
    }
    setBusy(true)
    try {
      await createCheckout() // redirects to Stripe on success
    } catch (e) {
      if (e?.cancelled) {
        setBusy(false)
        return
      }
      if (e?.alreadyPaid) {
        // Serveren nektet: tilgangen finnes alt. Les den inn og gå videre.
        await refreshTier()
        setBusy(false)
        handlePaid()
        return
      }
      window.fbq?.('trackCustom', 'CheckoutError', {
        message: String(e?.message || e).slice(0, 200),
      })
      setErr(e.message || 'Noe gikk galt. Prøv igjen.')
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-da-navy-dark flex flex-col">
      {/* Dark hero band — matches the app's navy/gold language */}
      <div className="px-6 pt-16 pb-8">
        <div className="max-w-xl mx-auto">
          <div className="font-mono text-[11px] font-medium text-da-gold tracking-[0.14em] mb-3">
            full tilgang
          </div>
          <h1 className="text-[26px] font-semibold text-da-bg leading-tight mb-3">
            {locked?.paywallTitle || <>Du har fullført de {answered} gratis spørsmålene.</>}
          </h1>
          <p className="text-[14px] text-da-dark-slogan leading-[1.55] max-w-md">
            Lås opp <strong className="text-da-bg">hele spørsmålsbanken</strong> og alle
            treningsmoduser i 12 måneder. Engangsbeløp på {PRICE} kr, ingen abonnement.
          </p>
          {/* Pris-anker: eksamensgebyret er den reelle sammenligningen.
              Ærlig og sterkt — stryk på trafikkstasjonen koster nytt gebyr. */}
          <p className="text-[13px] text-da-dark-slogan leading-[1.55] max-w-md mt-2.5">
            Til sammenligning: A2-eksamen koster{' '}
            <strong className="text-da-bg">970 kr per forsøk</strong> på trafikkstasjonen.
            God forberedelse er billig.
          </p>
          <PriceIncreaseNotice className="mt-3" compact />
        </div>
      </div>

      {/* Fade into the light action zone */}
      <div
        className="h-7 shrink-0"
        style={{
          background:
            'linear-gradient(to bottom, #0a1628 0%, #2a3a50 25%, #7e8a9c 55%, #cfd6df 80%, #fafbfc 100%)',
        }}
      />

      <div className="flex-1 bg-da-bg px-6 pt-4 pb-10">
        <div className="max-w-xl mx-auto">
          <div className="bg-white border-[0.5px] border-da-navy/20 border-l-2 border-l-da-gold rounded-lg px-5 py-5 mb-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="text-[17px] font-medium text-da-navy leading-tight">
                Lås opp hele banken
              </div>
              <div className="text-right whitespace-nowrap">
                <span className="text-[22px] font-semibold text-da-navy">{PRICE} kr</span>
                <span className="block font-mono text-[10px] text-da-text-muted mt-[1px]">
                  én gang · 12 mnd
                </span>
              </div>
            </div>
            <Lanseringspris className="mb-2.5" />
            <ul className="text-[13px] text-da-text-body leading-[1.7] mb-4 list-none space-y-0.5">
              <li>
                <span className="font-mono text-da-gold mr-1.5">+</span>Alle {ANTALL.total} spørsmål{antallParentes(ANTALL.total, ANTALL.A1_A3 + ANTALL.A2)}, alle
                kategorier
              </li>
              <li>
                <span className="font-mono text-da-gold mr-1.5">+</span>Prøveeksamen i offisielt
                format, med tid og bestå-grense
              </li>
              <li>
                <span className="font-mono text-da-gold mr-1.5">+</span>Forklaring på hvert svar —
                lær reglene, ikke bare fasit
              </li>
              <li>
                <span className="font-mono text-da-gold mr-1.5">+</span>Læring, Eksamen og Tempo
              </li>
            </ul>

            <button
              onClick={handleBuy}
              disabled={busy}
              className="quiz-option w-full bg-da-navy hover:bg-da-navy-mid text-da-bg font-medium py-3 px-5 rounded-lg transition-colors text-[14px] inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span>
                {busy
                  ? 'Sender deg til betaling …'
                  : user
                  ? 'Kjøp full tilgang'
                  : 'Logg inn for å kjøpe'}
              </span>
              {!busy && <span className="font-mono text-[12px] text-da-gold">{PRICE} kr →</span>}
            </button>

            {err && (
              <p role="alert" className="mt-2 text-[12px] text-amber-700">
                {err}
              </p>
            )}

            {/* Betalingsmåter synlig FØR klikk. Bakgrunn 15.10.2026: 10-20 % av dem
                som ser muren trykker kjøp; muren sa bare «via Stripe», så ingen så
                at Apple Pay / Google Pay finnes (de er på i Stripe-kontoen og vises
                automatisk i Checkout). Tekstmerker, ikke logoer: offisielle merker
                krever Apples/Googles egne filer og retningslinjer. Legg til 'PayPal'
                i lista når den er aktivert i Stripe-dashbordet. */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5" aria-label="Betalingsmåter">
              {BETALINGSMAATER.map((navn) => (
                <span
                  key={navn}
                  className="font-mono text-[10.5px] text-da-navy/80 border-[0.5px] border-da-navy/25 rounded px-1.5 py-0.5 tracking-[0.02em]"
                >
                  {navn}
                </span>
              ))}
            </div>
            <p className="font-mono text-[11px] text-da-text-muted mt-2 tracking-[0.04em] text-center">
              Engangsbeløp · sikker betaling via Stripe · over 240 piloter øver her
            </p>

            <HarTilgangLoggInn className="text-center mt-3" />
          </div>

          {/* Not-ready-to-buy path: capture the email so an anonymous user who
              won't convert now still becomes a reachable lead. Self-hides for
              logged-in users (they already have an email on file). Always shown
              here (non-dismissible) so it stays a real alternative to the wall. */}
          {bonus ? (
            // Bonusen er brukt (35 spørsmål): ingen nytt skjema, brukeren har
            // allerede gitt e-post. Kjøp er veien videre.
            <div className="bg-da-cream/40 border-[0.5px] border-da-navy/20 border-l-2 border-l-da-gold rounded-lg px-5 py-4 mb-4">
              <div className="font-mono text-[11px] font-medium text-da-gold tracking-[0.12em] mb-1.5">
                øvingsplan
              </div>
              <p className="text-[13px] text-da-text-body leading-[1.5]">
                Øvingsplanen er på vei til innboksen din. De 10 ekstra spørsmålene
                er brukt opp, og resten av banken ligger bak kjøpet over.
              </p>
            </div>
          ) : (
            <LeadCapture
              source="quiz_paywall"
              dismissible={false}
              variant="paywall"
              bonusOffer={!locked}
              onBonus={onBonus}
            />
          )}

          {onContinue && (
            <button
              onClick={() => { logFunnel(PAYWALL_EXIT, { answered }); onContinue() }}
              className="quiz-option w-full text-center text-[13px] text-da-text-muted hover:text-da-navy py-2 transition-colors"
            >
              Se resultatene mine først →
            </button>
          )}

          {/* Låst eksamenstype: ingen resultater å se, så utveien går til
              forsiden. Muren skal aldri være en blindvei. */}
          {locked && (
            <Link
              to="/"
              onClick={() => logFunnel(PAYWALL_EXIT, { answered, examType: lockedExam })}
              className="quiz-option block w-full text-center text-[13px] text-da-text-muted hover:text-da-navy py-2 transition-colors"
            >
              Tilbake til forsiden
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
