// Inline SVG quadcopter logo for DroneLappen.
// Uses currentColor so it inherits the parent's text color — drop it inside
// any text-colored element and it will match. Pass className for sizing.
export default function DroneLogo({ className = 'w-10 h-10', title = 'DroneLappen' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {/* X-frame arms — rotor center to rotor center */}
      <line x1="10" y1="10" x2="38" y2="38" />
      <line x1="38" y1="10" x2="10" y2="38" />
      {/* Four rotors */}
      <circle cx="10" cy="10" r="5" />
      <circle cx="38" cy="10" r="5" />
      <circle cx="10" cy="38" r="5" />
      <circle cx="38" cy="38" r="5" />
      {/* Small rotor hubs */}
      <circle cx="10" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="38" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="10" cy="38" r="1" fill="currentColor" stroke="none" />
      <circle cx="38" cy="38" r="1" fill="currentColor" stroke="none" />
      {/* Central body */}
      <circle cx="24" cy="24" r="4" fill="currentColor" stroke="none" />
    </svg>
  )
}
