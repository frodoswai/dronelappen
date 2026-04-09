import { useParams, useNavigate } from 'react-router-dom'
import ModeCard from '../components/ModeCard'
import { recordSessionStart } from '../lib/sessionHistory'

// Step 2 of the two-step home flow. User picked an exam on Home, now
// picks a mode. Round 2 visual redesign: compact dark hero (no
// propeller — too much repetition) + three mode cards in the light
// zone, matching the Home aesthetic.
//
// Session recording happens on mode commit (the tap that actually
// launches the quiz), so the smart resume on Home always points at
// the last committed session.
//
// Round 2.5: mode renames (Øv fritt → Læring, Rapid → Tempo), tag
// tweaks (praksis → teori, trafikkstasjon → trafikkstasjonen), mono
// labels bumped for phone readability, and every mode card now has
// an explicit "start →" affordance. URL slugs stay on /practice and
// /rapid so existing bookmarks keep working.
export default function ExamSelect() {
  const { examType } = useParams()
  const navigate = useNavigate()

  const isA2 = examType === 'A2'
  const categoryLabel = isA2 ? 'trafikkstasjonen' : 'online, gratis'
  const displayName = isA2 ? 'A2' : 'A1 / A3'

  const examDescription = isA2
    ? 'Realistisk simulering. 30 spørsmål, 60 min, 23 riktige for å bestå.'
    : 'Realistisk simulering. 30 spørsmål, 75% for å bestå.'

  // Gate each mode tap on recordSessionStart so smart resume stays
  // honest. Using onClick rather than wrapping the Link target because
  // we want the side effect to fire before navigation.
  const start = (mode) => () => recordSessionStart(examType, mode)

  return (
    <div className="min-h-screen bg-da-bg flex flex-col">
      {/* ═══ Compact dark hero ═══ */}
      <div className="bg-da-navy-dark px-6 pt-3 pb-5">
        <div className="pt-8">
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => navigate('/')}
              className="quiz-option text-da-gold text-xl leading-none hover:opacity-80"
              aria-label="Tilbake"
            >
              ←
            </button>
            <span className="font-mono text-[12px] font-medium text-da-gold tracking-[0.1em]">
              {categoryLabel}
            </span>
          </div>
          <h1 className="text-4xl font-medium text-da-bg leading-none tracking-tight">
            {displayName}
          </h1>
        </div>
      </div>

      {/* ═══ Fade transition (28px) ═══ */}
      <div
        className="h-7"
        style={{
          background:
            'linear-gradient(to bottom, #0a1628 0%, #2a3a50 25%, #7e8a9c 55%, #cfd6df 80%, #fafbfc 100%)',
        }}
      />

      {/* ═══ Three mode cards ═══
          Round 2.5: flex-1 removed so the content sizes naturally and
          the global Footer sits right under the cards on tall screens. */}
      <div className="px-6 pt-2 pb-6 bg-da-bg">
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="flex-1 h-px bg-da-navy/20" />
          <span className="font-mono text-[12px] font-medium text-da-navy/60 tracking-[0.1em]">
            velg modus
          </span>
          <div className="flex-1 h-px bg-da-navy/20" />
        </div>

        <ModeCard
          to={`/quiz/${examType}`}
          label="simulering"
          title="Eksamen"
          description={examDescription}
          variant="primary"
          onClick={start('exam')}
        />

        <ModeCard
          to={`/practice/${examType}`}
          label="teori"
          title="Læring"
          description="Lær i ditt eget tempo. Forklaring etter hvert svar."
          variant="neutral"
          onClick={start('practice')}
        />

        {/* Round 2.5 rename: Rapid → Tempo. The old label "tempo"
            would now be redundant with the title "Tempo", so the
            category tag moves to "hurtig" — the speed framing the
            Rapid card always had. */}
        <ModeCard
          to={`/rapid/${examType}`}
          label="hurtig"
          title="Tempo"
          description="Test farten din. Riktig = videre, feil = lær og videre."
          variant="gold"
          showBolt
          onClick={start('rapid')}
        />
      </div>
    </div>
  )
}
