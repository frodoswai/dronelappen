import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

/**
 * Lightweight auth strip for the top of pages (inside dark hero sections).
 * Shows "Logg inn" for anon users, email + "Logg ut" for authenticated
 * users. PRO badge lives in Home.jsx next to the beta pill instead.
 *
 * variant="dark" (default) — white/gold text on dark background
 * variant="light" — navy text on light background
 */
export default function AuthHeader({ variant = 'dark' }) {
  const { user, loading } = useAuth()

  if (loading) return null

  const isDark = variant === 'dark'
  const linkClass = isDark
    ? 'text-da-dark-slogan hover:text-da-bg'
    : 'text-da-text-muted hover:text-da-navy'
  const emailClass = isDark ? 'text-da-dark-slogan' : 'text-da-text-muted'

  // Utlogging må ALDRI avhenge av at Supabase-serveren svarer. Funnet
  // 2026-07-09: /auth/v1/logout ga 503 → supabase-js lot sesjonen ligge i
  // localStorage, og brukeren var «logget inn igjen» ved neste sidelast.
  // scope:'local' rydder lokalt uavhengig av server-revokering; sweep +
  // full reload er belte og bukse hvis klienten likevel kaster underveis.
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch (_) {
      /* server nede — vi rydder selv under */
    } finally {
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith('sb-') && k.includes('-auth-token'))
          .forEach((k) => localStorage.removeItem(k))
      } catch (_) {
        /* ignore */
      }
      window.location.assign('/')
    }
  }

  if (!user) {
    return (
      <div className="flex justify-start mb-1">
        <Link
          to="/login"
          className={`font-mono text-[11px] tracking-[0.1em] transition-colors ${linkClass}`}
        >
          Logg inn
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-start gap-2.5 mb-1">
      <span className={`font-mono text-[10px] tracking-wide truncate max-w-[160px] ${emailClass}`}>
        {user.email}
      </span>
      <button
        onClick={handleLogout}
        className={`font-mono text-[11px] tracking-[0.1em] transition-colors ${linkClass}`}
      >
        Logg ut
      </button>
    </div>
  )
}
