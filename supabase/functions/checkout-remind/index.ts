import Stripe from 'npm:stripe@17'
import { createClient } from 'jsr:@supabase/supabase-js@2'

// 16.10.2026: påminnelse ved forlatt kjøp, spurt ETTER avbrudd i stedet for før
// Stripe. Kjøp-knappen går nå rett til Stripe (dialogen «steg 1 av 2» fra 13/10
// sto i veien for alle, også de som ville betale). Kommer kunden tilbake på
// cancel_url (?betalt=avbrutt), spør CheckoutRemindDialog om én påminnelse.
// Sier kunden ja, lander e-posten og samtykket her: på den fortsatt åpne
// Stripe-økta som metadata.remind = '1' og metadata.remind_email.
// MacMiniHub/scripts/dronelappen_checkout_recovery.py leser begge på utløpte
// økter og sender én e-post med gjenopprettings-URL-en.
//
// Stripes egen samtykke-boks (consent_collection.promotions) er kun for
// USA-bedrifter med USA-kunder, derfor denne veien.

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-12-18.acacia',
})

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const SID_RE = /^cs_(live|test)_[A-Za-z0-9]+$/

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '')
    if (!token) return json({ error: 'Not authenticated' }, 401)
    const { data: { user } } = await admin.auth.getUser(token)
    if (!user) return json({ error: 'Not authenticated' }, 401)

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const rawEmail = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!EMAIL_RE.test(rawEmail) || rawEmail.length > 254) {
      return json({ error: 'invalid_email', message: 'Skriv inn en gyldig e-postadresse.' }, 400)
    }
    const sid = typeof body?.session_id === 'string' && SID_RE.test(body.session_id) ? body.session_id : ''

    // Finn kundens åpne økt. Helst den klienten husket fra redirecten, ellers
    // den nyeste åpne økta med denne brukeren som client_reference_id.
    // Økta MÅ tilhøre den innloggede brukeren: ingen skal kunne hekte en
    // e-post på andres kjøp.
    let session: Stripe.Checkout.Session | null = null
    if (sid) {
      const s = await stripe.checkout.sessions.retrieve(sid)
      if (s.client_reference_id === user.id && s.status === 'open') session = s
    }
    if (!session) {
      const since = Math.floor(Date.now() / 1000) - 24 * 3600
      const list = await stripe.checkout.sessions.list({
        status: 'open',
        created: { gte: since },
        limit: 100,
      })
      session = list.data.find((s) => s.client_reference_id === user.id) ?? null
    }
    if (!session) {
      return json({ error: 'no_open_session', message: 'Fant ingen påbegynt betaling å minne om.' }, 404)
    }

    await stripe.checkout.sessions.update(session.id, {
      metadata: { remind: '1', remind_email: rawEmail },
    })
    return json({ ok: true, session_id: session.id })
  } catch (err) {
    return json({ error: (err as Error).message }, 500)
  }
})
