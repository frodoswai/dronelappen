import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

/**
 * Lightweight auth strip for the top of pages (inside dark hero sections).
 * Shows "Logg inn" for anon users, email + PRO badge + "Logg ut" for
 * authenticated users. Designed to sit in the hero's pt-8 zone.
 *
 * variant="dark" (default) — white/gold text on dark background
 * variant="light" — navy text on light background
 */
export default function AuthHeader({ variant = 'dark' }) {
  const { user, loading, tier } = useAuth()

  if (loading) return null

  const isDark = variant === 'dark'
  const linkClass = isDark
    ? 'text-da-dark-slogan hover:text-da-bg'
    : 'text-da-text-muted hover:text-da-navy'
  const emailClass = isDark ? 'text-da-dark-slogan' : 'text-da-text-muted'
  const badgeClass = 'font-mono text-[9px] font-semibold tracking-[0.12em] bg-da-gold/20 text-da-gold border border-da-gold/40 px-1.5 py-[1px] rounded-[3px]'

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (!user) {
    return (
      <div className="flex justify-end mb-1">
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
    <div className="flex items-center justify-end gap-2.5 mb-1">
      {tier === 'paid' && <span className={badgeClass}>PRO</span>}
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
