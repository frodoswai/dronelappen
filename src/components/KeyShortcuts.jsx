import { useEffect } from 'react'

// Tastatursnarveier i quizen (14.11.2026): 1–4 eller A–D velger svar,
// Enter og pil høyre går videre, pil venstre går tilbake (bare Eksamen).
// Egen komponent uten markup, slik at lytteren alltid har ferske handlere
// uten at Quiz må skrive til en ref under rendring.
// Hopper over tastetrykk i skjemafelt, med Ctrl/Cmd/Alt og ved holdt tast.
// Enter på en knapp eller lenke overlates til nettleseren, ellers ville
// «Neste» blitt utløst to ganger.
export default function KeyShortcuts({ onKey }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      const t = e.target
      const tag = t?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t?.isContentEditable) return
      if (e.key === 'Enter' && (tag === 'BUTTON' || tag === 'A')) return
      onKey(e.key.length === 1 ? e.key.toLowerCase() : e.key)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onKey])
  return null
}
