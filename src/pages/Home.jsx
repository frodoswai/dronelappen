import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import HeroPropeller from '../components/HeroPropeller'
import CrosshairMarks from '../components/CrosshairMarks'
import ModePillRow from '../components/ModePillRow'
import AuthHeader from '../components/AuthHeader'
import NewsletterSignup from '../components/NewsletterSignup'
import {
  getLastSession,
  sessionToPath,
  sessionDisplayStats,
  describeSession,
} from '../lib/sessionHistory'

// Home — Round 2 visual redesign, Round 2.5 refinements applied.
//
// Three stacked sections:
//   1. Dark navy hero with wordmark + gold propeller SVG bleed
//   2. Stepped fade gradient (28px)
//   3. Light content zone: resume strip, A2 card (dominant),
//      A1/A3 card (quiet), stats footer
//
// Round 2.5 changes here:
//   - Mono labels bumped up a pt or two for phone readability
//   - Category tag: trafikkstasjon → trafikkstasjonen (definite form)
//   - Fortsett card gets a cream tint + more padding so smart resume
//     clearly reads as the top CTA when it exists
//   - Both exam cards now end in an explicit "velg modus →" indicator
//     because the corner crosshairs alone didn't read as "tap me"
//   - flex-1 removed from the light zone — content sizes naturally
//     instead of stretching to viewport
export default function Home() {
  const { tier } = useAuth()
  const [lastSession, setLastSession] = useState(null)
  // Round 3.5: live counts from Supabase. null → loading (shows dots
  // so there's no layout shift). Fire-and-forget — never block render
  // and never surface errors to the UI; a failed fetch stays as dots.
  const [stats, setStats] = useState({ questions: null, categories: null })

  // Smart resume — read on mount so we only render the strip if the
  // user has a fresh session in localStorage (stale > 14 days returns
  // null from getLastSession).
  useEffect(() => {
    setLastSession(getLastSession())
  }, [])

  // Fetch live question + category counts via direct REST call.
  // Uses the anon key explicitly instead of the supabase client to
  // avoid a race condition: when a logged-out user has stale tokens
  // in localStorage, the supabase client may send an expired JWT
  // before session refresh completes, causing the RPC to 401.
  // A plain fetch with the anon key sidesteps this entirely.
  useEffect(() => {
    let cancelled = false
    async function fetchStats() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/get_question_count`,
          {
            method: 'POST',
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Content-Type': 'application/json',
            },
            body: '{}',
          }
        )
        if (!res.ok) throw new Error(res.status)
        const data = await res.json()
        if (cancelled) return
        setStats({
          questions: data?.[0]?.total_questions ?? null,
          categories: data?.[0]?.total_categories ?? null,
        })
      } catch (_) {
        /* swallow — loading dots remain */
      }
    }
    fetchStats()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-da-bg flex flex-col">
      {/* ═══ Dark hero zone ═══ */}
      <div className="relative overflow-hidden bg-da-navy-dark px-6 pt-3 pb-6">
        <div className="relative max-w-xl mx-auto">
        <HeroPropeller />

        {/* All hero text pinned left (max-w so it never overlaps the
            propeller on the right). z-10 above the SVG. */}
        <div className="relative z-10 pt-8 max-w-[65%]">
          {/* Status row: freemium pitch or PRO confirmation */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {tier === 'paid' ? (
              <span className="font-mono text-[9px] font-semibold tracking-[0.12em] bg-da-gold/20 text-da-gold border border-da-gold/40 px-1.5 py-[2px] rounded-[3px]">
                PRO — alle spørsmål
              </span>
            ) : (
              <span className="font-mono text-[10px] text-da-gold tracking-[0.08em] font-medium border border-da-gold/60 px-2 py-[2px] rounded-[3px]">
                25 spørsmål gratis · ALLE spørsmål med PRO
              </span>
            )}
          </div>

          {/* Auth row — email + logout, left-aligned */}
          <AuthHeader variant="dark" />

          {/* Wordmark */}
          <div className="flex items-baseline gap-0.5 mb-1.5">
            <h1 className="text-3xl font-semibold text-da-bg tracking-tight leading-none">
              DroneLappen
            </h1>
            <span className="font-mono text-sm text-da-gold tracking-wide font-medium">
              .app
            </span>
          </div>
          {/* Slogan */}
          <p className="font-serif italic text-sm text-da-dark-slogan">
            Bli en bedre dronepilot
          </p>
        </div>
        </div>
      </div>

      {/* ═══ Fade transition (28px, stepped gradient) ═══ */}
      <div
        className="h-7"
        style={{
          background:
            'linear-gradient(to bottom, #0a1628 0%, #2a3a50 25%, #7e8a9c 55%, #cfd6df 80%, #fafbfc 100%)',
        }}
      />

      {/* ═══ Light content zone ═══ */}
      <div className="px-6 pt-1 pb-6 bg-da-bg">
        <div className="max-w-xl mx-auto">
        {/* Divider with mono label */}
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="flex-1 h-px bg-da-navy/20" />
          <span className="font-mono text-[12px] font-medium text-da-navy/60 tracking-[0.1em]">
            velg eksamen
          </span>
          <div className="flex-1 h-px bg-da-navy/20" />
        </div>

        {/* Smart resume — only if recent session exists. Round 2.5
            adds the cream tint + extra padding so this card is
            visibly the primary CTA when shown. */}
        {lastSession && (
          <Link
            to={sessionToPath(lastSession)}
            className="quiz-option rise-in block bg-da-cream/40 border-[0.5px] border-da-navy/30 border-l-2 border-l-da-gold rounded-lg px-4 py-3 mb-4 hover:bg-da-cream/60 transition-all active:scale-[0.99]"
          >
            <div className="font-mono text-[11px] font-medium text-da-gold tracking-[0.1em] mb-0.5">
              fortsett
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-medium text-da-navy">
                {describeSession(lastSession)}
              </span>
              <span className="font-mono text-[11px] text-da-text-muted">
                {sessionDisplayStats(lastSession)}
              </span>
            </div>
          </Link>
        )}

        {/* ═══ A2 card — dominant, primary ═══
            Round 4 affordance pass: stretched-link pattern. The card is
            a div; an absolutely-positioned overlay Link (z-10) makes the
            whole surface clickable, while the mode pills sit above it
            (z-20) as real deep-links into each mode. Sibling links —
            never nested — so the HTML stays valid. The "velg modus" text
            became a filled navy chip: one solid element per card makes
            "this is pressable" unmistakable on touch, where hover never
            fires. */}
        <div className="quiz-option group rise-in rise-d1 relative bg-white border-[0.5px] border-da-navy rounded-lg px-[18px] pt-5 pb-4 mb-3 transition-all shadow-[0_1px_2px_rgba(8,53,84,0.06),0_4px_14px_rgba(8,53,84,0.08)] hover:shadow-[0_2px_4px_rgba(8,53,84,0.08),0_10px_28px_rgba(8,53,84,0.14)] hover:-translate-y-[1px] active:scale-[0.99]">
          <CrosshairMarks variant="solid" />
          <Link
            to="/exam/A2"
            aria-label="A2 — velg modus"
            className="absolute inset-0 z-10 rounded-lg"
          />
          <div className="font-mono text-[12px] text-da-gold tracking-[0.12em] font-medium mb-1.5">
            trafikkstasjonen
          </div>
          <div className="text-[34px] font-medium text-da-navy leading-none mb-2.5 tracking-tight">
            A2
          </div>
          {/* Tier-aware: the real exam is 30/60min/23, but the free tier
              practices with a 25-question pool — say so instead of
              promising 30 and delivering 25. */}
          <p className="text-[12.5px] text-da-text-body leading-[1.55] mb-3.5">
            {tier === 'paid'
              ? 'Den betalte eksamen. 30 spørsmål, 60 min, 23 riktige for å bestå.'
              : 'Den betalte eksamen: 30 spørsmål, 60 min, 23 riktige. Øv gratis med 25 spørsmål.'}
          </p>
          <div className="relative z-20">
            <ModePillRow variant="primary" examType="A2" />
          </div>
          <div className="flex justify-end mt-3">
            <span className="font-mono text-[11px] tracking-[0.1em] bg-da-navy text-da-bg px-3.5 py-2 rounded-[5px] shadow-sm group-hover:bg-da-navy-mid transition-colors">
              velg modus{' '}
              <span className="text-da-gold inline-block transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </span>
          </div>
        </div>

        {/* ═══ A1/A3 card — quiet, secondary ═══
            Round 4: dashed border replaced with a solid faint one —
            dashed reads as "disabled/empty", not "quiet". Same
            stretched-link structure as the A2 card. */}
        <div className="quiz-option group rise-in rise-d2 relative bg-white border-[0.5px] border-da-navy/30 rounded-lg px-4 pt-3.5 pb-3 mb-4 transition-all shadow-[0_1px_3px_rgba(8,53,84,0.05)] hover:border-da-navy/50 hover:shadow-[0_2px_4px_rgba(8,53,84,0.06),0_6px_18px_rgba(8,53,84,0.10)] hover:-translate-y-[1px] active:scale-[0.99]">
          <Link
            to="/exam/A1_A3"
            aria-label="A1/A3 — velg modus"
            className="absolute inset-0 z-10 rounded-lg"
          />
          {/* Kontrast ($10K punkt 8): faded (#8a98a8 ≈ 2.9:1) strøk på
              WCAG AA og fikk kortet til å se deaktivert ut. Bumpet til
              muted/dim + navy tittel — fortsatt stille, men lesbart og
              tydelig aktivt. */}
          <div className="font-mono text-[12px] font-medium text-da-text-muted tracking-[0.12em] mb-1">
            online, gratis
          </div>
          <div className="flex items-baseline justify-between mb-1.5">
            <div className="text-xl font-medium text-da-navy leading-none tracking-tight">
              A1 / A3
            </div>
            <span className="font-mono text-[11px] text-da-text-dim">
              grunnleggende
            </span>
          </div>
          <p className="text-[11.5px] text-da-text-dim leading-[1.5] mb-2.5">
            Øv gratis før du tar A2.
          </p>
          <div className="relative z-20">
            <ModePillRow variant="muted" examType="A1_A3" />
          </div>
          <div className="flex justify-end mt-3">
            <span className="font-mono text-[11px] tracking-[0.1em] bg-white border-[0.5px] border-da-navy/40 text-da-navy px-3.5 py-2 rounded-[5px] group-hover:border-da-navy/70 transition-colors">
              velg modus{' '}
              <span className="text-da-gold inline-block transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </span>
          </div>
        </div>

        {/* ═══ Newsletter (Droneavisa list via MailerLite) ═══ */}
        <div className="rise-in rise-d3">
          <div className="flex items-center gap-2.5 mb-3.5">
            <div className="flex-1 h-px bg-da-navy/20" />
            <span className="font-mono text-[12px] font-medium text-da-navy/60 tracking-[0.1em]">
              hold deg oppdatert
            </span>
            <div className="flex-1 h-px bg-da-navy/20" />
          </div>
          <NewsletterSignup />
        </div>

        {/* Footer stats — Round 3.5 wired live from Supabase. Dots on
            load so the layout doesn't shift when counts resolve. Errors
            are swallowed silently (dots stay). */}
        <div className="flex items-center justify-between pt-3 border-t-[0.5px] border-da-navy/15">
          <span className="font-mono text-[11px] text-da-text-muted tracking-wide tabular-nums">
            {stats.questions !== null
              ? `${stats.questions} spørsmål · ${stats.categories} kategorier`
              : '··· spørsmål · ··· kategorier'}
          </span>
          <span className="font-mono text-[11px] text-da-text-muted">v1.1</span>
        </div>
        </div>
      </div>
    </div>
  )
}
