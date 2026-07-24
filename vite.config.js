import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Prisen i index.html (meta-beskrivelser, JSON-LD Offer, noscript-innhold)
// settes inn ved bygg. Speiler src/lib/pricing.js og
// supabase/functions/create-checkout/index.ts — endres én, MÅ alle endres.
//
// NB: index.html er statisk etter bygg. Vercel bygger på hver push, men hvis
// ingen pusher rundt 15.08.2026 vil den stå med gammel pris. Derfor finnes
// det en planlagt oppgave som trigger redeploy den dagen.
const PRICE_INCREASE_AT = '2026-08-15T00:00:00+02:00'
const DL_PRIS = Date.now() >= Date.parse(PRICE_INCREASE_AT) ? '349' : '249'

function prisPlugin() {
  return {
    name: 'dl-pris',
    transformIndexHtml(html) {
      return html.replaceAll('%DL_PRIS%', DL_PRIS)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), prisPlugin()],
})
