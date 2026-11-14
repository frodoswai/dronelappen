import { Link } from 'react-router-dom'
import { recordSessionStart } from '../lib/sessionHistory'

// Tre store knapper nederst i hvert eksamenskort på forsiden (B2, 14.11.2026).
// Hver knapp går rett inn i modusen (/quiz, /practice, /rapid) og registrerer
// øktstart slik ExamSelect gjør. `primary` fyller én av dem med mørkeblått:
// 'exam' | 'practice' | 'rapid' | null.
const MODES = [
  { mode: 'exam', label: 'Eksamen', base: '/quiz' },
  { mode: 'practice', label: 'Læring', base: '/practice' },
  { mode: 'rapid', label: 'Tempo', base: '/rapid' },
]

export default function ModePillRow({ examType, primary = null }) {
  return (
    <div className="flex gap-2">
      {MODES.map((p) => (
        <Link
          key={p.mode}
          to={`${p.base}/${examType}`}
          onClick={() => recordSessionStart(examType, p.mode)}
          className={`flex-1 h-12 rounded-xl text-[15px] font-semibold inline-flex items-center justify-center transition-colors active:scale-[0.98] ${
            p.mode === primary
              ? 'bg-da-navy text-white hover:bg-da-navy-mid'
              : 'bg-white border border-[#C9D3DC] text-da-navy hover:border-da-navy'
          }`}
        >
          {p.label}
        </Link>
      ))}
    </div>
  )
}
