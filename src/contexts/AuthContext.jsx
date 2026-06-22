import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({ user: null, loading: true, tier: 'free', refreshTier: async () => {} })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tier, setTier] = useState('free')

  // Read the current entitlement and set tier accordingly. Exposed as
  // refreshTier so screens can re-check after returning from Stripe Checkout
  // (the webhook writes the entitlement out-of-band).
  const refreshTier = useCallback(async () => {
    const { data: { user: current } } = await supabase.auth.getUser()
    if (!current) {
      setTier('free')
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
    return next
  }, [])

  // Re-check tier whenever the user changes.
  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!user) {
        if (!cancelled) setTier('free')
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
      } else {
        setTier('free')
      }
    }
    run()
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, tier, refreshTier }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with its provider by design
export const useAuth = () => useContext(AuthContext)
