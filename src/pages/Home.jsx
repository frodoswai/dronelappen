import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DroneLogo from '../components/DroneLogo'
import {
  getLastSession,
  describeSession,
  sessionToPath,
} from '../lib/sessionHistory'

export default function Home() {
  const navigate = useNavigate()
  const [resume, setResume] = useState(null)

  // Read smart-resume state on mount. Stale entries (> 14 days) return null
  // so the button stays hidden when the app hasn't been used in a while.
  useEffect(() => {
    setResume(getLastSession())
  }, [])

  const exams = [
    { id: 'A1_A3', name: 'A1/A3' },
    { id: 'A2', name: 'A2' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="max-w-lg mx-auto pt-10 pb-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-blue-900 mb-3 flex items-center justify-center gap-3">
            <DroneLogo className="w-10 h-10" />
            <span>DroneLappen</span>
          </h1>
          <p className="text-gray-600 text-lg">Bli en bedre dronepilot</p>
        </div>

        {/* Smart resume (hidden unless a fresh last session exists) */}
        {resume && (
          <button
            onClick={() => navigate(sessionToPath(resume))}
            className="quiz-option w-full mb-6 bg-white border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-900 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden="true">↻</span>
              <span>Fortsett: {describeSession(resume)}</span>
            </span>
            <span aria-hidden="true">→</span>
          </button>
        )}

        {/* Exam cards — step 1 of the two-step flow. Tapping opens the mode
            picker at /exam/:examType, not a quiz directly. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {exams.map((exam) => (
            <button
              key={exam.id}
              onClick={() => navigate(`/exam/${exam.id}`)}
              className="quiz-option group bg-white hover:bg-blue-50 rounded-xl shadow-md hover:shadow-lg border-2 border-blue-100 hover:border-blue-400 p-8 flex flex-col items-center justify-center min-h-[140px] transition-all"
            >
              <span className="text-3xl font-bold text-blue-900 mb-1">
                {exam.name}
              </span>
              <span className="text-sm text-gray-500 group-hover:text-blue-700 transition-colors">
                Velg modus →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
