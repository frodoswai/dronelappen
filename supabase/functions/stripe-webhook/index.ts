import Stripe from 'npm:stripe@17'
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Receives Stripe webhook events. On checkout.session.completed it grants
// the user 12 months of "paid" entitlement. Signature-verified; no JWT.

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-12-18.acacia',
})

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
const ACCESS_MONTHS = 12
const META_PIXEL_ID = '1025209573360224' // Droneavisa Pixel / CAPI dataset

// SHA-256 hex. Meta CAPI requires PII hashed (email lowercased + trimmed first).
async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature')
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, WEBHOOK_SECRET)
  } catch (err) {
    return new Response(
      `Webhook signature verification failed: ${(err as Error).message}`,
      { status: 400 },
    )
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.client_reference_id || session.metadata?.user_id

      // Only grant access when the session is actually paid.
      const paid = session.payment_status === 'paid' || session.status === 'complete'

      if (userId && paid) {
        const admin = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        )

        // Fixed window: now + 12 months. Idempotent on Stripe retries.
        const expires = new Date()
        expires.setMonth(expires.getMonth() + ACCESS_MONTHS)

        const { error } = await admin
          .from('entitlements')
          .upsert(
            { user_id: userId, tier: 'paid', expires_at: expires.toISOString() },
            { onConflict: 'user_id' },
          )
        if (error) throw error

        // Upgrade the (anonymous) buyer to a permanent account by linking the
        // email Stripe collected, so they can log in later on any device.
        // Best-effort: never block the entitlement grant above.
        try {
          const email = session.customer_details?.email
          if (email) {
            const { error: linkErr } = await admin.auth.admin.updateUserById(userId, {
              email,
              email_confirm: true,
            })
            if (linkErr) {
              // Email already belongs to a returning customer: move the
              // entitlement onto their existing account instead.
              const { data: list } = await admin.auth.admin.listUsers()
              const existing = list?.users?.find(
                (u) => u.email?.toLowerCase() === email.toLowerCase() && u.id !== userId,
              )
              if (existing) {
                await admin.from('entitlements').upsert(
                  { user_id: existing.id, tier: 'paid', expires_at: expires.toISOString() },
                  { onConflict: 'user_id' },
                )
              }
            }
          }
        } catch (_) {
          // Linking is a convenience; the entitlement is already granted.
        }

        // Server-side Purchase → Meta Conversions API (CAPI), mirroring the
        // browser Pixel. Shares event_id (Stripe session id) with the browser
        // event so Meta deduplicates the two into one conversion. Strictly
        // best-effort: wrapped in try/catch AFTER the entitlement grant, so it
        // can never block or fail the access that was just granted.
        try {
          const capiToken = Deno.env.get('META_CAPI_TOKEN')
          if (capiToken) {
            const userData: Record<string, unknown> = {
              external_id: [await sha256Hex(userId.trim())],
            }
            const email = session.customer_details?.email
            if (email) {
              userData.em = [await sha256Hex(email.trim().toLowerCase())]
            }
            // fbp/fbc ble lagt i session.metadata av create-checkout (klienten
            // leser dem samtykke-gatet). Sendes USHASHET som enkeltstrenger per
            // CAPI-spec — dette er det som knytter Purchase til annonseklikket.
            if (session.metadata?.fbp) userData.fbp = session.metadata.fbp
            if (session.metadata?.fbc) userData.fbc = session.metadata.fbc
            // [2026-07-17 EMQ] Ekte klient-IP/UA fanget av create-checkout ved
            // checkout-tidspunkt (webhooken selv kommer fra Stripes servere,
            // så req-headers her er ubrukelige som match-nøkler).
            if (session.metadata?.capi_ip) userData.client_ip_address = session.metadata.capi_ip
            if (session.metadata?.capi_ua) userData.client_user_agent = session.metadata.capi_ua

            const payload: Record<string, unknown> = {
              data: [{
                event_name: 'Purchase',
                event_time: Math.floor(Date.now() / 1000),
                action_source: 'website',
                event_source_url: 'https://dronelappen.app/',
                event_id: session.id,
                user_data: userData,
                custom_data: { currency: 'NOK', value: 249 },
              }],
            }
            // Optional: route to Events Manager → Test Events during verification.
            // Set META_CAPI_TEST_EVENT_CODE to enable; unset it for production.
            const testCode = Deno.env.get('META_CAPI_TEST_EVENT_CODE')
            if (testCode) payload.test_event_code = testCode

            const resp = await fetch(
              `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(capiToken)}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              },
            )
            if (!resp.ok) {
              console.error('CAPI Purchase failed:', resp.status, await resp.text())
            }
          } else {
            console.error('CAPI: META_CAPI_TOKEN not set — skipping Purchase event')
          }
        } catch (err) {
          // CAPI is analytics only; never affect the entitlement grant.
          console.error('CAPI Purchase error:', (err as Error).message)
        }
      }
    }
  } catch (err) {
    // Return 500 so Stripe retries delivery.
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
