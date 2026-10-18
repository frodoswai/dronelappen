import { useEffect } from 'react'
import { useLocation, matchPath } from 'react-router-dom'

// Rutetitler for fanen, historikken og bokmerker. Appen er en SPA, så uten dette
// viser alle ruter tittelen fra index.html (oppdaget på /kontakt 18.10.2026).
// Forsiden beholder index.html-tittelen (den har antall spørsmål fra bygget).
const BASE = 'DroneLappen'
const EXAM_NAMES = { A1_A3: 'A1/A3', A2: 'A2', A2_STS: 'STS' }

const STATIC = {
  '/kontakt': 'Kontakt',
  '/personvern': 'Personvern',
  '/vilkar': 'Vilkår',
  '/login': 'Logg inn',
  '/sett-passord': 'Sett passord',
  '/min-side': 'Min side',
  '/results': 'Resultat',
  '/a2-ovingsplan': 'A2-øvingsplan',
  '/bestilt': 'Takk for bestillingen',
  '/bestatt': 'Gratulerer med bestått',
  '/auth/callback': 'Logger inn',
}

const DYNAMIC = [
  ['/exam/:examType', (n) => `Eksamen ${n}`],
  ['/quiz/:examType', (n) => `Prøveeksamen ${n}`],
  ['/practice/:examType', (n) => `Øving ${n}`],
  ['/rapid/:examType', (n) => `Lynrunde ${n}`],
]

export function titleFor(pathname) {
  if (STATIC[pathname]) return `${STATIC[pathname]} · ${BASE}`
  for (const [pattern, fn] of DYNAMIC) {
    const m = matchPath(pattern, pathname)
    if (m) return `${fn(EXAM_NAMES[m.params.examType] || m.params.examType)} · ${BASE}`
  }
  return null
}

export default function PageTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    const original = document.title
    const t = titleFor(pathname)
    if (t) document.title = t
    return () => {
      document.title = original
    }
  }, [pathname])
  return null
}
