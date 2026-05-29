// newsletter-signup — public Edge Function for the DroneLappen home-page
// newsletter form. Adds the email to the Droneavisa MailerLite list. The
// MailerLite API token stays server-side (MAILERLITE_API_KEY secret) so it is
// never exposed to the browser, and the browser's CSP only needs to allow the
// Supabase domain (which it already does).
//
// Subscribers are created WITHOUT a forced status, so MailerLite's account
// double opt-in setting governs the flow: with double opt-in on, the new
// subscriber is 'unconfirmed' and MailerLite sends the confirmation email.
//
// Mirrors the idempotent lookup-then-create pattern of the existing Droneavisa
// WordPress plugin, and targets the same "Droneavisa subscribers" group.

const ML_API = 'https://connect.mailerlite.com/api'
const GROUP_ID = '184178221435061694' // "Droneavisa subscribers"

const ALLOWED_ORIGINS = new Set([
  'https://dronelappen.vercel.app',
  'https://dronelappen.app',
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

// Conservative server-side email check (the client validates too).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }
  if (req.method !== 'POST') {
    return json({ status: 'error', message: 'Method not allowed' }, 405, cors)
  }

  const token = Deno.env.get('MAILERLITE_API_KEY')
  if (!token) {
    return json({ status: 'error', message: 'Serverkonfigurasjon mangler.' }, 500, cors)
  }

  const body = await req.json().catch(() => ({}))
  const email = String(body?.email ?? '').trim().toLowerCase()

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return json({ status: 'error', message: 'Ugyldig e-postadresse' }, 400, cors)
  }

  const mlHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  try {
    // 1) Idempotent lookup by email.
    const lookup = await fetch(`${ML_API}/subscribers/${encodeURIComponent(email)}`, {
      headers: mlHeaders,
    })

    if (lookup.status === 200) {
      // Already on file — make sure they're in our group, then signal duplicate.
      const data = await lookup.json().catch(() => null)
      const subId = data?.data?.id
      if (subId) {
        await fetch(`${ML_API}/subscribers/${encodeURIComponent(subId)}/groups/${GROUP_ID}`, {
          method: 'POST',
          headers: mlHeaders,
        }).catch(() => {})
      }
      return json({ status: 'ok', duplicate: true }, 200, cors)
    }

    if (lookup.status !== 404) {
      const detail = await lookup.text().catch(() => '')
      console.error('mailerlite lookup failed', lookup.status, detail.slice(0, 200))
      return json({ status: 'error', message: 'Noe gikk galt. Prøv igjen senere.' }, 502, cors)
    }

    // 2) Create + assign to group in one call. No `status` field, so the
    //    account's double opt-in setting decides whether a confirmation email
    //    is sent.
    const create = await fetch(`${ML_API}/subscribers`, {
      method: 'POST',
      headers: mlHeaders,
      body: JSON.stringify({ email, groups: [GROUP_ID] }),
    })

    if (create.ok) {
      return json({ status: 'ok', duplicate: false }, 200, cors)
    }

    const detail = await create.text().catch(() => '')
    console.error('mailerlite create failed', create.status, detail.slice(0, 200))
    return json({ status: 'error', message: 'Noe gikk galt. Prøv igjen senere.' }, 502, cors)
  } catch (err) {
    console.error('newsletter-signup error', (err as Error).message)
    return json({ status: 'error', message: 'Noe gikk galt. Prøv igjen senere.' }, 500, cors)
  }
})
