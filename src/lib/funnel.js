// Serverside trakt-logging (03.08.2026).
//
// HVORFOR: betalingsmuren fyrte bare fbq('InitiateCheckout'). Den er
// samtykke-gatet — rundt 39 % godtar — og tallet kan uansett ikke spørres per
// bruker. Da vi 3/8 fant at 23 ikke-betalende hadde brukt opp gratis-poolen på
// én uke, fantes det ingen måte å svare på om de i det hele tatt SÅ muren.
// Uten det tallet kan man ikke skille «de så tilbudet og sa nei» fra «de traff
// aldri et tilbud», og det er to helt forskjellige problemer.
//
// Designvalg:
// - Fire-and-forget. Logging skal ALDRI blokkere eller velte kjøpsflyten;
//   alle feil svelges bevisst.
// - Ingen persondata utover user_id, som allerede finnes i user_progress.
// - Anonyme sesjoner teller også: AuthContext gir hver besøkende en anonym
//   Supabase-bruker, så user_id finnes selv for dem som aldri har logget inn.

import { supabase } from './supabase'

export const PAYWALL_VIEW = 'paywall_view'
export const PAYWALL_BUY_CLICK = 'paywall_buy_click'
export const PAYWALL_EXIT = 'paywall_exit'

export function logFunnel(event, { examType = null, answered = null } = {}) {
  try {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data?.user?.id
      if (!uid) return
      supabase
        .from('funnel_events')
        .insert({ user_id: uid, event, exam_type: examType, answered })
        .then(() => {}, () => {})
    }, () => {})
  } catch (_) {
    /* logging skal aldri velte flyten */
  }
}
