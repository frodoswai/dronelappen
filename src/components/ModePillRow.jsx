// Three-mode pill row that lives at the bottom of each exam card on
// Home. Primary variant = cream + gold (for the A2 card); muted
// variant = translucent navy (for the quieter A1/A3 card).
//
// Round 2.5: pills bumped from 10px/px-2.5/py-1 to 11px/px-3/py-1.5
// for arm's-length phone readability, and mode labels renamed —
// "øv fritt" → "læring", "rapid" → "tempo" (bolt SVG stays on tempo).
export default function ModePillRow({ variant = 'primary' }) {
  const isPrimary = variant === 'primary'
  const baseClass =
    'font-mono text-[11px] px-3 py-1.5 rounded-[3px] tracking-[0.025em]'
  const examPill = isPrimary
    ? 'text-da-navy bg-da-cream'
    : 'text-da-text-dim bg-da-navy/5'
  const tempoPill = isPrimary
    ? 'text-da-gold-text bg-da-cream-light'
    : 'text-da-text-dim bg-da-navy/5'

  const BoltSvg = ({ fill }) => (
    <svg width="7" height="9" viewBox="0 0 7 9" fill={fill} aria-hidden="true">
      <polygon points="4,0 0,5.5 2.5,5.5 1.5,9 7,3.5 4,3.5" />
    </svg>
  )

  return (
    <div className="flex gap-1.5 items-center flex-wrap">
      <span className={`${baseClass} ${examPill}`}>eksamen</span>
      <span className={`${baseClass} ${examPill}`}>læring</span>
      <span className={`${baseClass} ${tempoPill} flex items-center gap-1`}>
        <BoltSvg fill={isPrimary ? '#7A4F05' : '#6b7a8c'} />
        tempo
      </span>
    </div>
  )
}
