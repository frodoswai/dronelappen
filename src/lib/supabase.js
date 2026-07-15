import { createClient } from '@supabase/supabase-js'
import { getAttribution, getMetaIds } from './attribution.js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Fetch questions via the get-questions Edge Function.
 * The function reads questions server-side with service_role,
 * enforcing free/paid tier limits based on the user's entitlement.
 */
export async function fetchQuestions({ examType } = {}) {
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(
    `${supabaseUrl}/functions/v1/get-questions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        ...(session && { Authorization: `Bearer ${session.access_token}` }),
      },
      body: JSON.stringify({ exam_type: examType }),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Edge Function error: ${res.status}`)
  }

  return res.json() // { tier, count, questions }
}

/**
 * Start a Stripe Checkout for full access (249 NOK / 12 months).
 * Requires the user to be logged in. Redirects the browser to Stripe on success.
 */
export async function createCheckout() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Du må være innlogget for å kjøpe full tilgang.')
  }

  const res = await fetch(
    `${supabaseUrl}/functions/v1/create-checkout`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        Authorization: `Bearer ${session.access_token}`,
      },
      // fbc/fbp (samtykke-gatet) følger med til Stripe-metadata slik at
      // stripe-webhookens CAPI Purchase kan knyttes til annonseklikket.
      body: JSON.stringify({ attribution: { ...getAttribution(), ...getMetaIds() } }),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Checkout-feil: ${res.status}`)
  }

  const { url } = await res.json()
  if (!url) throw new Error('Mangler checkout-URL fra serveren.')
  window.location.href = url
}
