import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase, fetchQuestions } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import QuizLayout from '../components/QuizLayout'
import Paywall from '../components/Paywall'

// Exam mode wall-clock budget. Using a constant keeps the display/fix and
// handleTimeUp math in sync.
const EXAM_DURATION_MS = 60 * 60 * 1000 // 60 min
const LOW_TIME_MS = 5 * 60 * 1000

// Eksamensmodus speiler de offisielle prøvene i antall spørsmål:
// A1/A3 = 40 (flydrone.no, verifisert 2026-07-08), A2 = 30.
// Bestå-terskelen (75 %) regnes dynamisk i Results: 30/40 og 23/30.
// Læring (practice) holder seg på 30 uansett type.
const EXAM_QUESTION_COUNT = { A1_A3: 40, A2: 30 }
const PRACTICE_QUESTION_COUNT = 30

// Fisher-Yates shuffle
function shuffleArray(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Round 3: this page handles both Eksamen (/quiz/:examType) and Læring
// (/practice/:examType). The two modes share question fetching, option
// shuffling, and the wall-clock timer (Eksamen only), but diverge in
// feedback behavior:
//   Læring  → answer locks immediately, ✓/✗ + explanation shown per
//             question, analytics logged on each answer.
//   Eksamen → like the real trafikkstasjon exam: no feedback at all
//             until the end. Answers are changeable, Forrige/Neste
//             navigation between questions, and all logging is deferred
//             to completion so changed answers only count once.
export default function Quiz() {
  const { examType } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const { user } = useAuth()

  const isPracticeMode = location.pathname.includes('practice')

  // Målrettet læring (18/7): ?feil=1 → kun spørsmål der brukerens siste
  // svar var feil (feilbanken), ?kategori=<navn> → kun én kategori.
  // Kun Læring — Eksamen skal alltid være offisielt format. Filtrene
  // SNITTES mot settet fra get-questions, så gratis-brukere kan aldri
  // nå spørsmål utenfor free_pool denne veien.
  const searchParams = new URLSearchParams(location.search)
  const mistakesOnly = isPracticeMode && searchParams.get('feil') === '1'
  const categoryFilter = isPracticeMode ? searchParams.get('kategori') : null
  const hasFilter = mistakesOnly || !!categoryFilter
  // Timer kun for A2: den ekte A2-eksamen på trafikkstasjonen har 60 min,
  // mens A1/A3-netteksamen på flydrone.no er selvgående uten dokumentert
  // tidsgrense (verifisert mot Luftfartstilsynet/UAS Norway 2026-06-10).
  // Untimed A1/A3 er altså bevisst — ikke en manglende feature.
  const needsTimer = examType === 'A2' && !isPracticeMode

  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)
  // Nav row ref for the mobile auto-scroll below (Læring only).
  const navRowRef = useRef(null)

  // Mobil-fix (Frode 18/7): i Læring dytter forklaringsboksen Neste-knappen
  // under folden på lange forklaringer. Når forklaringen vises, scroller vi
  // mykt slik at forklaring + Neste kommer i syne. scroll-mb på nav-raden
  // holder den klar av den faste kjøp-baren for gratisbrukere.
  useEffect(() => {
    if (!showExplanation) return
    const id = requestAnimationFrame(() => {
      navRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    })
    return () => cancelAnimationFrame(id)
  }, [showExplanation])
  // Wall-clock anchored timer state. `startTime` is set once after the
  // questions load so network latency doesn't eat into the exam budget.
  // `remainingMs` is derived from Date.now() on every tick, so tab-blur
  // (which throttles setInterval) can't pause the countdown.
  const [startTime, setStartTime] = useState(null)
  const [remainingMs, setRemainingMs] = useState(needsTimer ? EXAM_DURATION_MS : null)
  const [quizComplete, setQuizComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Tier as reported by the get-questions Edge Function. When 'free', the
  // server capped the set at the 25-question free pool (FREE_LIMIT), so the
  // end of this quiz is the paywall moment rather than a plain results page.
  const [fetchedTier, setFetchedTier] = useState(null)
  const [showPaywall, setShowPaywall] = useState(false)

  // Fetch questions on mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const { questions: data, tier } = await fetchQuestions({ examType })
        setFetchedTier(tier ?? null)

        // Målrettet læring: snitt poolen mot feilbank- og/eller kategori-
        // IDer fra RPC-ene i migrasjon 007. RPC-feil behandles som vanlig
        // lastefeil; tomt snitt gir den dedikerte tom-tilstanden under.
        let pool = data || []
        if (mistakesOnly || categoryFilter) {
          let allowed = null
          if (mistakesOnly) {
            const { data: ids, error: idErr } = await supabase.rpc('get_mistake_question_ids')
            if (idErr) throw idErr
            allowed = new Set(ids || [])
          }
          if (categoryFilter) {
            const { data: ids, error: idErr } = await supabase.rpc('get_category_question_ids', {
              p_exam_type: examType,
              p_category: categoryFilter,
            })
            if (idErr) throw idErr
            const catSet = new Set(ids || [])
            allowed = allowed
              ? new Set([...allowed].filter((id) => catSet.has(id)))
              : catSet
          }
          pool = pool.filter((q) => allowed.has(q.id))
        }

        // Shuffle question order, then shuffle each question's options.
        // Free tier: serveren capper poolen på 25, så slice er no-op der.
        const targetCount = isPracticeMode
          ? PRACTICE_QUESTION_COUNT
          : EXAM_QUESTION_COUNT[examType] ?? 30
        const shuffled = shuffleArray(pool)
        const selected = shuffled.slice(0, targetCount).map(q => ({
          ...q,
          options: shuffleArray(q.options)
        }))
        setQuestions(selected)
        setAnswers(new Array(selected.length).fill(null))
        setLoading(false)
        // Anchor the wall-clock timer the moment questions are ready (A2
        // Eksamen only) — not during the fetch, so network latency doesn't
        // eat into the exam budget. Set here rather than in a separate effect
        // to avoid a synchronous setState-in-effect.
        if (needsTimer) setStartTime(Date.now())
      } catch (err) {
        console.error('Error fetching questions:', err)
        setError('Feil ved lasting av spørsmål')
        setLoading(false)
      }
    }
    loadQuestions()
  }, [examType, needsTimer, isPracticeMode, mistakesOnly, categoryFilter])

  // Wall-clock tick — recomputes remainingMs from Date.now() on every pass,
  // so the countdown is correct after tab-blur / backgrounding / throttling.
  // 250ms interval keeps the MM:SS display snappy without burning battery.
  useEffect(() => {
    if (!needsTimer || startTime === null || quizComplete) return
    const tick = () => {
      const left = Math.max(0, EXAM_DURATION_MS - (Date.now() - startTime))
      setRemainingMs(left)
      if (left <= 0) setQuizComplete(true)
    }
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [needsTimer, startTime, quizComplete])

  // On completion: persist the session (logged-in only) and route to results.
  // Done in an effect — not during render — so Date.now() isn't called in the
  // render path and the insert/navigate fire exactly once (no StrictMode
  // double-run).
  useEffect(() => {
    if (!quizComplete || questions.length === 0) return

    // Eksamen defers per-question logging to completion (Læring logs on
    // each answer in handleSelectAnswer) so changed answers count once.
    // All fire-and-forget — failures must never block the results page.
    if (!isPracticeMode) {
      questions.forEach((q, idx) => {
        const ans = answers[idx]
        if (!ans) return // unanswered (timer ran out) — don't pollute stats
        try {
          supabase
            .rpc('log_question_answer', {
              p_question_id: q.id,
              p_was_correct: ans === q.correct_option_id,
            })
            .then(() => {})
            .catch(() => {})
        } catch (_) { /* swallow */ }
      })
      if (user) {
        const rows = questions
          .map((q, idx) =>
            answers[idx]
              ? {
                  user_id: user.id,
                  question_id: q.id,
                  correct: answers[idx] === q.correct_option_id,
                }
              : null
          )
          .filter(Boolean)
        if (rows.length > 0) {
          try {
            supabase
              .from('user_progress')
              .insert(rows)
              .then(() => {})
              .catch(() => {})
          } catch (_) { /* swallow */ }
        }
      }
    }

    if (user) {
      const correctTotal = answers.filter(
        (ans, idx) => ans && questions[idx] && ans === questions[idx].correct_option_id
      ).length
      supabase
        .from('quiz_sessions')
        .insert({
          user_id: user.id,
          exam_type: examType,
          completed_at: new Date().toISOString(),
          score: correctTotal,
          total_questions: questions.length,
        })
        .then(() => {})
        .catch(() => {})
    }

    // A2 Eksamen is the only mode with a wall-clock timer, so it's the only
    // mode that reports time used. Compute from startTime to capture the
    // actual elapsed value even if the user finished early.
    const timeUsedMs =
      needsTimer && startTime !== null
        ? Math.min(EXAM_DURATION_MS, Date.now() - startTime)
        : null
    navigate('/results', {
      state: {
        questions,
        answers,
        isPracticeMode,
        examType,
        timeUsedMs,
        examDurationMs: needsTimer ? EXAM_DURATION_MS : null,
      },
    })
  }, [quizComplete, questions, answers, user, examType, isPracticeMode, needsTimer, startTime, navigate])

  // Helper: find option text by id
  const getOptionText = (question, optionId) => {
    const opt = question.options.find(o => o.id === optionId)
    return opt ? opt.text : optionId
  }

  // Loading — match the Round 2 dark-hero language instead of a bare
  // white flash.
  if (loading) {
    return (
      <div className="min-h-screen bg-da-navy-dark flex items-center justify-center p-4">
        <p className="font-mono text-[12px] tracking-[0.1em] text-da-dark-slogan">
          laster spørsmål…
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-da-bg flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-700 text-base mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="quiz-option bg-da-navy text-da-bg font-medium py-3 px-6 rounded-lg"
          >
            Tilbake til hjem
          </button>
        </div>
      </div>
    )
  }

  // Tom-tilstand for målrettet læring: feilbanken er tom (alt riktig sist,
  // eller utlogget/fersk bruker) eller kategorien finnes ikke i brukerens
  // pool (gratis-pool mangler kategorien). Vennlig melding, aldri feil.
  if (hasFilter && questions.length === 0) {
    return (
      <div className="min-h-screen bg-da-bg flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="font-mono text-[11px] font-medium text-da-gold tracking-[0.12em] mb-2">
            {mistakesOnly ? 'feilbanken' : 'kategori'}
          </p>
          <p className="text-[15px] font-medium text-da-navy mb-2">
            {mistakesOnly
              ? user
                ? 'Ingen feil å øve på — bra jobba!'
                : 'Logg inn og øv litt først, så samler vi feilene dine her.'
              : 'Fant ingen spørsmål i denne kategorien i din pool.'}
          </p>
          <p className="text-[12.5px] text-da-text-body leading-[1.5] mb-4">
            {mistakesOnly && user
              ? 'Siste svar på alle spørsmål du har øvd på var riktig. Fortsett med vanlig læring for å dekke resten av banken.'
              : 'Prøv vanlig læring i stedet.'}
          </p>
          <button
            onClick={() => navigate(`/practice/${examType}`)}
            className="quiz-option bg-da-navy hover:bg-da-navy-mid text-da-bg font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Start vanlig læring →
          </button>
        </div>
      </div>
    )
  }

  // Completion is handled by the effect above (persist + navigate); render
  // nothing while that runs.
  if (quizComplete) return null

  // Free users hit the paywall after the 25-question free pool. Buy is the
  // primary action; onContinue still lets them see their results, so the wall
  // never traps their own session data.
  if (showPaywall) {
    return (
      <Paywall
        answered={questions.length}
        onContinue={() => { setShowPaywall(false); setQuizComplete(true) }}
      />
    )
  }

  const freeCapped = fetchedTier === 'free'
  const currentQuestion = questions[currentIndex]
  if (!currentQuestion) return null
  const isAnswered = selectedAnswer !== null
  const isCorrect = selectedAnswer === currentQuestion.correct_option_id

  const handleSelectAnswer = (optionId) => {
    // Blur the tapped button so its :focus/:hover style does not leak
    // onto the next question's button at the same screen position.
    if (typeof document !== 'undefined' && document.activeElement?.blur) {
      document.activeElement.blur()
    }

    // Eksamen: selection is changeable and reveals nothing — the real
    // exam gives no feedback until the end. Logging happens on completion.
    if (!isPracticeMode) {
      setSelectedAnswer(optionId)
      const newAnswers = [...answers]
      newAnswers[currentIndex] = optionId
      setAnswers(newAnswers)
      return
    }

    // Læring: first answer locks, feedback + logging fire immediately.
    if (isAnswered) return
    setSelectedAnswer(optionId)
    setShowExplanation(true)
    const newAnswers = [...answers]
    newAnswers[currentIndex] = optionId
    setAnswers(newAnswers)
    // Fire-and-forget analytics: anonymous per-question stats, no user data.
    // Failures must never block the quiz.
    try {
      supabase
        .rpc('log_question_answer', {
          p_question_id: currentQuestion.id,
          p_was_correct: optionId === currentQuestion.correct_option_id,
        })
        .then(() => {})
        .catch(() => {})
    } catch (_) { /* swallow */ }

    // Save per-question progress for logged-in users (fire-and-forget).
    if (user) {
      try {
        supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            question_id: currentQuestion.id,
            correct: optionId === currentQuestion.correct_option_id,
          })
          .then(() => {})
          .catch(() => {})
      } catch (_) { /* swallow */ }
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const next = currentIndex + 1
      setCurrentIndex(next)
      // Eksamen allows revisiting: restore a previously given answer so
      // the selection survives Forrige/Neste round-trips. Læring is
      // strictly linear, so `answers[next]` is always null there.
      setSelectedAnswer(answers[next] ?? null)
      setShowExplanation(false)
      // Tilbakestill scroll så neste spørsmål starter øverst — ellers står
      // brukeren igjen nede der Neste var etter auto-scrollen over.
      window.scrollTo({ top: 0, behavior: 'auto' })
    } else if (freeCapped) {
      // End of the free 25-question pool → paywall instead of results.
      // The InitiateCheckout intent event fires from the paywall's buy button.
      window.fbq?.('trackCustom', 'FreePoolCompleted')
      setShowPaywall(true)
    } else {
      setQuizComplete(true)
    }
  }

  // Eksamen only — step back to review/change an earlier answer.
  const handlePrev = () => {
    if (currentIndex === 0) return
    const prev = currentIndex - 1
    setCurrentIndex(prev)
    setSelectedAnswer(answers[prev] ?? null)
    setShowExplanation(false)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const formatMs = (ms) => {
    if (ms === null || ms === undefined) return ''
    const totalSec = Math.floor(ms / 1000)
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const correctCount = answers.slice(0, currentIndex + (isAnswered ? 1 : 0)).filter(
    (ans, idx) => ans && questions[idx] && ans === questions[idx].correct_option_id
  ).length

  // Dynamic labels based on shuffled position (A, B, C, D...)
  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F']

  // QuizLayout props
  const answeredSoFar = currentIndex + (isAnswered ? 1 : 0)
  const layoutMode = isPracticeMode ? 'laering' : 'eksamen'
  // Filtrert læring viser hva man øver på i header-statsen (truncate i
  // QuizLayout tar seg av lange kategorinavn på smale skjermer).
  const filterLabel = mistakesOnly ? 'feilbank' : categoryFilter
  const layoutStats = isPracticeMode
    ? [filterLabel, answeredSoFar > 0 ? `${correctCount}/${answeredSoFar} riktige` : null]
        .filter(Boolean)
        .join(' · ') || null
    : null
  const layoutTimer = needsTimer && remainingMs !== null ? formatMs(remainingMs) : null
  const timerUrgent = needsTimer && remainingMs !== null && remainingMs <= LOW_TIME_MS

  return (
    <QuizLayout
      mode={layoutMode}
      examType={examType}
      progress={{ current: currentIndex + 1, total: questions.length }}
      stats={layoutStats}
      timer={layoutTimer}
      timerUrgent={timerUrgent}
    >
      {/* ═══ Question card ═══
          Round 3: white surface, 0.5px navy hairline border, no shadow.
          Matches the quiet-but-precise HUD aesthetic from Home/ExamSelect. */}
      <div className="bg-white border-[0.5px] border-da-navy/30 rounded-lg p-4 mb-3">
        <h2 className="text-[15px] font-medium text-da-navy mb-3 leading-[1.45]">
          {currentQuestion.question_text}
        </h2>

        {/* Options — rendered in shuffled order with positional labels */}
        <div className="space-y-2.5">
          {currentQuestion.options.map((option, idx) => {
            const optLabel = optionLabels[idx] || option.id.toUpperCase()
            const isSelected = selectedAnswer === option.id
            const isCorrectOpt = option.id === currentQuestion.correct_option_id

            // Round 3 state palette (Læring):
            //   idle     → white / navy hairline
            //   correct  → green tint, green border
            //   wrong    → amber tint, amber border (never harsh red)
            //   dim      → 50% opacity on non-chosen options after answer
            // Eksamen never reveals correctness — selected gets a navy
            // fill, everything else stays idle and tappable.
            let btnClass =
              'quiz-option w-full text-left rounded-lg border-[0.5px] px-4 py-3 transition-all flex items-start gap-3 '

            if (!isPracticeMode) {
              // quiz-option-selected: unntar valgt svar fra touch-regelen i
              // index.css som resetter bakgrunn ved sticky :hover — uten den
              // ble navy-fyllet overstyrt og lys tekst sto på hvit bunn
              // (Frode 18/7: «svaret forsvinner, bare C står igjen»).
              btnClass += isSelected
                ? 'quiz-option-selected bg-da-navy border-da-navy text-da-bg cursor-pointer'
                : 'bg-white border-da-navy/30 hover:border-da-navy/60 hover:bg-da-cream/20 text-da-navy cursor-pointer'
            } else if (!isAnswered) {
              btnClass +=
                'bg-white border-da-navy/30 hover:border-da-navy/60 hover:bg-da-cream/20 text-da-navy cursor-pointer'
            } else if (isCorrectOpt) {
              btnClass +=
                'bg-green-50 border-green-500 text-da-navy'
            } else if (isSelected && !isCorrectOpt) {
              btnClass +=
                'bg-amber-50 border-amber-500 text-da-navy'
            } else {
              btnClass +=
                'bg-white border-da-navy/15 text-da-text-dim opacity-50'
            }

            // Composite key forces React to unmount/remount per question,
            // clearing any browser-tracked :hover / tap-highlight state.
            return (
              <button
                key={`${currentIndex}-${option.id}`}
                onClick={() => handleSelectAnswer(option.id)}
                disabled={isPracticeMode && isAnswered}
                className={btnClass}
              >
                <span className="font-mono text-[13px] font-semibold text-da-gold tracking-wide shrink-0 pt-[1px]">
                  {optLabel}
                </span>
                <span className="text-[14px] leading-[1.45]">{option.text}</span>
              </button>
            )
          })}
        </div>

        {/* Explanation — Læring only. Eksamen gives no feedback until the
            results page (showExplanation is never set in exam mode).
            Cream tint + gold accent bar keeps it distinct from the
            correct/wrong answer buttons above. */}
        {showExplanation && (
          <div className="mt-3 bg-da-cream/40 border-[0.5px] border-da-gold/40 border-l-2 border-l-da-gold rounded px-4 py-3">
            <p
              className={`font-mono text-[11px] font-semibold tracking-[0.1em] mb-1.5 ${
                isCorrect ? 'text-green-700' : 'text-amber-700'
              }`}
            >
              {isCorrect ? '✓ riktig' : '✗ feil'}
            </p>
            {!isCorrect && (
              <p className="text-[12.5px] text-da-text-body mb-1.5 leading-[1.5]">
                <span className="font-medium text-da-navy">Riktig svar:</span>{' '}
                {getOptionText(currentQuestion, currentQuestion.correct_option_id)}
              </p>
            )}
            <p className="text-[12.5px] text-da-text-body leading-[1.5]">
              {currentQuestion.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Nav row — shows once the current question has an answer.
          Eksamen adds Forrige so earlier answers can be reviewed/changed. */}
      {isAnswered && (
        <div ref={navRowRef} className="flex gap-2.5 scroll-mb-16">
          {!isPracticeMode && currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="quiz-option bg-white border-[0.5px] border-da-navy/30 hover:border-da-navy/60 text-da-navy font-medium py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span className="font-mono text-[12px] text-da-gold">←</span>
              <span>Forrige</span>
            </button>
          )}
          <button
            onClick={handleNext}
            className="quiz-option flex-1 bg-da-navy hover:bg-da-navy-mid text-da-bg font-medium py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>
              {currentIndex < questions.length - 1 ? 'Neste' : 'Se resultater'}
            </span>
            <span className="font-mono text-[12px] text-da-gold">→</span>
          </button>
        </div>
      )}
    </QuizLayout>
  )
}
