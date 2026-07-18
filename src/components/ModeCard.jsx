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
  // Round 4 affordance pass: the "start →" text became a filled chip —
  // a real button shape. Chip fill follows the card's hierarchy:
  // navy (Eksamen, primary action), outlined (Læring, secondary),
  // gold (Tempo, the energetic one).
  const config = {
    primary: {
      border: 'border-da-navy',
      labelColor: 'text-da-gold',
      titleColor: 'text-da-navy',
      crosshairVariant: 'solid',
      chip: 'bg-da-navy text-da-bg group-hover:bg-da-navy-mid',
      arrow: 'text-da-gold',
    },
    neutral: {
      border: 'border-da-navy/40',
      labelColor: 'text-da-text-muted',
      titleColor: 'text-da-navy',
      crosshairVariant: 'muted',
      chip: 'bg-white border-[0.5px] border-da-navy/30 text-da-navy group-hover:border-da-navy/60',
      arrow: 'text-da-gold',
    },
    gold: {
      border: 'border-da-gold',
      labelColor: 'text-da-gold',
      titleColor: 'text-da-gold-text',
      crosshairVariant: 'gold',
      chip: 'bg-da-gold text-da-navy-dark group-hover:brightness-105',
      arrow: 'text-da-navy-dark',
    },
  }[variant]

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`quiz-option group relative block bg-white border-[0.5px] ${config.border} rounded-lg px-[18px] pt-4 pb-3.5 mb-2.5 transition-all shadow-[0_1px_2px_rgba(8,53,84,0.05),0_3px_10px_rgba(8,53,84,0.06)] hover:shadow-[0_2px_4px_rgba(8,53,84,0.08),0_8px_22px_rgba(8,53,84,0.12)] hover:-translate-y-[1px] active:scale-[0.99]`}
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

      {/* Round 4: filled chip instead of bare text — the only reliable
          "tap me" signal on touch, where hover styles never fire. */}
      <div className="flex justify-end mt-2.5">
        <span
          className={`font-mono text-[11px] tracking-[0.1em] px-3.5 py-2 rounded-[5px] transition-all ${config.chip}`}
        >
          start{' '}
          <span
            className={`${config.arrow} inline-block transition-transform group-hover:translate-x-0.5`}
          >
            →
          </span>
        </span>
      </div>
    </Link>
  )
}
