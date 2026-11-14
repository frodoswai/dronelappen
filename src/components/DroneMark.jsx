// Forenklet drone sett ovenfra: fire rotorringer, kryss og et punkt i midten.
// Samme merke som app-ikonet og favicon (14.11.2026).
export default function DroneMark({ size = 30, color = '#E89F1E' }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke={color}
      strokeWidth="2.9"
      strokeLinecap="round"
    >
      <path d="M15.5 15.5l17 17M32.5 15.5l-17 17" />
      <circle cx="10.5" cy="10.5" r="6.8" />
      <circle cx="37.5" cy="10.5" r="6.8" />
      <circle cx="10.5" cy="37.5" r="6.8" />
      <circle cx="37.5" cy="37.5" r="6.8" />
      <circle cx="24" cy="24" r="3.6" fill={color} stroke="none" />
    </svg>
  )
}
