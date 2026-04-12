import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase, fetchQuestions } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import QuizLayout from '../components/QuizLayout'

// Exam mode wall-clock budget. Using a constant keeps the display/fix and
// handleTimeUp math in sync.
const EXAM_DURATION_MS = 60 * 60 * 1000 // 60 min
const LOW_TIME_MS = 5 * 60 * 1000

// Fisher-Yates shuffle
function shuffleArray(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Round 3: this page handles both Eksamen (/quiz/:examType) and Læring
// (/practice/:examType). The two modes share question fetching, option
// shuffling, wall-clock timer (Eksamen only), and analytics logging —
// they diverge only in header label, pass/fail context, and whether the
// explanation card appears after each answer.
export default function Quiz() {
  const { examType } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const { user } = useAuth()

  const isPracticeMode = location.pathname.includes('practice')
  const needsTimer = examType === 'A2' && !isPracticeMode

  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)
  // Wall-clock anchored timer state. `startTime` is set once after the
  // questions load so network latency doesn't eat into the exam budget.
  // `remainingMs` is derived from Date.now() on every tick, so tab-blur
  // (which throttles setInterval) can't pause the countdown.
  const [startTime, setStartTime] = useState(null)
  const [remainingMs, setRemainingMs] = useState(needsTimer ? EXAM_DURATION_MS : null)
  const [quizComplete, setQuizComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch questions on mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const { questions: data } = await fetchQuestions({ examType })

        // Shuffle question order, then shuffle each question's options
        const shuffled = shuffleArray(data || [])
        const selected = shuffled.slice(0, 30).map(q => ({
          ...q,
          options: shuffleArray(q.options)
        }))
        setQuestions(selected)
        setAnswers(new Array(selected.length).fill(null))
        setLoading(false)
      } catch (err) {
        console.error('Error fetching questions:', err)
        setError('Feil ved lasting av spørsmål')
        setLoading(false)
      }
    }
    loadQuestions()
  }, [examType])

  // Anchor the wall-clock timer once questions are loaded.
  useEffect(() => {
    if (!needsTimer || loading || startTime !== null) return
    setStartTime(Date.now())
  }, [needsTimer, loading, startTime])

  // Wall-clock tick — recomputes remainingMs from Date.now() on every pass,
  // so the countdown is correct after tab-blur / backgrounding / throttling.
  // 250ms interval keeps the MM:SS display snappy without burning battery.
  useEffect(() => {
    if (!needsTimer || startTime === null || quizComplete) return
    const tick = () => {
      const left = Math.max(0, EXAM_DURATION_MS - (Date.now() - startTime))
      setRemainingMs(left)
      if (left <= 0) setQuizComplete(true)
    }
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [needsTimer, startTime, quizComplete])

  // Helper: find option text by id
  const getOptionText = (question, optionId) => {
    const opt = question.options.find(o => o.id === optionId)
    return opt ? opt.text : optionId
  }

  // Loading — match the Round 2 dark-hero language instead of a bare
  // white flash.
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

  if (quizComplete) {
    // Save quiz session for logged-in users (fire-and-forget).
    if (user && questions.length > 0) {
      const correctTotal = answers.filter(
        (ans, idx) => ans && questions[idx] && ans === questions[idx].correct_option_id
      ).length
      supabase
        .from('quiz_sessions')
        .insert({
          user_id: user.id,
          exam_type: examType,
          completed_at: new Date().toISOString(),
          score: correctTotal,
          total_questions: questions.length,
        })
        .then(() => {})
        .catch(() => {})
    }

    // A2 Eksamen is the only mode with a wall-clock timer, so it's the
    // only mode that reports time used. Compute from startTime to capture
    // the actual elapsed value even if the user finished early.
    const timeUsedMs =
      needsTimer && startTime !== null
        ? Math.min(EXAM_DURATION_MS, Date.now() - startTime)
        : null
    navigate('/results', {
      state: {
        questions,
        answers,
        isPracticeMode,
        examType,
        timeUsedMs,
        examDurationMs: needsTimer ? EXAM_DURATION_MS : null,
      },
    })
    return null
  }

  const currentQuestion = questions[currentIndex]
  if (!currentQuestion) return null
  const isAnswered = selectedAnswer !== null
  const isCorrect = selectedAnswer === currentQuestion.correct_option_id

  const handleSelectAnswer = (optionId) => {
    if (isAnswered) return
    // Blur the tapped button so its :focus/:hover style does not leak
    // onto the next question's button at the same screen position.
    if (typeof document !== 'undefined' && document.activeElement?.blur) {
      document.activeElement.blur()
    }
    setSelectedAnswer(optionId)
    setShowExplanation(true)
    const newAnswers = [...answers]
    newAnswers[currentIndex] = optionId
    setAnswers(newAnswers)
    // Fire-and-forget analytics: anonymous per-question stats, no user data.
    // Failures must never block the quiz.
    try {
      supabase
        .rpc('log_question_answer', {
          p_question_id: currentQuestion.id,
          p_was_correct: optionId === currentQuestion.correct_option_id,
        })
        .then(() => {})
        .catch(() => {})
    } catch (_) { /* swallow */ }

    // Save per-question progress for logged-in users (fire-and-forget).
    if (user) {
      try {
        supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            question_id: currentQuestion.id,
            correct: optionId === currentQuestion.correct_option_id,
          })
          .then(() => {})
          .catch(() => {})
      } catch (_) { /* swallow */ }
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    } else {
      setQuizComplete(true)
    }
  }

  const formatMs = (ms) => {
    if (ms === null || ms === undefined) return ''
    const totalSec = Math.floor(ms / 1000)
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const correctCount = answers.slice(0, currentIndex + (isAnswered ? 1 : 0)).filter(
    (ans, idx) => ans && questions[idx] && ans === questions[idx].correct_option_id
  ).length

  // Dynamic labels based on shuffled position (A, B, C, D...)
  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F']

  // QuizLayout props
  const answeredSoFar = currentIndex + (isAnswered ? 1 : 0)
  const layoutMode = isPracticeMode ? 'laering' : 'eksamen'
  const layoutStats = isPracticeMode && answeredSoFar > 0
    ? `${correctCount}/${answeredSoFar} riktige`
    : null
  const layoutTimer = needsTimer && remainingMs !== null ? formatMs(remainingMs) : null
  const timerUrgent = needsTimer && remainingMs !== null && remainingMs <= LOW_TIME_MS

  return (
    <QuizLayout
      mode={layoutMode}
      examType={examType}
      progress={{ current: currentIndex + 1, total: questions.length }}
      stats={layoutStats}
      timer={layoutTimer}
      timerUrgent={timerUrgent}
    >
      {/* ═══ Question card ═══
          Round 3: white surface, 0.5px navy hairline border, no shadow.
          Matches the quiet-but-precise HUD aesthetic from Home/ExamSelect. */}
      <div className="bg-white border-[0.5px] border-da-navy/30 rounded-lg p-5 mb-4">
        <h2 className="text-[15px] font-medium text-da-navy mb-4 leading-[1.45]">
          {currentQuestion.question_text}
        </h2>

        {/* Options — rendered in shuffled order with positional labels */}
        <div className="space-y-2.5">
          {currentQuestion.options.map((option, idx) => {
            const optLabel = optionLabels[idx] || option.id.toUpperCase()
            const isSelected = selectedAnswer === option.id
            const isCorrectOpt = option.id === currentQuestion.correct_option_id

            // Round 3 state palette:
            //   idle     → white / navy hairline
            //   correct  → green tint, green border
            //   wrong    → amber tint, amber border (never harsh red)
            //   dim      → 50% opacity on non-chosen options after answer
            let btnClass =
              'quiz-option w-full text-left rounded-lg border-[0.5px] px-4 py-3 transition-all flex items-start gap-3 '

            if (!isAnswered) {
              btnClass +=
                'bg-white border-da-navy/30 hover:border-da-navy/60 hover:bg-da-cream/20 text-da-navy cursor-pointer'
            } else if (isCorrectOpt) {
              btnClass +=
                'bg-green-50 border-green-500 text-da-navy'
            } else if (isSelected && !isCorrectOpt) {
              btnClass +=
                'bg-amber-50 border-amber-500 text-da-navy'
            } else {
              btnClass +=
                'bg-white border-da-navy/15 text-da-text-dim opacity-50'
            }

            // Composite key forces React to unmount/remount per question,
            // clearing any browser-tracked :hover / tap-highlight state.
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

        {/* Explanation — shown after each answer in Læring, after each in
            Eksamen too (unchanged behavior). Cream tint + gold accent bar
            keeps it distinct from the correct/wrong answer buttons above. */}
        {showExplanation && (
          <div className="mt-4 bg-da-cream/40 border-[0.5px] border-da-gold/40 border-l-2 border-l-da-gold rounded px-4 py-3">
            <p
              className={`font-mono text-[11px] font-semibold tracking-[0.1em] mb-1.5 ${
                isCorrect ? 'text-green-700' : 'text-amber-700'
              }`}
            >
              {isCorrect ? '✓ riktig' : '✗ feil'}
            </p>
            {!isCorrect && (
              <p className="text-[12.5px] text-da-text-body mb-1.5 leading-[1.5]">
                <span className="font-medium text-da-navy">Riktig svar:</span>{' '}
                {getOptionText(currentQuestion, currentQuestion.correct_option_id)}
              </p>
            )}
            <p className="text-[12.5px] text-da-text-body leading-[1.5]">
              {currentQuestion.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Next / finish button — shows only after answer committed */}
      {isAnswered && (
        <button
          onClick={handleNext}
          className="quiz-option w-full bg-da-navy hover:bg-da-navy-mid text-da-bg font-medium py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>
            {currentIndex < questions.length - 1 ? 'Neste' : 'Se resultater'}
          </span>
          <span className="font-mono text-[12px] text-da-gold">→</span>
        </button>
      )}
    </QuizLayout>
  )
}
