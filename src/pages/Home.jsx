import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import HeroPropeller from '../components/HeroPropeller'
import CrosshairMarks from '../components/CrosshairMarks'
import ModePillRow from '../components/ModePillRow'
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

  // Fetch live question + category counts. Uses `count: 'exact', head: true`
  // which returns only the count header — no rows shipped over the wire —
  // so this stays cheap even as the question bank grows.
  useEffect(() => {
    let cancelled = false
    async function fetchStats() {
      try {
        const [questionsResult, categoriesResult] = await Promise.all([
          supabase.from('questions').select('id', { count: 'exact', head: true }),
          supabase.from('categories').select('id', { count: 'exact', head: true }),
        ])
        if (cancelled) return
        setStats({
          questions: questionsResult.count,
          categories: categoriesResult.count,
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
        <HeroPropeller />

        {/* pt-8 leaves room for phone status bar bleed. z-10 so the
            text layers above the propeller SVG on narrow viewports. */}
        <div className="relative z-10 pt-8">
          <div className="flex items-baseline gap-0.5 mb-2">
            <h1 className="text-3xl font-medium text-da-bg tracking-tight leading-none">
              DroneLappen
            </h1>
            <span className="font-mono text-sm text-da-gold tracking-wide font-medium">
              .app
            </span>
          </div>
          {/* Combined "Gratis i beta" pill — single unit, own line,
              clear of propeller on narrow phones. Replaces the separate
              beta tag + "foreløpig gratis" line from Round 3.6. */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[10px] text-da-gold tracking-[0.12em] font-medium border border-da-gold/60 px-2 py-[2px] rounded-[3px]">
              Gratis i beta
            </span>
          </div>
          <p className="font-serif italic text-sm text-da-dark-slogan">
            Bli en bedre dronepilot
          </p>
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
            className="quiz-option block bg-da-cream/40 border-[0.5px] border-da-navy/30 border-l-2 border-l-da-gold rounded-none px-4 py-3 mb-4 hover:bg-da-cream/60 transition-colors"
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

        {/* ═══ A2 card — dominant, primary ═══ */}
        <Link
          to="/exam/A2"
          className="quiz-option relative block bg-white border-[0.5px] border-da-navy rounded-lg px-[18px] pt-5 pb-4 mb-3 hover:shadow-sm transition-shadow"
        >
          <CrosshairMarks variant="solid" />
          <div className="font-mono text-[12px] text-da-gold tracking-[0.12em] font-medium mb-1.5">
            trafikkstasjonen
          </div>
          <div className="text-[34px] font-medium text-da-navy leading-none mb-2.5 tracking-tight">
            A2
          </div>
          <p className="text-[12.5px] text-da-text-body leading-[1.55] mb-3.5">
            Den betalte eksamen. 30 spørsmål, 60 min, 23 riktige for å bestå.
          </p>
          <ModePillRow variant="primary" />
          <div className="flex justify-end mt-3">
            <span className="font-mono text-[11px] text-da-gold tracking-[0.1em]">
              velg modus →
            </span>
          </div>
        </Link>

        {/* ═══ A1/A3 card — quiet, secondary ═══ */}
        <Link
          to="/exam/A1_A3"
          className="quiz-option relative block bg-transparent border-[0.5px] border-dashed border-da-navy/15 rounded-lg px-4 pt-3.5 pb-3 mb-4 hover:border-da-navy/30 transition-colors"
        >
          <div className="font-mono text-[12px] font-medium text-da-text-faded tracking-[0.12em] mb-1">
            online, gratis
          </div>
          <div className="flex items-baseline justify-between mb-1.5">
            <div className="text-xl font-medium text-da-text-dim leading-none tracking-tight">
              A1 / A3
            </div>
            <span className="font-mono text-[11px] text-da-text-faded">
              grunnleggende
            </span>
          </div>
          <p className="text-[11.5px] text-da-text-faded leading-[1.5] mb-2.5">
            Øv gratis før du tar A2.
          </p>
          <ModePillRow variant="muted" />
          <div className="flex justify-end mt-3">
            <span className="font-mono text-[11px] text-da-text-faded tracking-[0.1em]">
              velg modus →
            </span>
          </div>
        </Link>

        {/* Footer stats — Round 3.5 wired live from Supabase. Dots on
            load so the layout doesn't shift when counts resolve. Errors
            are swallowed silently (dots stay). */}
        <div className="flex items-center justify-between pt-3 border-t-[0.5px] border-da-navy/15">
          <span className="font-mono text-[11px] text-da-text-muted tracking-wide tabular-nums">
            {stats.questions !== null
              ? `${stats.questions} spørsmål · ${stats.categories} kategorier`
              : '··· spørsmål · ··· kategorier'}
          </span>
          <span className="font-mono text-[11px] text-da-text-muted">v1.0</span>
        </div>
      </div>
    </div>
  )
}
