// Ducted rotor SVG — inspired by DJI Avata 360, drawn as gold line art
// on navy. Positioned absolute in the upper-right of the dark hero,
// bleeding ~30% off-canvas so it reads as a brand beacon and not a logo.
// Used only on Home (not ExamSelect) to avoid visual repetition.
export default function HeroPropeller({ className = '' }) {
  return (
    <svg
      className={`absolute pointer-events-none z-0 ${className}`}
      style={{ top: '-45px', right: '-75px', opacity: 0.4 }}
      width="210"
      height="210"
      viewBox="0 0 200 200"
      fill="none"
      stroke="#E89F1E"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {/* Ducted housing — outer rings */}
      <circle cx="100" cy="100" r="92" strokeWidth="2" />
      <circle cx="100" cy="100" r="85" strokeWidth="1.2" />
      <circle cx="100" cy="100" r="78" strokeWidth="0.8" opacity="0.5" />

      {/* Crosshair structural lines */}
      <line x1="6" y1="100" x2="194" y2="100" strokeWidth="0.6" opacity="0.35" strokeDasharray="2,4" />
      <line x1="100" y1="6" x2="100" y2="194" strokeWidth="0.6" opacity="0.35" strokeDasharray="2,4" />

      {/* Four propeller blades */}
      <g strokeWidth="1.4" opacity="0.85">
        <ellipse cx="100" cy="58" rx="6" ry="26" transform="rotate(25 100 100)" />
        <ellipse cx="100" cy="58" rx="6" ry="26" transform="rotate(115 100 100)" />
        <ellipse cx="100" cy="58" rx="6" ry="26" transform="rotate(205 100 100)" />
        <ellipse cx="100" cy="58" rx="6" ry="26" transform="rotate(295 100 100)" />
      </g>

      {/* Central hub — gold fill is the brand beacon */}
      <circle cx="100" cy="100" r="14" strokeWidth="1.3" />
      <circle cx="100" cy="100" r="8" fill="#E89F1E" stroke="none" />
      <circle cx="100" cy="100" r="2.5" fill="#0a1628" stroke="none" />

      {/* Inner ghost rings — radar sweep feel */}
      <circle cx="100" cy="100" r="34" strokeWidth="0.5" opacity="0.3" />
      <circle cx="100" cy="100" r="48" strokeWidth="0.5" opacity="0.25" />
    </svg>
  )
}
