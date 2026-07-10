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
  // VIKTIG: aldri `await` signOut her. Funnet 2026-07-10: signOut kan henge
  // evig på supabase-js' interne navigator-lås (f.eks. når en token-refresh
  // står fast mot en 503-ende auth-server) — da kjører aldri koden etter
  // await, og brukeren forblir innlogget. Vi fyrer signOut best-effort,
  // rydder localStorage selv, og laster siden på nytt umiddelbart.
  const handleLogout = () => {
    try {
      supabase.auth.signOut({ scope: 'local' }).catch(() => {})
    } catch (_) {
      /* ignore */
    }
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('sb-') && k.includes('-auth-token'))
        .forEach((k) => localStorage.removeItem(k))
    } catch (_) {
      /* ignore */
    }
    window.location.assign('/')
  }

  // Anonyme sesjoner (alle besøkende får en, se AuthContext) skal se
  // «Logg inn» — ikke «Logg ut» + tom e-post. Funnet 2026-07-10: en
  // tilbakevendende kjøper på ny enhet fikk anonym sesjon og fant aldri
  // innloggingen, fordi headeren så «innlogget» ut.
  if (!user || user.is_anonymous) {
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
