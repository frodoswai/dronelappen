import { useState } from 'react'
import { Link } from 'react-router-dom'

// Newsletter signup for the Droneavisa list. Posts to the newsletter-signup
// Edge Function, which holds the MailerLite token server-side and adds the
// email to the "Droneavisa subscribers" group. Double opt-in (when enabled on
// the MailerLite account) means MailerLite sends the confirmation email — the
// success copy below reflects that "check your inbox" flow.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newsletter-signup`
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

// status: 'idle' | 'sending' | 'success' | 'duplicate' | 'error'
export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

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
        body: JSON.stringify({ email: value }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.status === 'ok') {
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

  const sending = status === 'sending'

  return (
    <div className="bg-da-cream/40 border-[0.5px] border-da-navy/20 border-l-2 border-l-da-gold rounded-lg px-5 py-4 mb-4">
      <div className="font-mono text-[11px] font-medium text-da-gold tracking-[0.12em] mb-1.5">
        nyhetsbrev
      </div>
      <p className="text-[13px] text-da-text-body leading-[1.5] mb-3">
        Få de siste dronenyhetene fra{' '}
        <span className="font-medium text-da-navy">Droneavisa.no</span> — regelendringer,
        nye droner, tips og guider rett i innboksen.
      </p>

      {status === 'success' ? (
        <p
          role="status"
          className="text-[13px] font-medium text-green-700 leading-[1.5]"
        >
          Takk! Sjekk innboksen din og bekreft påmeldingen.
        </p>
      ) : status === 'duplicate' ? (
        <p role="status" className="text-[13px] font-medium text-da-navy leading-[1.5]">
          Du er allerede påmeldt — takk!
        </p>
      ) : (
        <>
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
              <span>{sending ? 'Sender…' : 'Meld meg på'}</span>
              {!sending && <span className="font-mono text-[12px] text-da-gold">→</span>}
            </button>
          </form>

          {status === 'error' && (
            <p role="alert" className="mt-2 text-[12px] text-amber-700 leading-[1.4]">
              {errorMsg}
            </p>
          )}

          <p className="mt-2.5 text-[11px] text-da-text-muted leading-[1.45]">
            Du kan melde deg av når som helst. Se{' '}
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
