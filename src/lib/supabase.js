import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Fetch questions via the get-questions Edge Function.
 * The function reads questions server-side with service_role,
 * enforcing free/paid tier limits based on the user's entitlement.
 */
export async function fetchQuestions({ examType } = {}) {
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(
    `${supabaseUrl}/functions/v1/get-questions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        ...(session && { Authorization: `Bearer ${session.access_token}` }),
      },
      body: JSON.stringify({ exam_type: examType }),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Edge Function error: ${res.status}`)
  }

  return res.json() // { tier, count, questions }
}
