import Stripe from 'npm:stripe@17'
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Receives Stripe webhook events. On checkout.session.completed it grants
// the user 12 months of "paid" entitlement. Signature-verified; no JWT.

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-12-18.acacia',
})

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
const ACCESS_MONTHS = 12

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
