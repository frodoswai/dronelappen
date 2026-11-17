// inject-prerender.mjs: legger prerender/home.html inn i dist/index.html (#root).
// Kjøres etter vite build. Mangler snapshoten, gjør skriptet ingenting.
// Innholdet ligger i <div class="dl-prerender">, som er skjult med CSS for vanlige
// besøkende (de ser React-versjonen straks den er lastet, som før). Crawlere som
// ikke kjører JavaScript leser teksten i HTML-en. createRoot() erstatter innholdet.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const snap = join(ROOT, 'prerender', 'home.html')
const out = join(ROOT, 'dist', 'index.html')
if (!existsSync(snap)) { console.log('inject-prerender: ingen snapshot, hopper over'); process.exit(0) }
let html = readFileSync(out, 'utf8')
const tom = '<div id="root"></div>'
if (!html.includes(tom)) throw new Error('inject-prerender: fant ikke tom #root i dist/index.html')
html = html.replace(tom, `<div id="root"><div class="dl-prerender">${readFileSync(snap, 'utf8').trim()}</div></div>`)
html = html.replace('</head>', '<style>.dl-prerender{visibility:hidden}</style>\n</head>')
writeFileSync(out, html)
console.log('inject-prerender: forsiden lagt inn i dist/index.html')
