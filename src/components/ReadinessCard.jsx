import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { enabledExamTypes, examLabel } from '../lib/exams'

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
        // Bare eksamenstyper som er skrudd på (lib/exams.js). Når STS-banken
        // er lastet inn, gir get_readiness STS-rader til alle brukere, også
        // før STS er synlig i appen.
        const enabled = enabledExamTypes()
        for (const row of data) {
          const k = row.exam_type
          if (!enabled.includes(k)) continue
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
          // onData skjuler Homes eget fortsett-kort. Den skal derfor BARE
          // fyre når dette kortet faktisk kommer til å rendre — altså når
          // brukeren har nok svar til at vi har noe å si. Fra 05.08.2026
          // returnerer vi null under 15 svar, og uten denne sjekken ville
          // begge kortene forsvunnet: vi sa «skjul ditt», og viste ikke vårt.
          const mest = Math.max(...Object.values(withData).map((v) => v.answered))
          if (mest >= MIN_ANSWERED) onData?.(withData)
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
  const label = examLabel(examType)
  const pct = Math.round((d.correct / d.answered) * 100)
  const tooEarly = d.answered < MIN_ANSWERED

  // Under 15 svar har kortet ingenting å si, og da skal det ikke ta plass.
  // Fram til 05.08.2026 rendret det «For tidlig å si …» i den beste slotten
  // på forsiden — rett under knappene, over A2-kortet — altså en ramme rundt
  // en beskjed om at vi ikke har noen beskjed. Alle med 1–14 svar så den.
  // Nå møter de A2-kortet i stedet, som er det de faktisk skal gjøre.
  // Homes eget fortsett-kort tar over i stedet — se onData-sjekken over.
  if (tooEarly) return null
  const weakest = [...d.categories]
    .filter((c) => c.answered >= 3)
    .sort((a, b) => a.pct - b.pct)[0]

  // B2-drakt (14.11.2026): kortet står i den mørke toppen på forsiden, med
  // ring som på resultatsiden. Logikken over er uendret.
  const over = pct >= PASS
  const farge = over ? '#5BD69A' : '#E89F1E'
  const RING = 2 * Math.PI * 53
  const feil = d.answered - d.correct
  const dagens = { to: `/practice/${examType}?dagens=1`, tekst: 'Dagens 10' }
  // Under bestått-grensen går hovedknappen rett til svakeste kategori (18/7).
  const primaer =
    !over && weakest
      ? { to: `/practice/${examType}?kategori=${encodeURIComponent(weakest.name)}`, tekst: 'Øv på svakeste tema' }
      : dagens
  const sekundaer =
    !over && weakest
      ? dagens
      : feil > 0
      ? { to: `/practice/${examType}?feil=1`, tekst: `Øv på ${feil} feil` }
      : resume?.path
      ? { to: resume.path, tekst: 'Fortsett der du slapp' }
      : null

  return (
    <div className="rise-in mb-5">
      <div className="flex items-center gap-[18px] mb-5">
        <div className="relative w-[124px] h-[124px] shrink-0 flex items-center justify-center">
          <svg aria-hidden="true" width="124" height="124" viewBox="0 0 124 124" className="absolute inset-0">
            <circle cx="62" cy="62" r="53" fill="none" stroke="#1E3A57" strokeWidth="10" />
            {pct > 0 && (
              <circle
                cx="62"
                cy="62"
                r="53"
                fill="none"
                stroke={farge}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(Math.min(100, pct) / 100) * RING} ${RING}`}
                transform="rotate(-90 62 62)"
              />
            )}
          </svg>
          <span className="font-cond text-[44px] font-bold text-white leading-none tabular-nums">
            {pct}
            <span className="text-[22px] text-da-dark-slogan"> %</span>
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-cond text-[15px] font-semibold tracking-[0.08em] uppercase text-da-dark-slogan mb-1">
            Er du klar? · {label}
          </p>
          <h1 className="font-cond text-[30px] font-bold leading-[1.05] mb-1.5" style={{ color: farge }}>
            {over ? 'Over grensen' : pct >= 60 ? 'Nesten der' : 'Under grensen'}
          </h1>
          <p className="text-[15px] text-[#C9D6E2] leading-[1.4]">
            Bestått krever {PASS} %.
            {weakest && weakest.pct < 100 ? ` Svakest: ${weakest.name}, ${weakest.pct} %.` : ''}
          </p>
        </div>
      </div>
      <div className="flex gap-2.5">
        <Link
          to={primaer.to}
          className={`flex-1 h-14 rounded-[14px] text-[16px] font-bold inline-flex items-center justify-center text-center px-3 transition-all hover:brightness-105 active:scale-[0.98] ${
            tier === 'paid' ? 'bg-da-gold text-da-navy-dark' : 'bg-white text-da-navy'
          }`}
        >
          {primaer.tekst}
        </Link>
        {sekundaer && (
          <Link
            to={sekundaer.to}
            className="flex-1 h-14 rounded-[14px] border border-[#5C7691] hover:border-white text-white text-[16px] font-semibold inline-flex items-center justify-center text-center px-3 transition-colors active:scale-[0.98]"
          >
            {sekundaer.tekst}
          </Link>
        )}
      </div>
      <p className="mt-2.5 text-[13px] text-da-dark-slogan leading-[1.45]">
        Basert på siste svar på {d.answered} av {d.total} spørsmål
        {!over && feil > 0 && (
          <>
            {' '}·{' '}
            <Link to={`/practice/${examType}?feil=1`} className="underline underline-offset-2 text-[#EAF1F7]">
              øv på {feil} feil
            </Link>
          </>
        )}
        {tier !== 'paid' && ' · hele banken gir presis måling'}
      </p>
    </div>
  )
}
