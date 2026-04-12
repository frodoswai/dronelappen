import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase handles the token exchange from the URL hash automatically.
    // We just need to wait for the session to be established, then redirect.
    supabase.auth.getSession().then(({ data }) => {
      navigate(data.session ? '/' : '/login', { replace: true })
    })
  }, [navigate])

  return (
    <div className="min-h-screen bg-da-navy-dark flex items-center justify-center p-4">
      <p className="font-mono text-[12px] tracking-[0.1em] text-da-dark-slogan">
        logger deg inn&hellip;
      </p>
    </div>
  )
}
