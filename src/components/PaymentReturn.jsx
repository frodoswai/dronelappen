import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

/**
 * Handles the redirect back from Stripe Checkout.
 *   ?betalt=ok      → confirm + poll refreshTier (webhook may lag a few seconds)
 *   ?betalt=avbrutt → subtle "cancelled" notice
 * Cleans the query param from the URL once handled.
 */
export default function PaymentReturn() {
  const { refreshTier } = useAuth()
  const [status, setStatus] = useState(null) // 'ok' | 'pending' | 'avbrutt' | null

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const betalt = params.get('betalt')
    if (!betalt) return

    // Strip the param so a refresh doesn't re-trigger.
    params.delete('betalt')
    const qs = params.toString()
    window.history.replaceState(
      {},
      '',
      window.location.pathname + (qs ? `?${qs}` : ''),
    )

    // All setState calls live inside the async fn (never synchronously in the
    // effect body) to satisfy React's set-state-in-effect rule.
    let cancelled = false
    async function handle() {
      if (betalt === 'avbrutt') {
        if (!cancelled) setStatus('avbrutt')
        return
      }
      if (betalt !== 'ok') return

      // Fire the Meta Pixel Purchase event once. The success URL is only
      // reached after a completed Stripe payment, so this is the conversion.
      try {
        window.fbq?.('track', 'Purchase', { value: 249, currency: 'NOK' })
      } catch {
        // pixel not loaded — ignore
      }

      if (!cancelled) setStatus('pending')
      // Poll a few times: the webhook writes the entitlement out-of-band.
      for (let i = 0; i < 6; i++) {
        const tier = await refreshTier()
        if (cancelled) return
        if (tier === 'paid') {
          setStatus('ok')
          return
        }
        await new Promise((r) => setTimeout(r, 1500))
      }
      // Still not paid after polling — show optimistic confirmation anyway;
      // the entitlement resolves on next load.
      if (!cancelled) setStatus('ok')
    }
    handle()
    return () => { cancelled = true }
  }, [refreshTier])

  if (!status) return null

  const dismiss = () => setStatus(null)

  if (status === 'avbrutt') {
    return (
      <Banner tone="muted" onDismiss={dismiss}>
        Betalingen ble avbrutt. Du kan pr&oslash;ve igjen n&aring;r du vil.
      </Banner>
    )
  }

  if (status === 'pending') {
    return (
      <Banner tone="gold">
        Bekrefter betalingen din &hellip;
      </Banner>
    )
  }

  return (
    <Banner tone="gold" onDismiss={dismiss}>
      Takk! Full tilgang er aktivert &mdash; hele sp&oslash;rsm&aring;lsbanken er n&aring; &aring;pen.
    </Banner>
  )
}

function Banner({ tone, children, onDismiss }) {
  const toneClasses =
    tone === 'gold'
      ? 'bg-da-navy text-da-bg border-l-da-gold'
      : 'bg-da-cream/60 text-da-text-body border-l-da-navy/40'
  return (
    <div className={`${toneClasses} border-l-4 px-5 py-3 text-[13px] flex items-center justify-between gap-4`}>
      <span>{children}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="font-mono text-[12px] opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Lukk"
        >
          ✕
        </button>
      )}
    </div>
  )
}
