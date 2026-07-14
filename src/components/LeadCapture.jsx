import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Lead-magnet email capture shown to anonymous users at the two highest-intent
// moments: the Results screen (just finished a free round) and the Paywall exit
// ("not ready to buy"). Posts to the newsletter-signup Edge Function with
// source='quiz_*', which routes the email to the "DroneLappen leads" MailerLite
// group (separate from Droneavisa news) for an exam-focused nurture.
//
// Only shown to anonymous visitors — logged-in users already have an email on
// file, so re-asking is noise. Mirrors NewsletterSignup's request contract and
// SignupPrompt's 7-day localStorage dismissal.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newsletter-signup`
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY
const DISMISS_KEY = 'lead_capture_dismissed'
const DISMISS_DAYS = 7

// status: 'idle' | 'sending' | 'success' | 'duplicate' | 'error'
export default function LeadCapture({ source = 'quiz', dismissible = true }) {
  const { user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
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
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // localStorage unavailable (private mode) — dismiss for this view only.
    }
    setManuallyDismissed(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const value = email.trim().toLowerCase()
    if (!EMAIL_RE.test(value)) {
      setErrorMsg('Skriv inn en gyldig e-postadresse.')
      setStatus('error')
      return
    }

    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          apikey: ANON,
          Authorization: `Bearer ${ANON}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: value, source }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.status === 'ok') {
        // Meta funnel event so lead capture is countable alongside
        // InitiateCheckout (jf. Home/Paywall instrumentation).
        if (!data.duplicate) window.fbq?.('track', 'Lead', { content_name: source })
        setStatus(data.duplicate ? 'duplicate' : 'success')
        if (!data.duplicate) setEmail('')
      } else {
        setErrorMsg(data.message || 'Noe gikk galt. Prøv igjen senere.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Noe gikk galt. Prøv igjen senere.')
      setStatus('error')
    }
  }

  // Hide while auth resolves and for logged-in users. Only honour a recent
  // dismissal on dismissible instances (Results); the Paywall exit offer
  // (dismissible=false) always shows so it stays a real alternative to buying.
  if (loading || user || (dismissible && manuallyDismissed)) return null

  const sending = status === 'sending'

  return (
    <div className="bg-da-cream/40 border-[0.5px] border-da-navy/20 border-l-2 border-l-da-gold rounded-lg px-5 py-4 mb-4 relative">
      {dismissible && status !== 'success' && status !== 'duplicate' && (
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-da-text-muted hover:text-da-navy transition-colors"
          aria-label="Lukk"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        </button>
      )}

      <div className="font-mono text-[11px] font-medium text-da-gold tracking-[0.12em] mb-1.5">
        gratis øvingsplan
      </div>

      {status === 'success' ? (
        <p role="status" className="text-[13px] font-medium text-green-700 leading-[1.5]">
          Takk! Øvingsplanen er på vei — sjekk innboksen din om et par minutter.
        </p>
      ) : status === 'duplicate' ? (
        <p role="status" className="text-[13px] font-medium text-da-navy leading-[1.5]">
          Du er allerede på lista — planen ligger i innboksen din. Takk!
        </p>
      ) : (
        <>
          <p className="text-[13px] text-da-text-body leading-[1.5] mb-3 pr-6">
            Få en gratis øvingsplan og de viktigste eksamenstipsene rett i
            innboksen — så du består på første forsøk.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="din@epost.no"
              aria-label="E-postadresse"
              disabled={sending}
              className="flex-1 bg-white border-[0.5px] border-da-navy/30 focus:border-da-navy/60 outline-none rounded-lg px-4 py-2.5 text-[14px] text-da-navy placeholder:text-da-text-muted transition-colors disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending}
              className="quiz-option bg-da-navy hover:bg-da-navy-mid text-da-bg font-medium py-2.5 px-5 rounded-lg transition-colors text-[13px] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span>{sending ? 'Sender…' : 'Send meg planen'}</span>
              {!sending && <span className="font-mono text-[12px] text-da-gold">→</span>}
            </button>
          </form>

          {status === 'error' && (
            <p role="alert" className="mt-2 text-[12px] text-amber-700 leading-[1.4]">
              {errorMsg}
            </p>
          )}

          <p className="mt-2.5 text-[11px] text-da-text-muted leading-[1.45]">
            Vil du også lagre fremgangen din?{' '}
            <Link to="/login" className="underline hover:text-da-navy transition-colors">
              Opprett gratis konto
            </Link>
            . Meld deg av når som helst · se{' '}
            <Link to="/personvern" className="underline hover:text-da-navy transition-colors">
              personvern
            </Link>
            .
          </p>
        </>
      )}
    </div>
  )
}
