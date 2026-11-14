import { Link } from 'react-router-dom'
import TextSizeToggle from './TextSizeToggle'
import InstallAppButton from './InstallAppButton'

export default function Footer() {
  return (
    <footer className="w-full max-w-xl mx-auto py-5 px-5 text-center text-[14px] text-da-text-muted space-y-2.5">
      <InstallAppButton />
      <TextSizeToggle />
      <div className="flex items-center justify-center gap-3 text-[14px]">
        <Link to="/min-side" className="text-da-navy font-medium hover:underline transition-colors">
          Min side
        </Link>
        <span className="text-[#B8C4CF]">·</span>
        <Link to="/vilkar" className="text-da-text-muted hover:text-da-navy transition-colors">
          Vilkår
        </Link>
        <span className="text-[#B8C4CF]">·</span>
        <Link to="/personvern" className="text-da-text-muted hover:text-da-navy transition-colors">
          Personvern
        </Link>
        <span className="text-[#B8C4CF]">·</span>
        <Link to="/kontakt" className="text-da-text-muted hover:text-da-navy transition-colors">
          Kontakt
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[14px]">
        <a href="/dronesertifikat-a2/" className="text-da-text-muted hover:text-da-navy transition-colors">
          A2-sertifikat
        </a>
        <span className="text-[#B8C4CF]">·</span>
        <a href="/sts-eksamen/" className="text-da-text-muted hover:text-da-navy transition-colors">
          STS-eksamen
        </a>
        <span className="text-[#B8C4CF]">·</span>
        <a href="/droneeksamen-oving/" className="text-da-text-muted hover:text-da-navy transition-colors">
          Øv til eksamen
        </a>
        <span className="text-[#B8C4CF]">·</span>
        <a href="/pris/" className="text-da-text-muted hover:text-da-navy transition-colors">
          Pris
        </a>
        <span className="text-[#B8C4CF]">·</span>
        <a href="/blogg/" className="text-da-text-muted hover:text-da-navy transition-colors">
          Blogg
        </a>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[14px]">
        <span>Offisielt:</span>
        <a href="https://flydrone.no" target="_blank" rel="noopener" className="text-da-text-muted hover:text-da-navy transition-colors">
          flydrone.no
        </a>
        <span className="text-[#B8C4CF]">·</span>
        <a href="https://luftfartstilsynet.no/droner/" target="_blank" rel="noopener" className="text-da-text-muted hover:text-da-navy transition-colors">
          Luftfartstilsynet
        </a>
        <span className="text-[#B8C4CF]">·</span>
        <a href="https://www.vegvesen.no/forerkort/ta-forerkort/teoriprove/droneeksamen/" target="_blank" rel="noopener" className="text-da-text-muted hover:text-da-navy transition-colors">
          Statens vegvesen
        </a>
      </div>
      <div>
        DroneLappen er laget av{' '}
        <a
          href="https://droneavisa.no"
          target="_blank"
          rel="noopener noreferrer"
          className="text-da-navy font-medium hover:underline transition-colors"
        >
          Droneavisa.no
        </a>
      </div>
    </footer>
  )
}
