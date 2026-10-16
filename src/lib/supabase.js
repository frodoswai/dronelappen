import { createClient } from '@supabase/supabase-js'
import { getAttribution, getGoogleClick, getMetaIds } from './attribution.js'

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
 * Start a Stripe Checkout for full access (pris: se src/lib/pricing.js).
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
      // google_click sendes SEPARAT fra attribution, ikke som en nøkkel i den:
      // attribution leses fra localStorage og kan være uker gammel, mens
      // klikk-IDen bare gjelder denne fane-økta. Edge-funksjonen baker den inn
      // i success_url slik at Google kan knytte kjøpet til annonseklikket også
      // når brukeren har avslått cookies.
      body: JSON.stringify({
        attribution: { ...getAttribution(), ...getMetaIds() },
        google_click: getGoogleClick(),
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    // 15.10.2026: serveren nekter ny Stripe-økt for en som alt har betalt.
    // Kallerne leser tilgangen på nytt (refreshTier) i stedet for å vise feil.
    if (res.status === 409 && err.error === 'already_paid') {
      const e = new Error(err.message || 'Du har allerede full tilgang.')
      e.alreadyPaid = true
      throw e
    }
    throw new Error(err.error || `Checkout-feil: ${res.status}`)
  }

  const { url } = await res.json()
  if (!url) throw new Error('Mangler checkout-URL fra serveren.')
  // 16.10.2026: husk økt-ID-en til PaymentReturn. Kommer kunden tilbake på
  // ?betalt=avbrutt, kan CheckoutRemindDialog hekte en påminnelse på akkurat
  // denne økta (checkout-remind). Stripe-URL-en bærer ID-en i stien.
  try {
    const sid = url.match(/cs_(?:live|test)_[A-Za-z0-9]+/)?.[0] || ''
    localStorage.setItem(CHECKOUT_SID_KEY, JSON.stringify({ sid, ts: Date.now() }))
  } catch {
    /* lagring blokkert: serveren finner økta på bruker-ID i stedet */
  }
  window.location.href = url
}

const CHECKOUT_SID_KEY = 'dl_checkout_sid'

/** Økt-ID fra siste kjøpsforsøk (maks 24 t gammel, Stripes levetid), ellers ''. */
export function pendingCheckoutSid() {
  try {
    const v = JSON.parse(localStorage.getItem(CHECKOUT_SID_KEY) || 'null')
    if (v?.sid && Date.now() - v.ts < 24 * 3600 * 1000) return v.sid
  } catch {
    /* ignorer */
  }
  return ''
}

/**
 * 16.10.2026: kunden avbrøt hos Stripe og sa ja til én påminnelse. Hekter
 * e-post + samtykke på den åpne Stripe-økta (checkout-remind). Påminnelsen
 * sendes fra Max når økta har utløpt (scripts/dronelappen_checkout_recovery.py).
 */
export async function requestCheckoutReminder(email) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Ingen sesjon.')
  const res = await fetch(`${supabaseUrl}/functions/v1/checkout-remind`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ email, session_id: pendingCheckoutSid() || undefined }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || err.error || `Feil ${res.status}`)
  }
  return res.json()
}
