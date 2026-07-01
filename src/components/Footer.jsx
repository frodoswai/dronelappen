import { Link } from 'react-router-dom'
import TextSizeToggle from './TextSizeToggle'

export default function Footer() {
  return (
    <footer className="w-full max-w-xl mx-auto py-4 px-6 text-center text-sm text-gray-400 space-y-2.5">
      <TextSizeToggle />
      <div className="flex items-center justify-center gap-3 font-mono text-[11px] tracking-[0.05em]">
        <Link to="/vilkar" className="text-gray-400 hover:text-da-navy transition-colors">
          Vilkår
        </Link>
        <span className="text-gray-300">·</span>
        <Link to="/personvern" className="text-gray-400 hover:text-da-navy transition-colors">
          Personvern
        </Link>
        <span className="text-gray-300">·</span>
        <Link to="/kontakt" className="text-gray-400 hover:text-da-navy transition-colors">
          Kontakt
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-[11px] tracking-[0.05em]">
        <span className="text-gray-400">Offisielt:</span>
        <a href="https://flydrone.no" target="_blank" rel="noopener" className="text-gray-400 hover:text-da-navy transition-colors">
          flydrone.no
        </a>
        <span className="text-gray-300">·</span>
        <a href="https://luftfartstilsynet.no/droner/" target="_blank" rel="noopener" className="text-gray-400 hover:text-da-navy transition-colors">
          Luftfartstilsynet
        </a>
        <span className="text-gray-300">·</span>
        <a href="https://www.vegvesen.no/forerkort/ta-forerkort/teoriprove/droneeksamen/" target="_blank" rel="noopener" className="text-gray-400 hover:text-da-navy transition-colors">
          Statens vegvesen
        </a>
      </div>
      <div>
        DroneLappen — powered by{' '}
        <a
          href="https://droneavisa.no"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-blue-900 transition-colors"
        >
          Droneavisa.no
        </a>
      </div>
    </footer>
  )
}
