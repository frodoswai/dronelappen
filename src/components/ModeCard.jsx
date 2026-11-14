import { Link } from 'react-router-dom'

// Moduskort på /exam/:type. B2-drakt (14.11.2026): hele kortet er trykkflaten,
// med tittel, én linje forklaring og en pil. `variant="primary"` får mørkeblå
// ramme; de andre er like. (`showBolt` og `label` tas imot, men vises ikke.)
export default function ModeCard({ to, title, description, variant = 'neutral', onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-2xl p-4 mb-3 bg-white transition-colors active:scale-[0.99] ${
        variant === 'primary'
          ? 'border-2 border-da-navy'
          : 'border border-[#C9D3DC] hover:border-da-navy'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="font-cond text-[30px] font-bold text-da-navy leading-none mb-1.5">
          {title}
        </div>
        <p className="text-[15px] text-da-text-body leading-[1.4]">{description}</p>
      </div>
      <svg
        aria-hidden="true"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#083554"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 transition-transform group-hover:translate-x-0.5"
      >
        <path d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}
