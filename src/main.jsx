import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { captureAttribution } from './lib/attribution.js'
import { logLanding } from './lib/visits.js'
import { captureVoteSource } from './lib/voteSource.js'
import { captureStsPreview } from './lib/exams.js'

// Capture acquisition source (UTM/referrer) on first known-channel visit,
// so it can be attached to the Stripe checkout for sales attribution.
captureAttribution()
// Klikk -> økt: logg landingen hvis besøket har en kjent kilde. Se lib/visits.js.
logLanding()
// ?src= for funksjonsstemmer (STS-flisa). Se lib/voteSource.js.
captureVoteSource()
// ?sts-test=1 for STS-testere før lansering. Se lib/exams.js.
captureStsPreview()

// index.html har en statisk bunntekst-navigasjon for crawlere uten JavaScript.
// Appen rendrer de samme lenkene selv (components/Footer.jsx), saa den fjernes her.
document.getElementById('dl-static-nav')?.remove()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)