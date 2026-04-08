import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Easy to tweak at the top of the file:
const CORRECT_FLASH_MS = 400
const WRONG_PAUSE_MS = 2500

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

        const shuffled = shuffleArray(data || []).map((q) => ({
          ...q,
          options: shuffleArray(q.options),
        }))
        setQuestions(shuffled)
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

  const advance = () => {
    timerRef.current = null
    setSelectedAnswer(null)
    setFeedback(null)
    setCurrentIndex((idx) => {
      const next = idx + 1
      if (next >= questions.length) {
        setFinished(true)
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
    setFinished(true)
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
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4">
        <div className="max-w-lg mx-auto py-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h1 className="text-2xl font-bold text-blue-900 mb-4">
              Rapid ferdig
            </h1>
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
      : 'bg-gradient-to-b from-gray-50 to-white'

  return (
    <div className={`min-h-screen p-4 transition-colors duration-150 ${bgFlash}`}>
      <div className="max-w-lg mx-auto py-6">
        {/* Header — running score + Stop */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-semibold text-gray-700">
            Rapid — {examType === 'A1_A3' ? 'A1/A3' : 'A2'}
          </span>
          <button
            onClick={handleStop}
            className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-3 py-1 rounded-lg transition-colors"
          >
            Stopp
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-center">
          <p className="text-blue-900 font-semibold">
            Riktige: {correctCount} / {answeredCount}
          </p>
          <p className="text-blue-700 text-xs mt-1">
            Spørsmål {currentIndex + 1} av {questions.length}
          </p>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">
            {currentQuestion.question_text}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const optLabel = optionLabels[idx] || option.id.toUpperCase()
              const isSelected = selectedAnswer === option.id
              const isCorrectOpt =
                option.id === currentQuestion.correct_option_id

              let btnClass =
                'w-full p-4 text-left rounded-lg border-2 font-medium transition-all '

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

              return (
                <button
                  key={option.id}
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
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
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
      </div>
    </div>
  )
}
