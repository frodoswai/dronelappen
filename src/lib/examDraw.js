// Trekket av spørsmål i eksamensmodus (Quiz.jsx). Egen fil slik at logikken
// kan testes med node mot den ekte banken (04.10.2026).
//
// To regler, begge bare i eksamensmodus:
//
// 1. Spørsmål med samme overlap_group avslører hverandre (STS-banken,
//    migrasjon 018) og trekkes ikke i samme runde.
// 2. Eksamenstyper med examMaxHard i lib/exams.js får høyst så mange spørsmål
//    med vanskelighetsgrad 3 per runde. STS har 5 (Frode 04.10.2026): Eivind
//    syntes eksamensmodusen var tyngre enn prøven, og et tilfeldig trekk kunne
//    gi mange detaljspørsmål på én gang. Resten av runden fylles med grad 1
//    og 2 i stokket rekkefølge.
//
// Spørsmålene plukkes i stokket rekkefølge. Et spørsmål hoppes over når
// gruppen allerede er trukket, eller når det er grad 3 og grensen er nådd.
// Blir det for få igjen (en liten eller filtrert bank), fylles runden opp med
// de overhoppede: først de som ikke bryter grad 3-grensen, så resten, slik at
// runden alltid får `count` spørsmål når banken har nok.
//
// A1/A3 og A2 har verken grupper eller examMaxHard, så for dem er trekket det
// samme som før: de første `count` i stokket rekkefølge.
export function drawExamQuestions(shuffled, count, maxHard = Infinity) {
  const isHard = (q) => q.difficulty === 3
  const picked = []
  const skippedOverlap = []
  const skippedHard = []
  const groups = new Set()
  let hard = 0

  for (const q of shuffled) {
    if (picked.length >= count) break
    const group = q.overlap_group
    if (group && groups.has(group)) {
      skippedOverlap.push(q)
      continue
    }
    if (isHard(q) && hard >= maxHard) {
      skippedHard.push(q)
      continue
    }
    if (group) groups.add(group)
    if (isHard(q)) hard++
    picked.push(q)
  }

  for (const q of skippedOverlap) {
    if (picked.length >= count) break
    if (isHard(q) && hard >= maxHard) {
      skippedHard.push(q)
      continue
    }
    if (isHard(q)) hard++
    picked.push(q)
  }

  for (const q of skippedHard) {
    if (picked.length >= count) break
    picked.push(q)
  }

  return picked
}
