// get-questions — henter spørsmål til appen (Quiz, Tempo) per eksamenstype.
//
// Kilden lå tidligere bare i Supabase (v9, 2026-07-08). Lagt inn i repo
// 30.09.2026 da v10 la til overlap_group i select (STS-banken, migrasjon 018).
// Deploy: Supabase MCP deploy_edge_function, verify_jwt=false (funksjonen
// slår selv opp brukeren fra Authorization-headeren).
//
// Gratis-brukere får bare spørsmål med free_pool = true (maks 25 per
// eksamenstype). STS (A2_STS) har ingen gratis-pool (Frode 30.09.2026), så
// gratis-brukere får 0 STS-spørsmål, og appen viser betalingsmuren.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const FREE_LIMIT = 25

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

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await admin.auth.getUser(token)
      if (user) {
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

    // Build query using actual column names
    let query = admin
      .from('questions')
      .select('id, category_id, question_text, options, correct_option_id, explanation, difficulty, exam_type, overlap_group')
      .order('id')

    if (exam_type) {
      query = query.eq('exam_type', exam_type)
    }

    if (tier === 'free') {
      // Kuratert, FAST gratis-pool (free_pool-flagget i DB, 25 per
      // eksamenstype med kategorispredning). Deterministisk sett =
      // gjentatte anonyme kall lekker aldri mer enn disse.
      // .limit() beholdes som belte-og-bukse hvis flagget en dag
      // skulle bli satt på flere rader enn tiltenkt.
      query = query.eq('free_pool', true).limit(FREE_LIMIT)
    }

    const { data, error } = await query
    if (error) throw error

    return new Response(
      JSON.stringify({ tier, count: data.length, questions: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
