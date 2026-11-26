import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createCheckout } from '../lib/supabase'
import PriceIncreaseNotice from './PriceIncreaseNotice'
import { PRICE, TIERS, DEFAULT_PLAN, PLAN_LABEL, PRICE_STS_UPGRADE, planPrice } from '../lib/pricing'
import HarTilgangLoggInn from './HarTilgangLoggInn'
import { logFunnel, UPGRADE_BUY_CLICK } from '../lib/funnel'

/**
 * Upsell to full access (se src/lib/pricing.js / 12 months).
 * - Paid users: hidden.
 * - Logged-in free users: "Kjøp full tilgang" → Stripe Checkout.
 * - Anonymous users: nudged to create an account first (payment ties to a user).
 */
// paidOnlyTitle: eksamenstyper uten gratis-pool (STS) sender paywallTitle fra
// lib/exams.js, så kortet ikke lover «25 spørsmål» der det er null gratis
// (03.10.2026, landingssida /sts-eksamen/ sender gratisbrukere hit).
// examType (08.10.2026): A1/A3 er gratis for alle, så kortet selger A2 og STS
// der i stedet for å love «25 spørsmål».
export default function UpgradePrompt({ compact = false, requireUser = false, paidOnlyTitle = '', examType = null }) {
  const { user, tier, sts, expiresAt, loading } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // 26.11.2026, to nivåer fra 1.12: A2-kunde uten STS som står på STS-siden
  // får påbygget (149 kr) her. Gratisbruker på STS-siden får pakken (449 kr),
  // alle andre steder selges A2 (349 kr). Før datoen: ett kjøp, som før.
  const pabygg = tier === 'paid' && !sts && examType === 'A2_STS'
  if (loading || (tier === 'paid' && !pabygg)) return null
  // When requireUser is set, defer to other prompts (e.g. account signup) for
  // anonymous visitors instead of stacking two cards.
  if (requireUser && !user) return null

  const plan = pabygg ? 'sts_upgrade' : TIERS && examType === 'A2_STS' ? 'a2_sts' : DEFAULT_PLAN
  const pris = planPrice(plan)
  const utlop = expiresAt
    ? new Date(expiresAt).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  const handleBuy = async () => {
    setBusy(true)
    setError('')
    // Funnel-instrumentering (se Home.jsx): tell buy-forsøk i Meta + synliggjør feil.
    window.fbq?.('track', 'InitiateCheckout', { value: pris, currency: 'NOK' })
    // Ventes på (maks 800 ms) før redirect, samme mønster som QuizLayout.
    // Påbygget logges ikke her: hendelsen teller gratisbrukere som kjøper.
    if (!pabygg) await logFunnel(UPGRADE_BUY_CLICK, { examType })
    try {
      await createCheckout(plan) // redirects to Stripe on success
    } catch (err) {
      if (err?.cancelled) {
        setBusy(false)
        return
      }
      // Ingen økt og anonym økt lot seg ikke opprette: innlogging er siste utvei.
      if (err?.needsLogin) {
        setBusy(false)
        navigate('/login')
        return
      }
      window.fbq?.('trackCustom', 'CheckoutError', { message: String(err?.message || err).slice(0, 200) })
      setError(err.message || 'Noe gikk galt. Prøv igjen.')
      setBusy(false)
    }
  }

  return (
    <div className="bg-[#EEF3F7] rounded-2xl p-4 mb-4">
      <div className="text-[13px] font-semibold tracking-[0.08em] uppercase text-da-text-muted mb-1.5">
        {pabygg ? 'STS-påbygg' : TIERS ? PLAN_LABEL[plan] : 'full tilgang'}
      </div>
      <p className="text-[15px] text-da-text-body leading-[1.45] mb-3">
        {pabygg ? (
          <>
            Du har A2. Legg til STS for <strong>{pris} kr én gang</strong>. Påbygget gjelder
            {utlop ? <> til <strong>{utlop}</strong>, samme dato som A2-tilgangen din</> : ' like lenge som A2-tilgangen din'}.
            Ingen abonnement.
          </>
        ) : TIERS && plan === 'a2_sts' ? (
          <>
            {paidOnlyTitle ? `${paidOnlyTitle} ` : ''}Betal <strong>{pris} kr én gang</strong> og få{' '}
            <strong>A2, A1/A3 og STS</strong> i 12 måneder. Ingen abonnement. Har du A2 fra før,
            legger du til STS for {PRICE_STS_UPGRADE} kr når du er innlogget.
          </>
        ) : TIERS && examType === 'A1_A3' ? (
          <>
            A1/A3 er gratis for alle. Skal du videre til A2? Betal <strong>{pris} kr én gang</strong> og
            få <strong>hele A2-banken</strong> i 12 måneder. Ingen abonnement.
          </>
        ) : TIERS ? (
          <>
            Gratisversjonen gir deg 25 A2-spørsmål. Betal <strong>{pris} kr én gang</strong> og
            lås opp <strong>hele A2-banken</strong> i 12 måneder. Ingen abonnement. STS kan
            legges til for {PRICE_STS_UPGRADE} kr.
          </>
        ) : examType === 'A1_A3' && !paidOnlyTitle ? (
          <>
            A1/A3 er gratis for alle. Skal du videre til A2? Betal <strong>{PRICE} kr én gang</strong> og
            f&aring; <strong>A2 og STS-p&aring;bygget</strong> i 12 m&aring;neder. Ingen abonnement.
          </>
        ) : (
          <>
            {paidOnlyTitle ? `${paidOnlyTitle} ` : 'Gratisversjonen gir deg 25 A2-spørsmål. '}Betal <strong>{PRICE} kr én gang</strong> og
            l&aring;s opp <strong>hele sp&oslash;rsm&aring;lsbanken</strong> i 12 m&aring;neder. Ingen abonnement.
          </>
        )}
      </p>
      <PriceIncreaseNotice className="mb-3 -mt-1" compact />

      <button
        onClick={handleBuy}
        disabled={busy}
        className="w-full h-14 rounded-[14px] bg-da-gold text-da-navy-dark text-[16px] font-bold inline-flex items-center justify-center text-center px-3 transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
      >
        {busy
          ? 'Sender deg til betaling …'
          : pabygg
          ? `Legg til STS · ${pris} kr`
          : TIERS
          ? `Kjøp ${PLAN_LABEL[plan]} · ${pris} kr`
          : `Kjøp full tilgang · ${PRICE} kr`}
      </button>

      {error && (
        <p className="text-[14px] text-red-700 mt-2" role="alert">{error}</p>
      )}

      {!pabygg && <HarTilgangLoggInn className="mt-3 text-center" />}

      {!compact && (
        <p className="text-[13px] text-da-text-muted mt-2 text-center">
          Engangsbel&oslash;p. Sikker betaling via Stripe.
        </p>
      )}
    </div>
  )
}
