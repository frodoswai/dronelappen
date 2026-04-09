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
export default function ExamSelect() {
  const { examType } = useParams()
  const navigate = useNavigate()

  const isA2 = examType === 'A2'
  const categoryLabel = isA2 ? 'trafikkstasjon' : 'online, gratis'
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
            <span className="font-mono text-[10px] text-da-gold tracking-[0.15em]">
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

      {/* ═══ Three mode cards ═══ */}
      <div className="flex-1 px-6 pt-2 pb-6 bg-da-bg">
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="flex-1 h-px bg-da-navy/20" />
          <span className="font-mono text-[10px] text-da-navy/60 tracking-[0.15em]">
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
          label="praksis"
          title="Øv fritt"
          description="Lær i ditt eget tempo. Forklaring etter hvert svar."
          variant="neutral"
          onClick={start('practice')}
        />

        <ModeCard
          to={`/rapid/${examType}`}
          label="tempo"
          title="Rapid"
          description="Test farten din. Riktig = videre, feil = lær og videre."
          variant="gold"
          showBolt
          onClick={start('rapid')}
        />
      </div>
    </div>
  )
}
