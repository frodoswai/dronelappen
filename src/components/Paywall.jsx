import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createCheckout } from '../lib/supabase'
import { logFunnel, PAYWALL_VIEW, PAYWALL_BUY_CLICK, PAYWALL_EXIT } from '../lib/funnel'
import LeadCapture from './LeadCapture'
import PriceIncreaseNotice from './PriceIncreaseNotice'
import Lanseringspris from './Lanseringspris'
import { PRICE_STS_UPGRADE, PRICE_A2, PRICE_A2_STS, TIERS, DEFAULT_PLAN, PLAN_LABEL, planPrice } from '../lib/pricing'
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
 *
 * To nivåer fra 1.12.2026 (26.11.2026): muren har da to valg, A2 (349 kr) og
 * A2 + STS (449 kr). A2 er forvalgt (hovedtilbudet, Frode 26.11), pakken når
 * kunden kom fra STS. Før datoen er muren som før: ett kjøp med alt.
 *
 * upgrade: kunden har A2 uten STS og åpnet STS. Da er dette påbygg-muren:
 * 149 kr, gjelder ut tilgangen kunden alt har. Ingen e-postskjema, ingen
 * «har du tilgang»-lenke: kunden er innlogget og betalende.
 */
export default function Paywall({ answered = 25, onContinue, lockedExam = null, bonus = false, onBonus = null, onPaid = null, upgrade = false }) {
  const { user, refreshTier, refreshAccess, expiresAt } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const locked = examConfig(lockedExam)
  const [plan, setPlan] = useState(
    upgrade ? 'sts_upgrade' : TIERS && lockedExam === 'A2_STS' ? 'a2_sts' : DEFAULT_PLAN,
  )
  const pris = planPrice(plan)
  // Har kunden alt det denne muren selger? Påbygg-muren: STS. Ellers: betalt.
  const harDette = async () => {
    const a = await refreshAccess()
    return upgrade ? a.tier === 'paid' && a.sts : a.tier === 'paid'
  }
  const utlop = expiresAt
    ? new Date(expiresAt).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

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
      const har = await harDette()
      if (cancelled) return
      if (har) { handlePaid(); return }
      // Påbygg-muren holdes utenfor mur-trakten: den som ser den er en
      // betalende kunde, og mur-målingen teller gratisbrukere. Salget leses
      // i Stripe (metadata.plan = sts_upgrade).
      if (!upgrade) logFunnel(PAYWALL_VIEW, { answered, examType: lockedExam })
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleBuy = async () => {
    if (busy) return
    setErr('')
    // Fersk tilgang før kjøpsklikket telles: en betalt kunde skal verken
    // logges som kjøpsklikk eller sendes til Stripe (15.10.2026).
    if (await harDette()) { handlePaid(); return }
    // Ventes på: rett etter dette redirecter vi til Stripe, og en
    // fire-and-forget-insert rekker ikke å sende før siden lastes ut.
    // logFunnel gir uansett kontrollen tilbake innen 800 ms.
    if (!upgrade) await logFunnel(PAYWALL_BUY_CLICK, { answered, examType: lockedExam })
    window.fbq?.('track', 'InitiateCheckout', { value: pris, currency: 'NOK' })
    setBusy(true)
    try {
      await createCheckout(plan) // redirects to Stripe on success
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
    upgrade ? (
      <>Alle {ANTALL.A2_STS} STS-spørsmålene, til prøven «Utvidelse av A2 til STS»</>
    ) : !TIERS || plan === 'a2_sts' ? (
      <>Alle {ANTALL.total} spørsmål{antallParentes(ANTALL.total, ANTALL.A1_A3 + ANTALL.A2)}, alle kategorier</>
    ) : (
      <>Alle {ANTALL.A2} A2-spørsmålene og alle {ANTALL.A1_A3} til A1/A3, alle kategorier</>
    ),
    'Prøveeksamen i offisielt format, med tid og bestå-grense',
    'Forklaring på hvert svar, så du lærer reglene og ikke bare fasit',
    'Læring, Eksamen og Tempo',
  ]
  // Valgene på muren fra 1.12.2026. Rekkefølgen er bevisst: A2 først.
  const valg = [
    { id: 'a2', pris: PRICE_A2, tekst: 'A2 og A1/A3' },
    { id: 'a2_sts', pris: PRICE_A2_STS, tekst: 'A2, A1/A3 og STS' },
  ]
  const visValg = TIERS && !upgrade
  const tittel = upgrade
    ? 'Legg til STS i tilgangen din'
    : locked?.paywallTitle || <>Du har fullført de {answered} gratis spørsmålene</>

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
            {upgrade ? 'STS-påbygg' : TIERS ? 'Velg tilgang' : 'Full tilgang'}
          </p>
          <h1 className="text-[30px] font-bold text-white leading-[1.12] tracking-tight mb-4">
            {tittel}
          </h1>
          {!locked && (
            <div className="mb-4">
              <div aria-hidden="true" className="h-2 rounded-full bg-[#1E3A57] mb-2">
                <div className="h-2 rounded-full bg-da-gold" style={{ width: `${pst}%` }} />
              </div>
              <p className="text-[15px] text-[#C9D6E2] leading-[1.4]">
                {TIERS ? (
                  <>Det er {answered} av {ANTALL.A2} A2-spørsmål. Resten får du med A2.</>
                ) : (
                  <>
                    Det er {answered} av {ANTALL.A2} A2-spørsmål. Resten ligger i full tilgang,
                    sammen med STS.
                  </>
                )}
              </p>
            </div>
          )}
          {upgrade ? (
            <p className="text-[15px] text-[#C9D6E2] leading-[1.45]">
              Du har A2. Påbygget gir deg STS i samme tilgang
              {utlop ? (
                <>
                  , og gjelder til <strong className="text-white">{utlop}</strong>, samme dato som A2
                </>
              ) : (
                <>, og gjelder like lenge som A2-tilgangen din</>
              )}
              .
            </p>
          ) : (
            /* Pris-anker: eksamensgebyret er den reelle sammenligningen. */
            <p className="text-[15px] text-[#C9D6E2] leading-[1.45]">
              Til sammenligning koster A2-eksamen{' '}
              <strong className="text-white">970 kr per forsøk</strong> på trafikkstasjonen.
            </p>
          )}
        </div>
      </div>

      {/* ═══ Hvitt felt ═══ */}
      <div className="flex-1 bg-white rounded-t-3xl px-5 pt-[22px] pb-8">
        <div className="max-w-xl mx-auto">
          <div className="flex items-end justify-between gap-3 mb-4">
            <h2 className="text-[22px] font-bold text-da-navy leading-tight">
              {upgrade ? 'Legg til STS' : !TIERS ? 'Lås opp hele banken' : plan === 'a2_sts' ? 'Lås opp A2 og STS' : 'Lås opp A2'}
            </h2>
            <div className="text-right whitespace-nowrap">
              <div className="font-cond text-[36px] font-bold text-da-navy leading-none">{pris} kr</div>
              <div className="text-[13px] text-da-text-muted">
                {upgrade ? 'én gang · ut tilgangen din' : 'én gang · 12 måneder'}
              </div>
            </div>
          </div>
          {visValg && (
            <div role="radiogroup" aria-label="Velg tilgang" className="grid grid-cols-2 gap-2.5 mb-2">
              {valg.map((v) => {
                const valgt = plan === v.id
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={valgt}
                    onClick={() => setPlan(v.id)}
                    className={`text-left rounded-[14px] px-3.5 py-3 min-h-[76px] transition-colors ${
                      valgt
                        ? 'border-2 border-da-navy bg-[#EEF3F7]'
                        : 'border border-[#C9D3DC] bg-white hover:border-da-navy'
                    }`}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-[17px] font-bold text-da-navy">{PLAN_LABEL[v.id]}</span>
                      <span className="text-[16px] font-semibold text-da-navy tabular-nums whitespace-nowrap">{v.pris} kr</span>
                    </span>
                    <span className="block text-[14px] text-da-text-body leading-[1.35] mt-0.5">{v.tekst}</span>
                  </button>
                )
              })}
            </div>
          )}
          {visValg && (
            <p className="text-[14px] text-da-text-body leading-[1.4] mb-4">
              {plan === 'a2'
                ? `Skal du ta STS senere, legger du det til for ${PRICE_STS_UPGRADE} kr.`
                : `Du sparer ${PRICE_A2 + PRICE_STS_UPGRADE - PRICE_A2_STS} kr mot å legge til STS senere.`}
            </p>
          )}
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
              : upgrade
              ? `Legg til STS · ${pris} kr`
              : TIERS
              ? `Kjøp ${PLAN_LABEL[plan]} · ${pris} kr`
              : `Kjøp full tilgang · ${pris} kr`}
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
          {!upgrade && <HarTilgangLoggInn className="text-center mt-2 mb-5" />}
          {!user || user.is_anonymous ? null : <div className="mb-5" />}

          {/* Not-ready-to-buy path: capture the email so an anonymous user who
              won't convert now still becomes a reachable lead. Self-hides for
              logged-in users (they already have an email on file). Always shown
              here (non-dismissible) so it stays a real alternative to the wall. */}
          {upgrade ? null : bonus ? (
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
              onClick={() => { if (!upgrade) logFunnel(PAYWALL_EXIT, { answered, examType: lockedExam }) }}
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
