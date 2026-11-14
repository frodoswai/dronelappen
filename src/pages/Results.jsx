import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import CrosshairMarks from '../components/CrosshairMarks'
import LeadCapture from '../components/LeadCapture'
import UpgradePrompt from '../components/UpgradePrompt'
import { useAuth } from '../contexts/AuthContext'
import ReportQuestion from '../components/ReportQuestion'
import { examDisplay } from '../lib/exams'

// Pass threshold mirrors the real A2 exam: 23/30 = 76.6% ≥ 75%.
const PASS_PERCENT = 75

// MM:SS formatter shared across the verdict card.
function formatMs(ms) {
  if (ms === null || ms === undefined) return ''
  const totalSec = Math.floor(ms / 1000)
  const mins = Math.floor(totalSec / 60)
  const secs = totalSec % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Round 3: full rewrite in the Home/ExamSelect visual language.
// Three finish screens share one structure: dark hero headline + 28px
// fade + light zone with stats card and action buttons. The existing
// wrong-answer review toggle and per-question cards are preserved — only
// the verdict card / hero is restyled.
export default function Results() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showAllAnswers, setShowAllAnswers] = useState(false)
  // Deling etter bestått A1/A3-eksamen (Del D i A1/A3-briefen, 08.10.2026).
  // Gratis A1/A3 skal gi omtale, og den som nettopp besto er den beste ambassadøren.
  const [delStatus, setDelStatus] = useState('')
  // Simple mount fade-in for the stats card. No confetti, no bounce.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  if (!location.state) {
    return (
      <div className="min-h-screen bg-da-bg flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-da-text-body text-base mb-4">
            Ingen resultater tilgjengelig
          </p>
          <button
            onClick={() => navigate('/')}
            className="quiz-option bg-da-navy text-da-bg font-medium px-6 py-3 rounded-lg"
          >
            Tilbake til hjem
          </button>
        </div>
      </div>
    )
  }

  const {
    questions,
    answers,
    isPracticeMode,
    examType,
    timeUsedMs,
    examDurationMs,
  } = location.state

  const getOptionText = (question, optionId) => {
    if (!optionId || !question?.options) return '—'
    const opt = question.options.find((o) => o.id === optionId)
    return opt ? opt.text : optionId
  }

  const correctCount = answers.filter(
    (ans, idx) =>
      ans && questions[idx] && ans === questions[idx].correct_option_id
  ).length
  const totalQuestions = questions.length
  const percentage = Math.round((correctCount / totalQuestions) * 100)
  const passThreshold = Math.ceil(totalQuestions * 0.75)
  const passed = percentage >= PASS_PERCENT

  // "Start på nytt" — send the user straight back to the mode picker for
  // this exam so they don't have to tap through Home again. Falls back to
  // Home if we somehow got here without an examType.
  const retryPath = examType ? `/exam/${examType}` : '/'

  const displayExam = examDisplay(examType)

  // Mode + verdict selection. Three visual variants:
  //   Læring          → navy label, navy accent border, neutral copy
  //   Eksamen passed  → green label, green accent border, celebratory
  //   Eksamen failed  → amber label, amber accent border, encouraging
  const variant = isPracticeMode ? 'laering' : passed ? 'passed' : 'failed'

  const heroConfig = {
    laering: {
      modeLabel: 'læring',
      headline: 'Godt jobbet',
      slogan: 'Du har gjennomgått alle spørsmålene',
      cardBorder: 'border-da-navy',
      crosshair: 'solid',
      scoreColor: 'text-da-navy',
      accentColor: 'text-da-navy',
      ring: '#E89F1E',
      headColor: 'text-white',
    },
    passed: {
      modeLabel: 'eksamen',
      headline: 'Bestått',
      slogan: 'Du ville bestått den ekte prøven',
      cardBorder: 'border-green-600',
      crosshair: 'solid',
      scoreColor: 'text-green-700',
      accentColor: 'text-green-700',
      ring: '#5BD69A',
      headColor: 'text-[#5BD69A]',
    },
    failed: {
      modeLabel: 'eksamen',
      headline: 'Ikke bestått',
      slogan: `Du trenger ${passThreshold} av ${totalQuestions} for å bestå`,
      cardBorder: 'border-da-gold',
      crosshair: 'gold',
      scoreColor: 'text-da-gold-text',
      accentColor: 'text-da-gold',
      ring: '#E89F1E',
      headColor: 'text-da-gold',
    },
  }[variant]

  const fadeClass = `transition-all duration-500 ${
    mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
  }`

  const renderAnswerCard = (item) => (
    <div
      key={item.index}
      className={`bg-white border-[0.5px] border-l-2 rounded-lg p-4 ${
        item.isCorrect
          ? 'border-green-200 border-l-green-500'
          : 'border-amber-200 border-l-amber-500'
      }`}
    >
      <p className="font-mono text-[10px] tracking-[0.1em] text-da-text-muted mb-1.5 uppercase">
        spørsmål {item.index + 1}
      </p>
      <h3 className="text-[14px] font-medium text-da-navy mb-3 leading-[1.45]">
        {item.question.question_text}
      </h3>

      <div className="mb-3 space-y-2">
        <div
          className={`rounded px-3 py-2 border-[0.5px] ${
            item.isCorrect
              ? 'bg-green-50 border-green-200'
              : 'bg-amber-50 border-amber-300'
          }`}
        >
          <p
            className={`font-mono text-[10px] font-semibold tracking-[0.1em] mb-1 ${
              item.isCorrect ? 'text-green-700' : 'text-amber-700'
            }`}
          >
            {item.isCorrect ? '✓ ditt svar' : '✗ ditt svar'}
          </p>
          <p className="text-[14.5px] text-da-navy leading-[1.45]">
            {getOptionText(item.question, item.userAnswer)}
          </p>
        </div>

        {!item.isCorrect && (
          <div className="rounded px-3 py-2 border-[0.5px] bg-green-50 border-green-200">
            <p className="font-mono text-[10px] font-semibold tracking-[0.1em] text-green-700 mb-1">
              riktig svar
            </p>
            <p className="text-[14.5px] text-da-navy leading-[1.45]">
              {getOptionText(item.question, item.question.correct_option_id)}
            </p>
          </div>
        )}
      </div>

      <div className="bg-da-cream/40 border-[0.5px] border-da-gold/40 border-l-2 border-l-da-gold rounded px-3 py-2">
        <p className="font-mono text-[10px] font-semibold tracking-[0.1em] text-da-gold-text mb-1 uppercase">
          forklaring
        </p>
        <p className="text-[14px] text-da-text-body leading-[1.5]">
          {item.question.explanation}
        </p>
        {item.question.source_public && (
          <p className="mt-1.5 text-[12.5px] text-da-text-muted leading-[1.45]">
            Kilde: {item.question.source_public}
          </p>
        )}
        <ReportQuestion key={item.question.id} questionId={item.question.id} />
      </div>
    </div>
  )

  const allResults = answers.map((ans, idx) => ({
    index: idx,
    question: questions[idx],
    userAnswer: ans,
    isCorrect: ans === questions[idx].correct_option_id,
  }))
  const wrongAnswers = allResults.filter((item) => !item.isCorrect)

  const RING = 2 * Math.PI * 59
  const tidTekst =
    timeUsedMs !== null && timeUsedMs !== undefined
      ? `${formatMs(timeUsedMs)}${examDurationMs ? ` / ${formatMs(examDurationMs)}` : ''}`
      : null

  return (
    <div className="min-h-screen bg-da-navy-dark flex flex-col">
      {/* ═══ Mørk topp med ring ═══
          B2 «Cockpit lys» (Frode 14.11.2026): resultatet står på mørk bunn,
          tallene og svarene ligger på hvitt felt under. */}
      <div className="px-5 pt-6 pb-6">
        <div className="max-w-xl mx-auto flex items-center gap-5">
          <div className="relative w-[136px] h-[136px] shrink-0 flex items-center justify-center">
            <svg aria-hidden="true" width="136" height="136" viewBox="0 0 136 136" className="absolute inset-0">
              <circle cx="68" cy="68" r="59" fill="none" stroke="#1E3A57" strokeWidth="10" />
              {percentage > 0 && (
                <circle
                  cx="68"
                  cy="68"
                  r="59"
                  fill="none"
                  stroke={heroConfig.ring}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${((mounted ? percentage : 0) / 100) * RING} ${RING}`}
                  transform="rotate(-90 68 68)"
                  style={{ transition: 'stroke-dasharray 700ms ease-out' }}
                />
              )}
            </svg>
            <div className="flex flex-col items-center">
              <span className="font-cond text-[46px] font-bold text-white leading-none tabular-nums">
                {percentage}
                <span className="text-[22px] text-da-dark-slogan"> %</span>
              </span>
              <span className="text-[13px] text-da-dark-slogan tabular-nums">
                {correctCount} av {totalQuestions}
              </span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="font-cond text-[15px] font-semibold tracking-[0.08em] uppercase text-da-dark-slogan mb-1">
              {heroConfig.modeLabel}
              {displayExam && <span> · {displayExam}</span>}
            </p>
            <h1
              role="status"
              className={`font-cond text-[36px] font-bold leading-none mb-1.5 ${heroConfig.headColor}`}
            >
              {heroConfig.headline}
            </h1>
            <p className="text-[15px] text-[#C9D6E2] leading-[1.4]">
              {heroConfig.slogan}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Hvitt felt ═══ */}
      <div className="flex-1 bg-white rounded-t-3xl px-5 pt-5 pb-6">
        <div className="max-w-xl mx-auto">
          <div className={`grid grid-cols-2 gap-2.5 mb-4 ${fadeClass}`}>
            <div className="bg-[#EEF3F7] rounded-[14px] px-3.5 py-3">
              <div className="font-cond text-[26px] font-bold text-da-navy leading-tight tabular-nums">
                {isPracticeMode ? totalQuestions : `${passThreshold} av ${totalQuestions}`}
              </div>
              <div className="text-[13px] text-da-text-muted">
                {isPracticeMode ? 'spørsmål' : 'grense for bestått'}
              </div>
            </div>
            <div className="bg-[#EEF3F7] rounded-[14px] px-3.5 py-3">
              {/* 08.10.2026: A1/A3 Eksamen har ingen klokke. Vis da modusen
                  som faktisk ble brukt. */}
              <div className="font-cond text-[26px] font-bold text-da-navy leading-tight tabular-nums">
                {tidTekst || (isPracticeMode ? 'Læring' : 'Eksamen')}
              </div>
              <div className="text-[13px] text-da-text-muted">
                {tidTekst ? 'tid brukt' : 'modus'}
              </div>
            </div>
          </div>

          {/* 22.10.2026: en leser trodde prøveeksamen her var den ekte A1/A3-
              eksamen og lette etter beviset på flydrone.no. Si det rett ut på
              resultatsiden i eksamensmodus. */}
          {!isPracticeMode && (
            <p className="text-center text-[13px] text-da-text-muted mb-5">
              Dette er en øvingsprøve.{' '}
              {examType === 'A1_A3'
                ? 'Den ekte A1/A3-eksamen tar du gratis på flydrone.no.'
                : 'Den ekte prøven tar du på en trafikkstasjon hos Statens vegvesen.'}
            </p>
          )}

          {/* Del resultatet: bare bestått A1/A3 Eksamen. Web Share API på mobil,
              ellers kopieres lenken. UTM share/results/a1a3 viser i visit_events
              om delingene gir nye besøkende. */}
          {variant === 'passed' && examType === 'A1_A3' && (
            <div className="text-center mb-5">
              <button
                onClick={async () => {
                  const url = 'https://dronelappen.app/?utm_source=share&utm_medium=results&utm_campaign=a1a3'
                  const text = `Jeg besto A1/A3-simuleringen på DroneLappen med ${correctCount} av ${totalQuestions}. Alle A1/A3-spørsmålene er gratis:`
                  try {
                    if (navigator.share) {
                      await navigator.share({ title: 'DroneLappen', text, url })
                      setDelStatus('Takk for at du deler!')
                    } else {
                      await navigator.clipboard.writeText(`${text} ${url}`)
                      setDelStatus('Lenken er kopiert.')
                    }
                  } catch {
                    /* avbrutt deling er ikke en feil */
                  }
                }}
                className="quiz-option bg-da-gold text-da-navy-dark font-medium py-2.5 px-5 rounded-lg text-[13px] hover:opacity-90 transition-opacity"
              >
                Del at du besto
              </button>
              {delStatus && (
                <p className="text-[12px] text-da-text-muted mt-2" role="status">{delStatus}</p>
              )}
            </div>
          )}

          {/* Email capture — shown only for anonymous users. Lower-friction
              than account creation and feeds the DroneLappen leads nurture;
              links to account signup inline for those who want progress saved. */}
          <LeadCapture source="quiz_results" />

          {/* Upsell to full access — only for logged-in free users */}
          <UpgradePrompt requireUser examType={examType} />

          {/* Encouraging line for failed Eksamen — kept below the card so
              it doesn't compete with the score. */}
          {variant === 'failed' && (
            <p className="text-[13px] text-da-text-body italic text-center mb-4">
              Du var nær — gå gjennom svarene og prøv på nytt.
            </p>
          )}

          {/* Action buttons — navy primary, white secondary */}
          <div className="space-y-2.5 mb-6">
            <button
              onClick={() => navigate(retryPath)}
              className="quiz-option w-full h-14 bg-da-gold hover:brightness-105 text-da-navy-dark text-[17px] font-bold px-4 rounded-[14px] transition-all flex items-center justify-center gap-2"
            >
              <span>{isPracticeMode ? 'Øv mer' : 'Start på nytt'}</span>
              <span className="font-mono text-[12px] text-da-navy-dark">→</span>
            </button>
            {/* Feilbanken (18/7): kryss-økt-øving på alt brukeren har svart
                feil på (siste svar teller). Kun innloggede — anonyme har
                ingen user_progress å hente fra. */}
            {user && examType && (
              <button
                onClick={() => navigate(`/practice/${examType}?feil=1`)}
                className="quiz-option w-full bg-white border-[0.5px] border-da-gold/70 hover:bg-da-cream/40 text-da-navy font-medium py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>Øv på feilene dine</span>
                <span className="font-mono text-[12px] text-da-gold">→</span>
              </button>
            )}
            <button
              onClick={() => navigate('/min-side')}
              className="quiz-option w-full bg-white border-[0.5px] border-da-navy/30 hover:border-da-navy/60 text-da-navy font-medium py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>Se min side</span>
              <span className="font-mono text-[12px] text-da-gold">→</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="quiz-option w-full bg-white border-[0.5px] border-da-navy/30 hover:border-da-navy/60 text-da-navy font-medium py-3.5 px-4 rounded-lg transition-colors"
            >
              Tilbake til hjem
            </button>
          </div>

          {/* Answer review toggle — same for every mode, because learning
              from mistakes is valuable no matter what brought you here. */}
          <button
            onClick={() => setShowAllAnswers(!showAllAnswers)}
            className="quiz-option w-full bg-white border-[0.5px] border-da-navy/20 hover:border-da-navy/40 text-da-navy font-medium py-3 px-4 rounded-lg transition-colors mb-5 font-mono text-[12px] tracking-[0.05em]"
          >
            {showAllAnswers ? 'skjul alle svar' : 'se alle svar'}
          </button>

          {/* Wrong answers (default view) */}
          {wrongAnswers.length > 0 && !showAllAnswers && (
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex-1 h-px bg-da-navy/20" />
                <span className="font-mono text-[11px] font-medium text-da-navy/60 tracking-[0.1em]">
                  feil svar ({wrongAnswers.length})
                </span>
                <div className="flex-1 h-px bg-da-navy/20" />
              </div>
              <div className="space-y-3">{wrongAnswers.map(renderAnswerCard)}</div>
            </div>
          )}

          {/* All answers (toggle view) */}
          {showAllAnswers && (
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex-1 h-px bg-da-navy/20" />
                <span className="font-mono text-[11px] font-medium text-da-navy/60 tracking-[0.1em]">
                  alle svar ({allResults.length})
                </span>
                <div className="flex-1 h-px bg-da-navy/20" />
              </div>
              <div className="space-y-3">{allResults.map(renderAnswerCard)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
