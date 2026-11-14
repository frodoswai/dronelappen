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
import DroneMark from './DroneMark'

// Vises som tekstmerker under kjøpsknappen. Må speile det som faktisk er på i
// Stripe → Betalingsmetoder (kort, Apple Pay, Google Pay, Link per 15.10.2026;
// PayPal aktiv i Checkout fra 16.10.2026, verifisert på betalingssiden).
const BETALINGSMAATER = ['Kort', 'Apple Pay', 'Google Pay', 'PayPal']

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
    setBusy(true)
    try {
      await createCheckout() // redirects to Stripe on success
    } catch (e) {
      if (e?.alreadyPaid) {
        // Serveren nektet: tilgangen finnes alt. Les den inn og gå videre.
        await refreshTier()
        setBusy(false)
        handlePaid()
        return
      }
      // Ingen økt og anonym økt lot seg ikke opprette: innlogging er siste utvei.
      if (e?.needsLogin) {
        setBusy(false)
        navigate('/login')
        return
      }
      window.fbq?.('trackCustom', 'CheckoutError', {
        message: String(e?.message || e).slice(0, 200),
      })
      setErr(e.message || 'Noe gikk galt. Prøv igjen.')
      setBusy(false)
    }
  }

  // B2-drakt (Frode 14.11.2026). Innhold og kjøpsflyt er som før; nytt er
  // fremdriftslinja i toppen, som viser hvor mye av A2-banken som er brukt.
  const pst = Math.min(100, Math.round((answered / ANTALL.A2) * 100))
  const hake = (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#17603C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-[1px]">
      <path d="M5 12l5 5 9-10" />
    </svg>
  )
  const punkter = [
    <>Alle {ANTALL.total} spørsmål{antallParentes(ANTALL.total, ANTALL.A1_A3 + ANTALL.A2)}, alle kategorier</>,
    'Prøveeksamen i offisielt format, med tid og bestå-grense',
    'Forklaring på hvert svar, så du lærer reglene og ikke bare fasit',
    'Læring, Eksamen og Tempo',
  ]

  return (
    <div className="min-h-screen bg-da-navy-dark flex flex-col">
      {/* ═══ Mørk topp ═══ */}
      <div className="px-5 pt-3 pb-6">
        <div className="pt-2 max-w-xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-5" aria-label="DroneLappen forside">
            <DroneMark />
            <span className="text-[20px] font-bold text-white leading-none">
              DroneLappen<span className="text-da-gold">.app</span>
            </span>
          </Link>
          <p className="text-[13px] font-semibold tracking-[0.08em] uppercase text-da-dark-slogan mb-2">
            Full tilgang
          </p>
          <h1 className="text-[30px] font-bold text-white leading-[1.12] tracking-tight mb-4">
            {locked?.paywallTitle || <>Du har fullført de {answered} gratis spørsmålene</>}
          </h1>
          {!locked && (
            <div className="mb-4">
              <div aria-hidden="true" className="h-2 rounded-full bg-[#1E3A57] mb-2">
                <div className="h-2 rounded-full bg-da-gold" style={{ width: `${pst}%` }} />
              </div>
              <p className="text-[15px] text-[#C9D6E2] leading-[1.4]">
                Det er {answered} av {ANTALL.A2} A2-spørsmål. Resten ligger i full tilgang,
                sammen med STS.
              </p>
            </div>
          )}
          {/* Pris-anker: eksamensgebyret er den reelle sammenligningen. */}
          <p className="text-[15px] text-[#C9D6E2] leading-[1.45]">
            Til sammenligning koster A2-eksamen{' '}
            <strong className="text-white">970 kr per forsøk</strong> på trafikkstasjonen.
          </p>
        </div>
      </div>

      {/* ═══ Hvitt felt ═══ */}
      <div className="flex-1 bg-white rounded-t-3xl px-5 pt-[22px] pb-8">
        <div className="max-w-xl mx-auto">
          <div className="flex items-end justify-between gap-3 mb-4">
            <h2 className="text-[22px] font-bold text-da-navy leading-tight">Lås opp hele banken</h2>
            <div className="text-right whitespace-nowrap">
              <div className="font-cond text-[36px] font-bold text-da-navy leading-none">{PRICE} kr</div>
              <div className="text-[13px] text-da-text-muted">én gang · 12 måneder</div>
            </div>
          </div>
          <ul className="list-none space-y-2.5 mb-4 text-[16px] text-da-text-body leading-[1.35]">
            {punkter.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5">
                {hake}
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <div className="bg-[#EEF3F7] rounded-xl px-3 py-2.5 mb-4 empty:hidden">
            <Lanseringspris />
            <PriceIncreaseNotice />
          </div>
          <button
            onClick={handleBuy}
            disabled={busy}
            className="w-full h-[60px] rounded-[14px] bg-da-gold text-da-navy-dark text-[18px] font-bold inline-flex items-center justify-center text-center px-3 transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
          >
            {busy
              ? 'Sender deg til betaling …'
              : `Kjøp full tilgang · ${PRICE} kr`}
          </button>
          {err && (
            <p role="alert" className="mt-2 text-[14px] text-amber-700">
              {err}
            </p>
          )}
          {/* Betalingsmåter synlig FØR klikk (15.10.2026). Tekstmerker, ikke
              logoer: offisielle merker krever Apples/Googles egne filer. */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5" aria-label="Betalingsmåter">
            {BETALINGSMAATER.map((navn) => (
              <span
                key={navn}
                className="text-[13px] font-medium text-da-navy border border-[#C9D3DC] rounded-lg px-2.5 py-1"
              >
                {navn}
              </span>
            ))}
          </div>
          <p className="text-[13px] text-da-text-muted mt-2.5 leading-[1.4] text-center">
            Engangsbeløp, ingen abonnement. Sikker betaling via Stripe. Over 240 piloter øver her.
          </p>
          <HarTilgangLoggInn className="text-center mt-2 mb-5" />
          {!user || user.is_anonymous ? null : <div className="mb-5" />}

          {/* Not-ready-to-buy path: capture the email so an anonymous user who
              won't convert now still becomes a reachable lead. Self-hides for
              logged-in users (they already have an email on file). Always shown
              here (non-dismissible) so it stays a real alternative to the wall. */}
          {bonus ? (
            // Bonusen er brukt (35 spørsmål): ingen nytt skjema, brukeren har
            // allerede gitt e-post. Kjøp er veien videre.
            <div className="bg-[#EEF3F7] rounded-2xl p-4 mb-4">
              <div className="text-[13px] font-semibold tracking-[0.08em] uppercase text-da-text-muted mb-1.5">
                øvingsplan
              </div>
              <p className="text-[15px] text-da-text-body leading-[1.45]">
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
              className="w-full min-h-11 text-center text-[15px] font-semibold text-da-navy hover:underline"
            >
              Se resultatene mine først
            </button>
          )}

          {/* Låst eksamenstype: ingen resultater å se, så utveien går til
              forsiden. Muren skal aldri være en blindvei. */}
          {locked && (
            <Link
              to="/"
              onClick={() => logFunnel(PAYWALL_EXIT, { answered, examType: lockedExam })}
              className="block w-full py-3 text-center text-[15px] font-semibold text-da-navy hover:underline"
            >
              Tilbake til forsiden
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
