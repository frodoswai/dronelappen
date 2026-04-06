import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  const exams = [
    {
      id: 'A1_A3',
      name: 'A1/A3 Øvingseksamen',
      questions: 30,
      timeLimit: null,
      passThreshold: 75,
    },
    {
      id: 'A2',
      name: 'A2 Øvingseksamen',
      questions: 30,
      timeLimit: 60,
      passThreshold: 75,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="max-w-lg mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">
            DroneLappen ✈️
          </h1>
          <p className="text-gray-600 text-lg">Øv til droneeksamen</p>
        </div>

        {/* Exam Cards */}
        <div className="space-y-6">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-900"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {exam.name}
              </h2>

              {/* Info */}
              <div className="text-sm text-gray-600 space-y-2 mb-6">
                <div className="flex justify-between">
                  <span>Antall spørsmål:</span>
                  <span className="font-semibold">{exam.questions}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tid:</span>
                  <span className="font-semibold">
                    {exam.timeLimit ? `${exam.timeLimit} min` : 'Ingen tidsbegrensning'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Bestågrense:</span>
                  <span className="font-semibold">{exam.passThreshold}%</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/quiz/${exam.id}`)}
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Start eksamen
                </button>
                <button
                  onClick={() => navigate(`/practice/${exam.id}`)}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Øv fritt
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}