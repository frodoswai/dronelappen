import { useParams, useNavigate } from 'react-router-dom'
import ModeCard from '../components/ModeCard'
import UpgradePrompt from '../components/UpgradePrompt'
import { useAuth } from '../contexts/AuthContext'
import { recordSessionStart } from '../lib/sessionHistory'
import { EXAMS, examConfig } from '../lib/exams'

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

  const { tier } = useAuth()

  // Navn, stikkord og tekster per eksamenstype står i lib/exams.js. Ruten
  // slipper bare gjennom kjente typer; A1/A3 er reserven, som før.
  const exam = examConfig(examType) ?? EXAMS.A1_A3
  const categoryLabel = exam.tag
  const displayName = exam.display

  // Tier-aware: free tier gets a 25-question pool on A2 (pass: 19 = 75%).
  // A1/A3 er unntatt fra 08.10.2026: gratis i sin helhet, 40/30 for alle.
  // PRO gets the full simulation i offisielt format (A2 og STS: 30/23,
  // A1/A3: 40/30, se examCount i lib/exams.js). STS har ingen gratis-pool.
  // Describe what the user will actually get, not more.
  const examDescription =
    tier === 'paid' ? exam.examDescription.paid : exam.examDescription.free

  // Gate each mode tap on recordSessionStart so smart resume stays
  // honest. Using onClick rather than wrapping the Link target because
  // we want the side effect to fire before navigation.
  const start = (mode) => () => recordSessionStart(examType, mode)

  return (
    <div className="min-h-screen bg-da-navy-dark flex flex-col">
      {/* Mørk topp (B2-drakt 14.11.2026) */}
      <div className="px-5 pt-3 pb-6">
        <div className="pt-2 max-w-xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="w-11 h-11 rounded-full border border-[#1E3A57] bg-[#10233A] flex items-center justify-center hover:border-da-dark-slogan transition-colors mb-4"
            aria-label="Tilbake"
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EAF1F7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <p className="text-[13px] font-semibold tracking-[0.08em] uppercase text-da-dark-slogan mb-1.5">{categoryLabel}</p>
          <h1 className="font-cond text-[44px] font-bold text-white leading-none">
            {displayName}
          </h1>
          {/* Innledning der eksamenstypen har en (STS-påbygget). */}
          {exam.intro && (
            <p className="text-[16px] text-[#C9D6E2] leading-[1.45] mt-3 max-w-md">
              {exam.intro}
            </p>
          )}
        </div>
      </div>

      {/* Hvitt felt med moduskortene */}
      <div className="flex-1 bg-white rounded-t-3xl px-5 pt-5 pb-6">
        <div className="max-w-xl mx-auto">

        {/* Upsell to full access for free users (hidden for paid).
            Placed above the mode cards so it's visible without scrolling. */}
        <UpgradePrompt paidOnlyTitle={exam.paidOnly ? exam.paywallTitle : ''} examType={examType} />

        <h2 className="text-[13px] font-semibold tracking-[0.08em] uppercase text-da-text-muted mb-2.5">Velg modus</h2>

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
    </div>
  )
}
