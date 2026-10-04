#!/usr/bin/env node
/**
 * Laster STS-banken (A2_STS, «Utvidelse av A2 til STS») inn i Supabase.
 *
 *   node supabase/seed-sts.mjs            # dry-run (standard): validerer og viser hva som ville skjedd
 *   node supabase/seed-sts.mjs --apply    # skriver kategorier og spørsmål (upsert)
 *
 * Kilde: content/sts/sts-batch-*-a2-til-sts.json (kanonisk, gjennomlest i tre runder 30.09.2026).
 * Nøkkel: SUPABASE_SECRET_KEY fra miljøet, ellers ~/Projects/MacMiniHub/.config/supabase.env.
 *
 * Spørsmåls-ID-ene er deterministiske (UUID v5 av «dronelappen-sts-<n>»), så en ny
 * kjøring med --apply oppdaterer de samme radene i stedet for å lage dubletter.
 * Rettelser i JSON synkes altså ved å kjøre --apply på nytt. Spørsmål som er fjernet
 * fra JSON (som n 43) slettes IKKE automatisk; skriptet sier fra om dem.
 *
 * NB: Innlasting endrer tellingen med en gang (get_question_count på forsiden og
 * dronelappen-antall.py neste morgen). Kjør derfor --apply først på lanseringsdagen,
 * etter lanseringsplanen i MacMiniHub/notes/briefs/2026-09-30-dronelappen-sts-banken.md.
 * STS har ingen gratis-pool (free_pool = false på alle, Frode 30.09.2026).
 */
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const FILES = ['sts-batch-1-a2-til-sts.json', 'sts-batch-2-a2-til-sts.json', 'sts-batch-3-a2-til-sts.json'].map((f) => join(ROOT, 'content', 'sts', f))
const EXAM = 'A2_STS'
const APPLY = process.argv.includes('--apply')

// UUID v5 (RFC 4122) uten ekstra avhengigheter. Namespace er et fast, tilfeldig valgt UUID.
const NS = '6f1c2a8e-3b7d-4c55-9a0e-5d2b7f4e9c13'
function uuidv5(name, ns = NS) {
  const nsBytes = Buffer.from(ns.replace(/-/g, ''), 'hex')
  const h = createHash('sha1').update(Buffer.concat([nsBytes, Buffer.from(name, 'utf8')])).digest()
  h[6] = (h[6] & 0x0f) | 0x50
  h[8] = (h[8] & 0x3f) | 0x80
  const x = h.subarray(0, 16).toString('hex')
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20, 32)}`
}

function env() {
  const e = { SUPABASE_URL: process.env.SUPABASE_URL, SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY }
  const f = join(homedir(), 'Projects', 'MacMiniHub', '.config', 'supabase.env')
  if ((!e.SUPABASE_URL || !e.SUPABASE_SECRET_KEY) && existsSync(f)) {
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#') || !t.includes('=')) continue
      const [k, ...rest] = t.split('=')
      const v = rest.join('=').trim().replace(/^['"]|['"]$/g, '')
      if (k === 'SUPABASE_URL' && !e.SUPABASE_URL) e.SUPABASE_URL = v
      if (k === 'SUPABASE_SECRET_KEY' && !e.SUPABASE_SECRET_KEY) e.SUPABASE_SECRET_KEY = v
    }
  }
  if (!e.SUPABASE_URL || !e.SUPABASE_SECRET_KEY) {
    console.error('FEIL: mangler SUPABASE_URL / SUPABASE_SECRET_KEY (miljø eller MacMiniHub/.config/supabase.env).')
    process.exit(2)
  }
  return e
}

// ---------- 1. Les og valider JSON ----------
const cats = new Map()
const questions = []
const errors = []
for (const f of FILES) {
  const d = JSON.parse(readFileSync(f, 'utf8'))
  for (const c of d.categories) {
    const prev = cats.get(c.slug)
    if (prev && prev !== c.name) errors.push(`kategori ${c.slug} har to navn: «${prev}» / «${c.name}»`)
    cats.set(c.slug, c.name)
  }
  for (const q of d.questions) questions.push(q)
}
const seen = new Set()
for (const q of questions) {
  const id = `n ${q.n}`
  if (seen.has(q.n)) errors.push(`${id}: duplikat n`)
  seen.add(q.n)
  if (!cats.has(q.category)) errors.push(`${id}: ukjent kategori ${q.category}`)
  const ids = (q.options || []).map((o) => o.id).join('')
  if (ids !== 'abcd') errors.push(`${id}: alternativer er ${ids}, ikke abcd`)
  if (!['a', 'b', 'c', 'd'].includes(q.correct_option_id)) errors.push(`${id}: ugyldig fasit ${q.correct_option_id}`)
  if (![1, 2, 3].includes(q.difficulty)) errors.push(`${id}: ugyldig vanskegrad ${q.difficulty}`)
  if (q.overlap_group && !/^[a-z0-9-]{1,60}$/.test(q.overlap_group)) errors.push(`${id}: ugyldig overlap_group`)
  const tekst = [q.question_text, q.explanation, q.source, ...(q.options || []).map((o) => o.text)].join(' ')
  if (/[–—→≤≥]/.test(tekst)) errors.push(`${id}: tankestrek eller symbol i publisert tekst`)
  if (!q.question_text?.trim() || !q.explanation?.trim()) errors.push(`${id}: tom stamme eller forklaring`)
}
const groups = {}
for (const q of questions) if (q.overlap_group) (groups[q.overlap_group] ??= []).push(q.n)
for (const [g, ns] of Object.entries(groups)) if (ns.length < 2) errors.push(`overlap_group ${g} har bare ett spørsmål (${ns})`)

console.log(`Lest: ${questions.length} spørsmål, ${cats.size} kategorier, ${Object.keys(groups).length} overlap-grupper.`)
if (errors.length) {
  console.error(`FEIL i innholdet (${errors.length}):\n  ` + errors.join('\n  '))
  process.exit(2)
}

// ---------- 2. Sammenlign med databasen ----------
const e = env()
const sb = createClient(e.SUPABASE_URL, e.SUPABASE_SECRET_KEY, { auth: { persistSession: false } })

const { data: dbCats, error: catErr } = await sb.from('categories').select('id, slug, name, exam_type').in('slug', [...cats.keys()])
if (catErr) { console.error('FEIL: nådde ikke Supabase (categories):', catErr.message); process.exit(2) }
const wrongExam = dbCats.filter((c) => c.exam_type !== EXAM)
if (wrongExam.length) {
  console.error('FEIL: slug finnes allerede med annen eksamenstype:', wrongExam.map((c) => `${c.slug}=${c.exam_type}`).join(', '))
  process.exit(2)
}
const { data: dbQs, error: qErr } = await sb.from('questions').select('id').eq('exam_type', EXAM)
if (qErr) { console.error('FEIL: nådde ikke Supabase (questions):', qErr.message); process.exit(2) }

const wanted = new Map(questions.map((q) => [uuidv5(`dronelappen-sts-${q.n}`), q]))
const dbIds = new Set(dbQs.map((r) => r.id))
const fremmede = [...dbIds].filter((id) => !wanted.has(id))
const nye = [...wanted.keys()].filter((id) => !dbIds.has(id))
const oppdateres = [...wanted.keys()].filter((id) => dbIds.has(id))

console.log(`Database: ${dbCats.length}/${cats.size} STS-kategorier finnes, ${dbIds.size} A2_STS-spørsmål finnes.`)
console.log(`Plan: ${cats.size - dbCats.length} nye kategorier, ${nye.length} nye spørsmål, ${oppdateres.length} oppdateres.`)
if (fremmede.length) {
  console.log(`OBS: ${fremmede.length} A2_STS-spørsmål i databasen finnes ikke i JSON (fjernet eller lagt inn på annen måte). De røres ikke:\n  ${fremmede.join('\n  ')}`)
}

if (!APPLY) {
  console.log('Dry-run: ingenting skrevet. Kjør med --apply for å laste inn.')
  process.exit(0)
}

// ---------- 3. Skriv ----------
const { error: upCatErr } = await sb.from('categories').upsert(
  [...cats].map(([slug, name]) => ({ slug, name, exam_type: EXAM })),
  { onConflict: 'slug' }
)
if (upCatErr) { console.error('FEIL ved kategorier:', upCatErr.message); process.exit(2) }
const { data: allCats, error: reCatErr } = await sb.from('categories').select('id, slug').eq('exam_type', EXAM)
if (reCatErr) { console.error('FEIL ved kategorier (les):', reCatErr.message); process.exit(2) }
const catId = Object.fromEntries(allCats.map((c) => [c.slug, c.id]))

const rows = [...wanted].map(([id, q]) => ({
  id,
  category_id: catId[q.category],
  question_text: q.question_text,
  options: q.options.map((o) => ({ id: o.id, text: o.text })),
  correct_option_id: q.correct_option_id,
  explanation: q.explanation,
  difficulty: q.difficulty,
  exam_type: EXAM,
  source: q.source,
  free_pool: false,
  overlap_group: q.overlap_group ?? null,
}))
if (rows.some((r) => !r.category_id)) { console.error('FEIL: mangler kategori-ID etter upsert.'); process.exit(2) }
const { error: upQErr } = await sb.from('questions').upsert(rows, { onConflict: 'id' })
if (upQErr) { console.error('FEIL ved spørsmål:', upQErr.message); process.exit(2) }

const { count, error: cntErr } = await sb.from('questions').select('id', { count: 'exact', head: true }).eq('exam_type', EXAM)
if (cntErr) { console.error('FEIL ved kontrolltelling:', cntErr.message); process.exit(2) }
console.log(`Ferdig: ${count} A2_STS-spørsmål i databasen (forventet ${wanted.size + fremmede.length}).`)
if (count !== wanted.size + fremmede.length) process.exit(2)
