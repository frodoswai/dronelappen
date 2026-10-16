import { useEffect, useRef, useState } from 'react'
import { requestCheckoutReminder } from '../lib/supabase'
import { logFunnel, CHECKOUT_REMIND_NO, CHECKOUT_REMIND_YES } from '../lib/funnel'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// 16.10.2026: vises av PaymentReturn når kunden kommer tilbake fra Stripe
// uten å betale (?betalt=avbrutt). Erstatter dialogen «steg 1 av 2» som sto
// FØR Stripe (13/10) og dermed i veien for alle, også de som ville betale.
// Her har kunden allerede avbrutt, så dialogen koster ingen kjøp. Et ja er
// aktivt samtykke til én påminnelse (mfl. § 15): e-posten hektes på den
// åpne Stripe-økta (checkout-remind), og Max sender e-posten når økta har
// utløpt. Ingen nyhetsbrev, ingen lagring av e-post hos oss.
export default function CheckoutRemindDialog({ defaultEmail = '', onClose }) {
  const [email, setEmail] = useState(defaultEmail)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!defaultEmail) setTimeout(() => inputRef.current?.focus(), 50)
  }, [defaultEmail])

  const decline = () => {
    logFunnel(CHECKOUT_REMIND_NO)
    onClose?.()
  }

  const submit = async (e) => {
    e.preventDefault()
    const v = email.trim().toLowerCase()
    if (!EMAIL_RE.test(v)) {
      setErr('Skriv inn en gyldig e-postadresse.')
      return
    }
    setBusy(true)
    setErr('')
    try {
      await requestCheckoutReminder(v)
      logFunnel(CHECKOUT_REMIND_YES)
      setDone(true)
    } catch (ex) {
      setErr(ex?.message || 'Noe gikk galt. Prøv igjen.')
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-da-navy-dark/70 flex items-end sm:items-center justify-center p-4"
      onClick={done ? onClose : decline}
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-remind-title"
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] bg-white rounded-xl border-[0.5px] border-da-navy/20 border-t-2 border-t-da-gold px-5 py-5 shadow-xl"
      >
        {done ? (
          <>
            <h2 id="checkout-remind-title" className="text-[17px] font-medium text-da-navy leading-tight mb-1.5">
              Notert.
            </h2>
            <p className="text-[13px] text-da-text-body leading-[1.6] mb-4">
              Du får én e-post med lenken tilbake til kjøpet i morgen, hvis du ikke har fullført innen da.
              Ikke noe mer enn det.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="quiz-option w-full bg-da-navy hover:bg-da-navy-mid text-da-bg font-medium py-3 px-5 rounded-lg transition-colors text-[14px]"
            >
              Lukk
            </button>
          </>
        ) : (
          <>
            <h2 id="checkout-remind-title" className="text-[17px] font-medium text-da-navy leading-tight mb-1.5">
              Vil du ha lenken tilbake på e-post?
            </h2>
            <p className="text-[13px] text-da-text-body leading-[1.6] mb-3.5">
              Betalingen ble avbrutt, helt greit. Hvis du vil, sender vi deg én e-post med lenken tilbake
              til kjøpet, i tilfelle du vil fullføre senere. Ingen nyhetsbrev.
            </p>
            <input
              ref={inputRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="din@epost.no"
              className="w-full border-[0.5px] border-da-navy/30 rounded-lg px-3.5 py-2.5 text-[15px] text-da-navy focus:outline-none focus:border-da-gold mb-3"
              required
            />
            {err && <p className="text-[12.5px] text-red-700 mb-3">{err}</p>}
            <button
              type="submit"
              disabled={busy}
              className="quiz-option w-full bg-da-navy hover:bg-da-navy-mid text-da-bg font-medium py-3 px-5 rounded-lg transition-colors text-[14px] disabled:opacity-60"
            >
              {busy ? 'Sender …' : 'Ja, send meg én påminnelse'}
            </button>
            <button
              type="button"
              onClick={decline}
              className="w-full mt-2 text-[12.5px] text-da-text-muted hover:text-da-navy py-1.5"
            >
              Nei takk
            </button>
          </>
        )}
      </form>
    </div>
  )
}
