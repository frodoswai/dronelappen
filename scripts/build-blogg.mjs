// build-blogg.mjs — statisk bloggenerator for dronelappen.app/blogg
// Leser content/blogg/*.md (frontmatter + markdown), skriver
// public/blogg/<slug>/index.html + public/blogg/index.html + sitemap.xml.
// Kjøres før `vite build` (se package.json). Null impact på React-bundelen:
// alt under public/ kopieres som statiske filer.
//
// Frontmatter-felter:
//   title:       (påkrevd)
//   description: (påkrevd, meta description)
//   date:        YYYY-MM-DD (påkrevd)
//   updated:     YYYY-MM-DD (valgfri)
//   slug:        (valgfri, ellers filnavn uten .md)
//   image:       assets/<fil>.png (valgfri — hero + og:image, 1200x630)
//   imageAlt:    alt-tekst (påkrevd hvis image er satt)

import { marked } from 'marked'
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, cpSync, existsSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT = join(ROOT, 'content', 'blogg')
const OUT = join(ROOT, 'public', 'blogg')
const SITE = 'https://dronelappen.app'

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const nbDate = (iso) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })

function parseFrontmatter(raw, file) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) throw new Error(`Mangler frontmatter: ${file}`)
  const meta = {}
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  for (const k of ['title', 'description', 'date'])
    if (!meta[k]) throw new Error(`Mangler "${k}" i ${file}`)
  meta.slug = meta.slug || basename(file, '.md')
  return { meta, body: m[2] }
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
  .crumb{font-size:.85rem;color:var(--muted);margin-bottom:1.25rem}
  .crumb a{color:var(--muted)}
  h1{font-size:2rem;line-height:1.2;color:var(--navy);margin:.25rem 0 .5rem}
  h2{font-size:1.4rem;color:var(--navy);margin-top:2.25rem}
  h3{font-size:1.15rem;color:var(--navy)}
  .meta{font-size:.9rem;color:var(--muted);margin-bottom:1.75rem}
  .meta .byline{font-style:italic;font-family:"Lora",Georgia,serif}
  .hero{width:100%;height:auto;border-radius:.75rem;margin:0 0 1.5rem;display:block}
  blockquote{border-left:4px solid var(--gold);background:#fff;margin:1.5rem 0;
    padding:.75rem 1.25rem;border-radius:0 .5rem .5rem 0}
  table{border-collapse:collapse;width:100%;font-size:.95rem}
  th,td{border:1px solid #dde4ea;padding:.5rem .7rem;text-align:left}
  th{background:var(--cream);color:var(--navy)}
  .cta-box{background:var(--navy);border-radius:.75rem;padding:1.5rem;margin:2.5rem 0;color:#e8eef4}
  .cta-box h2{color:#fff;margin:0 0 .5rem;font-size:1.25rem}
  .cta-box a.btn{display:inline-block;background:var(--gold);color:var(--navy-dark);
    font-weight:700;text-decoration:none;padding:.6rem 1.2rem;border-radius:.5rem;margin-top:.75rem}
  ul.artikler{list-style:none;padding:0}
  ul.artikler li{background:#fff;border:1px solid #e3e9ef;border-radius:.75rem;
    padding:1.1rem 1.3rem;margin-bottom:1rem}
  ul.artikler a.t{font-size:1.2rem;font-weight:600;color:var(--navy);text-decoration:none}
  ul.artikler .d{font-size:.85rem;color:var(--muted);margin:.25rem 0 .4rem}
  footer.site{border-top:1px solid #e3e9ef;margin-top:2rem;padding:1.5rem 1.25rem;
    text-align:center;font-size:.85rem;color:var(--muted)}
`

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Lora:ital@1&display=swap" rel="stylesheet">`

function page({ title, description, canonical, ogType, jsonld, bodyHtml, ogImage }) {
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
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="DroneLappen">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="nb_NO">
${ogImage ? `<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:image" content="${ogImage}">` : ''}
<meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}">
${FONTS}
<style>${CSS}</style>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
<!-- Cookie consent + Meta Pixel (consent-gated, opt-in) -->
<script>
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
</script>
<!-- End cookie consent -->
</head>
<body>
<header class="site">
  <a class="wordmark" href="/">Drone<span>Lappen</span></a>
  <a class="cta" href="/">Ta quizen →</a>
</header>
<main>
${bodyHtml}
</main>
<footer class="site">
  <p>© ${new Date().getFullYear()} DroneLappen · <a href="/blogg/">Blogg</a> ·
  Et søsterprosjekt av <a href="https://droneavisa.no" rel="noopener">Droneavisa.no</a></p>
</footer>
</body>
</html>`
}

const CTA_BOX = `<div class="cta-box">
<h2>Øv gratis til droneeksamen</h2>
<p>200+ norske spørsmål for A1/A3 og A2. Eksamensmodus med ekte tidsfrist og bestå-grense. Ingen innlogging, ingen reklame.</p>
<a class="btn" href="/">Start øvingen →</a>
</div>`

// ── Bygg ──────────────────────────────────────────────────────────
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

// Kopier bilder (content/blogg/assets → public/blogg/assets)
const ASSETS = join(CONTENT, 'assets')
if (existsSync(ASSETS)) cpSync(ASSETS, join(OUT, 'assets'), { recursive: true })

const posts = readdirSync(CONTENT)
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const { meta, body } = parseFrontmatter(readFileSync(join(CONTENT, f), 'utf8'), f)
    return { ...meta, html: marked.parse(body) }
  })
  .sort((a, b) => b.date.localeCompare(a.date))

for (const p of posts) {
  const url = `${SITE}/blogg/${p.slug}/`
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.title,
    description: p.description,
    datePublished: p.date,
    dateModified: p.updated || p.date,
    inLanguage: 'nb',
    mainEntityOfPage: url,
    author: { '@type': 'Person', name: 'Frode Friestad', url: 'https://droneavisa.no/om-droneavisa/' },
    publisher: { '@type': 'Organization', name: 'DroneLappen', url: SITE },
  }
  const ogImage = p.image ? `${SITE}/blogg/${p.image}` : undefined
  if (ogImage) jsonld.image = ogImage
  if (p.image && !p.imageAlt) throw new Error(`Mangler "imageAlt" for ${p.slug}`)
  const bodyHtml = `<nav class="crumb"><a href="/blogg/">Blogg</a> / ${esc(p.title)}</nav>
<article>
<h1>${esc(p.title)}</h1>
<p class="meta">Publisert <time datetime="${p.date}">${nbDate(p.date)}</time>${
    p.updated ? `, oppdatert <time datetime="${p.updated}">${nbDate(p.updated)}</time>` : ''
  } · <span class="byline">av Frode Friestad</span></p>
${p.image ? `<a href="/" aria-label="Gå til quiz-appen"><img class="hero" src="/blogg/${p.image}" alt="${esc(p.imageAlt)}" width="1200" height="630"></a>` : ''}
${p.html}
${CTA_BOX}
</article>`
  mkdirSync(join(OUT, p.slug), { recursive: true })
  writeFileSync(
    join(OUT, p.slug, 'index.html'),
    page({ title: `${p.title} – DroneLappen`, description: p.description, canonical: url, ogType: 'article', jsonld, bodyHtml, ogImage })
  )
}

// Indeks
const listHtml = posts
  .map(
    (p) => `<li><a class="t" href="/blogg/${p.slug}/">${esc(p.title)}</a>
<div class="d"><time datetime="${p.date}">${nbDate(p.date)}</time></div>
<div>${esc(p.description)}</div></li>`
  )
  .join('\n')

writeFileSync(
  join(OUT, 'index.html'),
  page({
    title: 'Blogg – DroneLappen',
    description: 'Guider og tips til droneeksamen i Norge: A1/A3, A2, regelverk og eksamensforberedelse.',
    canonical: `${SITE}/blogg/`,
    ogType: 'website',
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'DroneLappen-bloggen',
      url: `${SITE}/blogg/`,
      inLanguage: 'nb',
    },
    bodyHtml: `<h1>DroneLappen-bloggen</h1>
<p class="meta">Guider og tips til droneeksamen i Norge</p>
<ul class="artikler">
${listHtml}
</ul>
${CTA_BOX}`,
  })
)

// Sitemap
const urls = [
  `<url><loc>${SITE}/blogg/</loc><lastmod>${posts[0]?.updated || posts[0]?.date || ''}</lastmod></url>`,
  ...posts.map((p) => `<url><loc>${SITE}/blogg/${p.slug}/</loc><lastmod>${p.updated || p.date}</lastmod></url>`),
].join('\n')
writeFileSync(
  join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
)

console.log(`Bygget ${posts.length} artikkel/artikler + indeks + sitemap → public/blogg/`)
