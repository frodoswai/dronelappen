// sessionStorage-persistering av pågående quiz-økter (Tempo/Læring/Eksamen).
//
// Bakgrunn (Frode 31/7): all quiz-tilstand lå kun i React-minnet, så en
// utilsiktet refresh kastet hele økten — nytt spørsmålstrekk, nullstilt
// klokke, 0/0-teller. Nå lagres økten fortløpende og gjenopptas ved reload.
//
// Prinsipper:
// - startTime lagres som veggklokke-tidspunkt (Date.now()-anker), slik at
//   refresh ALDRI gir mer tid: eksamensklokka fortsetter å løpe og
//   tempo-stoppeklokka teller videre gjennom en reload.
// - sessionStorage (ikke localStorage): per fane, dør med fanen — en økt
//   skal ikke gjenoppstå dager senere eller lekke mellom faner.
// - Alle operasjoner er try/catch-et: privat modus / full lagring skal
//   aldri blokkere quizen.
const VERSION = 1
const DEFAULT_MAX_AGE_MS = 12 * 60 * 60 * 1000 // 12 t — zombievern

export function saveQuizSession(key, state) {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({ v: VERSION, savedAt: Date.now(), ...state })
    )
  } catch (_) {
    /* aldri blokker quizen */
  }
}

export function loadQuizSession(key, { maxAgeMs = DEFAULT_MAX_AGE_MS } = {}) {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data?.v !== VERSION) return null
    if (typeof data.savedAt !== 'number' || Date.now() - data.savedAt > maxAgeMs) return null
    if (!Array.isArray(data.questions) || data.questions.length === 0) return null
    return data
  } catch (_) {
    return null
  }
}

export function clearQuizSession(key) {
  try {
    sessionStorage.removeItem(key)
  } catch (_) {
    /* ignorer */
  }
}
