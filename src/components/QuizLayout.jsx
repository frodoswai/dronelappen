// Shared in-quiz shell (Round 3). All three in-quiz screens share the
// same structure: compact dark header + 28px fade + light content zone.
// Extracted here so Quiz (Eksamen + Læring) and Rapid (Tempo) stay DRY
// and the visual language from Round 2 Home/ExamSelect carries into the
// actual quiz flow.
//
// Props:
//   mode      — 'eksamen' | 'laering' | 'tempo' — drives the mono label
//   examType  — 'A2' | 'A1_A3' — shown in the header after a middot
//               (also 'A2_STS'; the name comes from examDisplay in lib/exams.js)
//   progress  — { current, total } — "Spørsmål 7/30" in the header
//   stats     — optional extra string (e.g. "5/7 riktige" in Læring/Tempo)
//   timer     — optional string (e.g. "57:23" Eksamen, "⏱ 1:42" Tempo)
//   timerUrgent — optional bool; paints the timer red when true (sub-5-min)
//   onStop    — optional handler; renders a small "stopp" button next to timer
//   flashBg   — optional Tailwind bg class for Rapid correct/wrong flashes
//   question  — spørsmålsteksten; vises i den mørke toppen (B2, 14.11.2026)
//   children  — svaralternativer og forklaring, ligger på det hvite feltet
//
// Layout intent:
//   1. Dark navy-dark zone with mode label / progress / timer
//   2. Thin progress bar at the bottom of the dark zone
//   3. 28px stepped gradient fade (identical to Home/ExamSelect)
//   4. Light content zone hosting the question card

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createCheckout } from '../lib/supabase'
import { logFunnel, QUIZ_BUY_CLICK } from '../lib/funnel'
import { PRICE } from '../lib/pricing'
import { examDisplay } from '../lib/exams'
import TextSizeToggle from './TextSizeToggle'

export default function QuizLayout({
  mode,
  examType,
  progress,
  stats,
  timer,
  timerUrgent,
  onStop,
  flashBg,
  question,
  children,
}) {
  const { tier, loading, refreshTier } = useAuth()
  const navigate = useNavigate()
  const [upgradeBusy, setUpgradeBusy] = useState(false)
  // Gate on loading so paid users never flash the "Gratis"/upgrade UI
  // before their entitlement resolves (mirrors UpgradePrompt).
  const isFree = !loading && tier !== 'paid'
  // A1/A3 er gratis i sin helhet fra 08.10.2026. Baren står fortsatt (den er
  // oppsalget til A2 og STS), men den skal ikke antyde en gratis-pool.
  const a1a3Free = isFree && examType === 'A1_A3'

  const handleUpgrade = async () => {
    if (upgradeBusy) return
    // 15.10.2026: fersk tilgang før Stripe. Er den betalt, forsvinner
    // oppsalget av seg selv (isFree leser tier fra AuthContext).
    if ((await refreshTier()) === 'paid') return
    // Ventes på: createCheckout redirecter til Stripe, og en fire-and-forget-
    // insert rekker ikke å sende før siden lastes ut. Samme felle som gjorde
    // paywall_buy_click ubrukelig i to døgn (se lib/funnel.js). Taket er 800 ms.
    await logFunnel(QUIZ_BUY_CLICK, { examType })
    setUpgradeBusy(true)
    try {
      await createCheckout() // redirects to Stripe on success
    } catch (e) {
      setUpgradeBusy(false)
      if (e?.alreadyPaid) { await refreshTier(); return }
      // Ingen økt og anonym økt lot seg ikke opprette: innlogging er siste utvei.
      if (e?.needsLogin) { navigate('/login'); return }
      // Avbrutt e-postdialog: bli i quizen. Andre feil: forsiden som før.
      if (!e?.cancelled) navigate('/')
    }
  }

  const modeLabel =
    mode === 'eksamen'
      ? 'eksamen'
      : mode === 'laering'
      ? 'læring'
      : mode === 'tempo'
      ? 'tempo'
      : mode || ''

  const displayExam = examDisplay(examType)

  const pct =
    progress && progress.total > 0
      ? (progress.current / progress.total) * 100
      : 0

  return (
    <div className="min-h-screen flex flex-col bg-da-navy-dark">
      {/* ═══ Mørk topp ═══
          B2 «Cockpit lys» (Frode 14.11.2026): teller, klokke og selve
          spørsmålet står på mørk bunn. Svarene ligger på et hvitt felt
          under, med mørkeblå tekst. Bare drakta er ny, oppførselen er
          som før. */}
      <div className="px-5 pt-3 pb-5">
        {/* pt-2 (ikke sidekonvensjonens pt-8): i quiz-flyten er stor
            topp-luft bare dødplass på mobil (Frode 18/7). */}
        <div className="pt-2 max-w-xl mx-auto">
          {/* Brand + upgrade line — context for direct/ad landings */}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-2">
            <Link
              to="/"
              className="font-mono text-[11px] font-medium text-da-dark-slogan tracking-[0.08em] hover:text-da-bg transition-colors shrink-0"
              aria-label="DroneLappen forside"
            >
              DroneLappen<span className="text-da-gold">.app</span>
            </Link>
            {/* Tekststørrelse i toppen (14.11.2026): bryteren lå bare i
                bunnteksten, under alt innholdet, der få fant den. */}
            <div className="ml-auto">
              <TextSizeToggle compact />
            </div>
            {isFree && (
              /* Variant B (05.08.2026): fylt gullpille i stedet for mono-tekst.
                 Knappen har ligget her hele tiden, men i 11 px gull på
                 marineblått leste den som en etikett, ikke noe trykkbart.
                 Plasseringen er uendret med vilje — vi endrer ÉN ting, og
                 quiz_buy_click logges nå, så vi kan se om det virket.
                 Bakgrunn: 8 av 23 betalende kjøpte uten å svare på ett
                 eneste spørsmål. Dette er inngangen deres. */
              <button
                onClick={handleUpgrade}
                disabled={upgradeBusy}
                className="quiz-option font-mono text-[11px] font-semibold bg-da-gold text-da-navy-dark tracking-[0.04em] px-2.5 py-1 rounded-full hover:brightness-105 transition-all shrink-0 disabled:opacity-60"
              >
                {upgradeBusy ? 'Sender til betaling …' : `Kjøp · ${PRICE} kr`}
              </button>
            )}
          </div>

          {/* Tilbake + teller + klokke */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <Link
              to="/"
              className="quiz-option w-11 h-11 rounded-full border border-[#1E3A57] bg-[#10233A] flex items-center justify-center hover:border-da-dark-slogan transition-colors shrink-0"
              aria-label="Tilbake"
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EAF1F7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </Link>
            {progress && (
              <div className="font-cond flex items-baseline gap-1.5 tabular-nums" aria-label={`Spørsmål ${progress.current} av ${progress.total}`}>
                <span className="text-[30px] font-bold text-da-gold leading-none">
                  {String(progress.current).padStart(2, '0')}
                </span>
                <span className="text-[18px] font-semibold text-da-dark-slogan leading-none">
                  / {progress.total}
                </span>
              </div>
            )}
            {timer ? (
              <div className="h-11 pl-3.5 pr-1.5 rounded-full border border-[#1E3A57] bg-[#10233A] flex items-center gap-2 shrink-0">
                <span
                  className={`font-cond text-[18px] font-semibold tabular-nums pr-2 ${
                    timerUrgent ? 'text-red-400' : 'text-[#EAF1F7]'
                  }`}
                  aria-label="Tid"
                >
                  {timer}
                </span>
                {onStop && (
                  <button
                    onClick={onStop}
                    className="quiz-option h-8 px-3 rounded-full bg-da-navy-dark border border-[#1E3A57] text-[13px] font-medium text-da-dark-slogan hover:text-white transition-colors"
                  >
                    Stopp
                  </button>
                )}
              </div>
            ) : (
              <div className="w-11 shrink-0" aria-hidden="true" />
            )}
          </div>

          {/* Fremdrift */}
          {progress && (
            <div className="w-full h-1 bg-[#1E3A57] rounded-full overflow-hidden mb-5">
              <div
                className="h-full bg-da-gold rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}

          {/* Modus, eksamen og eventuell stats */}
          <p className="text-[13px] font-semibold tracking-[0.08em] uppercase text-da-dark-slogan truncate mb-2">
            {modeLabel}
            {displayExam && <span> · {displayExam}</span>}
            {stats && <span> · {stats}</span>}
          </p>
          {question && (
            <h2 className="text-[21px] font-semibold text-white leading-[1.3]">
              {question}
            </h2>
          )}
        </div>
      </div>

      {/* ═══ Hvitt felt ═══ flashBg er Tempo sitt grønne/gule blink. */}
      <div
        className={`flex-1 rounded-t-3xl px-5 pt-5 ${isFree ? 'pb-24' : 'pb-6'} bg-white transition-colors duration-150 ${flashBg || ''}`}
      >
        <div className="max-w-xl mx-auto">{children}</div>
      </div>

      {/* ═══ Sticky free-quota bar ═══
          Visible under every question for free users: a persistent, low-
          friction buy button (Frode: "under hvert spørsmål en kjøp-knapp").
          Shows how much of the 25-question free pool is used (A2). On A1/A3,
          which is free in full from 08.10.2026, it says so and sells A2 + STS
          instead. Hidden for paid
          users and while the tier is still loading (isFree gates both). */}
      {isFree && progress && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-da-navy-dark/95 backdrop-blur border-t border-da-gold/30">
          <div className="max-w-xl mx-auto px-5 py-2.5 flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] text-da-dark-slogan tracking-wide tabular-nums">
              {a1a3Free ? 'A1/A3 er gratis' : 'Gratis'} · {progress.current}/{progress.total}{a1a3Free ? '' : ' spørsmål'}
            </span>
            <button
              onClick={handleUpgrade}
              disabled={upgradeBusy}
              className="quiz-option font-mono text-[11px] font-medium tracking-[0.04em] bg-da-gold text-da-navy-dark px-3 py-1.5 rounded-[5px] hover:opacity-90 transition-opacity shrink-0 disabled:opacity-60"
            >
              {upgradeBusy ? 'Sender …' : a1a3Free ? `A2 og STS · ${PRICE} kr →` : `Lås opp alt · ${PRICE} kr →`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
