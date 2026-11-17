import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createCheckout } from '../lib/supabase'
import DroneMark from '../components/DroneMark'
import ModePillRow from '../components/ModePillRow'
import AuthHeader from '../components/AuthHeader'
import NewsletterSignup from '../components/NewsletterSignup'
import HomeFaq from '../components/HomeFaq'
import ReadinessCard from '../components/ReadinessCard'
import StsVoteCard from '../components/StsVoteCard'
import StsExamCard from '../components/StsExamCard'
import HarTilgangLoggInn from '../components/HarTilgangLoggInn'
import PriceIncreaseNotice from '../components/PriceIncreaseNotice'
import Lanseringspris from '../components/Lanseringspris'
import InstallAppInterstitial from '../components/InstallAppInterstitial'
import { logFunnel, HOME_BUY_CLICK } from '../lib/funnel'
import { PRICE } from '../lib/pricing'
import { isExamEnabled, antallParentes } from '../lib/exams'
import ANTALL from '../lib/antall.json'
import {
  getLastSession,
  sessionToPath,
  sessionDisplayStats,
  describeSession,
} from '../lib/sessionHistory'
import {
  setPurchaseIntent,
  hasPurchaseIntent,
  clearPurchaseIntent,
} from '../lib/purchaseIntent'

// Home — Round 2 visual redesign, Round 2.5 refinements applied.
//
// Three stacked sections:
//   1. Dark navy hero with wordmark + gold propeller SVG bleed
//   2. Stepped fade gradient (28px)
//   3. Light content zone: resume strip, A2 card (dominant),
//      A1/A3 card (quiet), stats footer
//
// Round 2.5 changes here:
//   - Mono labels bumped up a pt or two for phone readability
//   - Category tag: trafikkstasjon → trafikkstasjonen (definite form)
//   - Fortsett card gets a cream tint + more padding so smart resume
//     clearly reads as the top CTA when it exists
//   - Both exam cards now end in an explicit "velg modus →" indicator
//     because the corner crosshairs alone didn't read as "tap me"
//   - flex-1 removed from the light zone — content sizes naturally
//     instead of stretching to viewport
export default function Home() {
  const { tier, user, refreshTier } = useAuth()
  const navigate = useNavigate()
  const [lastSession, setLastSession] = useState(null)
  // Sammenslåing (18/7): når ReadinessCard har data tok den over
  // fortsett-rollen, og det separate fortsett-kortet ble skjult.
  // SATT UT AV KRAFT 21.09.2026 mens STS-målingen går: ReadinessCard
  // står under A1/A3, så kortene stabler seg ikke lenger og stripa får
  // stå. Signalet beholdes — setteren fyrer som før, verdien leses bare
  // ikke — så skjulingen kan gjeninnføres 21.10 ved å sette
  // `&& !readinessActive` tilbake på fortsett-stripa.
  const [readinessActive, setReadinessActive] = useState(false)
  // { A2: { answered, total, … }, … } fra ReadinessCard, til «N av M besvart».
  const [progress, setProgress] = useState(null)
  const [buyBusy, setBuyBusy] = useState(false)
  const [buyErr, setBuyErr] = useState('')
  // «Fullfør kjøpet»-banner: true når brukeren klikket kjøp før innlogging
  // (intensjon i localStorage, 30 min TTL) og nå er innlogget uten betalt
  // tilgang. Se lib/purchaseIntent.js for resonnementet.
  const [resumeBuy, setResumeBuy] = useState(false)

  useEffect(() => {
    if (tier === 'paid') {
      // Kjøpet er fullført (eller brukeren var betalt hele tiden) — rydd.
      clearPurchaseIntent()
      setResumeBuy(false)
      return
    }
    if (user && hasPurchaseIntent()) setResumeBuy(true)
  }, [user, tier])

  // Direktekjøp fra e-post: ?kjop=1 starter checkout med én gang.
  //
  // Bakgrunnen (05.08.2026): nyhetsbrevet varsler prisøkningen 15.08, og
  // mottakerne er folk som allerede har brukt opp de 25 gratisspørsmålene
  // (på A2; A1/A3 er gratis i sin helhet fra 08.10.2026).
  // Uten dette måtte de lande på forsiden, finne kjøpskortet og klikke igjen —
  // tre steg for noen som allerede hadde bestemt seg.
  //
  // Dette er IKKE et mørkt mønster: brukeren har klikket en knapp som sier
  // «kjøp full tilgang», og Stripes betalingsside er i seg selv
  // bekreftelsessteget. Ingenting belastes før de fullfører der.
  //
  // Vernene som gjør det trygt:
  //   - fyrer bare én gang (ref-vakt), selv om React remounter
  //   - venter på at AuthContext har gitt en sesjon (anonym eller ikke)
  //   - leser tilgangen på nytt FØR den bestemmer seg. `tier` står på 'free'
  //     som utgangspunkt og settes først når entitlements-spørringen svarer;
  //     leste vi den rått, ville en betalende kunde som klikker lenken bli
  //     sendt til Stripe for å kjøpe noe han allerede eier. refreshTier()
  //     returnerer den ferske verdien og fjerner det kappløpet.
  //   - feiler den, blir brukeren stående på forsiden med feilmelding og
  //     kjøpskortet foran seg — ingen blindvei
  const [searchParams, setSearchParams] = useSearchParams()
  const direktekjopFyrt = useRef(false)

  useEffect(() => {
    if (searchParams.get('kjop') !== '1') return
    if (direktekjopFyrt.current) return
    if (!user) return // AuthContext er ikke ferdig ennå
    direktekjopFyrt.current = true
    // Rydd parameteren, så en refresh ikke starter kjøpet på nytt.
    const rest = new URLSearchParams(searchParams)
    rest.delete('kjop')
    setSearchParams(rest, { replace: true })
    ;(async () => {
      const ferskTier = await refreshTier()
      if (ferskTier === 'paid') return // eier den allerede
      handleBuy()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, searchParams])

  const handleBuy = async () => {
    setBuyBusy(true)
    setBuyErr('')
    // 15.10.2026: samme vern som ?kjop=1-stien, for alle kjøpsknapper.
    // `tier` i minnet kan være eldre enn kjøpet; refreshTier() setter den
    // ferske verdien, og en betalt kunde får da kjøpskortet uten kjøp.
    if ((await refreshTier()) === 'paid') { setBuyBusy(false); return }
    // Ventes på — createCheckout redirecter til Stripe. Se lib/funnel.js.
    await logFunnel(HOME_BUY_CLICK)
    // Funnel-instrumentering: registrer buy-klikk som InitiateCheckout så
    // forsøk er tellbare i Meta. En stille create-checkout-feil viser seg da
    // som InitiateCheckout uten matchende Purchase. Fyrer kun etter cookie-
    // samtykke (window.fbq ellers undefined); ?. gjør den til no-op uten pixel.
    window.fbq?.('track', 'InitiateCheckout', { value: PRICE, currency: 'NOK' })
    try {
      await createCheckout() // redirects to Stripe on success
    } catch (err) {
      if (err?.alreadyPaid) {
        // Serveren nektet ny Stripe-økt: tilgangen finnes alt.
        await refreshTier()
        setBuyBusy(false)
        return
      }
      // Gjør checkout-feil synlige i Meta -> brutt betalingssti fanges på
      // timer, ikke dager (jf. anon-email-bug 2026-07-01).
      // Ingen økt og anonym økt lot seg ikke opprette: innlogging er siste utvei.
      if (err?.needsLogin) {
        setPurchaseIntent()
        setBuyBusy(false)
        navigate('/login')
        return
      }
      window.fbq?.('trackCustom', 'CheckoutError', { message: String(err?.message || err).slice(0, 200) })
      setBuyErr(err.message || 'Noe gikk galt. Prøv igjen.')
      setBuyBusy(false)
    }
  }
  // Round 3.5: live counts from Supabase. null → loading (shows dots
  // so there's no layout shift). Fire-and-forget — never block render
  // and never surface errors to the UI; a failed fetch stays as dots.
  const [stats, setStats] = useState({ questions: null, categories: null })

  // Smart resume — read on mount so we only render the strip if the
  // user has a fresh session in localStorage (stale > 14 days returns
  // null from getLastSession).
  useEffect(() => {
    setLastSession(getLastSession())
  }, [])

  // Fetch live question + category counts via direct REST call.
  // Uses the anon key explicitly instead of the supabase client to
  // avoid a race condition: when a logged-out user has stale tokens
  // in localStorage, the supabase client may send an expired JWT
  // before session refresh completes, causing the RPC to 401.
  // A plain fetch with the anon key sidesteps this entirely.
  useEffect(() => {
    let cancelled = false
    async function fetchStats() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/get_question_count`,
          {
            method: 'POST',
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Content-Type': 'application/json',
            },
            body: '{}',
          }
        )
        if (!res.ok) throw new Error(res.status)
        const data = await res.json()
        if (cancelled) return
        setStats({
          questions: data?.[0]?.total_questions ?? null,
          categories: data?.[0]?.total_categories ?? null,
        })
      } catch (_) {
        /* swallow — loading dots remain */
      }
    }
    fetchStats()
    return () => {
      cancelled = true
    }
  }, [])

  // ═══ B2 «Cockpit lys» på forsiden (Frode 14.11.2026) ═══
  // Mørk topp med merke, overskrift og hovedvalgene. Hvitt felt under med
  // eksamenskortene. A2 står øverst fordi det er A2 folk betaler for.
  // «Er du klar?» står i toppen igjen når brukeren har nok svar; STS-målingen
  // fra 21.09 er over. Kjøpsflyten (handleBuy, purchaseIntent, ?kjop=1) er urørt.
  const paid = tier === 'paid'
  const loggedIn = !!user && !user.is_anonymous
  const totalt = stats.questions ?? ANTALL.total
  const label =
    'text-[13px] font-semibold tracking-[0.08em] uppercase text-da-text-muted mb-2.5'
  const tag =
    'px-2.5 py-1 rounded-lg bg-[#EEF3F7] text-da-navy text-[13px] font-semibold whitespace-nowrap'
  const besvart = (k) =>
    progress?.[k] ? (
      <span className="text-[14px] font-semibold text-da-text-muted tabular-nums whitespace-nowrap">
        {progress[k].answered} av {progress[k].total} besvart
      </span>
    ) : null
  const gullKnapp =
    'h-14 rounded-[14px] bg-da-gold text-da-navy-dark text-[16px] font-bold inline-flex items-center justify-center text-center px-3 transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60'

  const a2Card = (
    <section className="rise-in rounded-2xl border-2 border-da-navy p-4 mb-3.5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="font-cond text-[38px] font-bold text-da-navy leading-none">A2</h3>
        {besvart('A2') || (!paid && <span className={tag}>25 spørsmål gratis</span>)}
      </div>
      <p className="text-[15px] text-da-text-body leading-[1.4] mb-3">
        Prøven på trafikkstasjonen. 30 spørsmål, 60 minutter, 23 riktige for å bestå.
        Krever bestått A1/A3.
      </p>
      <ModePillRow examType="A2" primary={paid ? 'exam' : 'practice'} />
    </section>
  )

  const a1a3Card = (
    <section className="rise-in rise-d1 rounded-2xl border border-[#C9D3DC] p-4 mb-3.5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="font-cond text-[30px] font-bold text-da-navy leading-none">A1/A3</h3>
        {besvart('A1_A3') ||
          (!paid && (
            <span className="px-2.5 py-1 rounded-lg bg-green-50 text-green-800 text-[13px] font-semibold whitespace-nowrap">
              Helt gratis
            </span>
          ))}
      </div>
      <p className="text-[15px] text-da-text-body leading-[1.4] mb-3">
        Nettprøven alle må ta først. 40 spørsmål, 30 riktige for å bestå. Alle{' '}
        {ANTALL.A1_A3} spørsmålene er gratis.
      </p>
      <ModePillRow examType="A1_A3" />
    </section>
  )

  const stsCard = isExamEnabled('A2_STS') ? <StsExamCard /> : <StsVoteCard />

  return (
    <div className="min-h-screen bg-da-navy-dark flex flex-col">
      {/* Engangs fullskjerm-oppfordring om å installere som app — kun
          innloggede ekte brukere, maks én gang per enhet. */}
      <InstallAppInterstitial />

      {/* ═══ Mørk topp ═══ */}
      <div className="px-5 pt-3 pb-6">
        <div className="pt-2 max-w-xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5">
              <DroneMark />
              <span className="text-[20px] font-bold text-white leading-none">
                DroneLappen<span className="text-da-gold">.app</span>
              </span>
            </div>
            <Link
              to={loggedIn ? '/min-side' : '/login'}
              className="min-h-11 inline-flex items-center text-[15px] font-medium text-[#EAF1F7] hover:text-white transition-colors"
            >
              {loggedIn ? 'Min side' : 'Logg inn'}
            </Link>
          </div>

          {/* «Er du klar?» — rendrer ingenting før brukeren har nok svar. */}
          <ReadinessCard
            resume={
              lastSession
                ? {
                    path: sessionToPath(lastSession),
                    stats: sessionDisplayStats(lastSession),
                  }
                : null
            }
            onData={(d) => {
              setReadinessActive(true)
              setProgress(d || null)
            }}
          />

          {!readinessActive && (
            <div className="rise-in mb-5">
              {/* Vanlig Barlow, ikke Condensed: der får Ø et stort mellomrom foran v. */}
              <h1 className="text-[36px] font-bold text-white leading-[1.05] tracking-tight mb-2.5">
                Øv til dronelappen
              </h1>
              <p className="text-[17px] text-[#C9D6E2] leading-[1.4]">
                {paid
                  ? `Du har full tilgang til alle ${totalt} spørsmål, til A1/A3, A2 og STS.`
                  : `${totalt} spørsmål med forklaring, til A1/A3, A2 og STS. A1/A3 er gratis.`}
              </p>
            </div>
          )}

          {/* Prøv gratis eller kjøp — det første annonsetrafikken ser.
              Gull betyr kjøp over hele appen (05.08.2026). */}
          {!paid && (
            <>
              <div className="rise-in flex gap-2.5">
                {!readinessActive && (
                  <Link
                    to="/practice/A2"
                    className="flex-1 h-14 rounded-[14px] bg-white text-da-navy text-[16px] font-bold inline-flex items-center justify-center text-center px-3 transition-all hover:brightness-95 active:scale-[0.98]"
                  >
                    Prøv 25 gratis
                  </Link>
                )}
                <button onClick={handleBuy} disabled={buyBusy} className={`flex-1 ${gullKnapp}`}>
                  {buyBusy ? 'Sender …' : `Full tilgang · ${PRICE} kr`}
                </button>
              </div>
              {/* Sosialt bevis — statisk tall, oppdateres manuelt. Grunnlaget
                  MÅ være user_progress, ikke auth.users (rettet 04.08.2026):
                  select count(distinct user_id) from user_progress. */}
              <p className="mt-2.5 text-[14px] text-da-dark-slogan">
                Over 240 dronepiloter øver her allerede.
              </p>
            </>
          )}
        </div>
      </div>

      {/* ═══ Hvitt felt ═══ */}
      <div className="flex-1 bg-white rounded-t-3xl px-5 pt-5 pb-6">
        <div className="max-w-xl mx-auto">
          {/* Fullfør kjøpet — vises når kjøpsintensjonen overlevde
              login-runden (samme enhet, < 30 min). ✕ rydder intensjonen. */}
          {resumeBuy && !paid && user && (
            <div className="rise-in bg-[#EEF3F7] rounded-2xl p-4 mb-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className={label.replace('mb-2.5', 'mb-0.5')}>Du er innlogget</div>
                  <div className="text-[17px] font-semibold text-da-navy">
                    Fullfør kjøpet der du slapp
                  </div>
                </div>
                <button
                  onClick={() => { clearPurchaseIntent(); setResumeBuy(false) }}
                  aria-label="Lukk"
                  className="w-11 h-11 -mt-2 -mr-2 text-[18px] text-da-text-muted hover:text-da-navy transition-colors"
                >
                  ✕
                </button>
              </div>
              <button
                onClick={() => { clearPurchaseIntent(); handleBuy() }}
                disabled={buyBusy}
                className={`w-full ${gullKnapp}`}
              >
                {buyBusy ? 'Sender …' : `Full tilgang · ${PRICE} kr`}
              </button>
            </div>
          )}

          {/* Fortsett-stripe for den som har en økt, men ennå ikke nok svar
              til «Er du klar?». Med ringen i toppen dekker den returveien. */}
          {lastSession && !readinessActive && (
            <Link
              to={sessionToPath(lastSession)}
              className="rise-in block bg-[#EEF3F7] hover:bg-[#E3EAF0] rounded-2xl px-4 py-3 mb-4 transition-colors"
            >
              <div className={label.replace('mb-2.5', 'mb-0.5')}>Fortsett</div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[16px] font-semibold text-da-navy">
                  {describeSession(lastSession)}
                </span>
                <span className="text-[14px] text-da-text-muted tabular-nums whitespace-nowrap">
                  {sessionDisplayStats(lastSession)}
                </span>
              </div>
            </Link>
          )}

          <h2 className={label}>Velg eksamen</h2>
          {a2Card}
          {paid ? (
            <>
              {stsCard}
              {a1a3Card}
            </>
          ) : (
            <>
              {a1a3Card}
              {stsCard}
            </>
          )}

          {/* ═══ Full tilgang — kjøpskort, skjult for betalende ═══ */}
          {!paid && (
            <section className="rise-in rise-d2 bg-[#EEF3F7] rounded-2xl p-[18px] mt-1.5 mb-5">
              <div className="flex items-end justify-between gap-3 mb-2.5">
                <h2 className="text-[20px] font-bold text-da-navy leading-tight">Full tilgang</h2>
                <div className="text-right whitespace-nowrap">
                  <div className="font-cond text-[32px] font-bold text-da-navy leading-none">
                    {PRICE} kr
                  </div>
                  <div className="text-[13px] text-da-text-muted">én gang · 12 måneder</div>
                </div>
              </div>
              <p className="text-[15px] text-da-text-body leading-[1.45] mb-2.5">
                Alle {stats.questions ?? '200+'} spørsmål
                {antallParentes(stats.questions, ANTALL.A1_A3 + ANTALL.A2)}, alle kategorier og
                alle tre treningsmåter. Engangsbeløp, ingen abonnement. A1/A3 er gratis. Full
                tilgang gir A2 og STS.
              </p>
              <Lanseringspris className="mb-2" />
              <PriceIncreaseNotice className="mb-2.5" />
              <button onClick={handleBuy} disabled={buyBusy} className={`w-full ${gullKnapp}`}>
                {buyBusy ? 'Sender deg til betaling …' : 'Kjøp full tilgang'}
              </button>
              {buyErr && (
                <p role="alert" className="mt-2 text-[14px] text-amber-700">{buyErr}</p>
              )}
              <p className="mt-2.5 text-[13px] text-da-text-muted text-center">
                Sikker betaling via Stripe
              </p>
              <HarTilgangLoggInn className="mt-2 text-center" />
            </section>
          )}

          {/* Synlig FAQ, speiler FAQPage i index.html (08.10.2026) */}
          <HomeFaq />

          {/* ═══ Nyhetsbrev (Droneavisa-lista via MailerLite) ═══
              17.11.2026 (Frode: «kjøp er viktigst»): flyttet fra rett under
              kjøpskortet til under FAQ, så det ikke konkurrerer med kjøpsknappen. */}
          <div className="mt-5">
            <h2 className={label}>Hold deg oppdatert</h2>
            <NewsletterSignup />
          </div>

          {/* Bunnlinje: tall hentet live fra Supabase, og utlogging. */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#DCE4EA]">
            <span className="text-[13px] text-da-text-muted tabular-nums">
              {stats.questions !== null
                ? `${stats.questions} spørsmål${antallParentes(stats.questions, ANTALL.A1_A3 + ANTALL.A2)} · ${stats.categories} kategorier`
                : '··· spørsmål · ··· kategorier'}
            </span>
            {loggedIn && <AuthHeader variant="light" />}
          </div>
        </div>
      </div>
    </div>
  )
}
