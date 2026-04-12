import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import CrosshairMarks from '../components/CrosshairMarks'
import SignupPrompt from '../components/SignupPrompt'

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
  const [showAllAnswers, setShowAllAnswers] = useState(false)
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

  const displayExam = examType === 'A1_A3' ? 'A1 / A3' : examType || ''

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
    },
    passed: {
      modeLabel: 'eksamen',
      headline: 'Bestått',
      slogan: 'Du ville bestått den ekte prøven',
      cardBorder: 'border-green-600',
      crosshair: 'solid',
      scoreColor: 'text-green-700',
      accentColor: 'text-green-700',
    },
    failed: {
      modeLabel: 'eksamen',
      headline: 'Ikke bestått',
      slogan: `Du trenger ${passThreshold} av ${totalQuestions} for å bestå`,
      cardBorder: 'border-da-gold',
      crosshair: 'gold',
      scoreColor: 'text-da-gold-text',
      accentColor: 'text-da-gold',
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
          <p className="text-[13px] text-da-navy leading-[1.45]">
            {getOptionText(item.question, item.userAnswer)}
          </p>
        </div>

        {!item.isCorrect && (
          <div className="rounded px-3 py-2 border-[0.5px] bg-green-50 border-green-200">
            <p className="font-mono text-[10px] font-semibold tracking-[0.1em] text-green-700 mb-1">
              riktig svar
            </p>
            <p className="text-[13px] text-da-navy leading-[1.45]">
              {getOptionText(item.question, item.question.correct_option_id)}
            </p>
          </div>
        )}
      </div>

      <div className="bg-da-cream/40 border-[0.5px] border-da-gold/40 border-l-2 border-l-da-gold rounded px-3 py-2">
        <p className="font-mono text-[10px] font-semibold tracking-[0.1em] text-da-gold-text mb-1 uppercase">
          forklaring
        </p>
        <p className="text-[12.5px] text-da-text-body leading-[1.5]">
          {item.question.explanation}
        </p>
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

  return (
    <div className="min-h-screen bg-da-bg flex flex-col">
      {/* ═══ Dark hero ═══ */}
      <div className="bg-da-navy-dark px-6 pt-3 pb-5">
        <div className="pt-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[12px] font-medium text-da-gold tracking-[0.12em]">
              {heroConfig.modeLabel}
              {displayExam && (
                <span className="text-da-dark-slogan"> · {displayExam}</span>
              )}
            </span>
          </div>
          <h1
            role="status"
            className="text-[32px] font-medium text-da-bg leading-none tracking-tight mb-1"
          >
            {heroConfig.headline}
          </h1>
          <p className="font-serif italic text-sm text-da-dark-slogan">
            {heroConfig.slogan}
          </p>
        </div>
      </div>

      {/* ═══ Fade transition ═══ */}
      <div
        className="h-7 shrink-0"
        style={{
          background:
            'linear-gradient(to bottom, #0a1628 0%, #2a3a50 25%, #7e8a9c 55%, #cfd6df 80%, #fafbfc 100%)',
        }}
      />

      {/* ═══ Light content zone ═══ */}
      <div className="px-6 pt-2 pb-6 bg-da-bg">
        <div className="max-w-lg mx-auto">
          {/* Stats card — score as hero, then supporting stats. Crosshair
              marks echo the Round 2 exam cards on Home. */}
          <div
            className={`relative bg-white border-[0.5px] ${heroConfig.cardBorder} rounded-lg px-6 pt-6 pb-5 mb-4 ${fadeClass}`}
          >
            <CrosshairMarks variant={heroConfig.crosshair} />

            <div
              className={`font-mono text-[11px] font-medium ${heroConfig.accentColor} tracking-[0.12em] text-center mb-2`}
            >
              score
            </div>
            <div
              className={`text-[48px] font-medium font-mono tabular-nums ${heroConfig.scoreColor} leading-none text-center mb-3 tracking-tight`}
            >
              {percentage}%
            </div>
            <div className="text-center mb-4">
              <span className="font-mono text-[12px] text-da-text-muted tracking-wide tabular-nums">
                {correctCount}/{totalQuestions} riktige
              </span>
            </div>

            {/* Divider */}
            <div className="h-px bg-da-navy/15 mb-4" />

            {/* Secondary stats row — pass threshold + time used (Eksamen
                only) or question count (Læring) */}
            <div className="flex items-baseline justify-between">
              <div>
                <div className="font-mono text-[10px] text-da-text-muted tracking-[0.1em] uppercase mb-0.5">
                  {isPracticeMode ? 'spørsmål' : 'grense'}
                </div>
                <div className="font-mono text-[16px] font-semibold text-da-navy tabular-nums">
                  {isPracticeMode
                    ? `${totalQuestions}`
                    : `${passThreshold}/${totalQuestions}`}
                </div>
              </div>
              {timeUsedMs !== null && timeUsedMs !== undefined ? (
                <div className="text-right">
                  <div className="font-mono text-[10px] text-da-text-muted tracking-[0.1em] uppercase mb-0.5">
                    tid
                  </div>
                  <div className="font-mono text-[16px] font-semibold text-da-navy tabular-nums">
                    {formatMs(timeUsedMs)}
                    {examDurationMs && (
                      <span className="text-da-text-muted">
                        {' '}
                        / {formatMs(examDurationMs)}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-right">
                  <div className="font-mono text-[10px] text-da-text-muted tracking-[0.1em] uppercase mb-0.5">
                    modus
                  </div>
                  <div className="font-mono text-[16px] font-semibold text-da-navy">
                    læring
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Signup prompt — shown only for anonymous users */}
          <SignupPrompt />

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
              className="quiz-option w-full bg-da-navy hover:bg-da-navy-mid text-da-bg font-medium py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>{isPracticeMode ? 'Øv mer' : 'Start på nytt'}</span>
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
