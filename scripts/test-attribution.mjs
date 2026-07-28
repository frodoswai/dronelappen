// Test av UTM-fallback fra document.referrer.
const HOST = 'dronelappen.app'
let store = {}

globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v) },
  removeItem: (k) => { delete store[k] },
}
globalThis.window = { location: { search: '', pathname: '/', hostname: HOST } }
globalThis.document = { referrer: '', cookie: '' }

const { captureAttribution, getAttribution } = await import('../src/lib/attribution.js')

function scenario(navn, { search = '', pathname = '/', referrer = '', forhaands = null }) {
  store = {}
  if (forhaands) store['dl-attribution'] = JSON.stringify(forhaands)
  globalThis.window.location.search = search
  globalThis.window.location.pathname = pathname
  globalThis.document.referrer = referrer
  captureAttribution()
  return { navn, ut: getAttribution() }
}

let feil = 0
function sjekk(navn, faktisk, forventet) {
  const ok = faktisk === forventet
  if (!ok) feil++
  console.log(`  ${ok ? 'OK  ' : 'FEIL'} ${navn}: ${JSON.stringify(faktisk)}${ok ? '' : `  (forventet ${JSON.stringify(forventet)})`}`)
}

const CHRIS_REF =
  'https://dronelappen.app/dronesertifikat-a2/?utm_source=google&utm_medium=cpc' +
  '&utm_campaign=sok-juli-2026&utm_content=207054627028&utm_term=droneeksamen%20a2' +
  '&gad_source=1&gclid=CjwKCAjwpqHTBhAcEiwAj2Afunr-vDuL45oVoZu2vswXz7rmLnHVsItX'

console.log('\n1. Google-annonse via statisk landingsside (Chris Tokt 28.07)')
let r = scenario('chris', { search: '', pathname: '/', referrer: CHRIS_REF })
sjekk('utm_source', r.ut.utm_source, 'google')
sjekk('utm_medium', r.ut.utm_medium, 'cpc')
sjekk('utm_campaign', r.ut.utm_campaign, 'sok-juli-2026')
sjekk('utm_term', r.ut.utm_term, 'droneeksamen a2')
sjekk('landing_path (ekte landingsside)', r.ut.landing_path, '/dronesertifikat-a2/')
sjekk('lt_utm_source (last touch ogsaa)', r.ut.lt_utm_source, 'google')

console.log('\n2. Direkte besok, ingen referrer')
r = scenario('direkte', { search: '', pathname: '/', referrer: '' })
sjekk('utm_source', r.ut.utm_source, undefined)
sjekk('landing_path', r.ut.landing_path, '/')

console.log('\n3. Intern klikking fra forside uten parametre')
r = scenario('intern', { search: '', pathname: '/practice/A2', referrer: 'https://dronelappen.app/' })
sjekk('utm_source', r.ut.utm_source, undefined)
sjekk('landing_path', r.ut.landing_path, '/practice/A2')

console.log('\n4. Ekstern side med noen andres UTM-er (skal ikke stjeles)')
const FREMMED = 'https://konkurrent.no/artikkel?utm_source=deres-kampanje&utm_medium=email'
r = scenario('fremmed', { search: '', pathname: '/', referrer: FREMMED })
sjekk('utm_source', r.ut.utm_source, undefined)
sjekk('lt_referrer (ekstern henvisning logges fortsatt)', r.ut.lt_referrer, FREMMED)

console.log('\n5. UTM i adressefeltet skal vinne over referrer')
r = scenario('adressefelt-vinner', {
  search: '?utm_source=newsletter&utm_medium=email', pathname: '/', referrer: CHRIS_REF,
})
sjekk('utm_source', r.ut.utm_source, 'newsletter')
sjekk('utm_medium', r.ut.utm_medium, 'email')
sjekk('landing_path (ingen entryPath naar adressefelt vinner)', r.ut.landing_path, '/')

console.log('\n6. Facebook-klikk via statisk landingsside')
r = scenario('fb', {
  search: '', pathname: '/',
  referrer: 'https://dronelappen.app/a2-ovingsplan?utm_source=facebook&utm_medium=paid&fbclid=IwABC123',
})
sjekk('utm_source', r.ut.utm_source, 'facebook')
sjekk('fbclid', r.ut.fbclid, 'IwABC123')

console.log('\n7. Eksisterende first touch skal ikke overskrives')
r = scenario('laast', {
  search: '', pathname: '/', referrer: CHRIS_REF,
  forhaands: { utm_source: 'droneavisa', first_seen: '2026-07-01T10:00:00.000Z' },
})
sjekk('utm_source (beholder droneavisa)', r.ut.utm_source, 'droneavisa')
sjekk('first_seen (uendret)', r.ut.first_seen, '2026-07-01T10:00:00.000Z')
sjekk('lt_utm_source (last touch fanger google)', r.ut.lt_utm_source, 'google')

console.log('\n8. Soppel i referrer')
r = scenario('soppel', { search: '', pathname: '/', referrer: 'ikke-en-url' })
sjekk('utm_source', r.ut.utm_source, undefined)

console.log('\n9. Tidligere DIREKTE first touch skal oppgraderes til google')
r = scenario('oppgrader', {
  search: '', pathname: '/', referrer: CHRIS_REF,
  forhaands: { first_seen: '2026-07-01T10:00:00.000Z', landing_path: '/' },
})
sjekk('utm_source (oppgradert)', r.ut.utm_source, 'google')
sjekk('first_seen (bevart)', r.ut.first_seen, '2026-07-01T10:00:00.000Z')

console.log(`\n${feil === 0 ? 'ALLE TESTER BESTOD' : feil + ' TESTER FEILET'}`)
process.exit(feil === 0 ? 0 : 1)
