import { useEffect, useState } from 'react'

// Global display-size control. Because the app styles use fixed pixel
// font sizes throughout, the most reliable way to make everything
// bigger is to scale the whole UI via the CSS `zoom` property on the
// document root. Three levels, persisted to localStorage. The matching
// inline bootstrap in index.html applies the saved level before first
// paint so there's no flash of the default size on reload.
const STORAGE_KEY = 'dl-text-scale'

const LEVELS = [
  { id: 'normal', label: 'Normal', scale: 1, a: 'text-[12px]' },
  { id: 'stor', label: 'Stor', scale: 1.15, a: 'text-[15px]' },
  { id: 'storst', label: 'Størst', scale: 1.3, a: 'text-[19px]' },
]

function applyScale(scale) {
  // zoom: '' resets to the browser default (1). Avoids leaving an
  // explicit "1" on the element.
  document.documentElement.style.zoom = scale === 1 ? '' : String(scale)
}

export default function TextSizeToggle() {
  const [active, setActive] = useState('normal')

  // Sync from whatever the index.html bootstrap (or a prior session)
  // already set, so the highlighted button matches the live zoom.
  useEffect(() => {
    let saved = 'normal'
    try {
      saved = localStorage.getItem(STORAGE_KEY) || 'normal'
    } catch (_) {
      /* localStorage unavailable — fall back to normal */
    }
    const match = LEVELS.find((l) => l.id === saved) || LEVELS[0]
    setActive(match.id)
    applyScale(match.scale)
  }, [])

  const choose = (level) => {
    setActive(level.id)
    applyScale(level.scale)
    try {
      localStorage.setItem(STORAGE_KEY, level.id)
    } catch (_) {
      /* ignore — preference just won't persist */
    }
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <span className="font-mono text-[10px] text-gray-400 tracking-[0.1em]">
        tekststørrelse
      </span>
      <div className="flex items-center gap-1" role="group" aria-label="Tekststørrelse">
        {LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => choose(level)}
            aria-pressed={active === level.id}
            aria-label={`${level.label} tekststørrelse`}
            className={`quiz-option leading-none px-2 py-1 rounded border-[0.5px] transition-colors ${level.a} ${
              active === level.id
                ? 'bg-da-navy text-da-bg border-da-navy'
                : 'bg-white text-da-navy border-da-navy/30 hover:border-da-navy/60'
            }`}
          >
            A
          </button>
        ))}
      </div>
    </div>
  )
}
