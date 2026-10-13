// Bro mellom createCheckout() (lib/supabase.js) og CheckoutEmailDialog.jsx.
//
// 13.10.2026: 31 av 31 ekte forlatte Stripe-økter siste 45 dager hadde ingen
// e-post (kjøperen er nesten alltid anonym, og Stripe får aldri adressen før
// kunden taster den inn der). Derfor spør vi om e-posten FØR vi sender til
// Stripe: den forhåndsutfylles hos Stripe (ett felt mindre der), kvittering
// og tilgang kan knyttes til den, og den som sier ja, får én påminnelse hvis
// kjøpet ikke fullføres (sendes fra Max, scripts/dronelappen_checkout_recovery.py).
// Påminnelsen krever aktivt samtykke (mfl. § 15), så boksen er tom som standard.
//
// Dialogen registrerer seg én gang (App.jsx). askCheckoutEmail() gir
// { email, remind } eller null når brukeren avbryter.

let opener = null

export function registerCheckoutEmailDialog(fn) {
  opener = fn
  return () => {
    if (opener === fn) opener = null
  }
}

export function askCheckoutEmail(opts = {}) {
  if (!opener) return Promise.resolve({ email: '', remind: false, skipped: true })
  return opener(opts)
}

export class CheckoutCancelled extends Error {
  constructor() {
    super('Kjøpet ble avbrutt.')
    this.cancelled = true
  }
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
