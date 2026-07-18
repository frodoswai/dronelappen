import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

/**
 * «Er du klar?» — beredskapsscore per eksamenstype, basert på brukerens
 * SISTE svar per spørsmål (get_readiness-RPC, migrasjon 006).
 *
 * Produktlogikk (15/7): trakten lekker på gjenbesøk (1,6 quiz/bruker,
 * 8,5 % kommer tilbake). Scoren gir (1) en grunn til å komme tilbake —
 * «jeg ligger på 68 %, bestått krever 75 %» — og (2) et kjøpsargument
 * for gratis-brukere: lav dekning → «lås opp hele banken for å bli klar».
 *
 * Regler:
 *  - Ingen svar for en eksamenstype → ingen kortvisning (stille).
 *  - < 15 besvarte → «for tidlig å si»-modus med fremdrift mot 15.
 *  - ≥ 15 → prosent (riktige av besvarte), måles mot bestått-grensen 75 %,
 *    pluss svakeste kategori og dekning («basert på X av Y spørsmål»).
 * Fargespråk som resten av appen: grønt ≥ 75, gull 60–74, amber < 60.
 */
const PASS = 75
const MIN_ANSWERED = 15
const EXAM_LABELS = { A2: 'A2', A1_A3: 'A1/A3' }

// Sammenslåing (Frode 18/7): «Er du klar?» og fortsett-kortet på Home
// overlappet for returbrukere — to kort før hovedvalget. Nå eier dette
// kortet fortsett-rollen: `resume` ({ path, stats }) peker CTA-en på
// siste økt, og `onData` lar Home skjule sitt separate fortsett-kort
// når scoren faktisk rendrer. Uten øvingsdata rendrer vi fortsatt null
// og Home viser sitt eget fortsett-kort som før.
export default function ReadinessCard({ resume = null, onData }) {
  const { tier } = useAuth()
  const [byExam, setByExam] = useState(null) // null = laster/ingen data

  useEffect(() => {
    let cancelled = false
    supabase
      .rpc('get_readiness')
      .then(({ data, error }) => {
        if (cancelled || error || !data || data.length === 0) return
        const agg = {}
        for (const row of data) {
          const k = row.exam_type
          agg[k] ??= { answered: 0, correct: 0, total: 0, categories: [] }
          agg[k].answered += row.answered
          agg[k].correct += row.correct
          agg[k].total += row.total_questions
          if (row.answered > 0) {
            agg[k].categories.push({
              name: row.category,
              pct: Math.round((row.correct / row.answered) * 100),
              answered: row.answered,
            })
          }
        }
        // Behold kun eksamenstyper med minst ett svar
        const withData = Object.fromEntries(
          Object.entries(agg).filter(([, v]) => v.answered > 0)
        )
        if (Object.keys(withData).length > 0) {
          setByExam(withData)
          onData?.()
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
    // Bevisst mount-only: onData er en inline-callback fra Home og ville
    // trigget refetch på hver render om den sto i dep-lista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!byExam) return null

  // Vis den eksamenstypen brukeren har øvd mest på (én fokusert score,
  // ikke to konkurrerende kort).
  const [examType, d] = Object.entries(byExam).sort(
    (a, b) => b[1].answered - a[1].answered
  )[0]
  const label = EXAM_LABELS[examType] || examType
  const pct = Math.round((d.correct / d.answered) * 100)
  const tooEarly = d.answered < MIN_ANSWERED
  const weakest = [...d.categories]
    .filter((c) => c.answered >= 3)
    .sort((a, b) => a.pct - b.pct)[0]

  const tone =
    pct >= PASS ? 'text-green-700' : pct >= 60 ? 'text-da-gold' : 'text-amber-700'
  const barTone =
    pct >= PASS ? 'bg-green-600' : pct >= 60 ? 'bg-da-gold' : 'bg-amber-500'

  return (
    <div className="rise-in bg-white border-[0.5px] border-da-navy/30 border-l-2 border-l-da-gold rounded-lg px-4 pt-3 pb-3.5 mb-3">
      <div className="flex items-baseline justify-between mb-1">
        <span className="font-mono text-[11px] font-medium text-da-gold tracking-[0.12em]">
          er du klar?
        </span>
        <span className="font-mono text-[11px] text-da-text-muted">{label}</span>
      </div>

      {tooEarly ? (
        <>
          <p className="text-[13px] text-da-text-body leading-[1.5] mb-2">
            For tidlig å si — svar på {MIN_ANSWERED} spørsmål, så måler vi deg
            mot bestått-grensen. Du har svart på {d.answered} så langt.
          </p>
          <div className="h-1.5 bg-da-navy/10 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-da-navy/40 rounded-full"
              style={{ width: `${Math.min(100, (d.answered / MIN_ANSWERED) * 100)}%` }}
            />
          </div>
          <Link
            to={resume?.path || `/practice/${examType}`}
            className="quiz-option inline-flex items-center gap-2 bg-da-navy hover:bg-da-navy-mid text-da-bg font-medium py-2.5 px-4 rounded-lg transition-colors text-[13px]"
          >
            <span>Fortsett øvingen</span>
            <span className="font-mono text-[12px] text-da-gold">→</span>
          </Link>
        </>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className={`text-[34px] font-semibold leading-none tabular-nums ${tone}`}>
              {pct} %
            </span>
            <span className="text-[12.5px] text-da-text-muted">
              riktige — bestått krever {PASS} %
            </span>
          </div>
          {/* Fremdriftslinje med bestått-merke på 75 % */}
          <div className="relative h-1.5 bg-da-navy/10 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full ${barTone}`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
            <div
              className="absolute top-0 h-full w-[2px] bg-da-navy/50"
              style={{ left: `${PASS}%` }}
            />
          </div>
          <p className="text-[12px] text-da-text-muted leading-[1.5] mb-3">
            Basert på siste svar på {d.answered} av {d.total} spørsmål
            {weakest ? (
              <>
                {' '}· svakest: <span className="text-da-navy font-medium">{weakest.name}</span> ({weakest.pct} %)
              </>
            ) : null}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={resume?.path || `/practice/${examType}`}
              className="quiz-option inline-flex items-center gap-2 bg-da-navy hover:bg-da-navy-mid text-da-bg font-medium py-2.5 px-4 rounded-lg transition-colors text-[13px]"
            >
              <span>{pct >= PASS ? 'Hold formen ved like' : 'Øv der du er svakest'}</span>
              <span className="font-mono text-[12px] text-da-gold">→</span>
            </Link>
            {resume?.stats && (
              <span className="font-mono text-[11px] text-da-text-muted tabular-nums">
                sist: {resume.stats}
              </span>
            )}
            {tier !== 'paid' && (
              <span className="inline-flex items-center text-[12px] text-da-text-muted">
                Gratis-poolen er begrenset —{' '}
                <span className="text-da-navy font-medium ml-1">
                  hele banken gir presis måling
                </span>
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
