import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

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

  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [timeLeft, setTimeLeft] = useState(null)
  const [quizComplete, setQuizComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const timeLimit = examType === 'A2' && !isPracticeMode ? 3600 : null

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
        if (timeLimit) setTimeLeft(timeLimit)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching questions:', err)
        setError('Feil ved lasting av spørsmål')
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [examType, timeLimit])

  // Timer effect
  useEffect(() => {
    if (!timeLeft || timeLeft <= 0 || quizComplete || !timeLimit) return
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { setQuizComplete(true); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timeLeft, quizComplete, timeLimit])

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
    setSelectedAnswer(optionId)
    setShowExplanation(true)
    const newAnswers = [...answers]
    newAnswers[currentIndex] = optionId
    setAnswers(newAnswers)
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

  const formatTime = (seconds) => {
    if (!seconds) return ''
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const correctCount = answers.slice(0, currentIndex + (isAnswered ? 1 : 0)).filter(
    (ans, idx) => ans && questions[idx] && ans === questions[idx].correct_option_id
  ).length

  // Dynamic labels based on shuffled position (A, B, C, D...)
  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F']

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="max-w-lg mx-auto py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-semibold text-gray-700">
              Spørsmål {currentIndex + 1} av {questions.length}
            </span>
            {timeLimit && (
              <span className={`text-sm font-semibold ${timeLeft <= 300 ? 'text-red-600' : 'text-gray-700'}`}>
                {formatTime(timeLeft)}
              </span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-900 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
          </div>
        </div>

        {/* Practice mode score */}
        {isPracticeMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-center">
            <p className="text-blue-900 font-semibold">Riktige: {correctCount}/{currentIndex + (isAnswered ? 1 : 0)}</p>
          </div>
        )}

        {/* Question */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">
            {currentQuestion.question_text}
          </h2>

          {/* Options — rendered in shuffled order with positional labels */}
          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, idx) => {
              const optLabel = optionLabels[idx] || option.id.toUpperCase()
              const isSelected = selectedAnswer === option.id
              const isCorrectOpt = option.id === currentQuestion.correct_option_id

              let btnClass = 'w-full p-4 text-left rounded-lg border-2 font-medium transition-all '

              if (!isAnswered) {
                btnClass += 'border-blue-300 bg-white hover:bg-blue-50 text-gray-800 cursor-pointer'
              } else if (isCorrectOpt) {
                btnClass += 'border-green-500 bg-green-50 text-gray-800'
              } else if (isSelected && !isCorrectOpt) {
                btnClass += 'border-red-500 bg-red-50 text-gray-800'
              } else {
                btnClass += 'border-gray-300 bg-gray-50 text-gray-800'
              }

              return (
                <button key={option.id} onClick={() => handleSelectAnswer(option.id)}
                  disabled={isAnswered} className={btnClass}>
                  <span className="font-bold mr-3">{optLabel}.</span>
                  {option.text}
                </button>
              )
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-semibold text-amber-900 mb-2">
                {isCorrect ? '✓ Riktig svar' : '✗ Feil svar'}
              </p>
              <p className="text-gray-700 text-sm mb-2">
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
          <button onClick={handleNext}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
            {currentIndex < questions.length - 1 ? 'Neste' : 'Se resultater'}
          </button>
        )}
      </div>
    </div>
  )
}
