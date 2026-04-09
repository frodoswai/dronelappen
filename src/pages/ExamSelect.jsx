import { useParams, useNavigate } from 'react-router-dom'
import { recordSessionStart } from '../lib/sessionHistory'

// Step 2 of the two-step home flow. User picked an exam on Home, now picks
// a mode. This page is where sessions are actually recorded for smart
// resume — the tap that lands here is a browse intent, the tap that leaves
// is a commit.
export default function ExamSelect() {
  const { examType } = useParams()
  const navigate = useNavigate()

  const isA2 = examType === 'A2'
  const examLabel = isA2 ? 'A2' : 'A1/A3'
  const examTimeText = isA2
    ? '60 min'
    : 'ingen tid'

  const start = (mode, path) => {
    recordSessionStart(examType, mode)
    navigate(path)
  }

  const modes = [
    {
      id: 'exam',
      title: 'Eksamen',
      description: `Realistisk simulering. 30 spørsmål, ${examTimeText}, 75% for å bestå.`,
      className:
        'bg-white border-blue-900 hover:bg-blue-900 hover:text-white',
      accent: 'text-blue-900 group-hover:text-white',
      onClick: () => start('exam', `/quiz/${examType}`),
    },
    {
      id: 'practice',
      title: 'Øv fritt',
      description: 'Lær i ditt eget tempo. Forklaring etter hvert svar.',
      className:
        'bg-white border-gray-300 hover:bg-gray-100',
      accent: 'text-gray-800',
      onClick: () => start('practice', `/practice/${examType}`),
    },
    {
      id: 'rapid',
      title: 'Rapid ⚡',
      description: 'Test farten din. Riktig = videre, feil = lær og videre.',
      className:
        'bg-white border-amber-400 hover:bg-amber-50',
      accent: 'text-amber-600',
      onClick: () => start('rapid', `/rapid/${examType}`),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="max-w-lg mx-auto pt-6 pb-8">
        {/* Back + exam label */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate('/')}
            aria-label="Tilbake"
            className="quiz-option text-blue-900 hover:text-blue-700 font-semibold text-2xl leading-none w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold text-blue-900">{examLabel}</h1>
        </div>

        {/* Mode cards */}
        <div className="space-y-4">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={m.onClick}
              className={`quiz-option group w-full text-left rounded-xl shadow-md border-2 p-5 transition-all ${m.className}`}
            >
              <div className={`text-xl font-bold mb-1 ${m.accent} transition-colors`}>
                {m.title}
              </div>
              <div className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                {m.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
