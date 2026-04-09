// Three-mode pill row that lives at the bottom of each exam card on
// Home. Primary variant = cream + gold (for the A2 card); muted
// variant = translucent navy (for the quieter A1/A3 card).
export default function ModePillRow({ variant = 'primary' }) {
  const isPrimary = variant === 'primary'
  const baseClass =
    'font-mono text-[10px] px-2.5 py-1 rounded-[3px] tracking-[0.025em]'
  const examPill = isPrimary
    ? 'text-da-navy bg-da-cream'
    : 'text-da-text-dim bg-da-navy/5'
  const rapidPill = isPrimary
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
      <span className={`${baseClass} ${examPill}`}>øv fritt</span>
      <span className={`${baseClass} ${rapidPill} flex items-center gap-1`}>
        <BoltSvg fill={isPrimary ? '#7A4F05' : '#6b7a8c'} />
        rapid
      </span>
    </div>
  )
}
