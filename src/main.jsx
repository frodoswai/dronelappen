import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { captureAttribution } from './lib/attribution.js'
import { captureVoteSource } from './lib/voteSource.js'

// Capture acquisition source (UTM/referrer) on first known-channel visit,
// so it can be attached to the Stripe checkout for sales attribution.
captureAttribution()
// ?src= for funksjonsstemmer (STS-flisa). Se lib/voteSource.js.
captureVoteSource()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)