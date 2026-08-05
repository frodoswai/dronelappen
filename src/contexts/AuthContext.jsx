import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({
  user: null,
  loading: true,
  tier: 'free',
  expiresAt: null,
  refreshTier: async () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tier, setTier] = useState('free')
  // Utløpsdato for betalt tilgang, ISO-streng eller null.
  //
  // Lagt til 05.08.2026: tilgangen varer i 12 måneder, expires_at har ligget
  // i basen og blitt lest her hele tiden — men bare for å avgjøre paid/free.
  // Datoen ble aldri vist noe sted, så en kunde som kjøpte i juli 2026 ville
  // mistet tilgangen i juli 2027 uten forvarsel. Nå eksponeres den så Min
  // side kan si det.
  const [expiresAt, setExpiresAt] = useState(null)

  // Read the current entitlement and set tier accordingly. Exposed as
  // refreshTier so screens can re-check after returning from Stripe Checkout
  // (the webhook writes the entitlement out-of-band).
  const refreshTier = useCallback(async () => {
    const { data: { user: current } } = await supabase.auth.getUser()
    if (!current) {
      setTier('free')
      setExpiresAt(null)
      return 'free'
    }
    const { data } = await supabase
      .from('entitlements')
      .select('tier, expires_at')
      .eq('user_id', current.id)
      .single()
    const isPaid =
      data?.tier === 'paid' &&
      (!data.expires_at || new Date(data.expires_at) > new Date())
    const next = isPaid ? 'paid' : 'free'
    setTier(next)
    setExpiresAt(isPaid ? data?.expires_at ?? null : null)
    return next
  }, [])

  // Re-check tier whenever the user changes.
  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!user) {
        if (!cancelled) { setTier('free'); setExpiresAt(null) }
        return
      }
      const { data } = await supabase
        .from('entitlements')
        .select('tier, expires_at')
        .eq('user_id', user.id)
        .single()
      if (cancelled) return
      if (
        data?.tier === 'paid' &&
        (!data.expires_at || new Date(data.expires_at) > new Date())
      ) {
        setTier('paid')
        setExpiresAt(data.expires_at ?? null)
      } else {
        setTier('free')
        setExpiresAt(null)
      }
    }
    run()
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    let active = true

    // Every visitor gets a session: reuse an existing one, otherwise sign in
    // anonymously so the buy flow works without a login wall. The anonymous
    // account is upgraded to a permanent one (email linked) after purchase.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        if (active) { setUser(session.user); setLoading(false) }
        return
      }
      const { data, error } = await supabase.auth.signInAnonymously()
      if (!active) return
      setUser(error ? null : (data?.user ?? null))
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => { active = false; subscription.unsubscribe() }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, tier, expiresAt, refreshTier }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with its provider by design
export const useAuth = () => useContext(AuthContext)
