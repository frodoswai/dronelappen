import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Results() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showAllAnswers, setShowAllAnswers] = useState(false)

  if (!location.state) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Ingen resultater tilgjengelig</p>
          <button onClick={() => navigate('/')}
            className="mt-4 bg-blue-900 text-white px-6 py-2 rounded-lg">
            Tilbake til hjem
          </button>
        </div>
      </div>
    )
  }

  const { questions, answers, isPracticeMode, examType } = location.state

  // Helper: find option text by id
  const getOptionText = (question, optionId) => {
    if (!optionId || !question?.options) return '—'
    const opt = question.options.find(o => o.id === optionId)
    return opt ? opt.text : optionId
  }

  const correctCount = answers.filter(
    (ans, idx) => ans && questions[idx] && ans === questions[idx].correct_option_id
  ).length

  const totalQuestions = questions.length
  const percentage = Math.round((correctCount / totalQuestions) * 100)
  const passed = percentage >= 75
  const passThreshold = Math.ceil(totalQuestions * 0.75)

  const allResults = answers.map((ans, idx) => ({
    index: idx,
    question: questions[idx],
    userAnswer: ans,
    isCorrect: ans === questions[idx].correct_option_id,
  }))
  const wrongAnswers = allResults.filter((item) => !item.isCorrect)

  const renderAnswerCard = (item) => (
    <div key={item.index}
      className={`bg-white rounded-lg shadow-md p-5 border-l-4 ${item.isCorrect ? 'border-green-500' : 'border-red-500'}`}>
      <p className="text-sm text-gray-500 mb-2">Spørsmål {item.index + 1}</p>
      <h3 className="font-semibold text-gray-800 mb-3">{item.question.question_text}</h3>

      <div className="mb-3 space-y-2">
        <div className={`rounded p-3 ${item.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-xs font-semibold mb-1 ${item.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {item.isCorrect ? '✓ Ditt svar:' : '✗ Ditt svar:'}
          </p>
          <p className="text-gray-800">{getOptionText(item.question, item.userAnswer)}</p>
        </div>

        {!item.isCorrect && (
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="text-xs text-green-700 font-semibold mb-1">Riktig svar:</p>
            <p className="text-gray-800">{getOptionText(item.question, item.question.correct_option_id)}</p>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded p-3">
        <p className="text-xs text-amber-900 font-semibold mb-1">Forklaring:</p>
        <p className="text-sm text-gray-700">{item.question.explanation}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="max-w-lg mx-auto py-8">
        {/* Score Section */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Resultater</h1>
          <p className="text-gray-500 text-base mb-4">
            {examType === 'A2' ? 'A2' : 'A1/A3'} {isPracticeMode ? 'Praksis' : 'Øvingseksamen'}
          </p>
          <p className="text-5xl font-bold text-blue-900 mb-2">{correctCount}/{totalQuestions}</p>
          <p className="text-gray-600 text-lg mb-4">Riktige svar</p>
          <p className="text-2xl font-semibold mb-6">{percentage}%</p>

          <div className={`rounded-lg p-4 mb-6 ${passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-xl font-bold ${passed ? 'text-green-700' : 'text-red-700'}`}>
              {passed ? '✓ Bestått!' : '✗ Ikke bestått'}
            </p>
            <p className={`text-sm mt-1 ${passed ? 'text-green-600' : 'text-red-600'}`}>
              Bestågrense er {passThreshold}/{totalQuestions} (75%)
            </p>
          </div>

          <div className="space-y-3">
            <button onClick={() => navigate('/')}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
              Prøv igjen
            </button>
            <button onClick={() => setShowAllAnswers(!showAllAnswers)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors">
              {showAllAnswers ? 'Skjul alle svar' : 'Se alle svar'}
            </button>
          </div>
        </div>

        {/* Wrong answers (default view) */}
        {wrongAnswers.length > 0 && !showAllAnswers && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Feil svar ({wrongAnswers.length})</h2>
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
