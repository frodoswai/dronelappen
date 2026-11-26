import Stripe from 'npm:stripe@17'
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Creates a Stripe Checkout Session for the authenticated user.
// One-time payment that, once paid, grants 12 months of "paid"
// entitlement via the stripe-webhook function.

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-12-18.acacia',
})

// TO PRISNIVÅER fra 1. desember 2026 (bygd 26.11.2026, Frodes beslutninger
// 4/10, 13/10 og 24/10, se MacMiniHub/notes/briefs/
// 2026-10-24-dronelappen-to-nivaa-a2-sts-bygging.md).
//
//   Til og med 30.11: ett kjøp, 349 kr, STS inkludert (lanseringspris).
//   Fra 1.12:  a2          349 kr  A2 med A1/A3, uten STS
//              a2_sts      449 kr  A2, A1/A3 og STS
//              sts_upgrade 149 kr  STS-påbygg for kunde med aktiv A2.
//                                  Arver utløpsdatoen, ingen ny periode.
//
// Byttet er datostyrt og ikke manuelt av en grunn: datoen er annonsert, så
// vi er forpliktet til å gjennomføre den (mfl. § 7). Et manuelt bytte er
// avhengig av at noen husker å deploye på riktig dag.
//
// DENNE FILEN ER KILDEN TIL SANNHET for hva kunden faktisk belastes.
// src/lib/pricing.js speiler dato og priser for UI-et, og stripe-webhook
// har samme STS_TIER_AT. Endres én, MÅ de andre endres i samme commit.
//
// Prisskiftet 249 -> 349 (15.08.2026) er historie og ryddet bort herfra;
// 249-prisen (price_1Tl83aK4vmLGBhyM4NdiXYbf) står urørt i Stripe.
const STS_TIER_AT = Date.parse('2026-12-01T00:00:00+01:00')

type Plan = 'a2' | 'a2_sts' | 'sts_upgrade'
type PriceRef = { id: string; amount: number }

// 349-prisen fra 15.08.2026. Til og med 30.11 er STS med i den. Fra 1.12 er
// den A2-prisen: samme pris-ID videre (Frode 26.11.2026), for 349 kr for A2
// er hovedtilbudet og skal ikke bytte pris-ID.
const PRICE_LAUNCH: PriceRef = { id: 'price_1TwqHTK4vmLGBhyMR5jkABrl', amount: 349 }
// Fra 1.12: pakken og påbygget har egne Stripe-produkter (opprettet 26.11.2026).
const PRICES: Record<Plan, PriceRef> = {
  a2: PRICE_LAUNCH,
  a2_sts: { id: 'price_1Ufy60K4vmLGBhyMMYZYzh8w', amount: 449 },
  sts_upgrade: { id: 'price_1Ufy61K4vmLGBhyMYgbxrLSt', amount: 149 },
}

function stsTierActive(now = Date.now()) {
  return now >= STS_TIER_AT
}
const META_PIXEL_ID = '1025209573360224' // Droneavisa Pixel / CAPI dataset

// Klikk-ID-parametrene Google bruker. gclid er den vanlige; gbraid/wbraid
// brukes for iOS- og YouTube-trafikk der gclid ikke settes.
const GOOGLE_CLICK_PARAMS = new Set(['gclid', 'gbraid', 'wbraid'])

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

    // Body leses én gang her (planvalget trengs før sperren under).
    const rawBody: Record<string, unknown> | null = await req
      .json()
      .then((b) => (b && typeof b === 'object' ? (b as Record<string, unknown>) : null))
      .catch(() => null)

    // Planvalg. Før STS_TIER_AT finnes bare ett kjøp (349 kr med STS), uansett
    // hva klienten sender. Etter: mangler plan, er A2 trygg standard.
    const tierActive = stsTierActive()
    let plan: Plan = tierActive ? 'a2' : 'a2_sts'
    if (tierActive) {
      const rp = rawBody?.plan
      if (rp === 'a2' || rp === 'a2_sts' || rp === 'sts_upgrade') plan = rp
    }

    // 15.10.2026: betalt kunde skal aldri få en ny Stripe-økt. 14/10 traff en
    // kunde muren igjen 72 min etter kjøpet (fanen hadde aldri fått
    // ?betalt=ok) og klikket kjøp på nytt; bare flaks hindret dobbelttrekk.
    // Klienten sjekker også, men dette er sperren som holder uansett hva
    // fanen tror. 409 + already_paid: klienten leser tilgangen på nytt.
    //
    // 26.11.2026: ett unntak fra 1.12, STS-påbygget. Betalt kunde uten STS
    // slipper gjennom med plan = sts_upgrade, og bare da.
    {
      const { data: ent } = await admin
        .from('entitlements')
        .select('tier, expires_at, sts')
        .eq('user_id', user.id)
        .maybeSingle()
      const paid =
        ent?.tier === 'paid' &&
        (!ent.expires_at || new Date(ent.expires_at) > new Date())
      const hasSts = paid && ent?.sts === true
      const json409 = (error: string, message: string) =>
        new Response(JSON.stringify({ error, message }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      if (plan === 'sts_upgrade') {
        if (!paid) {
          return json409('upgrade_requires_a2', 'STS-påbygget krever at du har aktiv A2-tilgang.')
        }
        if (hasSts) {
          return json409('already_paid', 'Du har allerede full tilgang.')
        }
        // betalt + uten STS + sts_upgrade: videre til Stripe.
      } else if (paid) {
        if (tierActive && !hasSts && plan === 'a2_sts') {
          // Skal ikke betale 449 for noe som koster 149 for dem.
          return json409(
            'use_sts_upgrade',
            'Du har allerede A2. STS legger du til som påbygg for 149 kr.',
          )
        }
        return json409(
          'already_paid',
          hasSts ? 'Du har allerede full tilgang.' : 'Du har allerede A2-tilgang.',
        )
      }
    }

    // Acquisition attribution (UTM/referrer) sent from the client. Attach it to
    // both the session and the PaymentIntent so each sale's source is queryable
    // in Stripe (which channel: feed / reels / retargeting / organic).
    const meta: Record<string, string> = { user_id: user.id }
    // Google klikk-ID fra denne fane-økta (gclid/gbraid/wbraid). Sendes
    // separat fra attribution fordi den bare gjelder her og nå. Se
    // src/lib/attribution.js for hvorfor den ikke lagres på enheten.
    let googleClick: { name: string; value: string } | null = null
    // 13.10.2026: e-post fra dialogen før Stripe (anonyme kjøpere) og et
    // frivillig ja til én påminnelse ved forlatt kjøp. Påminnelsen sendes av
    // MacMiniHub/scripts/dronelappen_checkout_recovery.py, som leser
    // metadata.remind og customer_details.email på utløpte økter.
    let bodyEmail = ''
    let remind = false
    // [2026-11-11] Samtykke til markedsføring (samtykkebanneren). Uten det
    // sendes ingenting til Meta, verken herfra eller fra stripe-webhook, og
    // IP/User-Agent legges ikke i Stripe-metadata. Personvernerklæringen lover
    // at Meta bare brukes ved samtykke.
    let metaConsent = false
    try {
      const body = rawBody
      if (body && typeof body === 'object') {
        const e = (body as Record<string, unknown>).email
        if (typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim()) && e.length <= 254) {
          bodyEmail = e.trim().toLowerCase()
        }
        remind = (body as Record<string, unknown>).remind === 1 || (body as Record<string, unknown>).remind === '1'
        const mc = (body as Record<string, unknown>).meta_consent
        metaConsent = mc === true || mc === 1 || mc === '1'
      }
      const attr = body && typeof body === 'object' ? (body as Record<string, unknown>).attribution : null
      if (attr && typeof attr === 'object') {
        for (const [k, v] of Object.entries(attr as Record<string, unknown>)) {
          if (v == null || v === '') continue
          meta[String(k).slice(0, 40)] = String(v).slice(0, 450)
        }
      }
      const gc = body && typeof body === 'object' ? (body as Record<string, unknown>).google_click : null
      if (gc && typeof gc === 'object') {
        const name = String((gc as Record<string, unknown>).name || '')
        const value = String((gc as Record<string, unknown>).value || '')
        // Allowlist på navnet og streng tegnklasse på verdien: denne strengen
        // går rett inn i en URL vi selv sender brukeren tilbake til, så den
        // skal aldri kunne bære annet enn en klikk-ID.
        if (GOOGLE_CLICK_PARAMS.has(name) && /^[A-Za-z0-9_.-]{1,200}$/.test(value)) {
          googleClick = { name, value }
          meta[name] = value
        }
      }
    } catch {
      /* no/invalid body - proceed with user_id only */
    }

    // 26.10.2026: klienten sendte ingen klikk-ID? Slå opp nyeste fra
    // visit_events (migrasjon 028). iPad-salget 25/10 kjøpte i en ny fane
    // 1 t 51 min etter annonseklikket; fanens minne var tomt, og Google
    // talte aldri salget. Klienten vinner når den sender noe. 30 dager er
    // Googles vanlige klikkvindu. Samme allowlist og regex som over, fordi
    // verdien går rett inn i success_url. Oppslaget er best-effort: en feil
    // her skal aldri stoppe betalingen.
    let clickIdSource = googleClick ? 'body' : 'none'
    if (!googleClick) {
      try {
        const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
        const { data: row } = await admin
          .from('visit_events')
          .select('click_id_name, click_id')
          .eq('user_id', user.id)
          .not('click_id', 'is', null)
          .gt('created_at', since)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        const name = String(row?.click_id_name || '')
        const value = String(row?.click_id || '')
        if (GOOGLE_CLICK_PARAMS.has(name) && /^[A-Za-z0-9_.-]{1,200}$/.test(value)) {
          googleClick = { name, value }
          meta[name] = value
          clickIdSource = 'visit_events'
        }
      } catch (err) {
        console.error('click_id lookup failed:', (err as Error).message)
      }
    }
    // Én linje i Supabase-loggen: hvor ofte trengs oppslaget?
    console.log(`click_id_source=${clickIdSource}`)

    // Nivået i både session- og payment_intent-metadata: stripe-webhook leser
    // det, og salget kan leses per nivå i Stripe. Settes HER, etter
    // attribution-løkka, så et felt fra klienten aldri kan overstyre det.
    meta.plan = plan

    // [2026-07-17 EMQ] Ekte klient-IP og User-Agent fanges HER (kallet kommer
    // fra kjøperens browser) og lagres i session-metadata, slik at
    // stripe-webhookens CAPI Purchase (som kommer fra Stripes servere) kan
    // sende dem som match-nøkler. Løfter Purchase-EMQ (var 4.6: ip/ua 0 %).
    // Kun i session-metadata, ikke payment_intent (attribusjon holdes ren der).
    const clientIp = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim()
    const clientUa = (req.headers.get('user-agent') || '').slice(0, 450)
    const sessionMeta: Record<string, string> = { ...meta }
    // Flagget settes bare her, aldri fra attribution-feltene klienten sender.
    delete sessionMeta.meta_consent
    if (metaConsent) {
      sessionMeta.meta_consent = '1'
      if (clientIp) sessionMeta.capi_ip = clientIp
      if (clientUa) sessionMeta.capi_ua = clientUa
    } else {
      delete sessionMeta.fbp
      delete sessionMeta.fbc
    }
    if (remind && (user.email || bodyEmail)) sessionMeta.remind = '1'

    const price = tierActive ? PRICES[plan] : PRICE_LAUNCH

    // Retur-URL fra Stripe. {CHECKOUT_SESSION_ID} utvides av Stripe.
    //
    // Klikk-IDen henges på fordi kjøpskonverteringen fyres i PaymentReturn,
    // altså PÅ denne siden. Har brukeren godtatt cookies, kjenner gtag
    // klikket fra _gcl_aw uansett. Har han ikke det, er URL-en eneste bærer
    // (url_passthrough), og den overlever ikke turen ut til Stripe med mindre
    // vi tar den med tilbake selv. Uten dette ble to av tre ads-salg i august
    // aldri talt i Google Ads (31.08.2026).
    let successUrl = 'https://dronelappen.app/?betalt=ok&s={CHECKOUT_SESSION_ID}'
    if (googleClick) {
      successUrl += `&${googleClick.name}=${encodeURIComponent(googleClick.value)}`
    }
    // Fra 1.12: nivået med tilbake, så kvitteringen kan vise riktig beløp.
    // Kun til visning. Tilgangen avgjøres av webhooken, aldri av URL-en.
    if (tierActive) successUrl += `&plan=${plan}`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: price.id, quantity: 1 }],
      // {CHECKOUT_SESSION_ID} is expanded by Stripe on redirect; PaymentReturn
      // reads it as `s` and uses it as the Pixel/CAPI dedup event_id.
      success_url: successUrl,
      cancel_url: 'https://dronelappen.app/?betalt=avbrutt',
      client_reference_id: user.id,
      // Anonymous users have email "" (not null), so use || not ?? — otherwise
      // Stripe rejects the empty string. Stripe then collects the email itself.
      customer_email: user.email || bodyEmail || undefined,
      metadata: sessionMeta,
      // Forlatt kjøp: Stripe lager en gjenopprettings-URL (gyldig 30 dager
      // etter utløp) som påminnelsen lenker til. Økta utløper som før (24 t).
      after_expiration: { recovery: { enabled: true } },
      payment_intent_data: { metadata: meta },
      locale: 'nb',
      allow_promotion_codes: true,
      // 03.10.2026: alle besøkende har en anonym sesjon, så en betalende
      // kunde på en ny enhet kan havne her uten å være logget inn (Eivind,
      // STS-testen). Teksten står rett over betal-knappen hos Stripe.
      // Stripe godtok parameteren med samme API-versjon før deploy (testøkt
      // opprettet og utløpt 03.10, ubetalt).
      custom_text: {
        submit: {
          message:
            plan === 'sts_upgrade'
              ? 'STS-påbygget legges til tilgangen du allerede har, og gjelder til samme dato som den.'
              : tierActive
                ? 'Har du allerede tilgang? Da skal du ikke betale på nytt. Gå tilbake til dronelappen.app og logg inn med e-posten du kjøpte med.'
                : 'Har du allerede full tilgang? Da skal du ikke betale på nytt. Gå tilbake til dronelappen.app og logg inn med e-posten du kjøpte med.',
        },
      },
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
      if (capiToken && metaConsent) {
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
