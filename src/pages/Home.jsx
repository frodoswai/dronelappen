import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [newsletterStatus, setNewsletterStatus] = useState(null) // 'success' | 'error' | 'duplicate'
  const [submitting, setSubmitting] = useState(false)

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    setNewsletterStatus(null)
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: email.trim().toLowerCase() })
      if (error) {
        if (error.code === '23505') {
          setNewsletterStatus('duplicate')
        } else {
          throw error
        }
      } else {
        setNewsletterStatus('success')
        setEmail('')
      }
    } catch (err) {
      console.error('Newsletter signup error:', err)
      setNewsletterStatus('error')
    } finally {
      setSubmitting(false)
    }
  }

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

        {/* Newsletter Signup */}
        <div className="mt-10 bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-900">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Hold deg oppdatert</h2>
          <p className="text-gray-600 text-sm mb-4">
            Få tips, nyheter og oppdateringer rett i innboksen.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex gap-3">
            <input
              type="email"
              required
              placeholder="din@epost.no"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-900 hover:bg-blue-800 text-white font-semibold px-5 py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? '...' : 'Meld deg på'}
            </button>
          </form>
          {newsletterStatus === 'success' && (
            <p className="mt-3 text-green-700 text-sm font-medium">Takk! Du er påmeldt.</p>
          )}
          {newsletterStatus === 'duplicate' && (
            <p className="mt-3 text-blue-700 text-sm font-medium">Du er allerede påmeldt!</p>
          )}
          {newsletterStatus === 'error' && (
            <p className="mt-3 text-red-600 text-sm font-medium">Noe gikk galt. Prøv igjen.</p>
          )}
        </div>
      </div>
    </div>
  )
}