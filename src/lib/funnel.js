// Serverside trakt-logging (03.08.2026, gjort pålitelig 05.08.2026).
//
// HVORFOR: betalingsmuren fyrte bare fbq('InitiateCheckout'). Den er
// samtykke-gatet — rundt 39 % godtar — og tallet kan uansett ikke spørres per
// bruker. Da vi 3/8 fant at 23 ikke-betalende hadde brukt opp gratis-poolen på
// én uke, fantes det ingen måte å svare på om de i det hele tatt SÅ muren.
// Uten det tallet kan man ikke skille «de så tilbudet og sa nei» fra «de traff
// aldri et tilbud», og det er to helt forskjellige problemer.
//
// FEIL RETTET 05.08.2026 — samme felle som er dokumentert i create-checkout:
// første versjon gjorde getUser() (nettverkskall) og DERETTER insert, mens
// handleBuy redirecter til Stripe rett etterpå. Siden rakk aldri å sende, så
// paywall_buy_click sto på null i to døgn mens Stripe viste påbegynte kjøp i
// samme periode. Vi holdt på å konkludere med at betalingsmuren var død.
// Nå: getSession() leser fra lokal lagring uten nettverkskall, og logFunnel
// returnerer et løfte kalleren kan vente på før den navigerer bort.
//
// Designvalg:
// - Feil svelges fortsatt. Logging skal ALDRI velte kjøpsflyten.
// - Ingen persondata utover user_id, som allerede finnes i user_progress.
// - Anonyme sesjoner teller også: AuthContext gir hver besøkende en anonym
//   Supabase-bruker, så user_id finnes selv for dem som aldri har logget inn.

import { supabase } from './supabase'

export const PAYWALL_VIEW = 'paywall_view'
export const PAYWALL_BUY_CLICK = 'paywall_buy_click'
export const PAYWALL_EXIT = 'paywall_exit'
// Kjøpsknappen i quiz-headeren (QuizLayout). Egen hendelse fordi den treffer
// et helt annet publikum enn betalingsmuren: folk som kjøper UNDERVEIS eller
// uten å svare i det hele tatt. 8 av 23 betalende gjorde nettopp det.
export const QUIZ_BUY_CLICK = 'quiz_buy_click'
// Forsidens dobbeltvalg. Med denne har alle tre kjøpsinngangene hver sin
// hendelse, og vi kan endelig se hvilken av dem folk faktisk bruker.
export const HOME_BUY_CLICK = 'home_buy_click'

// Hvor lenge en kaller maks skal vente før den navigerer bort. En tapt
// logglinje er billigere enn et tapt kjøp, så taket er lavt med vilje.
const MAX_WAIT_MS = 800

export function logFunnel(event, { examType = null, answered = null } = {}) {
  const work = (async () => {
    try {
      const { data } = await supabase.auth.getSession()
      const uid = data?.session?.user?.id
      if (!uid) return
      await supabase
        .from('funnel_events')
        .insert({ user_id: uid, event, exam_type: examType, answered })
    } catch {
      /* logging skal aldri velte flyten */
    }
  })()

  // Kallere som ikke bryr seg kan ignorere returverdien; de som er i ferd med
  // å forlate siden gjør `await logFunnel(...)` og får uansett kontrollen
  // tilbake innen MAX_WAIT_MS.
  return Promise.race([
    work,
    new Promise((resolve) => { setTimeout(resolve, MAX_WAIT_MS) }),
  ])
}
