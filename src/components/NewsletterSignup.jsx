import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getLeadAttribution } from '../lib/attribution'

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
        body: JSON.stringify({ email: value, attribution: getLeadAttribution() }),
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
    <div className="bg-[#EEF3F7] rounded-2xl p-4 mb-3">
      <div className="text-[13px] font-semibold tracking-[0.08em] uppercase text-da-text-muted mb-1.5">
        nyhetsbrev
      </div>
      <p className="text-[15px] text-da-text-body leading-[1.5] mb-2.5">
        Få de siste dronenyhetene fra{' '}
        <span className="font-medium text-da-navy">Droneavisa.no</span>: regelendringer,
        nye droner, tips og guider rett i innboksen.
      </p>

      {status === 'success' ? (
        <p
          role="status"
          className="text-[15px] font-medium text-green-700 leading-[1.5]"
        >
          Takk! Sjekk innboksen din og bekreft påmeldingen.
        </p>
      ) : status === 'duplicate' ? (
        <p role="status" className="text-[15px] font-medium text-da-navy leading-[1.5]">
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
              className="flex-none sm:flex-1 w-full sm:w-auto bg-white border border-[#8A9AA8] focus:border-da-navy outline-none rounded-xl px-3.5 h-12 text-[16px] text-da-navy placeholder:text-da-text-muted transition-colors disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending}
              className="bg-da-navy hover:bg-da-navy-mid text-white font-semibold h-12 px-4 rounded-xl transition-colors text-[15px] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span>{sending ? 'Sender…' : 'Meld meg på'}</span>
            </button>
          </form>

          {status === 'error' && (
            <p role="alert" className="mt-2 text-[14px] text-amber-700 leading-[1.4]">
              {errorMsg}
            </p>
          )}

          <p className="mt-2.5 text-[15px] text-da-text-muted leading-[1.45]">
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
