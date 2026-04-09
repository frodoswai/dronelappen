// Shared in-quiz shell (Round 3). All three in-quiz screens share the
// same structure: compact dark header + 28px fade + light content zone.
// Extracted here so Quiz (Eksamen + Læring) and Rapid (Tempo) stay DRY
// and the visual language from Round 2 Home/ExamSelect carries into the
// actual quiz flow.
//
// Props:
//   mode      — 'eksamen' | 'laering' | 'tempo' — drives the mono label
//   examType  — 'A2' | 'A1_A3' — shown in the header after a middot
//   progress  — { current, total } — "Spørsmål 7/30" in the header
//   stats     — optional extra string (e.g. "5/7 riktige" in Læring/Tempo)
//   timer     — optional string (e.g. "57:23" Eksamen, "⏱ 1:42" Tempo)
//   timerUrgent — optional bool; paints the timer red when true (sub-5-min)
//   onStop    — optional handler; renders a small "stopp" button next to timer
//   flashBg   — optional Tailwind bg class for Rapid correct/wrong flashes
//   children  — question card contents
//
// Layout intent:
//   1. Dark navy-dark zone with mode label / progress / timer
//   2. Thin progress bar at the bottom of the dark zone
//   3. 28px stepped gradient fade (identical to Home/ExamSelect)
//   4. Light content zone hosting the question card

import { Link } from 'react-router-dom'

export default function QuizLayout({
  mode,
  examType,
  progress,
  stats,
  timer,
  timerUrgent,
  onStop,
  flashBg,
  children,
}) {
  const modeLabel =
    mode === 'eksamen'
      ? 'eksamen'
      : mode === 'laering'
      ? 'læring'
      : mode === 'tempo'
      ? 'tempo'
      : mode || ''

  const displayExam =
    examType === 'A1_A3' ? 'A1 / A3' : examType || ''

  const pct =
    progress && progress.total > 0
      ? (progress.current / progress.total) * 100
      : 0

  return (
    <div className={`min-h-screen flex flex-col bg-da-bg transition-colors duration-150 ${flashBg || ''}`}>
      {/* ═══ Compact dark header ═══ */}
      <div className="bg-da-navy-dark px-6 pt-3 pb-3">
        <div className="pt-8">
          {/* Top row — mono label cluster + timer */}
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <Link
                to="/"
                className="quiz-option text-da-gold text-xl leading-none hover:opacity-80 shrink-0"
                aria-label="Tilbake"
              >
                ←
              </Link>
              <span className="font-mono text-[12px] font-medium text-da-gold tracking-[0.1em] truncate">
                {modeLabel}
                {displayExam && (
                  <span className="text-da-dark-slogan"> · {displayExam}</span>
                )}
              </span>
            </div>
            {timer && (
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`font-mono text-[13px] font-semibold tabular-nums ${
                    timerUrgent ? 'text-red-400' : 'text-da-gold'
                  }`}
                  aria-label="Tid"
                >
                  {timer}
                </span>
                {onStop && (
                  <button
                    onClick={onStop}
                    className="quiz-option font-mono text-[10px] tracking-[0.1em] text-da-dark-slogan hover:text-da-bg border-[0.5px] border-da-dark-slogan/40 hover:border-da-bg/60 px-2 py-0.5 rounded transition-colors"
                  >
                    stopp
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Second row — progress counter + optional stats */}
          {progress && (
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="font-mono text-[11px] text-da-dark-slogan tracking-wide tabular-nums">
                spørsmål {progress.current}/{progress.total}
              </span>
              {stats && (
                <span className="font-mono text-[11px] text-da-dark-slogan tracking-wide tabular-nums truncate">
                  {stats}
                </span>
              )}
            </div>
          )}

          {/* Progress bar — hairline, gold on navy */}
          {progress && (
            <div className="w-full h-[2px] bg-da-bg/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-da-gold transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ═══ Fade transition (28px, stepped gradient) ═══ */}
      <div
        className="h-7 shrink-0"
        style={{
          background:
            'linear-gradient(to bottom, #0a1628 0%, #2a3a50 25%, #7e8a9c 55%, #cfd6df 80%, #fafbfc 100%)',
        }}
      />

      {/* ═══ Light content zone ═══ */}
      <div className="px-5 pt-2 pb-6 bg-da-bg">
        <div className="max-w-lg mx-auto">{children}</div>
      </div>
    </div>
  )
}
