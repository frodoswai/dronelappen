#!/usr/bin/env node
/**
 * DroneLappen Database Seed Script
 * 
 * Usage: node supabase/seed.js
 * 
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_KEY env vars
 * Or reads from ../Projects/MacMiniHub/.config/supabase.env
 * 
 * Reads question files from ~/Projects/MacMiniHub/dronelappen-*.md
 * Parses JSON arrays, resolves category slugs, inserts into Supabase.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join, resolve } from 'path'

// Config
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wenjugvnxjmvbvlgnnhh.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY or SUPABASE_SECRET_KEY env var')
  console.error('Set it or run: export SUPABASE_SECRET_KEY=sb_secret_...')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Parse JSON question arrays from markdown files
function parseQuestionsFromMd(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
  if (!jsonMatch) return []
  return JSON.parse(jsonMatch[1])
}

// Parse category SQL from markdown files
function parseCategorySql(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const sqlMatch = content.match(/```sql\n([\s\S]*?)\n```/)
  return sqlMatch ? sqlMatch[1] : null
}

async function seed() {
  console.log('🚀 Seeding DroneLappen database...')

  // Find question files
  const macMiniHub = resolve(import.meta.dirname, '../../MacMiniHub')
  const files = readdirSync(macMiniHub)
    .filter(f => f.startsWith('dronelappen-') && f.endsWith('.md'))
    .map(f => join(macMiniHub, f))

  if (files.length === 0) {
    console.error('No question files found in', macMiniHub)
    process.exit(1)
  }
  console.log(`Found ${files.length} question files`)

  // Get existing categories for slug->id mapping
  const { data: categories } = await supabase.from('categories').select('id, slug')
  const slugToId = Object.fromEntries(categories.map(c => [c.slug, c.id]))
  console.log(`Loaded ${categories.length} categories`)

  // Parse and insert questions from each file
  let totalInserted = 0
  for (const file of files) {
    const questions = parseQuestionsFromMd(file)
    if (questions.length === 0) continue

    const rows = questions.map(q => ({
      category_id: slugToId[q.category_slug] || null,
      question_text: q.question_text,
      options: q.options,
      correct_option_id: q.correct_option_id,
      explanation: q.explanation,
      difficulty: q.difficulty,
      exam_type: q.exam_type,
      source: q.source
    }))

    const { data, error } = await supabase.from('questions').insert(rows)
    if (error) {
      console.error(`Error inserting from ${file}:`, error.message)
    } else {
      console.log(`Inserted ${rows.length} questions from ${file}`)
      totalInserted += rows.length
    }
  }

  console.log(`\nDone! Total questions inserted: ${totalInserted}`)
}

seed().catch(console.error)
