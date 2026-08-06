import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// /sett-passord — sett eller endre passord på en konto som allerede er
// innlogget, ELLER som nettopp kom hit via en gjenopprettingslenke.
//
// HVORFOR DENNE FINNES (05.08.2026, funnet av Frode):
// Innloggingssiden tilbød «Passord» som metode, men veien til å FÅ et passord
// gikk via `signUp`, som feiler når e-posten allerede finnes. Av 40 kontoer med
// e-post har 24 betalt, og 19 av dem har ikke passord i det hele tatt — de ble
// opprettet av Stripe-webhooken ved kjøpet. For dem var «Opprett konto» en
// blindvei: valget sto i grensesnittet, men var umulig å komme gjennom.
//
// `updateUser({ password })` er den riktige operasjonen. Den krever en sesjon,
// ikke et gammelt passord, og virker derfor likt for tre grupper:
//   - webhook-opprettede kunder som aldri har hatt passord
//   - folk som bruker innloggingslenke og vil slippe e-postrunden
//   - anonyme som nettopp har kjøpt og vil sikre kontoen
//
// Gjenopprettingslenken fra innloggingssiden peker hit. Supabase etablerer
// sesjonen fra URL-fragmentet selv (detectSessionInUrl), så vi trenger ikke
// gjøre noe spesielt med token — vi må bare vente på at sesjonen finnes.
const MIN_LENGDE = 8

export default function SettPassord() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [passord, setPassord] = useState('')
  const [gjentatt, setGjentatt] = useState('')
  const [lagrer, setLagrer] = useState(false)
  const [melding, setMelding] = useState(null) // { type, tekst }
  // Kom de hit fra en gjenopprettingslenke? Leses fra URL-fragmentet allerede
  // ved første render — Supabase rydder hashen når sesjonen er etablert, så en
  // effekt kunne kommet for sent.
  const [erGjenoppretting, setErGjenoppretting] = useState(
    () => typeof window !== 'undefined' && window.location.hash.includes('type=recovery')
  )

  // PKCE-flyten legger ikke type i hashen; da kommer signalet som en hendelse
  // i stedet. Vi bruker det bare til å tilpasse overskriften — selve lagringen
  // er identisk uansett hvordan de kom hit.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setErGjenoppretting(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // Anonyme sesjoner teller ikke som innlogget — samme unntak som i Login.
  const innlogget = user && !user.is_anonymous

  const lagre = async (e) => {
    e.preventDefault()
    setMelding(null)
    if (passord.length < MIN_LENGDE) {
      setMelding({ type: 'error', tekst: `Passordet må ha minst ${MIN_LENGDE} tegn.` })
      return
    }
    if (passord !== gjentatt) {
      setMelding({ type: 'error', tekst: 'De to passordene er ikke like.' })
      return
    }
    setLagrer(true)
    const { error } = await supabase.auth.updateUser({ password: passord })
    setLagrer(false)
    if (error) {
      setMelding({ type: 'error', tekst: error.message })
      return
    }
    setMelding({
      type: 'success',
      tekst: 'Passordet er lagret. Du kan nå logge inn med e-post og passord.',
    })
    setPassord('')
    setGjentatt('')
    setTimeout(() => navigate('/min-side', { replace: true }), 1800)
  }

  const inputClass =
    'w-full bg-white border-[0.5px] border-da-navy/30 rounded-lg px-4 py-3 ' +
    'text-[15px] text-da-navy placeholder:text-da-text-faded ' +
    'focus:outline-none focus:border-da-gold transition-colors'

  return (
    <div className="min-h-screen flex flex-col bg-da-bg">
      <div className="bg-da-navy-dark px-6 pt-10 pb-6">
        <div className="max-w-sm mx-auto">
          <div className="font-mono text-[11px] font-medium text-da-gold tracking-[0.14em] mb-2">
            konto
          </div>
          <h1 className="text-[26px] font-semibold text-da-bg leading-tight">
            {erGjenoppretting ? 'Velg et passord' : 'Sett passord'}
          </h1>
        </div>
      </div>
      <div
        className="h-7 shrink-0"
        style={{
          background:
            'linear-gradient(to bottom, #0a1628 0%, #2a3a50 25%, #7e8a9c 55%, #cfd6df 80%, #fafbfc 100%)',
        }}
      />

      <div className="px-6 pt-2 pb-8 bg-da-bg flex-1">
        <div className="max-w-sm mx-auto">
          {!innlogget && !erGjenoppretting ? (
            <div className="bg-white border-[0.5px] border-da-navy/30 rounded-lg p-5">
              <p className="text-[14px] text-da-text-body mb-4 leading-[1.6]">
                Du må være innlogget for å sette passord. Logg inn med
                innloggingslenke først, så kan du velge et passord her.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="quiz-option w-full bg-da-navy hover:bg-da-navy-mid text-da-bg font-medium py-3 px-4 rounded-lg transition-colors text-[14px]"
              >
                Til innlogging →
              </button>
            </div>
          ) : (
            <form onSubmit={lagre} className="space-y-3">
              <p className="text-[13.5px] text-da-text-body leading-[1.6] mb-1">
                Med passord slipper du å hente en lenke i e-posten hver gang.
                Innloggingslenken virker fortsatt som før.
              </p>
              <div>
                <label className="block font-mono text-[11px] text-da-text-muted tracking-[0.1em] mb-1.5">
                  Nytt passord
                </label>
                <input
                  type="password"
                  required
                  value={passord}
                  onChange={(e) => setPassord(e.target.value)}
                  placeholder={`Minst ${MIN_LENGDE} tegn`}
                  className={inputClass}
                  autoComplete="new-password"
                  minLength={MIN_LENGDE}
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-da-text-muted tracking-[0.1em] mb-1.5">
                  Gjenta passordet
                </label>
                <input
                  type="password"
                  required
                  value={gjentatt}
                  onChange={(e) => setGjentatt(e.target.value)}
                  placeholder="Samme en gang til"
                  className={inputClass}
                  autoComplete="new-password"
                  minLength={MIN_LENGDE}
                />
              </div>

              {melding && (
                <p
                  role={melding.type === 'error' ? 'alert' : undefined}
                  className={`text-[13px] leading-[1.5] ${
                    melding.type === 'error' ? 'text-amber-700' : 'text-green-700'
                  }`}
                >
                  {melding.tekst}
                </p>
              )}

              <button
                type="submit"
                disabled={lagrer}
                className="quiz-option w-full bg-da-navy hover:bg-da-navy-mid text-da-bg font-medium py-3 px-4 rounded-lg transition-colors text-[14px] disabled:opacity-60"
              >
                {lagrer ? 'Lagrer …' : 'Lagre passord'}
              </button>
            </form>
          )}

          <button
            onClick={() => navigate('/min-side')}
            className="quiz-option w-full mt-5 bg-white border-[0.5px] border-da-navy/30 hover:border-da-navy/60 text-da-navy font-medium py-3 px-4 rounded-lg transition-colors text-[14px]"
          >
            Til Min side
          </button>
        </div>
      </div>
    </div>
  )
}
