import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, createCheckout } from '../lib/supabase'
import { PRICE_STS_UPGRADE } from '../lib/pricing'
import { useAuth } from '../contexts/AuthContext'
import AuthHeader from '../components/AuthHeader'
import DroneMark from '../components/DroneMark'
import { enabledExamTypes, examLabel, STS_LIVE, stsPreviewOn, setStsPreview } from '../lib/exams'

// «Min side» — personlig scoreboard (Frode 31/7; tempo-rekorder bevisst
// utsatt). Datagrunnlag: get_readiness() (siste svar per spørsmål, per
// eksamenstype/kategori — gamle feil henger ikke ved) + quiz_sessions
// med mode='eksamen' (migrasjon 008) for eksamenshistorikken.
//
// Fargetrapp (Frodes spec):
//   grå   → for lite data (under 15 svar for eksamenstype, under 3 for kategori)
//   rosa  → under 75 % (bestått-grensen). Var gul (amber-400) til 14.11.2026,
//           men den lå for nær gullfargen og 100 % så ut som en advarsel.
//   grønn → ≥ 75 %
//   GULL  → ≥ 90 % treff OG ≥ 80 % dekning — man skal ikke nå gull ved å
//           bare svare på det man allerede kan.

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
    dot: 'bg-rose-400',
    bar: 'bg-rose-400',
    text: 'text-rose-700',
  }
}

export default function MinSide() {
  const navigate = useNavigate()
  const { user, tier, expiresAt, sts, refreshAccess } = useAuth()
  // STS-påbygg for A2-kunde (26.11.2026, selges fra 1.12.2026).
  const [pabyggBusy, setPabyggBusy] = useState(false)
  const [pabyggErr, setPabyggErr] = useState('')
  const kjopPabygg = async () => {
    if (pabyggBusy) return
    setPabyggErr('')
    setPabyggBusy(true)
    try {
      // Fersk tilgang først: påbygget kan være kjøpt i en annen fane.
      if ((await refreshAccess()).sts) { setPabyggBusy(false); return }
      await createCheckout('sts_upgrade') // sender til Stripe
    } catch (e) {
      if (e?.alreadyPaid) await refreshAccess()
      else setPabyggErr(e?.message || 'Noe gikk galt. Prøv igjen.')
      setPabyggBusy(false)
    }
  }
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
  // Bare eksamenstyper som er skrudd på (lib/exams.js). Når STS-banken er
  // lastet inn, gir get_readiness STS-rader til alle, også før STS er synlig.
  const examTypes = enabledExamTypes()
  const hasAnyData = (rows || []).some(
    (r) => r.answered > 0 && examTypes.includes(r.exam_type)
  )

  return (
    <div className="min-h-screen bg-da-navy-dark flex flex-col">
      {/* ═══ Dark hero ═══ */}
      <div className="px-5 pt-3 pb-6">
        <div className="pt-2 max-w-xl mx-auto">
          {/* Vei hjem øverst (Frode 14.11.2026): før måtte man rulle helt ned. */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 mb-4 min-h-11"
            aria-label="Til forsiden"
          >
            <DroneMark />
            <span className="text-[20px] font-bold text-white leading-none">
              DroneLappen<span className="text-da-gold">.app</span>
            </span>
          </button>
          <span className="text-[17px] font-semibold tracking-[0.08em] uppercase text-da-dark-slogan">
            min side
          </span>
          <h1 className="text-[30px] font-bold text-white leading-[1.12] tracking-tight mb-2 mt-1.5">
            Fremgangen din
          </h1>
          <p className="text-[16px] text-[#C9D6E2] leading-[1.4]">
            Siste svar per spørsmål teller. Gamle feil henger ikke ved.
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-t-3xl px-5 pt-5 pb-8">
        <div className="max-w-xl mx-auto space-y-4">
          {/* Tilgangen din. Lagt til 05.08.2026: expires_at har ligget i basen
              siden starten, men datoen ble aldri vist noe sted — en kunde som
              kjøpte i juli 2026 ville mistet tilgangen i juli 2027 uten
              forvarsel. Erstatter samtidig «Full tilgang · alle spørsmål»-
              merket i forsidens hero, som bare bekreftet noe kunden allerede
              merket selv. */}
          {tier === 'paid' && (
            <div className="bg-[#EEF3F7] rounded-2xl p-4 flex items-baseline justify-between gap-3 flex-wrap">
              <div>
                <div className="text-[17px] font-semibold tracking-[0.08em] uppercase text-da-text-muted mb-0.5">
                  din tilgang
                </div>
                <span className="text-[16px] font-medium text-da-navy">
                  {sts ? 'Full tilgang til alle spørsmål' : 'A2 og A1/A3'}
                </span>
              </div>
              {expiresAt && (
                <span className="text-[16px] text-da-text-muted tabular-nums">
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

          {/* STS-påbygg (26.11.2026): A2-kunde uten STS. Arver utløpsdatoen. */}
          {tier === 'paid' && !sts && (
            <div className="border border-[#C9D3DC] rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-[17px] font-semibold tracking-[0.08em] uppercase text-da-text-muted mb-0.5">
                  sts-påbygg
                </div>
                <span className="text-[17px] text-da-text-body">
                  Legg til STS i tilgangen din. Gjelder til samme dato som A2
                  {expiresAt
                    ? `, ${new Date(expiresAt).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })}`
                    : ''}
                  .
                </span>
                {pabyggErr && (
                  <p role="alert" className="mt-1 text-[14px] text-amber-700">{pabyggErr}</p>
                )}
              </div>
              <button
                onClick={kjopPabygg}
                disabled={pabyggBusy}
                className="bg-da-gold text-da-navy-dark font-bold h-12 px-4 rounded-xl inline-flex items-center justify-center transition-all hover:brightness-105 text-[17px] disabled:opacity-60"
              >
                {pabyggBusy ? 'Sender …' : `Legg til STS · ${PRICE_STS_UPGRADE} kr`}
              </button>
            </div>
          )}

          {/* Passord. Lagt til 05.08.2026 fordi 19 av 24 betalende kunder ikke
              HAR passord — kontoen deres ble opprettet av Stripe-webhooken, og
              «Opprett konto» på innloggingssiden kunne ikke hjelpe dem: den
              kaller signUp, som feiler når e-posten allerede finnes.
              updateUser krever bare en sesjon, ikke et gammelt passord. */}
          {user && !user.is_anonymous && (
            <div className="border border-[#C9D3DC] rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-[17px] font-semibold tracking-[0.08em] uppercase text-da-text-muted mb-0.5">
                  innlogging
                </div>
                <span className="text-[17px] text-da-text-body">
                  Vil du slippe å hente lenke i e-posten hver gang?
                </span>
              </div>
              <button
                onClick={() => navigate('/sett-passord')}
                className="bg-white border border-[#C9D3DC] hover:border-da-navy text-da-navy font-semibold h-12 px-4 rounded-xl inline-flex items-center justify-center transition-colors text-[17px] shrink-0"
              >
                Sett passord →
              </button>
            </div>
          )}

          {!hasAnyData && (
            <div className="border border-[#C9D3DC] rounded-2xl p-4 text-center">
              <p className="text-[16px] text-da-text-body mb-3">
                Ingen fremgang registrert ennå. Start en økt, så bygger
                oversikten seg opp her.
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-da-navy hover:bg-da-navy-mid text-white font-semibold h-12 px-6 rounded-xl inline-flex items-center justify-center transition-colors"
              >
                Start øving →
              </button>
            </div>
          )}

          {examTypes.map((type) => {
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
                className="border border-[#C9D3DC] rounded-2xl p-4"
              >
                <div className="flex items-baseline justify-between mb-1">
                  <h2 className="text-[18px] font-medium text-da-navy">
                    {examLabel(type)}
                  </h2>
                  <span
                    className={`text-[17px] font-semibold tracking-[0.08em] ${level.text}`}
                  >
                    {level.key === 'gold' ? '🏅 ' : ''}
                    {level.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="font-cond text-[36px] font-bold text-da-navy tabular-nums leading-none">
                    {answered >= 15 ? `${pct}%` : '—'}
                  </span>
                  <span className="text-[17px] text-da-text-muted tracking-wide">
                    {answered} svart · {coveragePct}% av banken dekket
                  </span>
                </div>
                {/* Fremdriftslinje med 75 %-merke (bestått-grensen) */}
                <div className="relative h-2 bg-[#E3E9EE] rounded-full mb-4 overflow-hidden">
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
                          <p className="text-[17px] text-da-navy leading-tight truncate">
                            {c.category}
                          </p>
                          <p className="text-[17px] text-da-text-muted tabular-nums">
                            {c.answered === 0
                              ? 'ikke øvd ennå'
                              : `${c.correct}/${c.answered} riktige · ${c.answered} av ${c.total_questions} prøvd`}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            navigate(`/practice/${type}?kategori=${encodeURIComponent(c.category)}`)
                          }
                          className="min-h-11 inline-flex items-center text-[16px] font-semibold text-da-navy hover:underline shrink-0"
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
            <div className="border border-[#C9D3DC] rounded-2xl p-4">
              <h2 className="text-[17px] font-medium text-da-navy mb-3">
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
                      <span className="text-[17px] text-da-text-muted tabular-nums">
                        {dateStr} · {examLabel(s.exam_type)}
                      </span>
                      <span className="text-[16px] font-semibold tabular-nums text-da-navy">
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
            <p className="text-[16px] text-da-text-muted text-center leading-snug">
              Fremgangen lagres for denne nettleseren. Logg inn for å beholde
              den på tvers av enheter.
            </p>
          )}

          <button
            onClick={() => navigate('/')}
            className="w-full bg-white border border-[#C9D3DC] hover:border-da-navy text-da-navy font-semibold h-12 px-4 rounded-xl transition-colors"
          >
            Tilbake til hjem
          </button>

          {/* Utlogging (Frode 14.11.2026): fantes bare nederst på forsiden. */}
          {user && !user.is_anonymous && (
            <div className="flex justify-center pt-1">
              <AuthHeader variant="light" />
            </div>
          )}

          {/* STS-test før lansering (03.10.2026): i den installerte appen kan
              man ikke legge ?sts-test=1 i adressen, så bryteren står her.
              Forsvinner når STS_LIVE settes til true. */}
          {!STS_LIVE && (
            <button
              onClick={() => {
                setStsPreview(!stsPreviewOn())
                window.location.assign('/')
              }}
              className="block mx-auto text-[17px] text-da-text-muted hover:text-da-navy tracking-[0.05em] py-2 transition-colors"
            >
              {stsPreviewOn() ? 'STS-test er på · trykk for å slå av' : 'STS-test er av · trykk for å slå på'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
