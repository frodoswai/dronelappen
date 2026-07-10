import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createCheckout } from '../lib/supabase'

/**
 * Full-screen paywall shown when a FREE user reaches the end of the
 * 25-question free pool (the server-side FREE_LIMIT in get-questions).
 *
 * This is the highest-intent conversion moment: the user has just worked
 * through all 25 free questions and wants more. Buy is the primary action;
 * "Se resultatene mine" stays available so we never trap the user's own
 * session data behind the wall (hostile paywalls kill trust).
 *
 * Fires InitiateCheckout so the attempt is countable in Meta, and surfaces
 * CheckoutError the same way Home/UpgradePrompt do, keeping the funnel
 * instrumentation consistent (jf. anon-email-bug 2026-07-01).
 */
export default function Paywall({ answered = 25, onContinue }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const handleBuy = async () => {
    if (busy) return
    setErr('')
    window.fbq?.('track', 'InitiateCheckout', { value: 249, currency: 'NOK' })
    if (!user) {
      navigate('/login')
      return
    }
    setBusy(true)
    try {
      await createCheckout() // redirects to Stripe on success
    } catch (e) {
      window.fbq?.('trackCustom', 'CheckoutError', {
        message: String(e?.message || e).slice(0, 200),
      })
      setErr(e.message || 'Noe gikk galt. Prøv igjen.')
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-da-navy-dark flex flex-col">
      {/* Dark hero band — matches the app's navy/gold language */}
      <div className="px-6 pt-16 pb-8">
        <div className="max-w-xl mx-auto">
          <div className="font-mono text-[11px] font-medium text-da-gold tracking-[0.14em] mb-3">
            full tilgang
          </div>
          <h1 className="text-[26px] font-semibold text-da-bg leading-tight mb-3">
            Du har fullført de {answered} gratis spørsmålene.
          </h1>
          <p className="text-[14px] text-da-dark-slogan leading-[1.55] max-w-md">
            Lås opp <strong className="text-da-bg">hele spørsmålsbanken</strong> og alle
            treningsmoduser i 12 måneder. Engangsbeløp på 249 kr, ingen abonnement.
          </p>
          {/* Pris-anker: eksamensgebyret er den reelle sammenligningen.
              Ærlig og sterkt — stryk på trafikkstasjonen koster nytt gebyr. */}
          <p className="text-[13px] text-da-dark-slogan leading-[1.55] max-w-md mt-2.5">
            Til sammenligning: A2-eksamen koster{' '}
            <strong className="text-da-bg">970 kr per forsøk</strong> på trafikkstasjonen.
            God forberedelse er billig.
          </p>
        </div>
      </div>

      {/* Fade into the light action zone */}
      <div
        className="h-7 shrink-0"
        style={{
          background:
            'linear-gradient(to bottom, #0a1628 0%, #2a3a50 25%, #7e8a9c 55%, #cfd6df 80%, #fafbfc 100%)',
        }}
      />

      <div className="flex-1 bg-da-bg px-6 pt-4 pb-10">
        <div className="max-w-xl mx-auto">
          <div className="bg-white border-[0.5px] border-da-navy/20 border-l-2 border-l-da-gold rounded-lg px-5 py-5 mb-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="text-[17px] font-medium text-da-navy leading-tight">
                Lås opp hele banken
              </div>
              <div className="text-right whitespace-nowrap">
                <span className="text-[22px] font-semibold text-da-navy">249 kr</span>
                <span className="block font-mono text-[10px] text-da-text-muted mt-[1px]">
                  én gang · 12 mnd
                </span>
              </div>
            </div>
            <ul className="text-[13px] text-da-text-body leading-[1.7] mb-4 list-none space-y-0.5">
              <li>
                <span className="font-mono text-da-gold mr-1.5">+</span>Alle 241 spørsmål, alle
                kategorier
              </li>
              <li>
                <span className="font-mono text-da-gold mr-1.5">+</span>Prøveeksamen i offisielt
                format, med tid og bestå-grense
              </li>
              <li>
                <span className="font-mono text-da-gold mr-1.5">+</span>Forklaring på hvert svar —
                lær reglene, ikke bare fasit
              </li>
              <li>
                <span className="font-mono text-da-gold mr-1.5">+</span>Læring, Eksamen og Tempo
              </li>
            </ul>

            <button
              onClick={handleBuy}
              disabled={busy}
              className="quiz-option w-full bg-da-navy hover:bg-da-navy-mid text-da-bg font-medium py-3 px-5 rounded-lg transition-colors text-[14px] inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span>
                {busy
                  ? 'Sender deg til betaling …'
                  : user
                  ? 'Kjøp full tilgang'
                  : 'Logg inn for å kjøpe'}
              </span>
              {!busy && <span className="font-mono text-[12px] text-da-gold">249 kr →</span>}
            </button>

            {err && (
              <p role="alert" className="mt-2 text-[12px] text-amber-700">
                {err}
              </p>
            )}

            <p className="font-mono text-[11px] text-da-text-muted mt-3 tracking-[0.04em] text-center">
              Engangsbeløp · sikker betaling via Stripe · over 300 piloter øver her
            </p>
          </div>

          {onContinue && (
            <button
              onClick={onContinue}
              className="quiz-option w-full text-center text-[13px] text-da-text-muted hover:text-da-navy py-2 transition-colors"
            >
              Se resultatene mine først →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
