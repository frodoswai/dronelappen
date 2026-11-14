import { readFileSync } from 'node:fs'
import { cwd } from 'node:process'
import { defineConfig, loadEnv } from 'vite'
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

// Antall spørsmål i banken. Én kilde: src/lib/antall.json, som Max holder
// oppdatert daglig fra Supabase (~/Projects/MacMiniHub/scripts/dronelappen-antall.py
// committer ved endring -> Vercel bygger). Brukes i index.html (%DL_ANTALL%),
// landingssider/blogg ({{ANTALL}}) og i appen (import av antall.json).
// Innført 27.09.2026 da banken gikk fra 241 til 266.
// Fra STS-lanseringen 6.10.2026 er tallet totalen med STS, og tekstene i
// index.html sier «A1/A3, A2 og STS».
const DL_ANT = JSON.parse(readFileSync(new URL('./src/lib/antall.json', import.meta.url), 'utf8'))
const DL_ANTALL = String(DL_ANT.total)

function prisPlugin() {
  return {
    name: 'dl-pris',
    transformIndexHtml(html) {
      return html.replaceAll('%DL_PRIS%', DL_PRIS).replaceAll('%DL_ANTALL%', DL_ANTALL)
    },
  }
}

// https://vite.dev/config/
// Lokaltest (14.11.2026): edge-funksjonene godtar bare kall fra
// dronelappen.app (ALLOWED_ORIGINS), så en lokal server blir avvist. Med
// DL_PROXY_TARGET satt i .env.development.local sender utviklingsserveren
// alt under /sb videre til Supabase og oppgir dronelappen.app som avsender.
// Samme fil setter VITE_SUPABASE_URL=http://localhost:5173/sb, så appen
// bruker mellomleddet. Gjelder bare `npm run dev`: bygget og produksjon
// leser .env som før. Oppskrift: notes/reference/dronelappen-lokaltest.md.
export default defineConfig(({ mode }) => {
  const target = loadEnv(mode, cwd(), '').DL_PROXY_TARGET
  return {
    plugins: [react(), tailwindcss(), prisPlugin()],
    server: target
      ? {
          proxy: {
            '/sb': {
              target,
              changeOrigin: true,
              rewrite: (p) => p.replace(/^\/sb/, ''),
              configure: (proxy) => {
                proxy.on('proxyReq', (proxyReq) => {
                  proxyReq.setHeader('origin', 'https://dronelappen.app')
                })
              },
            },
          },
        }
      : undefined,
  }
})
