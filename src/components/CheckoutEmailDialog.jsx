import { useEffect, useRef, useState } from 'react'
import { registerCheckoutEmailDialog, EMAIL_RE } from '../lib/checkoutEmail'
import { PRICE } from '../lib/pricing'

// Ett steg før Stripe for anonyme kjøpere: e-post (forhåndsutfylles hos
// Stripe) og et frivillig ja til én påminnelse hvis kjøpet ikke fullføres.
// Se lib/checkoutEmail.js for hvorfor. Innloggede brukere ser aldri dialogen.
export default function CheckoutEmailDialog() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [remind, setRemind] = useState(false)
  const [err, setErr] = useState('')
  const resolver = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    return registerCheckoutEmailDialog(
      () =>
        new Promise((resolve) => {
          resolver.current = resolve
          setErr('')
          setOpen(true)
        }),
    )
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const finish = (value) => {
    setOpen(false)
    const r = resolver.current
    resolver.current = null
    r?.(value)
  }

  const submit = (e) => {
    e.preventDefault()
    const v = email.trim().toLowerCase()
    if (!EMAIL_RE.test(v)) {
      setErr('Skriv inn en gyldig e-postadresse.')
      return
    }
    finish({ email: v, remind })
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] bg-da-navy-dark/70 flex items-end sm:items-center justify-center p-4"
      onClick={() => finish(null)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-email-title"
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] bg-white rounded-xl border-[0.5px] border-da-navy/20 border-t-2 border-t-da-gold px-5 py-5 shadow-xl"
      >
        <div className="font-mono text-[11px] font-medium text-da-gold tracking-[0.12em] mb-1.5">
          steg 1 av 2
        </div>
        <h2 id="checkout-email-title" className="text-[17px] font-medium text-da-navy leading-tight mb-1.5">
          Hvor skal vi sende kvitteringen?
        </h2>
        <p className="text-[13px] text-da-text-body leading-[1.6] mb-3.5">
          Tilgangen din knyttes til e-posten, så du kan logge inn på mobil og PC. Betalingen skjer hos Stripe
          i neste steg ({PRICE} kr én gang, 12 måneder).
        </p>
        <input
          ref={inputRef}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="din@epost.no"
          className="w-full border-[0.5px] border-da-navy/30 rounded-lg px-3.5 py-2.5 text-[15px] text-da-navy focus:outline-none focus:border-da-gold mb-2.5"
          required
        />
        <label className="flex items-start gap-2.5 text-[12.5px] text-da-text-body leading-[1.5] mb-4 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remind}
            onChange={(e) => setRemind(e.target.checked)}
            className="mt-[3px] accent-da-navy"
          />
          <span>Send meg én påminnelse på e-post hvis jeg ikke fullfører kjøpet. Ingen nyhetsbrev.</span>
        </label>
        {err && <p className="text-[12.5px] text-red-700 mb-3">{err}</p>}
        <button
          type="submit"
          className="quiz-option w-full bg-da-navy hover:bg-da-navy-mid text-da-bg font-medium py-3 px-5 rounded-lg transition-colors text-[14px]"
        >
          Videre til betaling →
        </button>
        <button
          type="button"
          onClick={() => finish(null)}
          className="w-full mt-2 text-[12.5px] text-da-text-muted hover:text-da-navy py-1.5"
        >
          Avbryt
        </button>
      </form>
    </div>
  )
}
