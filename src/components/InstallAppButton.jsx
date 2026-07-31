import { useEffect, useState } from 'react'

// «Installer som app»-knapp (PWA). Chrome/Android fyrer `beforeinstallprompt`
// når appen er installerbar (manifest + ikoner i index.html); vi fanger
// eventet, viser en diskré knapp, og trigger den native installasjons-
// dialogen ved klikk. iOS Safari har ikke eventet — der viser knappen i
// stedet en kort instruks for «Legg til på Hjem-skjerm». Rendres aldri når
// appen allerede kjører installert (display-mode: standalone).
export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showIosHint, setShowIosHint] = useState(false)

  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)')?.matches ||
      window.navigator?.standalone === true)

  const isIos =
    typeof navigator !== 'undefined' &&
    /iphone|ipad|ipod/i.test(navigator.userAgent)

  useEffect(() => {
    const handler = (e) => {
      // Demp Chromes egen mini-infobar — vi viser vår egen knapp i stedet.
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (isStandalone) return null
  if (!deferredPrompt && !isIos) return null

  const handleClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      try {
        await deferredPrompt.userChoice
      } catch (_) {
        /* brukeren avbrøt — helt greit */
      }
      // Eventet kan bare brukes én gang; Chrome fyrer et nytt ved behov.
      setDeferredPrompt(null)
    } else if (isIos) {
      setShowIosHint((v) => !v)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className="font-mono text-[11px] tracking-[0.05em] text-da-gold-text hover:text-da-navy transition-colors"
      >
        📲 Installer DroneLappen som app
      </button>
      {showIosHint && (
        <p className="mt-1 text-[11px] text-gray-400 leading-snug">
          Trykk på Del-knappen{' '}
          <span aria-hidden="true">(firkanten med pil opp)</span> i Safari og
          velg «Legg til på Hjem-skjerm».
        </p>
      )}
    </div>
  )
}
