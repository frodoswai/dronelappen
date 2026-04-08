// Shared shell for quiz-like screens (Exam, Practice, Rapid).
// Keeps the outer container, paddings, and header slot consistent
// so mobile viewports stay tight: one compact header line, then the
// question card. Accepts a `flashBg` prop for Rapid's correct/wrong flashes.
export default function QuizLayout({ header, children, flashBg }) {
  const bg = flashBg || 'bg-gradient-to-b from-gray-50 to-white'
  return (
    <div className={`min-h-screen px-4 pt-3 pb-6 transition-colors duration-150 ${bg}`}>
      <div className="max-w-lg mx-auto">
        {header && <div className="mb-3">{header}</div>}
        {children}
      </div>
    </div>
  )
}
