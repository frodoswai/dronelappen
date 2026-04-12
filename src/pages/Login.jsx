import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('magic_link') // 'magic_link' | 'password_login' | 'password_signup'
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'success'|'error', text }

  // If already logged in, redirect home
  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const handleMagicLink = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Sjekk e-posten din for den magiske lenken!' })
    }
  }

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    }
    // onAuthStateChange in AuthContext handles the redirect
  }

  const handlePasswordSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Konto opprettet! Sjekk e-posten din for bekreftelse.' })
    }
  }

  const onSubmit =
    mode === 'magic_link'
      ? handleMagicLink
      : mode === 'password_login'
      ? handlePasswordLogin
      : handlePasswordSignup

  const inputClass =
    'w-full bg-white border-[0.5px] border-da-navy/30 focus:border-da-navy focus:ring-1 focus:ring-da-navy/20 rounded-lg px-4 py-3 text-[14px] text-da-navy placeholder:text-da-text-muted outline-none transition-colors'

  return (
    <div className="min-h-screen bg-da-bg flex flex-col">
      {/* Dark hero — compact */}
      <div className="bg-da-navy-dark px-6 pt-3 pb-5">
        <div className="pt-8">
          <h1 className="text-[28px] font-medium text-da-bg leading-none tracking-tight mb-1">
            {mode === 'password_signup' ? 'Opprett konto' : 'Logg inn'}
          </h1>
          <p className="font-serif italic text-sm text-da-dark-slogan">
            Lagre fremgangen din og f&aring; tilgang til alle sp&oslash;rsm&aring;l
          </p>
        </div>
      </div>

      {/* Fade */}
      <div
        className="h-7 shrink-0"
        style={{
          background:
            'linear-gradient(to bottom, #0a1628 0%, #2a3a50 25%, #7e8a9c 55%, #cfd6df 80%, #fafbfc 100%)',
        }}
      />

      {/* Form */}
      <div className="px-6 pt-2 pb-6 bg-da-bg">
        <div className="max-w-sm mx-auto">
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="block font-mono text-[11px] text-da-text-muted tracking-[0.1em] mb-1.5">
                E-post
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@epost.no"
                className={inputClass}
                autoComplete="email"
              />
            </div>

            {mode !== 'magic_link' && (
              <div>
                <label className="block font-mono text-[11px] text-da-text-muted tracking-[0.1em] mb-1.5">
                  Passord
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'password_signup' ? 'Velg et passord (min. 6 tegn)' : 'Ditt passord'}
                  className={inputClass}
                  autoComplete={mode === 'password_signup' ? 'new-password' : 'current-password'}
                  minLength={mode === 'password_signup' ? 6 : undefined}
                />
              </div>
            )}

            {/* Status message */}
            {message && (
              <div
                className={`rounded-lg px-4 py-3 text-[13px] leading-[1.45] ${
                  message.type === 'success'
                    ? 'bg-green-50 border-[0.5px] border-green-200 text-green-800'
                    : 'bg-amber-50 border-[0.5px] border-amber-200 text-amber-800'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="quiz-option w-full bg-da-navy hover:bg-da-navy-mid disabled:opacity-60 text-da-bg font-medium py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-[14px]"
            >
              <span>
                {loading
                  ? 'Venter...'
                  : mode === 'magic_link'
                  ? 'Send magisk lenke'
                  : mode === 'password_login'
                  ? 'Logg inn'
                  : 'Opprett konto'}
              </span>
              {!loading && <span className="font-mono text-[12px] text-da-gold">&rarr;</span>}
            </button>
          </form>

          {/* Mode switcher links */}
          <div className="mt-5 pt-4 border-t-[0.5px] border-da-navy/15 space-y-2 text-center">
            {mode === 'magic_link' && (
              <>
                <button
                  onClick={() => { setMode('password_login'); setMessage(null) }}
                  className="block w-full font-mono text-[11px] text-da-text-muted hover:text-da-navy tracking-[0.05em] transition-colors"
                >
                  Logg inn med passord i stedet
                </button>
                <button
                  onClick={() => { setMode('password_signup'); setMessage(null) }}
                  className="block w-full font-mono text-[11px] text-da-text-muted hover:text-da-navy tracking-[0.05em] transition-colors"
                >
                  Opprett konto med passord
                </button>
              </>
            )}
            {mode === 'password_login' && (
              <>
                <button
                  onClick={() => { setMode('magic_link'); setMessage(null) }}
                  className="block w-full font-mono text-[11px] text-da-text-muted hover:text-da-navy tracking-[0.05em] transition-colors"
                >
                  Send magisk lenke i stedet
                </button>
                <button
                  onClick={() => { setMode('password_signup'); setMessage(null) }}
                  className="block w-full font-mono text-[11px] text-da-text-muted hover:text-da-navy tracking-[0.05em] transition-colors"
                >
                  Har du ikke konto? Opprett konto
                </button>
              </>
            )}
            {mode === 'password_signup' && (
              <>
                <button
                  onClick={() => { setMode('magic_link'); setMessage(null) }}
                  className="block w-full font-mono text-[11px] text-da-text-muted hover:text-da-navy tracking-[0.05em] transition-colors"
                >
                  Send magisk lenke i stedet
                </button>
                <button
                  onClick={() => { setMode('password_login'); setMessage(null) }}
                  className="block w-full font-mono text-[11px] text-da-text-muted hover:text-da-navy tracking-[0.05em] transition-colors"
                >
                  Har du allerede konto? Logg inn
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => navigate('/')}
            className="quiz-option w-full mt-5 bg-white border-[0.5px] border-da-navy/30 hover:border-da-navy/60 text-da-navy font-medium py-3 px-4 rounded-lg transition-colors text-[14px]"
          >
            Tilbake til hjem
          </button>
        </div>
      </div>
    </div>
  )
}
