// Top-down quadcopter blueprint logo for DroneLappen.
//
// Design principles (matches the reference Frodo uploaded):
//   - Top-down perspective: four circular rotor housings at the corners,
//     X-frame arms from body center, vertical central body.
//   - Direction-forward: the body has a small nose triangle at the top so
//     users see orientation at a glance.
//   - Recognizable at favicon size (32×32): thick 2.2 stroke on rotor rings
//     and arms, simple 2-line propeller cross visible but not cluttered.
//   - Themeable: stroke="currentColor" + filled body use currentColor, so
//     dropping it in any text-colored element adopts that color.
//
// viewBox is 0 0 48 48 so existing CSS sizing still works.
export default function DroneLogo({ className = 'w-10 h-10', title = 'DroneLappen' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>

      {/* X-frame arms — from body center out to each rotor hub. Drawn first
          so the rotor rings visually cap the arm ends. */}
      <g strokeWidth="2.2">
        <line x1="24" y1="24" x2="12" y2="12" />
        <line x1="24" y1="24" x2="36" y2="12" />
        <line x1="24" y1="24" x2="12" y2="36" />
        <line x1="24" y1="24" x2="36" y2="36" />
      </g>

      {/* Rotor housings — thick outer rings, top-down view */}
      <g strokeWidth="2.2">
        <circle cx="12" cy="12" r="6" />
        <circle cx="36" cy="12" r="6" />
        <circle cx="12" cy="36" r="6" />
        <circle cx="36" cy="36" r="6" />
      </g>

      {/* Propeller blades — two crossed lines per rotor. Thinner so the
          housing stays the dominant shape at favicon scale. */}
      <g strokeWidth="1.1">
        {/* top-left */}
        <line x1="7" y1="12" x2="17" y2="12" />
        <line x1="12" y1="7" x2="12" y2="17" />
        {/* top-right */}
        <line x1="31" y1="12" x2="41" y2="12" />
        <line x1="36" y1="7" x2="36" y2="17" />
        {/* bottom-left */}
        <line x1="7" y1="36" x2="17" y2="36" />
        <line x1="12" y1="31" x2="12" y2="41" />
        {/* bottom-right */}
        <line x1="31" y1="36" x2="41" y2="36" />
        <line x1="36" y1="31" x2="36" y2="41" />
      </g>

      {/* Rotor hubs — small filled dots where blades meet */}
      <g fill="currentColor" stroke="none">
        <circle cx="12" cy="12" r="1.3" />
        <circle cx="36" cy="12" r="1.3" />
        <circle cx="12" cy="36" r="1.3" />
        <circle cx="36" cy="36" r="1.3" />
      </g>

      {/* Central body — vertical rounded rectangle (nose-up orientation) */}
      <rect
        x="20.5"
        y="17"
        width="7"
        height="14"
        rx="2.3"
        fill="currentColor"
        stroke="none"
      />

      {/* Direction nose — small triangle pointing up from the body */}
      <path
        d="M 22 17 L 24 14 L 26 17 Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  )
}
