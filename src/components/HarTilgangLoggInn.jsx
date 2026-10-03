import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// «Har du allerede full tilgang? Logg inn» ved kjøpsknappene (03.10.2026).
//
// Bakgrunn: alle besøkende får en anonym sesjon (se AuthContext), så
// kjøpsknappene sender en utlogget bruker rett til Stripe. En betalende
// kunde på en ny telefon eller nettleser (Eivind 03.10) møtte derfor
// betalingsmuren og kunne ha kjøpt på nytt. Denne linja viser veien inn.
// Vises bare for anonyme og utloggede, aldri for innloggede.
export default function HarTilgangLoggInn({ className = '' }) {
  const { user, loading } = useAuth()
  if (loading || (user && !user.is_anonymous)) return null
  return (
    <p className={`text-[12.5px] text-da-text-body ${className}`}>
      Har du allerede full tilgang?{' '}
      <Link to="/login" className="text-da-navy font-medium underline underline-offset-2">
        Logg inn
      </Link>
    </p>
  )
}
