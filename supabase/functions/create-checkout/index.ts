import Stripe from 'npm:stripe@17'
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Creates a Stripe Checkout Session for the authenticated user.
// One-time payment that, once paid, grants 12 months of "paid"
// entitlement via the stripe-webhook function.

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-12-18.acacia',
})

// PRISSKIFTE 249 -> 349 kr, varslet 24.07.2026, trer i kraft 15.08.2026.
//
// Byttet er datostyrt og ikke manuelt av en grunn: når vi først har
// annonsert datoen er vi juridisk forpliktet til å gjennomføre den
// (mfl. § 7 — en varslet prisøkning som ikke skjer er villedende).
// Et manuelt bytte er avhengig av at noen husker å deploye på riktig dag.
//
// DENNE FILEN ER KILDEN TIL SANNHET for hva kunden faktisk belastes.
// src/lib/pricing.js speiler samme dato og samme to priser for UI-et —
// endres den ene, MÅ den andre endres i samme commit, ellers viser vi én
// pris og belaster en annen.
const PRICE_INCREASE_AT = Date.parse('2026-08-15T00:00:00+02:00')
const PRICE_BEFORE = { id: 'price_1Tl83aK4vmLGBhyM4NdiXYbf', amount: 249 } // 249 NOK
const PRICE_AFTER = { id: 'price_1TwqHTK4vmLGBhyMR5jkABrl', amount: 349 } // 349 NOK, fra 15.08.2026

function currentPrice() {
  return Date.now() >= PRICE_INCREASE_AT ? PRICE_AFTER : PRICE_BEFORE
}
const META_PIXEL_ID = '1025209573360224' // Droneavisa Pixel / CAPI dataset

// SHA-256 hex. Meta CAPI requires PII hashed (email lowercased + trimmed first).
async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const ALLOWED_ORIGINS = new Set([
  'https://dronelappen.app',
  'https://dronelappen.vercel.app',
])

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : ''
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await admin.auth.getUser(token)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Acquisition attribution (UTM/referrer) sent from the client. Attach it to
    // both the session and the PaymentIntent so each sale's source is queryable
    // in Stripe (which channel: feed / reels / retargeting / organic).
    const meta: Record<string, string> = { user_id: user.id }
    try {
      const body = await req.json().catch(() => null)
      const attr = body && typeof body === 'object' ? (body as Record<string, unknown>).attribution : null
      if (attr && typeof attr === 'object') {
        for (const [k, v] of Object.entries(attr as Record<string, unknown>)) {
          if (v == null || v === '') continue
          meta[String(k).slice(0, 40)] = String(v).slice(0, 450)
        }
      }
    } catch {
      /* no/invalid body - proceed with user_id only */
    }

    // [2026-07-17 EMQ] Ekte klient-IP og User-Agent fanges HER (kallet kommer
    // fra kjøperens browser) og lagres i session-metadata, slik at
    // stripe-webhookens CAPI Purchase (som kommer fra Stripes servere) kan
    // sende dem som match-nøkler. Løfter Purchase-EMQ (var 4.6: ip/ua 0 %).
    // Kun i session-metadata, ikke payment_intent (attribusjon holdes ren der).
    const clientIp = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim()
    const clientUa = (req.headers.get('user-agent') || '').slice(0, 450)
    const sessionMeta: Record<string, string> = { ...meta }
    if (clientIp) sessionMeta.capi_ip = clientIp
    if (clientUa) sessionMeta.capi_ua = clientUa

    const price = currentPrice()

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: price.id, quantity: 1 }],
      // {CHECKOUT_SESSION_ID} is expanded by Stripe on redirect; PaymentReturn
      // reads it as `s` and uses it as the Pixel/CAPI dedup event_id.
      success_url: 'https://dronelappen.app/?betalt=ok&s={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://dronelappen.app/?betalt=avbrutt',
      client_reference_id: user.id,
      // Anonymous users have email "" (not null), so use || not ?? — otherwise
      // Stripe rejects the empty string. Stripe then collects the email itself.
      customer_email: user.email || undefined,
      metadata: sessionMeta,
      payment_intent_data: { metadata: meta },
      locale: 'nb',
      allow_promotion_codes: true,
    })

    // Server-side InitiateCheckout -> Meta Conversions API. The browser also
    // fires an InitiateCheckout, but the page redirects to Stripe before that
    // beacon reliably sends (0 captured in 30d), so this server event is the
    // real, reliable IC signal for ad optimization. event_id = Stripe session
    // id so it dedupes with the browser event (and is distinct per event_name
    // from the Purchase event). Strictly best-effort with a short timeout: it
    // must never block or delay returning the checkout URL.
    try {
      const capiToken = Deno.env.get('META_CAPI_TOKEN')
      if (capiToken) {
        const userData: Record<string, unknown> = {
          external_id: [await sha256Hex(user.id.trim())],
        }
        if (user.email) userData.em = [await sha256Hex(user.email.trim().toLowerCase())]
        // fbp/fbc fra klienten (samtykke-gatet, se attribution.js) — sendes
        // USHASHET som enkeltstrenger per CAPI-spec. Uten disse kan Meta ikke
        // knytte hendelsen til annonseklikket, og ad-set-optimaliseringen
        // sulter på signal.
        if (meta.fbp) userData.fbp = meta.fbp
        if (meta.fbc) userData.fbc = meta.fbc
        // Dette kallet kommer rett fra kjøperens browser, så IP + User-Agent
        // er ekte klientverdier — bedrer Metas match-kvalitet.
        if (clientIp) userData.client_ip_address = clientIp
        if (clientUa) userData.client_user_agent = clientUa

        const payload: Record<string, unknown> = {
          data: [{
            event_name: 'InitiateCheckout',
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            event_source_url: 'https://dronelappen.app/',
            event_id: session.id,
            user_data: userData,
            custom_data: { currency: 'NOK', value: price.amount },
          }],
        }
        // Same toggle as stripe-webhook: set to route to Test Events; unset for prod.
        const testCode = Deno.env.get('META_CAPI_TEST_EVENT_CODE')
        if (testCode) payload.test_event_code = testCode

        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 1500)
        try {
          const resp = await fetch(
            `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(capiToken)}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              signal: ctrl.signal,
            },
          )
          if (!resp.ok) console.error('CAPI InitiateCheckout failed:', resp.status, await resp.text())
        } finally {
          clearTimeout(timer)
        }
      }
    } catch (err) {
      // CAPI is analytics only; never affect the checkout URL just created.
      console.error('CAPI InitiateCheckout error:', (err as Error).message)
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
