import { useState } from 'react'
import { supabase } from '../lib/supabase'

// «Meld feil i spørsmålet» (14.11.2026). Ligger under forklaringen i Læring
// og i fasitgjennomgangen. Sender til report_question() (migrasjon 032), som
// har dagstak og kutter merknaden til 500 tegn. Merknaden er valgfri: et
// trykk på Send uten tekst er også en nyttig melding.
// Brukes med key={spørsmåls-ID}, så tilstanden nullstilles per spørsmål.
export default function ReportQuestion({ questionId }) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [state, setState] = useState('idle') // idle | sending | sent

  if (state === 'sent') {
    return (
      <p className="mt-2 text-[12.5px] text-da-text-muted" role="status">
        Takk, vi ser på spørsmålet.
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="quiz-option mt-2 text-[12.5px] text-da-text-muted underline underline-offset-2 hover:text-da-navy"
      >
        Meld feil i spørsmålet
      </button>
    )
  }

  const send = async () => {
    if (state === 'sending') return
    setState('sending')
    try {
      await supabase.rpc('report_question', { p_question_id: questionId, p_note: note })
    } catch (_) {
      /* en mislykket melding skal aldri stoppe øvingen */
    }
    setState('sent')
  }

  return (
    <div className="mt-2">
      <label className="block text-[12.5px] text-da-text-body mb-1" htmlFor={`meld-${questionId}`}>
        Hva er feil? (valgfritt)
      </label>
      <textarea
        id={`meld-${questionId}`}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        rows={2}
        className="w-full rounded border-[0.5px] border-da-navy/30 bg-white px-3 py-2 text-[14px] text-da-navy"
      />
      <div className="flex items-center gap-3 mt-1.5">
        <button
          type="button"
          onClick={send}
          disabled={state === 'sending'}
          className="quiz-option bg-da-navy text-da-bg text-[13px] font-medium py-2 px-4 rounded-lg disabled:opacity-60"
        >
          {state === 'sending' ? 'Sender …' : 'Send'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="quiz-option text-[12.5px] text-da-text-muted underline underline-offset-2"
        >
          Avbryt
        </button>
      </div>
    </div>
  )
}
