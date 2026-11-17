// prerender-home.mjs: lagrer ferdig rendret forside (#root) til prerender/home.html.
// 17.11.2026: rå HTML på dronelappen.app hadde 22 ord fordi forsiden rendres i
// nettleseren. AI-crawlere (GPTBot, ClaudeBot, Perplexity) kjører ikke JavaScript.
// inject-prerender.mjs legger snapshoten inn i dist/index.html ved bygg.
//
// Kjøres på Max (trenger Chrome), ikke på Vercel:
//   node scripts/prerender-home.mjs [url]   (standard: https://dronelappen.app/)
// Skriving til Supabase (anonym innlogging, visit_events) og annonseskript
// blokkeres, så snapshoten verken lager anonyme brukere eller forurenser tall.
import puppeteer from 'puppeteer-core'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const url = process.argv[2] || 'https://dronelappen.app/'
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' })
const p = await b.newPage()
await p.setViewport({ width: 420, height: 900 })
await p.setRequestInterception(true)
p.on('request', (r) => {
  const u = r.url()
  const lese = r.method() === 'GET' || u.includes('/rest/v1/rpc/get_question_count')
  const blokk = (u.includes('supabase.co') && !lese) ||
    /facebook|googletagmanager|googleadservices|doubleclick|ahrefs/.test(u)
  blokk ? r.abort() : r.continue()
})
await p.evaluateOnNewDocument(() => { try { localStorage.setItem('dl-cookie-consent', 'declined') } catch {} })
await p.goto(url, { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 1500))
const html = await p.evaluate(() => {
  const root = document.getElementById('root').cloneNode(true)
  root.querySelectorAll('.dl-prerender').forEach((n) => n.replaceWith(...n.childNodes))
  root.querySelectorAll('script,noscript,style,iframe').forEach((n) => n.remove())
  return root.innerHTML
})
await b.close()
const ord = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
if (ord < 200) { console.error(`For lite innhold (${ord} ord), lagrer ikke`); process.exit(1) }
mkdirSync(join(ROOT, 'prerender'), { recursive: true })
writeFileSync(join(ROOT, 'prerender', 'home.html'), html.trim() + '\n')
console.log(`prerender/home.html: ${ord} ord fra ${url}`)
