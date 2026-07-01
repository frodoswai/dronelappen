import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createCheckout } from '../lib/supabase'

/**
 * Upsell to full access (249 NOK / 12 months).
 * - Paid users: hidden.
 * - Logged-in free users: "Kjøp full tilgang" → Stripe Checkout.
 * - Anonymous users: nudged to create an account first (payment ties to a user).
 */
export default function UpgradePrompt({ compact = false, requireUser = false }) {
  const { user, tier, loading } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (loading || tier === 'paid') return null
  // When requireUser is set, defer to other prompts (e.g. account signup) for
  // anonymous visitors instead of stacking two cards.
  if (requireUser && !user) return null

  const handleBuy = async () => {
    setBusy(true)
    setError('')
    try {
      await createCheckout() // redirects to Stripe on success
    } catch (err) {
      setError(err.message || 'Noe gikk galt. Prøv igjen.')
      setBusy(false)
    }
  }

  return (
    <div className="bg-da-cream/40 border-[0.5px] border-da-navy/20 border-l-2 border-l-da-gold rounded-lg px-5 py-4 mb-4">
      <div className="font-mono text-[11px] font-medium text-da-gold tracking-[0.12em] mb-1.5">
        full tilgang
      </div>
      <p className="text-[13px] text-da-text-body leading-[1.5] mb-3">
        Gratisversjonen gir deg 25 sp&oslash;rsm&aring;l. Betal <strong>249 kr én gang</strong> og
        l&aring;s opp <strong>hele sp&oslash;rsm&aring;lsbanken</strong> i 12 m&aring;neder. Ingen abonnement.
      </p>

      {user ? (
        <button
          onClick={handleBuy}
          disabled={busy}
          className="quiz-option bg-da-navy hover:bg-da-navy-mid text-da-bg font-medium py-2.5 px-5 rounded-lg transition-colors text-[13px] inline-flex items-center gap-2 disabled:opacity-60"
        >
          <span>{busy ? 'Sender deg til betaling …' : 'Kjøp full tilgang'}</span>
          {!busy && <span className="font-mono text-[11px] text-da-gold">249 kr &rarr;</span>}
        </button>
      ) : (
        <Link
          to="/login"
          className="quiz-option bg-da-navy hover:bg-da-navy-mid text-da-bg font-medium py-2.5 px-5 rounded-lg transition-colors text-[13px] inline-flex items-center gap-2"
        >
          <span>Logg inn for &aring; kj&oslash;pe</span>
          <span className="font-mono text-[11px] text-da-gold">&rarr;</span>
        </Link>
      )}

      {error && (
        <p className="text-[12px] text-red-600 mt-2" role="alert">{error}</p>
      )}

      {!compact && (
        <p className="font-mono text-[11px] text-da-text-muted mt-3 tracking-[0.04em]">
          Engangsbel&oslash;p. Sikker betaling via Stripe.
        </p>
      )}
    </div>
  )
}
