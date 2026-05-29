import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const DISMISS_KEY = 'signup_prompt_dismissed'
const DISMISS_DAYS = 7

/**
 * Soft, dismissible signup prompt for anonymous users on the results screen.
 * Remembers dismissal in localStorage for 7 days.
 */
export default function SignupPrompt() {
  const { user, loading } = useAuth()

  // Whether the user dismissed the prompt within the last DISMISS_DAYS.
  // Read from localStorage once via lazy initializer (no effect needed), then
  // tracked in state so a dismiss tap hides it immediately.
  const [manuallyDismissed, setManuallyDismissed] = useState(() => {
    try {
      const stored = localStorage.getItem(DISMISS_KEY)
      if (!stored) return false
      const daysSince = (Date.now() - parseInt(stored, 10)) / (1000 * 60 * 60 * 24)
      return daysSince < DISMISS_DAYS
    } catch {
      return false
    }
  })

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setManuallyDismissed(true)
  }

  // Hide while auth resolves, for logged-in users, and after a recent dismissal.
  if (loading || user || manuallyDismissed) return null

  return (
    <div className="bg-da-cream/40 border-[0.5px] border-da-navy/20 border-l-2 border-l-da-gold rounded-lg px-5 py-4 mb-4 relative">
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-da-text-muted hover:text-da-navy transition-colors"
        aria-label="Lukk"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 2l10 10M12 2L2 12" />
        </svg>
      </button>

      <div className="font-mono text-[11px] font-medium text-da-gold tracking-[0.12em] mb-1.5">
        lagre fremgangen din
      </div>
      <p className="text-[13px] text-da-text-body leading-[1.5] mb-3 pr-6">
        Opprett en gratis konto for &aring; f&oslash;lge med p&aring; hvilke kategorier du mestrer
        og f&aring; tilbake historikken din neste gang du logger inn.
      </p>
      <div className="flex items-center gap-3">
        <Link
          to="/login"
          className="quiz-option bg-da-navy hover:bg-da-navy-mid text-da-bg font-medium py-2.5 px-5 rounded-lg transition-colors text-[13px] flex items-center gap-2"
        >
          <span>Opprett konto</span>
          <span className="font-mono text-[11px] text-da-gold">&rarr;</span>
        </Link>
        <button
          onClick={handleDismiss}
          className="font-mono text-[12px] text-da-text-muted hover:text-da-navy tracking-[0.05em] transition-colors"
        >
          Ikke n&aring;
        </button>
      </div>
    </div>
  )
}
