import { useEffect, useState } from 'react'
import {
  getInstallPrompt,
  subscribeInstallPrompt,
  promptInstall,
  isStandalone,
  isIos,
} from '../lib/installPrompt'

// «Installer som app»-lenken i footeren (alle sider). Bruker den delte
// beforeinstallprompt-fangsten i lib/installPrompt.js — se kommentaren der
// for hvorfor eventet ikke kan fanges lokalt. iOS Safari har ikke eventet;
// der viser knappen en kort «Legg til på Hjem-skjerm»-instruks i stedet.
// Rendres aldri når appen allerede kjører installert (standalone).
export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(getInstallPrompt())
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => subscribeInstallPrompt(setDeferredPrompt), [])

  if (isStandalone()) return null
  if (!deferredPrompt && !isIos()) return null

  const handleClick = async () => {
    if (deferredPrompt) {
      await promptInstall()
    } else if (isIos()) {
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
