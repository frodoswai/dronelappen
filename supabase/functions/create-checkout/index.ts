import Stripe from 'npm:stripe@17'
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Creates a Stripe Checkout Session for the authenticated user.
// One-time payment (249 NOK) that, once paid, grants 12 months of
// "paid" entitlement via the stripe-webhook function.

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-12-18.acacia',
})

const PRICE_ID = 'price_1Tl83aK4vmLGBhyM4NdiXYbf' // DroneLappen full tilgang (12 mnd), 249 NOK

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

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      // {CHECKOUT_SESSION_ID} is expanded by Stripe on redirect; PaymentReturn
      // reads it as `s` and uses it as the Pixel/CAPI dedup event_id.
      success_url: 'https://dronelappen.app/?betalt=ok&s={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://dronelappen.app/?betalt=avbrutt',
      client_reference_id: user.id,
      // Anonymous users have email "" (not null), so use || not ?? — otherwise
      // Stripe rejects the empty string. Stripe then collects the email itself.
      customer_email: user.email || undefined,
      metadata: meta,
      payment_intent_data: { metadata: meta },
      locale: 'nb',
      allow_promotion_codes: true,
    })

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
