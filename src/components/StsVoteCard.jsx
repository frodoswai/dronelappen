import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import CrosshairMarks from './CrosshairMarks'
import { getVoteSource } from '../lib/voteSource'

// Låst STS-flis med stemmeknapp — etterspørselsmåling, ikke en funksjon.
//
// HVORFOR DEN FINNES (21.09.2026): STS-etterspørselen er dokumentert med
// nøyaktig ÉN kunde. Eivind Gaertner spurte 14/8, fikk nei, øvde med
// Copilot i stedet og besto STS-teorien på trafikkstasjonen 10/9. Det er
// et signal, men ett tilfelle er ikke grunnlag for 80-100 nye spørsmål.
// Flisa måler i stedet for å gjette, og koster en ettermiddag mot ukene
// spørsmålsbanken ville tatt.
//
// TERSKELEN ER SATT FØR TALLET FINNES: 5 stemmer fra innloggede eller
// betalende på 30 dager, hvorav minst 2 med et fritekstsvar som beskriver
// et konkret bruksbehov = bygg hele settet. Under det: bare guiden på
// Droneavisa. Settes terskelen etterpå, leser man tallet man ønsker seg.
//
// JUSTERT 21.09.2026, samme dag som lansering og før første stemme.
// Den opprinnelige terskelen var 25, satt uten å se på nevneren. Da vi
// faktisk talte, var den umulig: 40 betalende og 55 registrerte, men bare
// 22 innloggede hadde vært aktive de siste 30 dagene. 25 var altså flere
// enn antallet mennesker som kunne stemme. 5 av 22 er rundt en femdel av
// en engasjert base som ber om noe uoppfordret — et reelt signal.
// Fritekstkravet er den egentlige kvalitetskontrollen: to som beskriver
// hva de trenger STS til er mer verdt enn tjue som klikker.
//
// TRE VALG SOM ER BEVISSTE:
//
// 1. INGEN DATO OG INGEN LOVNAD. Teksten sier «vurderer», ikke «kommer».
//    Frode har alt sagt til Eivind to ganger at ingen dato er lovet, og
//    flisa skal ikke motsi ham. En stemmeknapp som i praksis leses som en
//    lanseringsvarsling er et løfte vi ikke har dekning for.
//
// 2. INGEN TELLER PÅ FLISA. Et lavt tall demper videre stemming, og tallet
//    er til intern beslutning uansett. count_feature_votes er derfor
//    service_role-only — se 015_feature_votes.sql.
//
// 3. FRITEKSTFELTET KOMMER ETTER STEMMEN, ALDRI FØR. Stemmen er registrert
//    i det den avgis; feltet er en bonus vi spør om når brukeren allerede
//    har sagt ja. Motsatt rekkefølge ville gjort et skjema av ett klikk og
//    kostet oss stemmer. Feltet er også grunnen til at vi slipper å sende
//    en egen spørreundersøkelse etterpå.
//
// Anonyme kan stemme (ellers mister vi alle som ikke vil registrere seg),
// men tier og is_anonymous lagres på stemmetidspunktet så de kan telles
// hver for seg. Terskelen måles kun på innloggede/betalende.

const FEATURE = 'sts'
// Kvittering for «nei takk» til fritekstfeltet. Ligger lokalt med vilje —
// et ubesvart spørsmål er ikke data verdt en rad i basen.
const SKIP_KEY = 'dl_sts_note_skipped'

// Guiden finnes allerede, spørsmålene gjør ikke. Å sende den som spør til
// det vi faktisk har er bedre enn å la ham stå igjen med en kvittering.
const GUIDE_URL =
  'https://droneavisa.no/spesifikk-kategori-sts-guide-norge/?utm_source=dronelappen&utm_medium=app&utm_campaign=sts-stemme'

export default function StsVoteCard() {
  const { user } = useAuth()
  // null = vet ikke ennå (skjuler flisa helt til vi vet, så en som alt har
  // stemt aldri ser knappen blinke forbi og tror stemmen forsvant).
  const [voted, setVoted] = useState(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [noteDone, setNoteDone] = useState(false)
  // Lat initialisering, ikke en effekt: localStorage er tilgjengelig
  // allerede ved første render, og en setState i en effekt ville gitt en
  // ekstra runde der feltet vises og forsvinner igjen.
  const [skipped, setSkipped] = useState(() => {
    try {
      return localStorage.getItem(SKIP_KEY) === '1'
    } catch (_) {
      return false // private mode — spør en gang til, ikke verdt mer
    }
  })
  const [err, setErr] = useState('')

  // Les tilstanden når sesjonen finnes. RPC-en krever brukerens egen JWT,
  // så den kan ikke gjøres med det rå anon-kallet Home bruker til
  // get_question_count — derfor venter vi på user fra AuthContext.
  useEffect(() => {
    let cancelled = false
    if (!user) return
    ;(async () => {
      const { data, error } = await supabase.rpc('get_feature_vote_state', {
        p_feature: FEATURE,
      })
      if (cancelled) return
      if (error) { setVoted(false); return }
      const rad = data?.[0]
      setVoted(Boolean(rad?.has_voted))
      if (rad?.has_note) setNoteDone(true)
    })()
    return () => { cancelled = true }
  }, [user])

  const stem = async () => {
    setBusy(true)
    setErr('')
    // Kilde fra ?src= i lenken (f.eks. sts-epost-2), se lib/voteSource.js
    // og 017_feature_votes_src.sql. null = kom ikke via en sporet lenke.
    const { error } = await supabase.rpc('cast_feature_vote', {
      p_feature: FEATURE,
      p_src: getVoteSource(),
    })
    setBusy(false)
    if (error) {
      setErr('Fikk ikke registrert stemmen. Prøv igjen.')
      return
    }
    setVoted(true)
  }

  const lagreNote = async () => {
    const txt = note.trim()
    if (!txt) return
    setBusy(true)
    const { error } = await supabase.rpc('set_feature_vote_note', {
      p_feature: FEATURE,
      p_note: txt,
    })
    setBusy(false)
    // Stemmen står uansett — en feilet fritekst skal ikke se ut som om
    // hele svaret gikk tapt.
    if (error) { setErr('Fikk ikke lagret svaret, men stemmen din er talt.'); return }
    setNoteDone(true)
  }

  const hoppOver = () => {
    try { localStorage.setItem(SKIP_KEY, '1') } catch (_) { /* ignorer */ }
    setSkipped(true)
  }

  // Vent til vi vet. Ingen flimring mellom knapp og kvittering.
  if (voted === null) return null

  return (
    <div className="rise-in rise-d3 relative bg-white border-[0.5px] border-dashed border-da-navy/40 rounded-lg px-[18px] pt-4 pb-3.5 mb-3">
      <CrosshairMarks variant="muted" />

      <div className="font-mono text-[12px] text-da-text-muted tracking-[0.12em] font-medium mb-1.5">
        ikke laget ennå
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-[34px] font-medium text-da-navy/70 leading-none tracking-tight">
          STS
        </span>
        {/* Hengelås — samme gråtone som tittelen, så den leser som status
            og ikke som en knapp. */}
        <svg width="15" height="18" viewBox="0 0 12 15" aria-hidden="true" className="mb-1">
          <path
            d="M3 6V4a3 3 0 1 1 6 0v2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-da-navy/45"
          />
          <rect x="1" y="6" width="10" height="8" rx="1.5" className="fill-da-navy/45" />
        </svg>
      </div>

      {!voted ? (
        <>
          <p className="text-[12.5px] text-da-text-body leading-[1.55] mb-3">
            Spesifikk kategori. Vi har ingen STS-spørsmål i dag, og vurderer
            om vi skal lage dem.{' '}
            <span className="text-da-text-muted">
              Si fra om du trenger det, så teller vi.
            </span>
          </p>

          <button
            onClick={stem}
            disabled={busy}
            className="quiz-option w-full bg-da-navy hover:bg-da-navy-mid text-da-bg font-medium py-3 px-4 rounded-lg transition-colors text-[13px] inline-flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
          >
            <span>{busy ? 'Registrerer …' : 'Jeg trenger STS'}</span>
            {!busy && <span className="font-mono text-[12px] text-da-gold">+1</span>}
          </button>
        </>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-mono text-[11px] font-medium text-da-gold tracking-[0.1em]">
              notert
            </span>
            <span className="text-[13px] font-medium text-da-navy">
              Stemmen din er talt.
            </span>
          </div>

          {/* Fritekst — ett felt, valgfritt, og bare så lenge det er
              ubesvart og ikke avvist. */}
          {!noteDone && !skipped && (
            <div className="mt-3">
              <label
                htmlFor="sts-note"
                className="block text-[12.5px] text-da-text-body leading-[1.55] mb-2"
              >
                Hva trenger du STS til?{' '}
                <span className="text-da-text-muted">
                  Valgfritt — men det avgjør hva spørsmålene bør handle om.
                </span>
              </label>
              <textarea
                id="sts-note"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="F.eks. inspeksjon av kraftlinjer for arbeidsgiver, eller flyging over folk på oppdrag."
                className="w-full text-[13px] text-da-navy bg-da-bg border-[0.5px] border-da-navy/30 rounded-lg px-3 py-2.5 leading-[1.5] focus:outline-none focus:border-da-navy/60 placeholder:text-da-text-muted"
              />
              <div className="flex items-center justify-between gap-3 mt-2">
                <button
                  onClick={hoppOver}
                  className="quiz-option font-mono text-[11px] text-da-text-muted hover:text-da-navy tracking-[0.05em] transition-colors"
                >
                  hopp over
                </button>
                <button
                  onClick={lagreNote}
                  disabled={busy || !note.trim()}
                  className="quiz-option bg-da-gold hover:brightness-105 text-da-navy-dark font-semibold py-2.5 px-4 rounded-lg transition-all text-[13px] active:scale-[0.99] disabled:opacity-40"
                >
                  {busy ? 'Sender …' : 'Send svar'}
                </button>
              </div>
            </div>
          )}

          {noteDone && (
            <p className="text-[12.5px] text-da-text-body leading-[1.55] mt-1">
              Takk — svaret ditt er med i vurderingen.
            </p>
          )}

          {/* Guiden finnes. Den som nettopp sa at han trenger STS skal få
              noe med seg videre, ikke bare en kvittering. */}
          <a
            href={GUIDE_URL}
            target="_blank"
            rel="noopener"
            className="quiz-option inline-flex items-center gap-1.5 font-mono text-[11px] text-da-navy/70 hover:text-da-navy tracking-[0.05em] mt-3 transition-colors"
          >
            Les STS-guiden vår i mellomtiden
            <span className="text-da-gold">→</span>
          </a>
        </>
      )}

      {err && (
        <p className="text-[12px] text-da-text-muted mt-2">{err}</p>
      )}
    </div>
  )
}
