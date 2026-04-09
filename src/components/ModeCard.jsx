import { Link } from 'react-router-dom'
import CrosshairMarks from './CrosshairMarks'

// Single mode card used on ExamSelect (Eksamen / Læring / Tempo).
// Three variants share the same shell but swap border, label color,
// title color, crosshair tint, and the "start →" arrow color:
//   primary — solid navy border, gold label, navy title (Eksamen)
//   neutral — soft navy border, muted label, navy title (Læring)
//   gold    — gold border + title, with the lightning bolt SVG (Tempo)
//
// Round 2.5: added explicit "start →" affordance in the bottom-right
// of every card, and bumped the mono label from 10px to 12px for
// arm's-length phone readability.
export default function ModeCard({
  to,
  label,
  title,
  description,
  variant = 'neutral',
  showBolt = false,
  onClick,
}) {
  const config = {
    primary: {
      border: 'border-da-navy',
      labelColor: 'text-da-gold',
      titleColor: 'text-da-navy',
      crosshairVariant: 'solid',
      startColor: 'text-da-navy',
    },
    neutral: {
      border: 'border-da-navy/40',
      labelColor: 'text-da-text-muted',
      titleColor: 'text-da-navy',
      crosshairVariant: 'muted',
      startColor: 'text-da-text-muted',
    },
    gold: {
      border: 'border-da-gold',
      labelColor: 'text-da-gold',
      titleColor: 'text-da-gold-text',
      crosshairVariant: 'gold',
      startColor: 'text-da-gold',
    },
  }[variant]

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`quiz-option relative block bg-white border-[0.5px] ${config.border} rounded-lg px-[18px] pt-5 pb-4 mb-3 hover:shadow-sm transition-shadow`}
    >
      <CrosshairMarks variant={config.crosshairVariant} />
      <div
        className={`font-mono text-[12px] ${config.labelColor} tracking-[0.12em] font-medium mb-1.5`}
      >
        {label}
      </div>
      <div
        className={`text-2xl font-medium ${config.titleColor} leading-none mb-2 tracking-tight flex items-center gap-2`}
      >
        {title}
        {showBolt && (
          <svg
            width="14"
            height="18"
            viewBox="0 0 7 9"
            fill="#E89F1E"
            aria-hidden="true"
          >
            <polygon points="4,0 0,5.5 2.5,5.5 1.5,9 7,3.5 4,3.5" />
          </svg>
        )}
      </div>
      <p className="text-[12.5px] text-da-text-body leading-[1.55]">
        {description}
      </p>

      {/* Round 2.5: explicit clickability affordance. Crosshair marks
          alone weren't reading as "tap me" on device testing. */}
      <div className="flex justify-end mt-3">
        <span
          className={`font-mono text-[11px] ${config.startColor} tracking-[0.1em]`}
        >
          start →
        </span>
      </div>
    </Link>
  )
}
