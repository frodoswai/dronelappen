import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import QuizLayout from '../components/QuizLayout'

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

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_type', examType)

        if (fetchError) throw fetchError

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
    fetchQuestions()
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-600 text-lg">Laster spørsmål...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
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

  if (finished || !currentQuestion) {
    const pct =
      answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0
    const displayMs = finalElapsedMs ?? elapsedMs
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4">
        <div className="max-w-lg mx-auto py-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h1 className="text-2xl font-bold text-blue-900 mb-4">
              Rapid ferdig
            </h1>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-900 mb-1">Du brukte</p>
              <p className="text-4xl font-bold text-amber-700 tabular-nums">
                {formatMs(displayMs)}
              </p>
              <p className="text-sm text-amber-900 mt-1">
                på {answeredCount} spørsmål
              </p>
            </div>
            <p className="text-gray-700 text-lg mb-2">
              Riktige: <span className="font-semibold">{correctCount}</span> /{' '}
              {answeredCount}
            </p>
            <p className="text-gray-600 mb-6">{pct}% riktige</p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
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
        </div>
      </div>
    )
  }

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F']
  const isAnswered = selectedAnswer !== null

  // Background flash on correct/wrong
  const bgFlash =
    feedback === 'correct'
      ? 'bg-green-50'
      : feedback === 'wrong'
      ? 'bg-red-50'
      : null

  const poolLabel = examType === 'A1_A3' ? 'A1/A3' : 'A2'

  const header = (
    <div className="flex justify-between items-center text-sm text-gray-600 gap-2">
      <span className="truncate">
        Rapid — {poolLabel} · {correctCount}/{answeredCount} riktige ·{' '}
        {currentIndex + 1}/{questions.length}
      </span>
      <span className="flex items-center gap-2 shrink-0">
        <span
          className="font-semibold tabular-nums text-amber-700"
          aria-label="Tid brukt"
        >
          ⏱ {formatMs(elapsedMs)}
        </span>
        <button
          onClick={handleStop}
          className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-2 py-1 rounded transition-colors"
        >
          Stopp
        </button>
      </span>
    </div>
  )

  return (
    <QuizLayout header={header} flashBg={bgFlash}>
      {/* Question card — tightened padding */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-base font-semibold text-gray-800 mb-4 leading-snug">
          {currentQuestion.question_text}
        </h2>

        <div className="space-y-2">
          {currentQuestion.options.map((option, idx) => {
            const optLabel = optionLabels[idx] || option.id.toUpperCase()
            const isSelected = selectedAnswer === option.id
            const isCorrectOpt =
              option.id === currentQuestion.correct_option_id

            let btnClass =
              'quiz-option w-full p-3 text-left rounded-lg border-2 font-medium transition-all '

            if (!isAnswered) {
              btnClass +=
                'border-blue-300 bg-white hover:bg-blue-50 text-gray-800 cursor-pointer'
            } else if (isCorrectOpt) {
              btnClass += 'border-green-500 bg-green-100 text-gray-900'
            } else if (isSelected && !isCorrectOpt) {
              btnClass += 'border-red-500 bg-red-100 text-gray-900'
            } else {
              btnClass += 'border-gray-300 bg-gray-50 text-gray-800'
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
                <span className="font-bold mr-3">{optLabel}.</span>
                {option.text}
              </button>
            )
          })}
        </div>

        {/* Wrong-answer feedback line */}
        {feedback === 'wrong' && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-900 text-sm">
              <span className="font-semibold">Feil.</span> Riktig svar:{' '}
              {getOptionText(
                currentQuestion,
                currentQuestion.correct_option_id
              )}
            </p>
          </div>
        )}
      </div>
    </QuizLayout>
  )
}
