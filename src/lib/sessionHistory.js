// Lightweight localStorage session log.
//
// Shape: an array of entries, appended on session start.
//   [{ examType: 'A2', mode: 'rapid', startedAt: 1744200000000, ... }]
//
// Round 1 only writes { examType, mode, startedAt }, but the array shape is
// forward-compatible with Round 2 ("memory of last session score") and
// Round 3 ("session history") — we can add score, total, durationMs fields
// to new entries without any migration.
//
// All reads/writes are wrapped in try/catch so a corrupted payload or
// disabled storage never crashes the app.

const KEY = 'dronelappen_sessions'
const MAX_ENTRIES = 50
const STALE_MS = 14 * 24 * 60 * 60 * 1000 // 14 days

function safeRead() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (_) {
    return []
  }
}

function safeWrite(list) {
  if (typeof window === 'undefined') return
  try {
    const trimmed = list.slice(-MAX_ENTRIES)
    window.localStorage.setItem(KEY, JSON.stringify(trimmed))
  } catch (_) { /* storage full or disabled — ignore */ }
}

/**
 * Record that the user just started a session. Called from ExamSelect when
 * the user commits to a mode (the tap that actually launches the quiz).
 *
 * @param {'A1_A3'|'A2'} examType
 * @param {'exam'|'practice'|'rapid'} mode
 */
export function recordSessionStart(examType, mode) {
  const list = safeRead()
  list.push({ examType, mode, startedAt: Date.now() })
  safeWrite(list)
}

/**
 * Get the most recent session entry, or null if none exists or the last
 * entry is older than `maxAgeMs` (default 14 days — stale resume).
 */
export function getLastSession({ maxAgeMs = STALE_MS } = {}) {
  const list = safeRead()
  if (list.length === 0) return null
  const last = list[list.length - 1]
  if (!last || typeof last.startedAt !== 'number') return null
  if (Date.now() - last.startedAt > maxAgeMs) return null
  return last
}

/**
 * Human-readable label for a session — e.g. "A2 Rapid", "A1/A3 Eksamen".
 */
export function describeSession(session) {
  if (!session) return ''
  const examLabel = session.examType === 'A1_A3' ? 'A1/A3' : 'A2'
  const modeLabel =
    session.mode === 'rapid'
      ? 'Rapid'
      : session.mode === 'practice'
      ? 'Øv fritt'
      : 'Eksamen'
  return `${examLabel} ${modeLabel}`
}

/**
 * Short, mono-friendly relative time label for the right-hand side of
 * the smart resume button. Round 2 doesn't yet persist per-session
 * scores or durations, so until those land the "stats" we can honestly
 * show is how long ago the user was last in the app.
 *
 * Round 3 will swap this for the real `"5:43 · 27/30"` format described
 * in the Round 2 brief, once Quiz/Rapid/Practice start writing score
 * and duration back into the session log on finish.
 */
export function sessionDisplayStats(session) {
  if (!session || typeof session.startedAt !== 'number') return ''
  const diffMs = Date.now() - session.startedAt
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'nå nettopp'
  if (minutes < 60) return `${minutes} min siden`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} t siden`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'i går'
  if (days < 7) return `${days} dager siden`
  const weeks = Math.floor(days / 7)
  return `${weeks} uke${weeks > 1 ? 'r' : ''} siden`
}

/**
 * Build the in-app route for a session entry so a smart-resume tap can
 * navigate straight to the right screen.
 */
export function sessionToPath(session) {
  if (!session) return '/'
  const base =
    session.mode === 'rapid'
      ? '/rapid'
      : session.mode === 'practice'
      ? '/practice'
      : '/quiz'
  return `${base}/${session.examType}`
}
