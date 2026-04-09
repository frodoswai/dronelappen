// HUD-style corner brackets — four small L-shapes in the corners of a
// card, evoking a targeting reticle / instrument panel crop mark.
// Three variants: 'solid' (navy, full), 'muted' (navy, 50%), 'gold'
// (the Rapid accent). Must be placed inside a `relative` parent.
export default function CrosshairMarks({ variant = 'solid' }) {
  const isGold = variant === 'gold'
  const stroke = isGold ? '#E89F1E' : '#083554'
  const opacity = variant === 'muted' ? 0.5 : 1

  const Mark = ({ d, className }) => (
    <div className={`absolute ${className}`}>
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <path d={d} stroke={stroke} strokeWidth="1.4" fill="none" opacity={opacity} />
      </svg>
    </div>
  )

  return (
    <>
      <Mark d="M0 0 H6 M0 0 V6" className="top-[5px] left-[5px]" />
      <Mark d="M10 0 H4 M10 0 V6" className="top-[5px] right-[5px]" />
      <Mark d="M0 10 H6 M0 10 V4" className="bottom-[5px] left-[5px]" />
      <Mark d="M10 10 H4 M10 10 V4" className="bottom-[5px] right-[5px]" />
    </>
  )
}
