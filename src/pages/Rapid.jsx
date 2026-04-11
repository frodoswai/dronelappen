import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, fetchQuestions } from '../lib/supabase'
import QuizLayout from '../components/QuizLayout'
import CrosshairMarks from '../components/CrosshairMarks'

// Easy to tweak at the top of the file:
const CORRECT_FLASH_MS = 400
const WRONG_PAUSE_MS = 2500
const RAPID_SESSION_SIZE = 30

// Fisher-Yates shuffle
function shuffleArray(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Round 3: Tempo mode. Shares QuizLayout and the question-card styling
// with Quiz, but keeps its own inline finish screen because Rapid isn't
// a pass/fail exam — it's a stopwatch achievement with score-aware copy
// and a `handleStop` early-exit path that Results.jsx doesn't understand.
export default function Rapid() {
  const { examType } = useParams()
  const navigate = useNavigate()

  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [feedback, setFeedback] = useState(null) // 'correct' | 'wrong' | null
  const [correctCount, setCorrectCount] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Count-up timer — Rapid is about speed, not time pressure, so we show
  // ⏱ MM:SS counting up from 0 and highlight total time on the finish
  // screen. Same wall-clock anchor as exam mode, using Date.now() deltas so
  // tab-blur can't cheat the stopwatch.
  const [startTime, setStartTime] = useState(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [finalElapsedMs, setFinalElapsedMs] = useState(null)

  // Track pending timers so we can clean them up on unmount / stop
  const timerRef = useRef(null)

  // One-shot fade-in for the finish screen. No confetti, no bouncing.
  const [rapidMounted, setRapidMounted] = useState(false)
  useEffect(() => {
    if (!finished) return
    const id = requestAnimationFrame(() => setRapidMounted(true))
    return () => cancelAnimationFrame(id)
  }, [finished])

  // Short label used by the header and the finish screen. Computed up
  // front so it's in scope before the early-return finish block.
  const poolLabel = examType === 'A1_A3' ? 'A1/A3' : 'A2'

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const { questions: data } = await fetchQuestions({ examType })

        // Shuffle the pool, cap the session at RAPID_SESSION_SIZE,
        // then shuffle each question's options independently.
        const sessionQuestions = shuffleArray(data || [])
          .slice(0, RAPID_SESSION_SIZE)
          .map((q) => ({
            ...q,
            options: shuffleArray(q.options),
          }))
        setQuestions(sessionQuestions)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching questions:', err)
        setError('Feil ved lasting av spørsmål')
        setLoading(false)
      }
    }
    loadQuestions()
  }, [examType])

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // Start the stopwatch once questions are loaded — not during fetch, so
  // a slow network doesn't pad the user's apparent time.
  useEffect(() => {
    if (loading || startTime !== null) return
    setStartTime(Date.now())
  }, [loading, startTime])

  // Wall-clock tick for the MM:SS display. 250ms keeps the seconds digit
  // crisp without wasting battery. Stops the moment `finished` flips true
  // so the displayed total freezes at its final value.
  useEffect(() => {
    if (startTime === null || finished) return
    const tick = () => setElapsedMs(Date.now() - startTime)
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [startTime, finished])

  const finishWithFinalTime = () => {
    // Capture the stopwatch at the exact moment the session ends so the
    // finish screen shows a stable number instead of whatever the interval
    // last rendered.
    if (startTime !== null) {
      setFinalElapsedMs(Date.now() - startTime)
    }
    setFinished(true)
  }

  const advance = () => {
    timerRef.current = null
    setSelectedAnswer(null)
    setFeedback(null)
    setCurrentIndex((idx) => {
      const next = idx + 1
      if (next >= questions.length) {
        finishWithFinalTime()
        return idx
      }
      return next
    })
  }

  const currentQuestion = questions[currentIndex]

  const getOptionText = (question, optionId) => {
    if (!question) return ''
    const opt = question.options.find((o) => o.id === optionId)
    return opt ? opt.text : optionId
  }

  const handleSelectAnswer = (optionId) => {
    if (selectedAnswer !== null || !currentQuestion) return
    const wasCorrect = optionId === currentQuestion.correct_option_id

    // Blur the tapped button so its :focus/:hover style does not leak
    // onto the next question's button at the same screen position
    // when we auto-advance — users read leftover focus as a hint.
    if (typeof document !== 'undefined' && document.activeElement?.blur) {
      document.activeElement.blur()
    }

    setSelectedAnswer(optionId)
    setFeedback(wasCorrect ? 'correct' : 'wrong')
    setAnsweredCount((c) => c + 1)
    if (wasCorrect) setCorrectCount((c) => c + 1)

    // Fire-and-forget analytics — never block the flow on this.
    try {
      supabase
        .rpc('log_question_answer', {
          p_question_id: currentQuestion.id,
          p_was_correct: wasCorrect,
        })
        .then(() => {})
        .catch(() => {})
    } catch (_) { /* swallow */ }

    const delay = wasCorrect ? CORRECT_FLASH_MS : WRONG_PAUSE_MS
    timerRef.current = setTimeout(advance, delay)
  }

  const handleStop = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    finishWithFinalTime()
  }

  // MM:SS formatter shared by header stopwatch and finish screen.
  const formatMs = (ms) => {
    if (ms === null || ms === undefined) return '0:00'
    const totalSec = Math.floor(ms / 1000)
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-da-navy-dark flex items-center justify-center p-4">
        <p className="font-mono text-[12px] tracking-[0.1em] text-da-dark-slogan">
          laster spørsmål…
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-da-bg flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-700 text-base mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="quiz-option bg-da-navy text-da-bg font-medium py-3 px-6 rounded-lg"
          >
            Tilbake til hjem
          </button>
        </div>
      </div>
    )
  }

  // ═══ Finish screen ═══
  // Rebuilt Round 3 with the same dark hero + stats card pattern as
  // Results.jsx. Rapid has its own finish screen (not /results) because
  // the score-aware copy and handleStop early-exit don't fit the Results
  // state shape.
  if (finished || !currentQuestion) {
    const pct =
      answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0
    const displayMs = finalElapsedMs ?? elapsedMs
    // Score-aware headline — Rapid isn't pass/fail, it's a personal
    // achievement. Copy gets warmer as the score climbs.
    const isPerfect = answeredCount > 0 && correctCount === answeredCount
    let headline
    let moodLabel
    if (isPerfect) {
      headline = 'Perfekt løp'
      moodLabel = 'uten feil'
    } else if (pct >= 90) {
      headline = 'Sterkt tempo'
      moodLabel = 'nesten uten feil'
    } else if (pct >= 75) {
      headline = 'Bra jobba'
      moodLabel = 'solid innsats'
    } else {
      headline = 'Fortsett å øve'
      moodLabel = 'hver runde teller'
    }

    const fadeClass = `transition-all duration-500 ${
      rapidMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
    }`

    return (
      <div className="min-h-screen bg-da-bg flex flex-col">
        {/* ═══ Dark hero ═══ */}
        <div className="bg-da-navy-dark px-6 pt-3 pb-5">
          <div className="pt-8">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[12px] font-medium text-da-gold tracking-[0.12em]">
                tempo · {poolLabel}
              </span>
            </div>
            <h1
              role="status"
              className="text-[32px] font-medium text-da-bg leading-none tracking-tight mb-1"
            >
              {headline}
            </h1>
            <p className="font-serif italic text-sm text-da-dark-slogan">
              {moodLabel}
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
            {/* Stats card — hero time front and center, crosshair marks
                to echo the ExamSelect Tempo card accent. */}
            <div
              className={`relative bg-white border-[0.5px] border-da-gold rounded-lg px-6 pt-6 pb-5 mb-4 ${fadeClass}`}
            >
              <CrosshairMarks variant="gold" />

              <div className="font-mono text-[11px] font-medium text-da-gold tracking-[0.12em] text-center mb-2">
                tid
              </div>
              <div className="text-[48px] font-medium font-mono tabular-nums text-da-navy leading-none text-center mb-3 tracking-tight">
                {formatMs(displayMs)}
              </div>
              <div className="text-center mb-4">
                <span className="font-mono text-[12px] text-da-text-muted tracking-wide">
                  på {answeredCount}{' '}
                  {answeredCount === 1 ? 'spørsmål' : 'spørsmål'}
                </span>
              </div>

              {/* Divider */}
              <div className="h-px bg-da-navy/15 mb-4" />

              {/* Secondary stats — riktige + prosent */}
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="font-mono text-[10px] text-da-text-muted tracking-[0.1em] uppercase mb-0.5">
                    riktige
                  </div>
                  <div className="font-mono text-[20px] font-semibold text-da-navy tabular-nums">
                    {correctCount}/{answeredCount}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[10px] text-da-text-muted tracking-[0.1em] uppercase mb-0.5">
                    score
                  </div>
                  <div className="font-mono text-[20px] font-semibold text-da-gold tabular-nums">
                    {pct}%
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons — navy primary, white secondary */}
            <div className="space-y-2.5">
              <button
                onClick={() => navigate(`/exam/${examType}`)}
                className="quiz-option w-full bg-da-navy hover:bg-da-navy-mid text-da-bg font-medium py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>Nytt løp</span>
                <span className="font-mono text-[12px] text-da-gold">→</span>
              </button>
              <button
                onClick={() => navigate('/')}
                className="quiz-option w-full bg-white border-[0.5px] border-da-navy/30 hover:border-da-navy/60 text-da-navy font-medium py-3.5 px-4 rounded-lg transition-colors"
              >
                Tilbake til hjem
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F']
  const isAnswered = selectedAnswer !== null

  // Background flash on correct/wrong — kept subtle against the da-bg
  // light zone. Wrong uses amber (never harsh red) to stay on-palette.
  const bgFlash =
    feedback === 'correct'
      ? '!bg-green-50'
      : feedback === 'wrong'
      ? '!bg-amber-50'
      : null

  const headerStats = `${correctCount}/${answeredCount} riktige`

  return (
    <QuizLayout
      mode="tempo"
      examType={examType}
      progress={{ current: currentIndex + 1, total: questions.length }}
      stats={headerStats}
      timer={`⏱ ${formatMs(elapsedMs)}`}
      onStop={handleStop}
      flashBg={bgFlash}
    >
      {/* ═══ Question card ═══ */}
      <div className="bg-white border-[0.5px] border-da-navy/30 rounded-lg p-5">
        <h2 className="text-[15px] font-medium text-da-navy mb-4 leading-[1.45]">
          {currentQuestion.question_text}
        </h2>

        <div className="space-y-2.5">
          {currentQuestion.options.map((option, idx) => {
            const optLabel = optionLabels[idx] || option.id.toUpperCase()
            const isSelected = selectedAnswer === option.id
            const isCorrectOpt =
              option.id === currentQuestion.correct_option_id

            let btnClass =
              'quiz-option w-full text-left rounded-lg border-[0.5px] px-4 py-3 transition-all flex items-start gap-3 '

            if (!isAnswered) {
              btnClass +=
                'bg-white border-da-navy/30 hover:border-da-navy/60 hover:bg-da-cream/20 text-da-navy cursor-pointer'
            } else if (isCorrectOpt) {
              btnClass += 'bg-green-50 border-green-500 text-da-navy'
            } else if (isSelected && !isCorrectOpt) {
              btnClass += 'bg-amber-50 border-amber-500 text-da-navy'
            } else {
              btnClass +=
                'bg-white border-da-navy/15 text-da-text-dim opacity-50'
            }

            // Composite key forces React to unmount/remount the button
            // when the question changes — clears any browser-tracked
            // :hover / tap-highlight state from the previous question.
            return (
              <button
                key={`${currentIndex}-${option.id}`}
                onClick={() => handleSelectAnswer(option.id)}
                disabled={isAnswered}
                className={btnClass}
              >
                <span className="font-mono text-[13px] font-semibold text-da-gold tracking-wide shrink-0 pt-[1px]">
                  {optLabel}
                </span>
                <span className="text-[14px] leading-[1.45]">{option.text}</span>
              </button>
            )
          })}
        </div>

        {/* Wrong-answer feedback line — shown during the 2.5s pause so
            the user has a chance to register what the right answer was. */}
        {feedback === 'wrong' && (
          <div className="mt-4 bg-da-cream/40 border-[0.5px] border-da-gold/40 border-l-2 border-l-da-gold rounded px-4 py-2.5">
            <p className="font-mono text-[11px] font-semibold tracking-[0.1em] text-amber-700 mb-1">
              ✗ feil
            </p>
            <p className="text-[12.5px] text-da-text-body leading-[1.5]">
              <span className="font-medium text-da-navy">Riktig svar:</span>{' '}
              {getOptionText(currentQuestion, currentQuestion.correct_option_id)}
            </p>
          </div>
        )}
      </div>
    </QuizLayout>
  )
}
