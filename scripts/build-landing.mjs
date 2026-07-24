// build-landing.mjs — statiske buyer-intent landingssider på rot (dronelappen.app/<slug>/)
// Leser content/landing/*.md (frontmatter: title, description, h1, slug; body med
// faktaboks/CTA/FAQ i markdown), skriver public/<slug>/index.html (rot-nivå, IKKE /blogg/)
// + oppdaterer public/sitemap.xml. Kjøres før `vite build` (se package.json).
// FAQ parses fra "### " under "## Ofte stilte spørsmål" -> FAQPage JSON-LD (schema == synlig).
// Null impact på React-bundelen: alt under public/ kopieres som statiske filer, servert
// av Vercel FØR SPA-rewriten i vercel.json.
//
// Frontmatter:
//   title:       (påkrevd) SEO <title> + og:title
//   description: (påkrevd) meta description
//   h1:          (påkrevd) synlig H1 (kan avvike fra title)
//   slug:        (valgfri, ellers filnavn uten .md)

import { marked } from 'marked'
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT = join(ROOT, 'content', 'landing')
const PUBLIC = join(ROOT, 'public')
const SITE = 'https://dronelappen.app'

// ---- Pris ----------------------------------------------------------------
// Speiler src/lib/pricing.js og supabase/functions/create-checkout/index.ts.
// Endres én, MÅ alle tre endres i samme commit.
//
// Landingssidene er statiske og bygges bare ved deploy. For at de ikke skal
// stå og reklamere med gammel pris hvis ingen deployer 15. august, skrives
// prisen ut i <span class="dl-pris"> og et lite inline-skript retter den ved
// visning etter skiftetidspunktet. Da er siden korrekt uansett.
const PRICE_INCREASE_AT = '2026-08-15T00:00:00+02:00'
const PRICE_BEFORE = 249
const PRICE_AFTER = 349
const PRIS = Date.now() >= Date.parse(PRICE_INCREASE_AT) ? PRICE_AFTER : PRICE_BEFORE
const PRIS_VARSEL_HTML =
  PRIS === PRICE_BEFORE
    ? `<p class="dl-prisvarsel"><strong>Prisen øker til ${PRICE_AFTER} kr 15. august 2026.</strong> Kjøper du før det, beholder du dagens pris i hele tilgangsperioden.</p>`
    : ''

/** Erstatter {{PRIS}}, {{PRIS_HTML}} og {{PRIS_VARSEL}} i markdown/frontmatter. */
function pris(str) {
  return String(str)
    // marked pakker en placeholder på egen linje inn i <p>. Varselet er selv
    // et blokkelement, så vi spiser den wrapperen for å unngå nøstede <p>.
    .replaceAll('<p>{{PRIS_VARSEL}}</p>', PRIS_VARSEL_HTML)
    .replaceAll('{{PRIS_VARSEL}}', PRIS_VARSEL_HTML)
    .replaceAll('{{PRIS_HTML}}', `<span class="dl-pris">${PRIS}</span>`)
    .replaceAll('{{PRIS}}', String(PRIS))
}

// Selvkorrigerende prisskifte for allerede utrullede statiske sider.
const PRIS_SCRIPT = `<script>(function(){var T=Date.parse('${PRICE_INCREASE_AT}');if(Date.now()<T)return;var n=document.querySelectorAll('.dl-pris');for(var i=0;i<n.length;i++)n[i].textContent='${PRICE_AFTER}';var v=document.querySelectorAll('.dl-prisvarsel');for(var j=0;j<v.length;j++)v[j].parentNode.removeChild(v[j]);})();</script>`
// --------------------------------------------------------------------------

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function parseFrontmatter(raw, file) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) throw new Error(`Mangler frontmatter: ${file}`)
  const meta = {}
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  for (const k of ['title', 'description', 'h1'])
    if (!meta[k]) throw new Error(`Mangler "${k}" i ${file}`)
  meta.slug = meta.slug || basename(file, '.md')
  return { meta, body: m[2] }
}

// Trekk ut FAQ (### spørsmål + svar) fra seksjonen under "## Ofte stilte spørsmål"/"## FAQ"
function extractFaq(body) {
  const lines = body.split('\n')
  let inFaq = false
  const faqs = []
  let cur = null
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.*)$/)
    if (h2 && !line.startsWith('###')) {
      const t = h2[1].toLowerCase()
      inFaq = t.includes('ofte stilte') || t.includes('faq') || t.includes('spørsmål og svar')
      if (cur) { faqs.push(cur); cur = null }
      continue
    }
    if (!inFaq) continue
    const h3 = line.match(/^###\s+(.*)$/)
    if (h3) {
      if (cur) faqs.push(cur)
      cur = { q: h3[1].trim(), a: '' }
    } else if (cur && line.trim()) {
      cur.a += (cur.a ? ' ' : '') + line.trim()
    }
  }
  if (cur) faqs.push(cur)
  // strip enkel markdown fra svarene
  return faqs
    .filter((f) => f.q && f.a)
    .map((f) => ({ q: f.q, a: f.a.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_`]/g, '').trim() }))
}

const CSS = `
  :root{--navy:#083554;--navy-dark:#0a1628;--gold:#E89F1E;--gold-text:#7A4F05;
    --cream:#F4E8CA;--bg:#fafbfc;--body:#3d4f63;--muted:#5a6a7e}
  *{box-sizing:border-box}
  body{margin:0;font-family:"Barlow",system-ui,-apple-system,sans-serif;
    background:var(--bg);color:var(--body);line-height:1.65;font-size:1.0625rem}
  a{color:var(--navy)}
  header.site{background:var(--navy-dark);padding:.85rem 1.25rem;display:flex;
    align-items:center;justify-content:space-between;gap:1rem}
  header.site .wordmark{color:#fff;font-weight:700;font-size:1.2rem;text-decoration:none;letter-spacing:.01em}
  header.site .wordmark span{color:var(--gold)}
  header.site .cta{background:var(--gold);color:var(--navy-dark);font-weight:600;
    text-decoration:none;padding:.45rem .9rem;border-radius:.5rem;font-size:.95rem;white-space:nowrap}
  main{max-width:680px;margin:0 auto;padding:2rem 1.25rem 3rem}
  h1{font-size:2rem;line-height:1.2;color:var(--navy);margin:.25rem 0 .75rem}
  h2{font-size:1.4rem;color:var(--navy);margin-top:2.25rem}
  h3{font-size:1.12rem;color:var(--navy);margin-bottom:.25rem}
  .lede{font-size:1.15rem;color:var(--navy);font-weight:500;margin:0 0 1.5rem}
  table{border-collapse:collapse;width:100%;font-size:.95rem;margin:1rem 0}
  th,td{border:1px solid #dde4ea;padding:.5rem .7rem;text-align:left}
  th{background:var(--cream);color:var(--navy)}
  .faktaboks{background:#fff;border:1px solid #e3e9ef;border-left:4px solid var(--gold);
    border-radius:0 .5rem .5rem 0;padding:1rem 1.25rem;margin:1.5rem 0}
  .faktaboks h3{margin:.1rem 0 .5rem}
  .faktaboks ul{margin:.25rem 0;padding-left:1.15rem}
  .cta-box{background:var(--navy);border-radius:.75rem;padding:1.5rem;margin:2rem 0;color:#e8eef4}
  .cta-box h2{color:#fff;margin:0 0 .35rem;font-size:1.25rem}
  .cta-box p{margin:.25rem 0 .75rem}
  .cta-box a.btn{display:inline-block;background:var(--gold);color:var(--navy-dark);
    font-weight:700;text-decoration:none;padding:.6rem 1.2rem;border-radius:.5rem;margin:.35rem .5rem .1rem 0}
  .cta-box a.btn.secondary{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5)}
  details{border-bottom:1px solid #e3e9ef;padding:.6rem 0}
  summary{cursor:pointer;font-weight:600;color:var(--navy)}
  footer.site{border-top:1px solid #e3e9ef;margin-top:2rem;padding:1.5rem 1.25rem;
    text-align:center;font-size:.85rem;color:var(--muted)}
`

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Lora:ital@1&display=swap" rel="stylesheet">`

const CONSENT = `<script>
(function(){
var KEY='dl-cookie-consent';var PIXEL_ID='1025209573360224';
function loadPixel(){if(window.__dlPixel)return;window.__dlPixel=true;!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',PIXEL_ID);fbq('track','PageView');}
var choice=null;try{choice=localStorage.getItem(KEY);}catch(e){}
if(choice==='accepted'){loadPixel();return;}
if(choice==='declined'){return;}
function save(v){try{localStorage.setItem(KEY,v);}catch(e){}}
function showBanner(){var bar=document.createElement('div');bar.setAttribute('role','dialog');bar.setAttribute('aria-label','Samtykke til informasjonskapsler');bar.style.cssText='position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#083554;color:#e7edf2;padding:14px 18px;font-family:Barlow,Inter,-apple-system,Segoe UI,Roboto,sans-serif;font-size:13.5px;line-height:1.5;box-shadow:0 -2px 14px rgba(0,0,0,0.25);';bar.innerHTML='<div style="max-width:760px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;gap:12px;justify-content:space-between;"><span style="flex:1;min-width:240px;">Vi bruker nødvendige informasjonskapsler. Vi vil også bruke Meta-pixel til markedsføring og statistikk. <a href="https://dronelappen.app/personvern" style="color:#E89F1E;text-decoration:underline;">Les mer</a>.</span><span style="display:flex;gap:8px;flex-shrink:0;"><button id="dl-decline" type="button" style="background:transparent;color:#c3d0db;border:1px solid rgba(255,255,255,0.35);border-radius:7px;padding:8px 14px;font:inherit;cursor:pointer;">Bare nødvendige</button><button id="dl-accept" type="button" style="background:#E89F1E;color:#083554;border:none;border-radius:7px;padding:8px 16px;font:inherit;font-weight:600;cursor:pointer;">Godta alle</button></span></div>';document.body.appendChild(bar);document.getElementById('dl-accept').onclick=function(){save('accepted');loadPixel();bar.remove();};document.getElementById('dl-decline').onclick=function(){save('declined');bar.remove();};}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',showBanner);}else{showBanner();}
})();
</script>`

function page({ title, description, canonical, h1, bodyHtml, jsonld }) {
  return `<!doctype html>
<html lang="nb">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta name="theme-color" content="#0a1628">
<meta property="og:type" content="website">
<meta property="og:site_name" content="DroneLappen">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="nb_NO">
<meta name="twitter:card" content="summary">
${FONTS}
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
${CONSENT}
</head>
<body>
<header class="site">
  <a class="wordmark" href="/">Drone<span>Lappen</span></a>
  <a class="cta" href="/">Ta quizen →</a>
</header>
<main>
<h1>${esc(h1)}</h1>
${bodyHtml}
</main>
<footer class="site">
  <p>© ${new Date().getFullYear()} DroneLappen · <a href="/blogg/">Blogg</a> ·
  Et søsterprosjekt av <a href="https://droneavisa.no" rel="noopener">Droneavisa.no</a></p>
</footer>
${PRIS_SCRIPT}
</body>
</html>`
}

// ── Bygg ──────────────────────────────────────────────────────────
const files = readdirSync(CONTENT).filter((f) => f.endsWith('.md'))
const built = []
for (const f of files) {
  const { meta, body } = parseFrontmatter(readFileSync(join(CONTENT, f), 'utf8'), f)
  const url = `${SITE}/${meta.slug}/`
  const faqs = extractFaq(body)
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: meta.title,
        description: pris(meta.description),
        url,
        inLanguage: 'nb',
        isPartOf: { '@type': 'WebSite', name: 'DroneLappen', url: SITE },
      },
      ...(faqs.length
        ? [{
            '@type': 'FAQPage',
            mainEntity: faqs.map((q) => ({
              '@type': 'Question',
              name: pris(q.q),
              acceptedAnswer: { '@type': 'Answer', text: pris(q.a) },
            })),
          }]
        : []),
    ],
  }
  const bodyHtml = pris(marked.parse(body))
  mkdirSync(join(PUBLIC, meta.slug), { recursive: true })
  writeFileSync(join(PUBLIC, meta.slug, 'index.html'), page({
    title: pris(meta.title), description: pris(meta.description), canonical: url,
    h1: pris(meta.h1), bodyHtml, jsonld,
  }))
  built.push({ slug: meta.slug, faqs: faqs.length })
}

// Root-sitemap: alltid "/" + landingssidene (deterministisk, ingen volatil lastmod)
const smUrls = [
  `  <url><loc>${SITE}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
  ...built
    .map((b) => b.slug)
    .sort()
    .map((s) => `  <url><loc>${SITE}/${s}/</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>`),
].join('\n')
writeFileSync(
  join(PUBLIC, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${smUrls}\n</urlset>\n`
)

console.log(`Bygget ${built.length} landingsside(r): ${built.map((b) => `/${b.slug}/ (${b.faqs} FAQ)`).join(', ')} + oppdatert public/sitemap.xml`)
