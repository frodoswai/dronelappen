// Delt fangst av PWA-installasjonseventet.
//
// Chrome fyrer `beforeinstallprompt` ÉN gang per sidelast, så eventet må
// fanges på modulnivå (registreres ved import, før React rekker å montere)
// og deles mellom alle som vil bruke det — footer-knappen (InstallAppButton)
// og engangs-fullskjermen (InstallAppInterstitial). Hadde hver komponent
// hatt sin egen listener, ville bare én av dem fått eventet.
let deferredPrompt = null
const listeners = new Set()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Demp Chromes egen mini-infobar — vi styrer selv når dialogen vises.
    e.preventDefault()
    deferredPrompt = e
    listeners.forEach((fn) => fn(deferredPrompt))
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    listeners.forEach((fn) => fn(null))
  })
}

export function getInstallPrompt() {
  return deferredPrompt
}

// fn kalles med gjeldende prompt (eller null) ved endring. Returnerer unsubscribe.
export function subscribeInstallPrompt(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// Viser den native installasjonsdialogen. Returnerer true hvis brukeren
// takket ja. Eventet kan bare brukes én gang — Chrome fyrer et nytt senere
// hvis brukeren avslo og siden fortsatt er installerbar.
export async function promptInstall() {
  if (!deferredPrompt) return false
  const p = deferredPrompt
  deferredPrompt = null
  listeners.forEach((fn) => fn(null))
  p.prompt()
  try {
    const choice = await p.userChoice
    return choice?.outcome === 'accepted'
  } catch (_) {
    return false
  }
}

export function isStandalone() {
  return (
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)')?.matches ||
      window.navigator?.standalone === true)
  )
}

export function isIos() {
  return typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)
}
