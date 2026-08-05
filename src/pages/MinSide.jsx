import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import CrosshairMarks from '../components/CrosshairMarks'

// «Min side» — personlig scoreboard (Frode 31/7; tempo-rekorder bevisst
// utsatt). Datagrunnlag: get_readiness() (siste svar per spørsmål, per
// eksamenstype/kategori — gamle feil henger ikke ved) + quiz_sessions
// med mode='eksamen' (migrasjon 008) for eksamenshistorikken.
//
// Fargetrapp (Frodes spec):
//   grå   → for lite data (under 15 svar for eksamenstype, under 3 for kategori)
//   gul   → under 75 % (bestått-grensen)
//   grønn → ≥ 75 %
//   GULL  → ≥ 90 % treff OG ≥ 80 % dekning — man skal ikke nå gull ved å
//           bare svare på det man allerede kan.
const EXAM_LABELS = { A1_A3: 'A1/A3', A2: 'A2' }

function levelFor(pct, coveragePct, answered, minAnswered) {
  if (answered < minAnswered) {
    return {
      key: 'gray',
      label: 'for tidlig å si',
      dot: 'bg-gray-300',
      bar: 'bg-gray-300',
      text: 'text-da-text-muted',
    }
  }
  if (pct >= 90 && coveragePct >= 80) {
    return {
      key: 'gold',
      label: 'gullnivå',
      dot: 'bg-da-gold',
      bar: 'bg-da-gold',
      text: 'text-da-gold-text',
    }
  }
  if (pct >= 75) {
    return {
      key: 'green',
      label: 'på bestått-nivå',
      dot: 'bg-green-500',
      bar: 'bg-green-500',
      text: 'text-green-700',
    }
  }
  return {
    key: 'amber',
    label: 'under bestått-grensen',
    dot: 'bg-amber-400',
    bar: 'bg-amber-400',
    text: 'text-amber-700',
  }
}

export default function MinSide() {
  const navigate = useNavigate()
  const { user, tier, expiresAt } = useAuth()
  const [rows, setRows] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const [{ data: readiness }, { data: sess }] = await Promise.all([
          supabase.rpc('get_readiness'),
          supabase
            .from('quiz_sessions')
            .select('exam_type, score, total_questions, completed_at')
            .eq('mode', 'eksamen')
            .order('completed_at', { ascending: false })
            .limit(8),
        ])
        if (!alive) return
        setRows(readiness || [])
        setSessions(sess || [])
      } catch (_) {
        if (alive) setRows([])
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-da-navy-dark flex items-center justify-center p-4">
        <p className="font-mono text-[12px] tracking-[0.1em] text-da-dark-slogan">
          henter fremgangen din…
        </p>
      </div>
    )
  }

  const byType = {}
  for (const r of rows || []) {
    if (!byType[r.exam_type]) byType[r.exam_type] = []
    byType[r.exam_type].push(r)
  }
  const hasAnyData = (rows || []).some((r) => r.answered > 0)

  return (
    <div className="min-h-screen bg-da-bg flex flex-col">
      {/* ═══ Dark hero ═══ */}
      <div className="bg-da-navy-dark px-6 pt-3 pb-5">
        <div className="pt-8 max-w-xl mx-auto">
          <span className="font-mono text-[12px] font-medium text-da-gold tracking-[0.12em]">
            min side
          </span>
          <h1 className="text-[32px] font-medium text-da-bg leading-none tracking-tight mb-1 mt-1">
            Fremgangen din
          </h1>
          <p className="font-serif italic text-sm text-da-dark-slogan">
            siste svar per spørsmål teller — gamle feil henger ikke ved
          </p>
        </div>
      </div>
      <div
        className="h-7 shrink-0"
        style={{
          background:
            'linear-gradient(to bottom, #0a1628 0%, #2a3a50 25%, #7e8a9c 55%, #cfd6df 80%, #fafbfc 100%)',
        }}
      />

      <div className="px-6 pt-2 pb-8 bg-da-bg flex-1">
        <div className="max-w-xl mx-auto space-y-4">
          {/* Tilgangen din. Lagt til 05.08.2026: expires_at har ligget i basen
              siden starten, men datoen ble aldri vist noe sted — en kunde som
              kjøpte i juli 2026 ville mistet tilgangen i juli 2027 uten
              forvarsel. Erstatter samtidig «Full tilgang · alle spørsmål»-
              merket i forsidens hero, som bare bekreftet noe kunden allerede
              merket selv. */}
          {tier === 'paid' && (
            <div className="bg-white border-[0.5px] border-da-navy/30 border-l-2 border-l-da-gold rounded-lg px-5 py-4 flex items-baseline justify-between gap-3 flex-wrap">
              <div>
                <div className="font-mono text-[11px] font-medium text-da-gold tracking-[0.1em] mb-0.5">
                  din tilgang
                </div>
                <span className="text-[14px] font-medium text-da-navy">
                  Full tilgang til alle spørsmål
                </span>
              </div>
              {expiresAt && (
                <span className="font-mono text-[12px] text-da-text-muted tabular-nums">
                  gyldig til{' '}
                  {new Date(expiresAt).toLocaleDateString('nb-NO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
          )}

          {!hasAnyData && (
            <div className="bg-white border-[0.5px] border-da-navy/30 rounded-lg p-5 text-center">
              <p className="text-[14px] text-da-text-body mb-3">
                Ingen fremgang registrert ennå — start en økt, så bygger
                oversikten seg opp her.
              </p>
              <button
                onClick={() => navigate('/')}
                className="quiz-option bg-da-navy hover:bg-da-navy-mid text-da-bg font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Start øving →
              </button>
            </div>
          )}

          {['A1_A3', 'A2'].map((type) => {
            const cats = byType[type] || []
            if (cats.length === 0) return null
            const answered = cats.reduce((s, c) => s + c.answered, 0)
            const correct = cats.reduce((s, c) => s + c.correct, 0)
            const total = cats.reduce((s, c) => s + c.total_questions, 0)
            const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0
            const coveragePct = total > 0 ? Math.round((answered / total) * 100) : 0
            const level = levelFor(pct, coveragePct, answered, 15)

            // Kategorier sortert mest handlingsrettet: uøvde først, deretter
            // svakest treffprosent — «her bør du øve»-rekkefølge.
            const sorted = [...cats].sort((a, b) => {
              const aPct = a.answered > 0 ? a.correct / a.answered : -1
              const bPct = b.answered > 0 ? b.correct / b.answered : -1
              return aPct - bPct
            })

            return (
              <div
                key={type}
                className="relative bg-white border-[0.5px] border-da-navy/30 rounded-lg p-5"
              >
                <CrosshairMarks variant="gold" />
                <div className="flex items-baseline justify-between mb-1">
                  <h2 className="text-[18px] font-medium text-da-navy">
                    {EXAM_LABELS[type] || type}
                  </h2>
                  <span
                    className={`font-mono text-[11px] font-semibold tracking-[0.08em] ${level.text}`}
                  >
                    {level.key === 'gold' ? '🏅 ' : ''}
                    {level.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="font-mono text-[28px] font-semibold text-da-navy tabular-nums leading-none">
                    {answered >= 15 ? `${pct}%` : '—'}
                  </span>
                  <span className="font-mono text-[11px] text-da-text-muted tracking-wide">
                    {answered} svart · {coveragePct}% av banken dekket
                  </span>
                </div>
                {/* Fremdriftslinje med 75 %-merke (bestått-grensen) */}
                <div className="relative h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full ${level.bar} transition-all`}
                    style={{ width: `${answered >= 15 ? Math.min(100, pct) : 0}%` }}
                  />
                  <div className="absolute inset-y-0 w-px bg-da-navy/40" style={{ left: '75%' }} />
                </div>

                {/* Kategorilinjer — uøvd/svakest øverst, med øv-lenke rett
                    inn i målrettet læring for kategorien. */}
                <div className="divide-y divide-da-navy/10">
                  {sorted.map((c) => {
                    const cPct = c.answered > 0 ? Math.round((c.correct / c.answered) * 100) : 0
                    const cCov = c.total_questions > 0 ? Math.round((c.answered / c.total_questions) * 100) : 0
                    const cLevel = levelFor(cPct, cCov, c.answered, 3)
                    return (
                      <div key={c.category} className="flex items-center gap-2.5 py-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${cLevel.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-da-navy leading-tight truncate">
                            {c.category}
                          </p>
                          <p className="font-mono text-[10.5px] text-da-text-muted tabular-nums">
                            {c.answered === 0
                              ? 'ikke øvd ennå'
                              : `${c.correct}/${c.answered} riktige · ${c.answered} av ${c.total_questions} prøvd`}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            navigate(`/practice/${type}?kategori=${encodeURIComponent(c.category)}`)
                          }
                          className="quiz-option font-mono text-[11px] font-semibold text-da-gold-text hover:text-da-navy transition-colors shrink-0"
                        >
                          øv →
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Eksamenshistorikk — kun økter merket mode='eksamen' (fra 31/7);
              eldre økter mangler modus og holdes utenfor. */}
          {sessions.length > 0 && (
            <div className="bg-white border-[0.5px] border-da-navy/30 rounded-lg p-5">
              <h2 className="text-[15px] font-medium text-da-navy mb-3">
                Siste eksamensforsøk
              </h2>
              <div className="divide-y divide-da-navy/10">
                {sessions.map((s, i) => {
                  const threshold = Math.ceil(s.total_questions * 0.75)
                  const passed = s.score >= threshold
                  const d = new Date(s.completed_at)
                  const dateStr = d.toLocaleDateString('nb-NO', {
                    day: 'numeric',
                    month: 'short',
                  })
                  return (
                    <div key={i} className="flex items-center justify-between py-2">
                      <span className="font-mono text-[11px] text-da-text-muted tabular-nums">
                        {dateStr} · {EXAM_LABELS[s.exam_type] || s.exam_type}
                      </span>
                      <span className="font-mono text-[12px] font-semibold tabular-nums text-da-navy">
                        {s.score}/{s.total_questions}{' '}
                        <span className={passed ? 'text-green-700' : 'text-amber-700'}>
                          {passed ? '· bestått' : '· ikke bestått'}
                        </span>
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Anonyme sesjoner mister fremgangen hvis nettleserdata ryddes —
              mild dytt, aldri vegg. */}
          {user?.is_anonymous && hasAnyData && (
            <p className="text-[12px] text-da-text-muted text-center leading-snug">
              Fremgangen lagres for denne nettleseren. Logg inn for å beholde
              den på tvers av enheter.
            </p>
          )}

          <button
            onClick={() => navigate('/')}
            className="quiz-option w-full bg-white border-[0.5px] border-da-navy/30 hover:border-da-navy/60 text-da-navy font-medium py-3.5 px-4 rounded-lg transition-colors"
          >
            Tilbake til hjem
          </button>
        </div>
      </div>
    </div>
  )
}
