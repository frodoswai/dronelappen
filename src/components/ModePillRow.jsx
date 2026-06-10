import { Link } from 'react-router-dom'
import { recordSessionStart } from '../lib/sessionHistory'

// Three-mode pill row at the bottom of each exam card on Home.
// Primary variant = cream + gold (A2 card); muted = translucent navy
// (the quieter A1/A3 card).
//
// Round 4 (affordance pass): the pills always *looked* like buttons —
// now they are. Each pill is a real deep-link straight into its mode
// (/quiz, /practice, /rapid), recording the session start exactly like
// ExamSelect does. They sit above the card's stretched-link overlay
// (z-handling lives in Home.jsx), so tapping a pill skips the mode
// picker entirely while tapping anywhere else on the card still opens it.
//
// Declared at module scope (not inside the component) so it isn't
// recreated as a new component type on every render.
function BoltSvg({ fill }) {
  return (
    <svg width="7" height="9" viewBox="0 0 7 9" fill={fill} aria-hidden="true">
      <polygon points="4,0 0,5.5 2.5,5.5 1.5,9 7,3.5 4,3.5" />
    </svg>
  )
}

export default function ModePillRow({ variant = 'primary', examType }) {
  const isPrimary = variant === 'primary'
  const baseClass =
    'quiz-option font-mono text-[11px] px-3 py-1.5 rounded-[3px] tracking-[0.025em] transition-all hover:-translate-y-px hover:shadow-sm active:scale-95'
  const examPill = isPrimary
    ? 'text-da-navy bg-da-cream'
    : 'text-da-text-dim bg-da-navy/5'
  const tempoPill = isPrimary
    ? 'text-da-gold-text bg-da-cream-light'
    : 'text-da-text-dim bg-da-navy/5'

  const pills = [
    { mode: 'exam', label: 'eksamen', base: '/quiz', cls: examPill },
    { mode: 'practice', label: 'læring', base: '/practice', cls: examPill },
    { mode: 'rapid', label: 'tempo', base: '/rapid', cls: tempoPill, bolt: true },
  ]

  return (
    <div className="flex gap-1.5 items-center flex-wrap">
      {pills.map((p) => (
        <Link
          key={p.mode}
          to={`${p.base}/${examType}`}
          onClick={() => recordSessionStart(examType, p.mode)}
          className={`${baseClass} ${p.cls} ${
            p.bolt ? 'flex items-center gap-1' : ''
          }`}
        >
          {p.bolt && <BoltSvg fill={isPrimary ? '#7A4F05' : '#6b7a8c'} />}
          {p.label}
        </Link>
      ))}
    </div>
  )
}
