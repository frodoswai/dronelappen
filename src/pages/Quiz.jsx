import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import QuizLayout from '../components/QuizLayout'

// Exam mode wall-clock budget. Using a constant keeps the display/fix and
// handleTimeUp math in sync.
const EXAM_DURATION_MS = 60 * 60 * 1000 // 60 min

// Fisher-Yates shuffle
function shuffleArray(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function Quiz() {
  const { examType } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

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
    const fetchQuestions = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_type', examType)

        if (fetchError) throw fetchError

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
    fetchQuestions()
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
          <button onClick={() => navigate('/')} className="mt-4 bg-blue-900 text-white px-6 py-2 rounded-lg">
            Tilbake til hjem
          </button>
        </div>
      </div>
    )
  }

  if (quizComplete) {
    navigate('/results', { state: { questions, answers, isPracticeMode, examType } })
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

  // Compact one-line header: mode · progress · (timer | practice score)
  const modeLabel = isPracticeMode ? 'Øv' : 'Eksamen'
  const progressLabel = `Spørsmål ${currentIndex + 1}/${questions.length}`
  const answeredSoFar = currentIndex + (isAnswered ? 1 : 0)

  const header = (
    <>
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span className="truncate">
          {modeLabel} · {progressLabel}
          {isPracticeMode && ` · ${correctCount}/${answeredSoFar} riktige`}
        </span>
        {needsTimer && (
          <span className={`font-semibold tabular-nums ${remainingMs !== null && remainingMs <= 5 * 60 * 1000 ? 'text-red-600' : 'text-gray-700'}`}>
            {formatMs(remainingMs)}
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
        <div
          className="bg-blue-900 h-1 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>
    </>
  )

  return (
    <QuizLayout header={header}>
      {/* Question card — tightened padding */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-3">
        <h2 className="text-base font-semibold text-gray-800 mb-4 leading-snug">
          {currentQuestion.question_text}
        </h2>

        {/* Options — rendered in shuffled order with positional labels */}
        <div className="space-y-2 mb-2">
          {currentQuestion.options.map((option, idx) => {
            const optLabel = optionLabels[idx] || option.id.toUpperCase()
            const isSelected = selectedAnswer === option.id
            const isCorrectOpt = option.id === currentQuestion.correct_option_id

            let btnClass = 'quiz-option w-full p-3 text-left rounded-lg border-2 font-medium transition-all '

            if (!isAnswered) {
              btnClass += 'border-blue-300 bg-white hover:bg-blue-50 text-gray-800 cursor-pointer'
            } else if (isCorrectOpt) {
              btnClass += 'border-green-500 bg-green-50 text-gray-800'
            } else if (isSelected && !isCorrectOpt) {
              btnClass += 'border-red-500 bg-red-50 text-gray-800'
            } else {
              btnClass += 'border-gray-300 bg-gray-50 text-gray-800'
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
                <span className="font-bold mr-3">{optLabel}.</span>
                {option.text}
              </button>
            )
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-semibold text-amber-900 mb-1">
              {isCorrect ? '✓ Riktig svar' : '✗ Feil svar'}
            </p>
            <p className="text-gray-700 text-sm mb-1">
              <span className="font-semibold">Forklaring:</span>{' '}
              {currentQuestion.explanation}
            </p>
            <p className="text-gray-600 text-xs">
              <span className="font-semibold">Riktig svar:</span>{' '}
              {getOptionText(currentQuestion, currentQuestion.correct_option_id)}
            </p>
          </div>
        )}
      </div>

      {/* Next button */}
      {isAnswered && (
        <button
          onClick={handleNext}
          className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          {currentIndex < questions.length - 1 ? 'Neste' : 'Se resultater'}
        </button>
      )}
    </QuizLayout>
  )
}
