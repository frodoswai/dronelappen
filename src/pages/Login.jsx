import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import DroneMark from '../components/DroneMark'
import { hasPurchaseIntent } from '../lib/purchaseIntent'

// «Åpne med koden» (Frode 14.11.2026). E-posten har en knapp til
// /login#kode=123456. Koden ligger i fragmentet, så den sendes aldri til
// serveren, og ingenting verifiseres før brukeren selv trykker på knappen.
// Et e-postfilter som henter lenken, brenner derfor ikke koden.
// E-postadressen står ikke i lenken. Den huskes i nettleseren som ba om
// koden; åpnes lenken et annet sted, må brukeren skrive adressen selv.
const EPOST_NOKKEL = 'dl_login_epost'
function lesKodeFraLenke() {
  try {
    const kilde = window.location.hash + '&' + window.location.search.slice(1)
    const m = kilde.match(/[#&]kode=(\d{6})(?!\d)/)
    if (!m) return null
    let epost = ''
    try {
      epost = localStorage.getItem(EPOST_NOKKEL) || ''
    } catch {
      // lagring er sperret: brukeren skriver adressen selv
    }
    return { kode: m[1], velgPassord: /[#&]velg=passord/.test(kilde), epost }
  } catch {
    return null
  }
}
function huskEpost(epost) {
  try {
    localStorage.setItem(EPOST_NOKKEL, epost)
  } catch {
    // lagring er sperret: knappen i e-posten fyller da bare inn koden
  }
}
function glemEpost() {
  try {
    localStorage.removeItem(EPOST_NOKKEL)
  } catch {
    // ingenting å rydde
  }
}

export default function Login() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Leses én gang, før første tegning. null når brukeren ikke kom fra knappen.
  const [lenke] = useState(lesKodeFraLenke)
  const [email, setEmail] = useState(lenke?.epost || '')
  const [password, setPassword] = useState('')
  // Engangskode i stedet for klikkbar lenke. Bakgrunn: Microsoft 365 Safe
  // Links og liknende e-postfiltre HENTER lenken automatisk før brukeren
  // rekker å klikke. GET /verify brenner engangstokenet, skanneren blir
  // «logget inn», og kunden får 403 «Email link is invalid or has expired».
  // Bevist 31.08.2026 på en betalende kommune-kunde. En kode kan ikke
  // forhåndshentes — derfor sender vi kode, ikke lenke.
  const [code, setCode] = useState(lenke && !lenke.velgPassord ? lenke.kode : '')
  const [codeSent, setCodeSent] = useState(!!lenke && !lenke.velgPassord)
  // Gjenoppretting bruker samme kodeprinsipp som innlogging: lenka i
  // gjenopprettings-e-posten hadde nøyaktig samme svakhet — et e-postfilter
  // kunne hente den og brenne tokenet. Rammet de ~19 betalende uten passord.
  const [recoveryCode, setRecoveryCode] = useState(lenke?.velgPassord ? lenke.kode : '')
  const [recoveryCodeSent, setRecoveryCodeSent] = useState(!!lenke?.velgPassord)
  // Settes FØR verifyOtp slik at redirect-effekten under ikke rekker å sende
  // dem til forsiden i det sesjonen oppstår. Ref, ikke state: effekten leser
  // verdien når den kjører, uten å vente på en ny render.
  const paaVeiTilSettPassord = useRef(false)
  const [mode, setMode] = useState(lenke?.velgPassord ? 'password_login' : 'magic_link') // 'magic_link' (kode) | 'password_login' | 'password_signup'
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(
    lenke
      ? {
          type: 'success',
          text: lenke.epost
            ? 'Koden fra e-posten er fylt inn. Trykk på knappen under.'
            : 'Koden fra e-posten er fylt inn. Skriv e-postadressen din, og trykk på knappen under.',
        }
      : null
  ) // { type: 'success'|'error', text }

  // Fjern koden fra adresselinja med en gang, så den ikke blir liggende i
  // historikken eller følger med i sidevisninger til statistikkverktøy.
  useEffect(() => {
    if (lenke) navigate('/login', { replace: true })
  }, [lenke, navigate])

  // If already logged in, redirect home. NB: anonyme sesjoner (alle
  // besøkende har en, se AuthContext) teller IKKE som innlogget — uten
  // dette unntaket var /login uoppnåelig for alle med anonym sesjon
  // (funnet 2026-07-10, forklarer supportsaken 9/7).
  useEffect(() => {
    if (user && !user.is_anonymous && !paaVeiTilSettPassord.current) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  const handleMagicLink = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      huskEpost(email)
      setCodeSent(true)
      setMessage({
        type: 'success',
        text: 'Vi har sendt en 6-sifret kode til ' + email + '. Skriv den inn her.',
      })
    }
  }

  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email',
    })
    setLoading(false)
    if (error) {
      setMessage({
        type: 'error',
        text: 'Koden stemmer ikke, eller den er mer enn en time gammel. Be om en ny.',
      })
    } else {
      glemEpost()
    }
    // onAuthStateChange i AuthContext håndterer redirect
  }

  const resetCodeFlow = () => {
    setCodeSent(false)
    setCode('')
    setRecoveryCodeSent(false)
    setRecoveryCode('')
    setMessage(null)
  }

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    }
    // onAuthStateChange in AuthContext handles the redirect
  }

  const handlePasswordSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Konto opprettet! Sjekk e-posten din for bekreftelse.' })
    }
  }

  // Sender en gjenopprettingslenke som lar brukeren SETTE passord — også hvis
  // han aldri har hatt et. Gjenoppretting sjekker aldri et gammelt passord;
  // den beviser bare at du eier innboksen og gir deg en sesjon, og med den
  // kan /sett-passord kalle updateUser.
  //
  // Ordlyden i knappen dekker derfor begge tilfellene med vilje. «Glemt
  // passord» alene ville ikke hjulpet de 19 betalende kundene som aldri har
  // laget et — de har ikke glemt noe, og ville aldri trykket.
  const handleGlemtPassord = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'Fyll inn e-postadressen din først.' })
      return
    }
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/sett-passord`,
    })
    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }
    huskEpost(email)
    setRecoveryCodeSent(true)
    setMessage({
      type: 'success',
      text: 'Vi har sendt en 6-sifret kode til ' + email + '. Skriv den inn her, så får du velge passord.',
    })
  }

  const handleVerifyRecovery = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    paaVeiTilSettPassord.current = true
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: recoveryCode.trim(),
      type: 'recovery',
    })
    setLoading(false)
    if (error) {
      paaVeiTilSettPassord.current = false
      setMessage({
        type: 'error',
        text: 'Koden stemmer ikke, eller den er mer enn en time gammel. Be om en ny.',
      })
      return
    }
    glemEpost()
    navigate('/sett-passord', { replace: true })
  }

  const onSubmit =
    mode === 'magic_link'
      ? codeSent
        ? handleVerifyCode
        : handleMagicLink
      : mode === 'password_login'
      ? recoveryCodeSent
        ? handleVerifyRecovery
        : handlePasswordLogin
      : handlePasswordSignup

  const inputClass =
    'w-full h-[52px] bg-white border border-[#8A9AA8] focus:border-da-navy focus:ring-1 focus:ring-da-navy/20 rounded-xl px-3.5 text-[16px] text-da-navy placeholder:text-da-text-muted outline-none transition-colors'

  // B2-drakt (Frode 14.11.2026). Skjemalogikken er urørt.
  // Kom brukeren hit fra en kjøpsknapp, sier vi hva som skjer etterpå:
  // forsiden viser «Fullfør kjøpet der du slapp» når innloggingen er gjort.
  const paaVeiTilKjop = hasPurchaseIntent()

  return (
    <div className="min-h-screen bg-da-navy-dark flex flex-col">
      {/* Mørk topp */}
      <div className="px-5 pt-3 pb-6">
        <div className="pt-2 max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2.5 mb-5"
            aria-label="DroneLappen forside"
          >
            <DroneMark />
            <span className="text-[20px] font-bold text-white leading-none">
              DroneLappen<span className="text-da-gold">.app</span>
            </span>
          </button>
          <h1 className="text-[30px] font-bold text-white leading-[1.12] tracking-tight mb-2">
            {mode === 'magic_link'
              ? 'Logg inn eller opprett konto'
              : mode === 'password_signup'
              ? 'Opprett konto'
              : 'Logg inn'}
          </h1>
          <p className="text-[16px] text-[#C9D6E2] leading-[1.4]">
            {paaVeiTilKjop
              ? 'Logg inn først, så fullfører du kjøpet med ett trykk etterpå.'
              : 'Lagre fremgangen din og få tilgang til alle spørsmål.'}
          </p>
        </div>
      </div>

      {/* Hvitt felt med skjemaet */}
      <div className="flex-1 bg-white rounded-t-3xl px-5 pt-[22px] pb-8">
        <div className="max-w-sm mx-auto">
          {/* Method toggle — both options selectable up front */}
          <div className="flex gap-1 p-1 mb-5 bg-[#EEF3F7] rounded-[14px]">
            <button
              type="button"
              onClick={() => { setMode('magic_link'); resetCodeFlow() }}
              className={`flex-1 h-11 rounded-[10px] text-[15px] font-semibold transition-colors ${
                mode === 'magic_link'
                  ? 'bg-white text-da-navy shadow-sm'
                  : 'text-da-text-muted hover:text-da-navy'
              }`}
            >
              Engangskode
            </button>
            <button
              type="button"
              onClick={() => { setMode('password_login'); resetCodeFlow() }}
              className={`flex-1 h-11 rounded-[10px] text-[15px] font-semibold transition-colors ${
                mode !== 'magic_link'
                  ? 'bg-white text-da-navy shadow-sm'
                  : 'text-da-text-muted hover:text-da-navy'
              }`}
            >
              Passord
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="block text-[14px] font-medium text-da-text-body mb-1.5">
                E-post
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (codeSent && !lenke) resetCodeFlow() }}
                autoFocus={!!lenke && !lenke.epost}
                placeholder="din@epost.no"
                className={inputClass}
                autoComplete="email"
              />
            </div>

            {mode === 'magic_link' && codeSent && (
              <div>
                <label className="block text-[14px] font-medium text-da-text-body mb-1.5">
                  Engangskode
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className={`${inputClass} font-mono tracking-[0.4em] text-center text-[18px]`}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus={!lenke}
                  maxLength={6}
                />
              </div>
            )}

            {mode === 'password_login' && recoveryCodeSent && (
              <div>
                <label className="block text-[14px] font-medium text-da-text-body mb-1.5">
                  Kode fra e-posten
                </label>
                <input
                  type="text"
                  required
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className={`${inputClass} font-mono tracking-[0.4em] text-center text-[18px]`}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus={!lenke}
                  maxLength={6}
                />
              </div>
            )}

            {mode !== 'magic_link' && !recoveryCodeSent && (
              <div>
                <label className="block text-[14px] font-medium text-da-text-body mb-1.5">
                  Passord
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'password_signup' ? 'Velg et passord (minst 8 tegn)' : 'Ditt passord'}
                  className={inputClass}
                  autoComplete={mode === 'password_signup' ? 'new-password' : 'current-password'}
                  // 8, ikke 6: /sett-passord krever 8, og to ulike minstekrav i
                  // samme app er bare forvirrende. Endret 06.08.2026.
                  minLength={mode === 'password_signup' ? 8 : undefined}
                />
              </div>
            )}

            {/* Status message */}
            {message && (
              <div
                className={`rounded-xl px-4 py-3 text-[15px] leading-[1.45] ${
                  message.type === 'success'
                    ? 'bg-green-50 border-[0.5px] border-green-200 text-green-800'
                    : 'bg-amber-50 border-[0.5px] border-amber-200 text-amber-800'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-da-navy hover:bg-da-navy-mid disabled:opacity-60 text-white font-bold px-4 rounded-[14px] transition-colors flex items-center justify-center gap-2 text-[16px]"
            >
              <span>
                {loading
                  ? 'Venter...'
                  : mode === 'magic_link'
                  ? codeSent
                    ? 'Logg inn'
                    : 'Send engangskode'
                  : mode === 'password_login'
                  ? recoveryCodeSent
                    ? 'Velg passord'
                    : 'Logg inn'
                  : 'Opprett konto'}
              </span>
            </button>
          </form>

          {mode === 'magic_link' && !codeSent && (
            <p className="mt-3 text-[14px] text-da-text-muted leading-[1.45] text-center">
              Vi sender deg en 6-sifret kode på e-post. Første gang oppretter den
              kontoen din, ingen passord å huske.
            </p>
          )}

          {mode === 'magic_link' && codeSent && (
            <div className="mt-3 text-center space-y-2">
              <p className="text-[14px] text-da-text-muted leading-[1.45]">
                Koden er gyldig i en time. Finner du den ikke, sjekk søppelpost.
              </p>
              <button
                type="button"
                onClick={resetCodeFlow}
                className="min-h-11 text-[15px] font-medium text-da-navy hover:underline"
              >
                Send ny kode
              </button>
            </div>
          )}

          {/* «Hans-tilfellet» (supportsak 9/7): kjøpere som kommer tilbake
              vet ikke alltid at tilgangen følger e-posten. Si det her. */}
          <p className="mt-4 text-[14px] text-da-text-body leading-[1.45] text-center bg-[#EEF3F7] rounded-xl px-4 py-3">
            <span className="font-medium text-da-navy">Kjøpt full tilgang?</span>{' '}
            Logg inn med samme e-postadresse som ved kjøpet, så er alt på plass.
          </p>

          {/* Within password mode: swap between login and signup */}
          {mode !== 'magic_link' && (
            <div className="mt-5 pt-4 border-t border-[#DCE4EA] text-center space-y-1">
              {/* Denne står FØRST og tydeligst av en grunn: 19 av 24 betalende
                  kunder har ikke passord (kontoen ble laget av Stripe-
                  webhooken), og for dem er «Opprett konto» en blindvei —
                  signUp feiler når e-posten finnes fra før. Denne veien virker
                  for dem. Teksten nevner begge tilfellene fordi den som aldri
                  har laget passord ikke har «glemt» noe. */}
              {mode === 'password_login' && !recoveryCodeSent && (
                <button
                  type="button"
                  onClick={handleGlemtPassord}
                  disabled={loading}
                  className="block w-full min-h-11 text-[15px] font-semibold text-da-navy hover:underline disabled:opacity-60"
                >
                  Glemt passord, eller aldri laget et? Få en lenke
                </button>
              )}
              {recoveryCodeSent ? (
                <button
                  onClick={resetCodeFlow}
                  className="min-h-11 text-[15px] font-medium text-da-navy hover:underline"
                >
                  Send ny kode
                </button>
              ) : mode === 'password_login' ? (
                <button
                  onClick={() => { setMode('password_signup'); setMessage(null) }}
                  className="min-h-11 text-[15px] font-medium text-da-navy hover:underline"
                >
                  Helt ny her? Opprett konto
                </button>
              ) : (
                <button
                  onClick={() => { setMode('password_login'); setMessage(null) }}
                  className="min-h-11 text-[15px] font-medium text-da-navy hover:underline"
                >
                  Har du allerede konto? Logg inn
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => navigate('/')}
            className="w-full mt-5 h-12 bg-white border border-[#C9D3DC] hover:border-da-navy text-da-navy font-semibold px-4 rounded-xl transition-colors text-[15px]"
          >
            Tilbake til forsiden
          </button>
        </div>
      </div>
    </div>
  )
}
