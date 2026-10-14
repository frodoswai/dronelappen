// get-questions — henter spørsmål til appen (Quiz, Tempo) per eksamenstype.
//
// Kilden lå tidligere bare i Supabase (v9, 2026-07-08). Lagt inn i repo
// 30.09.2026 da v10 la til overlap_group i select (STS-banken, migrasjon 018).
// Deploy: Supabase MCP deploy_edge_function, verify_jwt=false (funksjonen
// slår selv opp brukeren fra Authorization-headeren).
//
// Gratis-brukere: A1/A3 er gratis i sin helhet fra 08.10.2026 (Frode 05.10),
// men bare når exam_type er eksakt 'A1_A3'. A2 gir fortsatt bare spørsmål med
// free_pool = true (maks 25). STS (A2_STS) har ingen gratis-pool (Frode
// 30.09.2026), så gratis-brukere får 0 STS-spørsmål og appen viser muren.
// free_pool-flagget på A1/A3 i databasen står urørt: det er veien tilbake.
//
// Bonus (v12, 14.10.2026, Frode 05.10): en gratisbruker på A2 som har gitt
// e-post på muren har en rad i lead_bonus (skrevet av newsletter-signup), og
// får da free_pool ELLER bonus_pool, maks FREE_LIMIT + BONUS_LIMIT = 35.
// Appen kan aldri be om bonusen selv: alt avgjøres av JWT-ens bruker.
// Svaret bærer `bonus` og `free_limit` (25 eller 35) så appen vet hvor muren
// står og om e-postskjemaet skal vises igjen.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const FREE_LIMIT = 25
const BONUS_LIMIT = 10

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

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { exam_type } = await req.json().catch(() => ({}))

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Check auth + entitlements
    const authHeader = req.headers.get('Authorization')
    let tier: 'free' | 'paid' = 'free'
    let userId: string | null = null

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await admin.auth.getUser(token)
      if (user) {
        userId = user.id
        const { data: ent } = await admin
          .from('entitlements')
          .select('tier, expires_at')
          .eq('user_id', user.id)
          .single()
        if (
          ent?.tier === 'paid' &&
          (!ent.expires_at || new Date(ent.expires_at) > new Date())
        ) {
          tier = 'paid'
        }
      }
    }

    // Bonus: bare gratis A2 med en gyldig bruker i JWT-en. En rad i lead_bonus
    // (skrevet av newsletter-signup etter e-post på muren) gir 10 til.
    // Anon-nøkkelen uten bruker gir ingen rad, og body-feltene spiller ingen
    // rolle her. Feil i oppslaget skal ikke velte spørsmålshentingen.
    let bonus = false
    if (tier === 'free' && exam_type === 'A2' && userId) {
      const { data: lb, error: lbErr } = await admin
        .from('lead_bonus')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle()
      if (lbErr) console.error('lead_bonus-oppslag feilet', lbErr.message)
      bonus = !!lb
    }
    const freeLimit = bonus ? FREE_LIMIT + BONUS_LIMIT : FREE_LIMIT

    // Build query using actual column names
    let query = admin
      .from('questions')
      .select('id, category_id, question_text, options, correct_option_id, explanation, difficulty, exam_type, overlap_group')
      .order('id')

    if (exam_type) {
      query = query.eq('exam_type', exam_type)
    }

    // A1/A3 unntas (08.10.2026): hele banken er gratis. Unntaket krever
    // eksakt 'A1_A3', så et manglende eller feilstavet exam_type begrenses
    // som før.
    if (tier === 'free' && exam_type !== 'A1_A3') {
      // Kuratert, FAST gratis-pool (free_pool-flagget i DB, 25 per
      // eksamenstype med kategorispredning). Deterministisk sett =
      // gjentatte anonyme kall lekker aldri mer enn disse.
      // .limit() beholdes som belte-og-bukse hvis flagget en dag
      // skulle bli satt på flere rader enn tiltenkt.
      // Bonusbruker (A2): free_pool eller bonus_pool, maks 35.
      query = bonus
        ? query.or('free_pool.eq.true,bonus_pool.eq.true').limit(freeLimit)
        : query.eq('free_pool', true).limit(freeLimit)
    }

    const { data, error } = await query
    if (error) throw error

    return new Response(
      JSON.stringify({ tier, count: data.length, questions: data, bonus, free_limit: freeLimit }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
