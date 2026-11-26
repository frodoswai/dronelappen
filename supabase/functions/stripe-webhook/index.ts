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

// To prisnivåer fra 1.12.2026 (bygd 26.11.2026). Samme tidspunkt som i
// create-checkout og src/lib/pricing.js; endres ett sted, endres alle.
// create-checkout legger nivået i session.metadata.plan:
//   a2          -> tier paid, sts false, 12 mnd
//   a2_sts      -> tier paid, sts true,  12 mnd
//   sts_upgrade -> sts true, expires_at RØRES IKKE (arver A2-kjøpets utløp)
// Alle økter OPPRETTET før STS_TIER_AT gir sts = true uansett plan: de ble
// solgt med STS inkludert. Det er session.created (Stripes tidspunkt) som
// teller, ikke når webhooken kommer, så et kjøp påbegynt 30.11 kl. 23:50 og
// betalt 00:05 får det kunden ble lovet.
const STS_TIER_AT = Date.parse('2026-12-01T00:00:00+01:00')

// Gir 12 måneders tilgang. STS tas aldri fra en rad som har det og fortsatt
// er aktiv: en kunde som kjøper A2 på nytt fra en annen enhet (gjenkjøper-
// grenen) skal ikke miste STS han alt har betalt for, og en forsinket
// Stripe-retry av et A2-kjøp skal ikke oppheve et påbygg kjøpt etterpå.
// deno-lint-ignore no-explicit-any
async function grantAccess(admin: any, uid: string, sts: boolean, expiresIso: string) {
  let keepSts = sts
  if (!keepSts) {
    const { data: cur } = await admin
      .from('entitlements')
      .select('tier, sts, expires_at')
      .eq('user_id', uid)
      .maybeSingle()
    if (
      cur?.tier === 'paid' &&
      cur.sts === true &&
      (!cur.expires_at || new Date(cur.expires_at) > new Date())
    ) {
      keepSts = true
    }
  }
  return await admin
    .from('entitlements')
    .upsert(
      { user_id: uid, tier: 'paid', sts: keepSts, expires_at: expiresIso },
      { onConflict: 'user_id' },
    )
}

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

        const plan = session.metadata?.plan
        const createdMs = session.created ? session.created * 1000 : Date.now()
        const beforeTier = createdMs < STS_TIER_AT
        // Påbygg finnes bare etter byttet. Før det er alt et fullt kjøp.
        const isUpgrade = !beforeTier && plan === 'sts_upgrade'
        const sts = beforeTier || plan === 'a2_sts' || plan === 'sts_upgrade'

        if (isUpgrade) {
          // STS-påbygg: bare flagget. expires_at skal ALDRI skrives i denne
          // grenen. Idempotent på Stripe-retry.
          const { data: upd, error } = await admin
            .from('entitlements')
            .update({ sts: true })
            .eq('user_id', userId)
            .eq('tier', 'paid')
            .select('user_id')
          if (error) throw error
          if (!upd || upd.length === 0) {
            // Skal ikke skje (create-checkout krever aktiv A2). Kunden har
            // betalt, så gi full tilgang heller enn ingenting, og logg det.
            console.error(`sts_upgrade uten betalt rad for ${userId}: gir 12 mnd med STS`)
            const { error: fbErr } = await grantAccess(admin, userId, true, expires.toISOString())
            if (fbErr) throw fbErr
          }
        } else {
          const { error } = await grantAccess(admin, userId, sts, expires.toISOString())
          if (error) throw error
        }
        console.log(`plan=${plan ?? 'mangler'} before_tier=${beforeTier} sts=${sts} upgrade=${isUpgrade}`)

        // Upgrade the (anonymous) buyer to a permanent account by linking the
        // email Stripe collected, so they can log in later on any device.
        // Best-effort: never block the entitlement grant above.
        // Hoppes over for STS-påbygg: kunden er alt en fast konto, og
        // gjenkjøper-grenen under skriver expires_at.
        if (!isUpgrade) try {
          const email = session.customer_details?.email
          if (email) {
            const { error: linkErr } = await admin.auth.admin.updateUserById(userId, {
              email,
              email_confirm: true,
            })
            if (linkErr) {
              // Email already belongs to a returning customer: move the
              // entitlement onto their existing account instead.
              // listUsers er paginert (50 per side som standard), og basen har
              // 1600+ rader (mest anonyme engangs-sesjoner) — ett usidet kall
              // fant derfor aldri kunden, og gjenkjøpere ble stående uten
              // tilgang på sin egen konto. Søk gjennom alle sider.
              let existing: { id: string } | undefined
              for (let page = 1; page <= 100 && !existing; page++) {
                const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
                const users = list?.users ?? []
                existing = users.find(
                  (u) => u.email?.toLowerCase() === email.toLowerCase() && u.id !== userId,
                )
                if (users.length < 1000) break
              }
              if (existing) {
                await grantAccess(admin, existing.id, sts, expires.toISOString())
              }
            }
          }
        } catch (_) {
          // Linking is a convenience; the entitlement is already granted.
        }

        // MailerLite: legg kjøperen i gruppa «DroneLappen kunder». Det er den
        // gruppa som trigger automasjonen med innloggingsinstruksen.
        //
        // ⚠️ DENNE BLOKKA HAR FORSVUNNET FØR. Den lå i deployet v8 (verifisert
        // live 2026-07-09) men manglet i repoet, så en redeploy fra repo rundt
        // 2026-07-15 slettet den uten at noen merket det — og fem betalende
        // kunder fikk aldri innloggingsinstruksen. Nå ligger den i repoet.
        // IKKE fjern den, og sammenlign alltid mot deployet versjon
        // (get_edge_function) før du deployer denne funksjonen.
        //
        // status 'active' er bevisst: MailerLites double opt-in-bekreftelse er
        // engelsk og ikke redigerbar, og dette er transaksjonell e-post til en
        // kunde som nettopp har betalt. De skal ikke måtte bekrefte noe for å
        // få vite hvordan de logger inn.
        //
        // Hoppes over for STS-påbygg (26.11.2026): kunden står alt i gruppa,
        // og velkomstløpet skal ikke kunne trigges på nytt av et påbygg.
        if (!isUpgrade) try {
          const mlToken = Deno.env.get('MAILERLITE_API_KEY')
          const buyerEmail = session.customer_details?.email
          if (mlToken && buyerEmail) {
            const ML_API = 'https://connect.mailerlite.com/api'
            const GROUP_KUNDER = '192513298163304352' // «DroneLappen kunder»
            const GROUP_LEADS = '192882163047204155' // «DroneLappen leads»
            const mlHeaders = {
              Authorization: `Bearer ${mlToken}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            }
            const addr = buyerEmail.trim().toLowerCase()

            const lookup = await fetch(
              `${ML_API}/subscribers/${encodeURIComponent(addr)}`,
              { headers: mlHeaders },
            )

            if (lookup.status === 200) {
              const data = await lookup.json().catch(() => null)
              const subId = data?.data?.id
              if (subId) {
                // Aktiver FØR gruppe-innmelding: en 'unconfirmed' abonnent
                // (f.eks. noen som en gang startet en Droneavisa-påmelding og
                // aldri bekreftet) ville ellers bli med i gruppa uten å trigge
                // automasjonen. Rekkefølgen betyr noe.
                await fetch(`${ML_API}/subscribers/${encodeURIComponent(subId)}`, {
                  method: 'PUT',
                  headers: mlHeaders,
                  body: JSON.stringify({ status: 'active' }),
                }).catch(() => {})
                await fetch(
                  `${ML_API}/subscribers/${encodeURIComponent(subId)}/groups/${GROUP_KUNDER}`,
                  { method: 'POST', headers: mlHeaders },
                ).catch(() => {})

                // ...og UT av lead-gruppa, som stopper salgs-nurturen.
                //
                // 25.07.2026: Tore la igjen e-posten i LeadCapture 21:28 og
                // betalte 21:32 — fire minutter. Han sto da i BÅDE leads og
                // kunder, og lead-løpets tredje e-post ber mottakeren kjøpe
                // før prisen går opp 15.08. Altså: vi ville bedt en kunde om
                // å kjøpe det han nettopp hadde kjøpt.
                //
                // Å selge noe til noen som allerede eier det er ikke bare
                // pinlig, det er å be dem melde seg av. Kjøpere skal ikke ha
                // mindre innhold enn leads — de skal ha det samme innholdet
                // uten salget, i kjøper-automasjonen. Denne linja tar dem ut
                // av feil løp; kjøper-løpet er der de hører hjemme.
                await fetch(
                  `${ML_API}/subscribers/${encodeURIComponent(subId)}/groups/${GROUP_LEADS}`,
                  { method: 'DELETE', headers: mlHeaders },
                ).catch(() => {})
              }
            } else if (lookup.status === 404) {
              const create = await fetch(`${ML_API}/subscribers`, {
                method: 'POST',
                headers: mlHeaders,
                body: JSON.stringify({
                  email: addr,
                  status: 'active',
                  groups: [GROUP_KUNDER],
                }),
              })
              if (!create.ok) {
                const detail = await create.text().catch(() => '')
                console.error('MailerLite kunde-create feilet:', create.status, detail.slice(0, 200))
              }
            } else {
              console.error('MailerLite kunde-lookup feilet:', lookup.status)
            }
          } else if (!mlToken) {
            console.error('MAILERLITE_API_KEY mangler — kjøper får ikke velkomst-e-post')
          }
        } catch (err) {
          // Velkomst-e-posten er en bekvemmelighet; tilgangen er allerede gitt.
          console.error('MailerLite kunde-innmelding feilet:', (err as Error).message)
        }

        // Server-side Purchase → Meta Conversions API (CAPI), mirroring the
        // browser Pixel. Shares event_id (Stripe session id) with the browser
        // event so Meta deduplicates the two into one conversion. Strictly
        // best-effort: wrapped in try/catch AFTER the entitlement grant, so it
        // can never block or fail the access that was just granted.
        try {
          const capiToken = Deno.env.get('META_CAPI_TOKEN')
          // [2026-11-11] Bare når kjøperen samtykket til markedsføring ved
          // checkout (create-checkout setter metadata.meta_consent).
          if (capiToken && session.metadata?.meta_consent === '1') {
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
                custom_data: {
                  currency: (session.currency ?? 'nok').toUpperCase(),
                  // Les faktisk belastet beløp fra sesjonen framfor å hardkode
                  // prisen — da kan Purchase-verdien aldri komme i utakt med
                  // et prisskifte (249 -> 349 den 15.08.2026).
                  value: (session.amount_total ?? 24900) / 100,
                },
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
            console.log(capiToken ? 'CAPI: no marketing consent, Purchase not sent to Meta' : 'CAPI: META_CAPI_TOKEN not set, skipping Purchase event')
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
