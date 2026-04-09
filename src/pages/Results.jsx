import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

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

// Inline SVG icons — no new dependency, same currentColor trick as
// DroneLogo, so we can recolor via Tailwind text utilities.
function CheckCircleIcon({ className = '', strokeWidth = 2 }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="20" />
      <path d="M15 24 L22 31 L34 18" />
    </svg>
  )
}

function AlertCircleIcon({ className = '', strokeWidth = 2 }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="20" />
      <line x1="24" y1="14" x2="24" y2="27" />
      <circle cx="24" cy="34" r="1.2" fill="currentColor" />
    </svg>
  )
}

export default function Results() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showAllAnswers, setShowAllAnswers] = useState(false)
  // Simple mount fade-in for the celebration card. No confetti, no bounce.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  if (!location.state) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Ingen resultater tilgjengelig</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-900 text-white px-6 py-2 rounded-lg"
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

  const examLabel = examType === 'A2' ? 'A2' : 'A1/A3'

  // Shared animation class — a single 500ms fade used by all three modes.
  const fadeClass = `transition-all duration-500 ${
    mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
  }`

  const renderAnswerCard = (item) => (
    <div
      key={item.index}
      className={`bg-white rounded-lg shadow-md p-5 border-l-4 ${
        item.isCorrect ? 'border-green-500' : 'border-red-500'
      }`}
    >
      <p className="text-sm text-gray-500 mb-2">Spørsmål {item.index + 1}</p>
      <h3 className="font-semibold text-gray-800 mb-3">
        {item.question.question_text}
      </h3>

      <div className="mb-3 space-y-2">
        <div
          className={`rounded p-3 ${
            item.isCorrect
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <p
            className={`text-xs font-semibold mb-1 ${
              item.isCorrect ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {item.isCorrect ? '✓ Ditt svar:' : '✗ Ditt svar:'}
          </p>
          <p className="text-gray-800">
            {getOptionText(item.question, item.userAnswer)}
          </p>
        </div>

        {!item.isCorrect && (
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="text-xs text-green-700 font-semibold mb-1">
              Riktig svar:
            </p>
            <p className="text-gray-800">
              {getOptionText(item.question, item.question.correct_option_id)}
            </p>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded p-3">
        <p className="text-xs text-amber-900 font-semibold mb-1">Forklaring:</p>
        <p className="text-sm text-gray-700">{item.question.explanation}</p>
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

  // ---------- Mode-aware verdict card ----------
  // Øv fritt — gentle "well done", navy tint, no pass/fail pressure.
  // Eksamen pass — green BESTÅTT verdict, rehearsal framing.
  // Eksamen fail — muted amber "Ikke bestått", encouraging, never red.
  let verdictCard
  if (isPracticeMode) {
    verdictCard = (
      <div
        className={`bg-blue-50 border border-blue-100 rounded-xl shadow-md p-8 text-center mb-6 ${fadeClass}`}
      >
        <div className="flex justify-center mb-4">
          <CheckCircleIcon
            className="w-16 h-16 text-blue-900"
            strokeWidth={2.2}
          />
        </div>
        <h1
          role="status"
          className="text-3xl font-bold text-blue-900 mb-2 tracking-wide"
        >
          Godt jobbet!
        </h1>
        <p className="text-gray-700 text-base mb-5">
          Du har gjennomgått {totalQuestions} spørsmål.
        </p>
        <p className="text-lg text-gray-800 mb-1">
          <span className="font-semibold">Riktige svar:</span>{' '}
          <span className="font-mono tabular-nums font-semibold">
            {correctCount} / {totalQuestions}
          </span>
        </p>
        <p className="text-sm text-gray-500 mb-6">
          {examLabel} · Øv fritt
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate(retryPath)}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Øv mer
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Tilbake til hjem
          </button>
        </div>
      </div>
    )
  } else if (passed) {
    verdictCard = (
      <div
        className={`bg-green-50 border border-green-200 rounded-xl shadow-md p-8 text-center mb-6 ${fadeClass}`}
      >
        <div className="flex justify-center mb-4">
          <CheckCircleIcon
            className="w-20 h-20 text-green-600"
            strokeWidth={2.4}
          />
        </div>
        <h1
          role="status"
          className="text-4xl font-extrabold text-green-700 mb-2 tracking-wide"
        >
          BESTÅTT
        </h1>
        <p className="text-gray-800 text-base mb-5">
          Du ville bestått den ekte prøven!
        </p>
        <p className="text-lg text-gray-800 mb-1">
          <span className="font-mono tabular-nums font-semibold">
            {correctCount} / {totalQuestions}
          </span>{' '}
          riktige · <span className="font-mono tabular-nums">{percentage}%</span>
        </p>
        {timeUsedMs !== null && timeUsedMs !== undefined && (
          <p className="text-sm text-gray-600 mb-1">
            Tid brukt:{' '}
            <span className="font-mono tabular-nums">
              {formatMs(timeUsedMs)}
            </span>{' '}
            av{' '}
            <span className="font-mono tabular-nums">
              {formatMs(examDurationMs)}
            </span>
          </p>
        )}
        <p className="text-sm text-gray-500 mb-6">
          {examLabel} · Eksamen
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate(retryPath)}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Start på nytt
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Tilbake til hjem
          </button>
        </div>
      </div>
    )
  } else {
    verdictCard = (
      <div
        className={`bg-amber-50 border border-amber-200 rounded-xl shadow-md p-8 text-center mb-6 ${fadeClass}`}
      >
        <div className="flex justify-center mb-4">
          <AlertCircleIcon
            className="w-20 h-20 text-amber-600"
            strokeWidth={2.2}
          />
        </div>
        <h1
          role="status"
          className="text-3xl font-bold text-gray-800 mb-2 tracking-wide"
        >
          Ikke bestått
        </h1>
        <p className="text-gray-700 text-base mb-5">
          Du trenger {passThreshold} av {totalQuestions} for å bestå. Ikke gi
          opp — prøv igjen!
        </p>
        <p className="text-lg text-gray-800 mb-1">
          <span className="font-mono tabular-nums font-semibold">
            {correctCount} / {totalQuestions}
          </span>{' '}
          riktige ·{' '}
          <span className="font-mono tabular-nums">{percentage}%</span>
        </p>
        {timeUsedMs !== null && timeUsedMs !== undefined && (
          <p className="text-sm text-gray-600 mb-1">
            Tid brukt:{' '}
            <span className="font-mono tabular-nums">
              {formatMs(timeUsedMs)}
            </span>{' '}
            av{' '}
            <span className="font-mono tabular-nums">
              {formatMs(examDurationMs)}
            </span>
          </p>
        )}
        <p className="text-sm text-gray-500 mb-4">
          {examLabel} · Eksamen
        </p>
        <p className="text-sm text-gray-700 italic mb-6">
          Du var nær — gå gjennom svarene og prøv på nytt.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate(retryPath)}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Start på nytt
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Tilbake til hjem
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="max-w-lg mx-auto py-8">
        {verdictCard}

        {/* Answer review toggle — same for every mode, because learning
            from mistakes is valuable no matter what brought you here. */}
        <div className="mb-6">
          <button
            onClick={() => setShowAllAnswers(!showAllAnswers)}
            className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {showAllAnswers ? 'Skjul alle svar' : 'Se alle svar'}
          </button>
        </div>

        {/* Wrong answers (default view) */}
        {wrongAnswers.length > 0 && !showAllAnswers && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Feil svar ({wrongAnswers.length})
            </h2>
            <div className="space-y-4">{wrongAnswers.map(renderAnswerCard)}</div>
          </div>
        )}

        {/* All answers (toggle view) */}
        {showAllAnswers && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Alle svar</h2>
            <div className="space-y-4">{allResults.map(renderAnswerCard)}</div>
          </div>
        )}
      </div>
    </div>
  )
}
