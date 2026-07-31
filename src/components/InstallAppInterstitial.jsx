import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import DroneLogo from './DroneLogo'
import {
  getInstallPrompt,
  subscribeInstallPrompt,
  promptInstall,
  isStandalone,
  isIos,
} from '../lib/installPrompt'

// Engangs fullskjerm-oppfordring om å installere appen (Frode 31/7).
// Vises KUN for innloggede ekte brukere (aldri anonyme sesjoner — husk at
// `user` aldri er null i denne appen), maks én gang per enhet
// (localStorage-flagg), og bare når installasjon faktisk er mulig:
// Android/Chrome når beforeinstallprompt er fanget, iOS alltid (med
// Hjem-skjerm-instruks). Aldri i allerede installert app (standalone).
// «Hopp over» lukker for godt, med hint om footer-lenken.
const SEEN_KEY = 'dl-install-interstitial-seen'

export default function InstallAppInterstitial() {
  const { user } = useAuth()
  const [deferredPrompt, setDeferredPrompt] = useState(getInstallPrompt())
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(SEEN_KEY) === '1'
    } catch (_) {
      return true // uten localStorage kan vi ikke huske «sett» — vis aldri
    }
  })

  useEffect(() => subscribeInstallPrompt(setDeferredPrompt), [])

  const loggedIn = user && !user.is_anonymous
  if (dismissed || !loggedIn || isStandalone()) return null
  if (!deferredPrompt && !isIos()) return null

  const markSeen = () => {
    try {
      localStorage.setItem(SEEN_KEY, '1')
    } catch (_) {
      /* ignorer */
    }
    setDismissed(true)
  }

  const handleInstall = async () => {
    if (deferredPrompt) await promptInstall()
    markSeen()
  }

  const ios = !deferredPrompt && isIos()

  return (
    <div className="fixed inset-0 z-50 bg-da-navy-dark flex flex-col items-center justify-center px-8 py-10 overflow-y-auto">
      <div className="max-w-sm w-full text-center">
        <div className="flex justify-center mb-5 text-da-gold">
          <DroneLogo className="w-14 h-14" />
        </div>
        <p className="font-mono text-[12px] font-medium text-da-gold tracking-[0.12em] mb-2">
          ett trykk unna
        </p>
        <h1 className="text-[26px] font-medium text-da-bg leading-tight tracking-tight mb-3">
          Få DroneLappen som app
        </h1>
        <p className="text-[14px] text-da-dark-slogan leading-[1.6] mb-6">
          Eget ikon på hjemskjermen, helskjerm uten adresselinje, og du
          fortsetter rett der du slapp — akkurat som en vanlig app.
        </p>

        {ios ? (
          <div className="bg-white/5 border border-white/15 rounded-lg px-5 py-4 text-left mb-6">
            <p className="text-[13.5px] text-da-bg leading-[1.6]">
              <span className="font-medium">Slik gjør du det i Safari:</span>
              <br />
              1. Trykk på Del-knappen{' '}
              <span aria-hidden="true">(firkanten med pil opp)</span>
              <br />
              2. Velg «Legg til på Hjem-skjerm»
            </p>
          </div>
        ) : null}

        <div className="space-y-2.5">
          {!ios && (
            <button
              onClick={handleInstall}
              className="quiz-option w-full bg-da-gold hover:brightness-105 text-da-navy-dark font-semibold py-3.5 px-4 rounded-lg transition-all"
            >
              Installer appen
            </button>
          )}
          <button
            onClick={markSeen}
            className="quiz-option w-full bg-transparent border border-white/25 hover:border-white/50 text-da-bg font-medium py-3.5 px-4 rounded-lg transition-colors"
          >
            {ios ? 'Skjønner' : 'Hopp over'}
          </button>
        </div>

        <p className="mt-5 text-[12px] text-da-dark-slogan leading-snug">
          Du kan installere når som helst senere via
          «📲 Installer DroneLappen som app» nederst på hovedsiden.
        </p>
      </div>
    </div>
  )
}
