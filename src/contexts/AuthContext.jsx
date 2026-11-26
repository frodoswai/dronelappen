import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({
  user: null,
  loading: true,
  tier: 'free',
  expiresAt: null,
  sts: false,
  refreshTier: async () => {},
  refreshAccess: async () => ({ tier: 'free', sts: false }),
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
  // Omfatter tilgangen STS? (26.11.2026, entitlements.sts, migrasjon 034.)
  // Fra 1.12.2026 selges A2 uten STS; alle som kjøpte før har true.
  const [sts, setSts] = useState(false)

  // Read the current entitlement and set tier accordingly. Exposed as
  // refreshTier so screens can re-check after returning from Stripe Checkout
  // (the webhook writes the entitlement out-of-band).
  //
  // refreshAccess gir både nivå og STS ({ tier, sts }); refreshTier er den
  // samme lesingen og returnerer bare 'paid' | 'free', som kallerne fra før
  // 26.11.2026 forventer.
  const refreshAccess = useCallback(async () => {
    const { data: { user: current } } = await supabase.auth.getUser()
    if (!current) {
      setTier('free')
      setExpiresAt(null)
      setSts(false)
      return { tier: 'free', sts: false }
    }
    const { data } = await supabase
      .from('entitlements')
      .select('tier, expires_at, sts')
      .eq('user_id', current.id)
      .single()
    const isPaid =
      data?.tier === 'paid' &&
      (!data.expires_at || new Date(data.expires_at) > new Date())
    const next = isPaid ? 'paid' : 'free'
    const nextSts = isPaid && data?.sts === true
    setTier(next)
    setExpiresAt(isPaid ? data?.expires_at ?? null : null)
    setSts(nextSts)
    return { tier: next, sts: nextSts }
  }, [])
  const refreshTier = useCallback(async () => (await refreshAccess()).tier, [refreshAccess])

  // Re-check tier whenever the user changes.
  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!user) {
        if (!cancelled) { setTier('free'); setExpiresAt(null); setSts(false) }
        return
      }
      const { data } = await supabase
        .from('entitlements')
        .select('tier, expires_at, sts')
        .eq('user_id', user.id)
        .single()
      if (cancelled) return
      if (
        data?.tier === 'paid' &&
        (!data.expires_at || new Date(data.expires_at) > new Date())
      ) {
        setTier('paid')
        setExpiresAt(data.expires_at ?? null)
        setSts(data.sts === true)
      } else {
        setTier('free')
        setExpiresAt(null)
        setSts(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [user])

  // 15.10.2026: en fane som sto åpen mens kunden betalte i en annen fane (eller
  // lukket Stripe uten å komme tilbake til ?betalt=ok) husket «free» til neste
  // sideoppfrisk, og viste muren på nytt til en betalt kunde (14/10). Les
  // tilgangen på nytt når fanen blir synlig igjen, men bare så lenge den
  // står på free: betalte brukere trenger ingen ekstra spørring.
  // 26.11.2026: det samme gjelder A2-kunden som legger til STS i en annen fane.
  useEffect(() => {
    if (!user || (tier === 'paid' && sts)) return
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshTier()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [user, tier, sts, refreshTier])

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
    <AuthContext.Provider value={{ user, loading, tier, expiresAt, sts, refreshTier, refreshAccess }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with its provider by design
export const useAuth = () => useContext(AuthContext)
