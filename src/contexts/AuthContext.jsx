import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({ user: null, loading: true, tier: 'free' })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tier, setTier] = useState('free')

  // Fetch tier from entitlements when user changes
  useEffect(() => {
    if (!user) {
      setTier('free')
      return
    }
    let cancelled = false
    async function fetchTier() {
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
    fetchTier()
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
    <AuthContext.Provider value={{ user, loading, tier }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
