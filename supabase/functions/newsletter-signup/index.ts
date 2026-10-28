// newsletter-signup — public Edge Function for the DroneLappen home-page
// newsletter form. Adds the email to the Droneavisa MailerLite list. The
// MailerLite API token stays server-side (MAILERLITE_API_KEY secret) so it is
// never exposed to the browser, and the browser's CSP only needs to allow the
// Supabase domain (which it already does).
//
// Droneavisa newsletter subscribers are created WITHOUT a forced status, so
// MailerLite's account double opt-in setting governs: the new subscriber is
// 'unconfirmed' and MailerLite sends the confirmation email. Quiz leads are
// created with status 'active' instead — see the note by groupForSource.
//
// Mirrors the idempotent lookup-then-create pattern of the existing Droneavisa
// WordPress plugin. The optional `source` in the request body picks the target
// group: quiz-taker email captures (Results / Paywall screens) go to the
// "DroneLappen leads" group so they can get an exam-focused nurture, while the
// home-page newsletter form (no/unknown source) stays on "Droneavisa subscribers".
//
// Bonus på muren (v13, 14.10.2026, Frode 05.10): source 'quiz_paywall' med en
// gyldig bruker-JWT i Authorization (også anonym bruker) gir en rad i
// lead_bonus etter at MailerLite-kallet har lyktes (også ved duplicate), og
// svaret får `bonus: true`. get-questions leser raden og gir 10 A2-spørsmål
// til. Uten JWT, eller med anon-nøkkelen som før: som i dag, `bonus: false`.
// Feil ved upsert skal aldri ødelegge selve påmeldingen.
//
// Ettklikk for innloggede gratisbrukere (v14, 28.10.2026, Frode 28.10): source
// 'quiz_paywall_login' uten e-post i body. E-posten hentes fra JWT-ens bruker
// (må være en ekte, ikke-anonym bruker med e-post), resten er som
// quiz_paywall: MailerLite-gruppa «DroneLappen leads» med lead_source, rad i
// lead_bonus (source = 'quiz_paywall_login') og `bonus: true`. Anonym bruker
// eller bruker uten e-post får 400. Appen kan ikke velge e-post selv.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const ML_API = 'https://connect.mailerlite.com/api'
const GROUP_DRONEAVISA = '184178221435061694' // "Droneavisa subscribers" (home newsletter)
const GROUP_LEADS = '192882163047204155' // "DroneLappen leads" (quiz email capture)

// Map an optional client-supplied source to a MailerLite group. Unknown or
// absent source falls back to the Droneavisa list so the home form is unchanged.
function groupForSource(source: string): string {
  switch (source) {
    case 'quiz':
    case 'quiz_results':
    case 'quiz_paywall':
    case 'quiz_paywall_login':
    // Lead-annonsens landingsside (/a2-ovingsplan) — e-post før quiz.
    case 'quiz_landing':
      return GROUP_LEADS
    default:
      return GROUP_DRONEAVISA
  }
}

// Quiz leads are created with status 'active', deliberately overriding the
// account's "Double opt-in for API and integrations" setting. Why: MailerLite's
// confirmation email is English, says "our newsletter", and is NOT editable on
// the free plan — a Norwegian pilot who just asked for an "øvingsplan" would
// get an English newsletter-confirmation and bin it, so the nurture would never
// start. They gave explicit consent on our form (with a personvern link), so we
// start the Norwegian sequence immediately instead. Same deliberate override the
// stripe-webhook uses for buyers. The Droneavisa newsletter is untouched: no
// status field there, so the account's double opt-in still governs it.

// Attribusjon på leadet. Uten dette kan vi ikke svare på «hvilken kanal
// skaffet denne e-postadressen?» — 04.08.2026 sto Meta-lead-annonsen med
// 372 kr brukt og 0 registrerte leads i Metas egen måling, mens lista vokste
// med 16 personer samme uke. Ingen av delene kunne kobles sammen.
//
// Bare disse fire nøklene slippes gjennom, og hver verdi kappes til 255 tegn
// (MailerLites grense for tekstfelt). Feltene må finnes i MailerLite-kontoen
// på forhånd; de ble opprettet 04.08.2026.
const ATTRIBUTION_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'landing_path']

// Hvilket skjema som faktisk fanget adressen (22.09.2026. Feltet `lead_source`
// ble opprettet i MailerLite samme dag). Alle tre inngangene — resultatskjermen,
// betalingsmuren og /a2-ovingsplan — skriver til samme gruppe, så gruppa kunne
// bare svare på HVOR MANGE leads vi fikk, ikke hvilket skjema som skaffet dem.
// Uten det kan man ikke si om mur-skjemaet leverer i det hele tatt: 29 brukere
// forlot muren siden 13.08, og gruppa har 29 abonnenter totalt, men de to
// tallene har ingen påvist sammenheng.
//
// Samme regel som attribusjonen: settes BARE ved opprettelse. Den som først
// ga adressen på muren og siden melder seg på fra resultatskjermen skal
// fortsatt telle som et mur-lead — ellers måler vi siste berøring.
// `groupForSource` er fasiten på hvilke verdier som er gyldige; er kilden
// ukjent havner leadet uansett i Droneavisa-gruppa og feltet settes ikke.

function cleanAttribution(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, string> = {}
  for (const key of ATTRIBUTION_KEYS) {
    const val = (raw as Record<string, unknown>)[key]
    if (typeof val !== 'string') continue
    const trimmed = val.trim().slice(0, 255)
    if (trimmed) out[key] = trimmed
  }
  return out
}

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

// Rate limit per IP: maks 5 forsøk per time, håndhevet av Postgres-funksjonen
// newsletter_rate_check (migrasjon 011) — grensen justeres der, uten redeploy.
// Bakgrunn (sikkerhetsgjennomgangen 08.08.2026): endepunktet er åpent og kunne
// spammes med vilkårlige e-poster; duplicate-flagget beholdes bevisst (UI-et
// bruker det), så rate-limiten er det som gjør enumerering og innmeldings-spam
// upraktisk. Teller ALLE forsøk, også ugyldige e-poster. Feiler ÅPENT: er
// databasen utilgjengelig skal påmelding fortsatt virke — rate-limiten
// beskytter, den er ikke forretningskritisk.
async function rateLimitOk(req: Request): Promise<boolean> {
  try {
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'ukjent'
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resp = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/newsletter_rate_check`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_ip: ip }),
    })
    if (!resp.ok) {
      console.error('newsletter rate-check feilet', resp.status)
      return true
    }
    return (await resp.json()) === true
  } catch (err) {
    console.error('newsletter rate-check error', (err as Error).message)
    return true
  }
}

// Hvem som skal ha bonusen: brukeren bak JWT-en i Authorization, men bare
// for mur-kildene. Anon-nøkkelen (som de andre skjemaene sender) har ingen
// bruker, så getUser gir null og ingen bonus. Null ved feil.
const BONUS_SOURCES = new Set(['quiz_paywall', 'quiz_paywall_login'])
type BonusUser = { id: string; email: string | null; anonymous: boolean }
async function bonusUser(req: Request, source: string): Promise<BonusUser | null> {
  if (!BONUS_SOURCES.has(source)) return null
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null
  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { data: { user } } = await admin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user?.id) return null
    return { id: user.id, email: user.email ?? null, anonymous: user.is_anonymous === true }
  } catch (err) {
    console.error('lead_bonus getUser feilet', (err as Error).message)
    return null
  }
}

// Skriv raden i lead_bonus. Idempotent (upsert på user_id), og en feil her
// skal ikke velte påmeldingen: logg og svar false.
async function grantBonus(userId: string | null, source: string): Promise<boolean> {
  if (!userId) return false
  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { error } = await admin
      .from('lead_bonus')
      .upsert({ user_id: userId, source }, { onConflict: 'user_id', ignoreDuplicates: true })
    if (error) {
      console.error('lead_bonus upsert feilet', error.message)
      return false
    }
    return true
  } catch (err) {
    console.error('lead_bonus upsert error', (err as Error).message)
    return false
  }
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

  if (!(await rateLimitOk(req))) {
    return json({ status: 'error', message: 'For mange forsøk. Prøv igjen om en time.' }, 429, cors)
  }

  const body = await req.json().catch(() => ({}))
  let email = String(body?.email ?? '').trim().toLowerCase()
  const source = String(body?.source ?? '').trim().toLowerCase()
  const groupId = groupForSource(source)
  const isQuizLead = groupId === GROUP_LEADS
  const attribution = cleanAttribution(body?.attribution)

  // Slås opp før MailerLite-kallene, skrives først etter at de har lyktes.
  const bUser = await bonusUser(req, source)

  // Ettklikk (v14): innlogget gratisbruker sender ingen e-post, serveren
  // bruker kontoens. Body-e-post ignoreres for denne kilden, så appen kan
  // ikke melde på en annen adresse enn brukerens egen.
  if (source === 'quiz_paywall_login') {
    if (!bUser || bUser.anonymous || !bUser.email) {
      return json({ status: 'error', message: 'Logg inn med en konto som har e-post for å få bonusen.' }, 400, cors)
    }
    email = bUser.email.trim().toLowerCase()
  }

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
        // Quiz leads: activate BEFORE the group join. An 'unconfirmed' subscriber
        // (e.g. someone who once started a Droneavisa signup and never confirmed)
        // would otherwise join the group while inactive and never trigger the
        // nurture. Order matters here.
        if (isQuizLead) {
          await fetch(`${ML_API}/subscribers/${encodeURIComponent(subId)}`, {
            method: 'PUT',
            headers: mlHeaders,
            body: JSON.stringify({ status: 'active' }),
          }).catch(() => {})
        }
        await fetch(`${ML_API}/subscribers/${encodeURIComponent(subId)}/groups/${groupId}`, {
          method: 'POST',
          headers: mlHeaders,
        }).catch(() => {})
      }
      // Bonusen gis også ved duplicate: samme person på ny enhet skal ikke
      // straffes (briefen 05.10, edge case).
      return json({ status: 'ok', duplicate: true, bonus: await grantBonus(bUser?.id ?? null, source) }, 200, cors)
    }

    if (lookup.status !== 404) {
      const detail = await lookup.text().catch(() => '')
      console.error('mailerlite lookup failed', lookup.status, detail.slice(0, 200))
      return json({ status: 'error', message: 'Noe gikk galt. Prøv igjen senere.' }, 502, cors)
    }

    // 2) Create + assign to group in one call. Droneavisa: no `status` field, so
    //    the account's double opt-in decides (confirmation email sent). Quiz
    //    leads: status 'active' so the Norwegian nurture starts right away
    //    (see the note by groupForSource).
    //    Attribusjon settes BARE ved opprettelse. En som melder seg på igjen
    //    skal beholde kanalen som faktisk skaffet dem første gang — ellers
    //    ville siste berøring overskrive opprinnelsen, og da måler vi bare
    //    hvem som kom tilbake sist.
    const createBody: Record<string, unknown> = { email, groups: [groupId] }
    if (isQuizLead) createBody.status = 'active'
    const fields: Record<string, string> = { ...attribution }
    if (isQuizLead && source) fields.lead_source = source.slice(0, 255)
    if (Object.keys(fields).length) createBody.fields = fields

    const create = await fetch(`${ML_API}/subscribers`, {
      method: 'POST',
      headers: mlHeaders,
      body: JSON.stringify(createBody),
    })

    if (create.ok) {
      return json({ status: 'ok', duplicate: false, bonus: await grantBonus(bUser?.id ?? null, source) }, 200, cors)
    }

    const detail = await create.text().catch(() => '')
    console.error('mailerlite create failed', create.status, detail.slice(0, 200))
    return json({ status: 'error', message: 'Noe gikk galt. Prøv igjen senere.' }, 502, cors)
  } catch (err) {
    console.error('newsletter-signup error', (err as Error).message)
    return json({ status: 'error', message: 'Noe gikk galt. Prøv igjen senere.' }, 500, cors)
  }
})
