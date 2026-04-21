// Backfill the `summary` column on existing recipes.
// Generates a short cooking-arc paragraph via Claude for every recipe that
// doesn't yet have one. Run after applying supabase/add-summary-column.sql.
//
// Usage:
//   npx tsx scripts/backfill-summaries.ts [--limit=N] [--dry-run]

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local manually — same pattern other scripts use, no dotenv dep
const envPath = resolve(__dirname, '..', '.env.local')
try {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim()
  }
} catch (e) { console.error(`Failed to load ${envPath}:`, e); process.exit(1) }

const SUPABASE_URL = 'https://zacwsrcdvpglrcvirlng.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

if (!SERVICE_KEY) { console.error('SUPABASE_SERVICE_KEY missing in .env.local'); process.exit(1) }
if (!ANTHROPIC_API_KEY) { console.error('ANTHROPIC_API_KEY missing in .env.local'); process.exit(1) }

const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')
const limitArg = [...args].find(a => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined

type RecipeRow = {
  slug: string
  title: string
  description: string | null
  cuisine: string | null
  steps: { step: number; text: string; timer_minutes: number | null }[] | null
  ingredients: unknown
}

async function summarize(recipe: RecipeRow): Promise<string | null> {
  const stepsText = (recipe.steps || [])
    .map((s, i) => `${i + 1}. ${s.text}`)
    .join('\n')
  if (!stepsText) return null

  const prompt = `Write a SKELETAL cooking arc for this recipe — 3-5 short comma-separated phrases that capture the PHASES of cooking, not the specific steps. Under 20 words total.

Rules:
- Collapse related actions into one phase: "season and sear chicken" not "pat dry, salt, sear in a hot pan until golden"
- Use broad ingredient labels: "aromatics" not "garlic, shallots, ginger"; "the meat" not "bone-in chicken thighs"
- No measurements, no temperatures, no specific times, no technique explanations
- Think: how you'd sketch this recipe for a friend on a napkin

Good examples:
- "Season and sear chicken, add lemon and dates, braise until tender."
- "Bloom aromatics, simmer tomatoes and sauce, add beans, finish with poached eggs."
- "Toast spices, build curry base, simmer meat, garnish with fresh herbs."
- "Whip cream and sugar, fold in yolks, freeze overnight."

Recipe: ${recipe.title}${recipe.cuisine ? ` (${recipe.cuisine})` : ''}
${recipe.description ? `Description: ${recipe.description}\n` : ''}
Steps:
${stepsText}

Return ONLY the summary — no quotes, no preamble, no markdown.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    console.error(`  [claude] ${res.status}: ${await res.text()}`)
    return null
  }
  const data = await res.json()
  const text: string = data.content?.[0]?.text || ''
  return text.trim().replace(/^["']|["']$/g, '') || null
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY!)

  let query = supabase
    .from('recipes')
    .select('slug, title, description, cuisine, steps, ingredients')
    .eq('status', 'published')
    .is('summary', null)
    .order('created_at', { ascending: false })
  if (limit) query = query.limit(limit)

  const { data: recipes, error } = await query
  if (error) { console.error('Fetch error:', error); process.exit(1) }
  if (!recipes || recipes.length === 0) { console.log('All recipes already have summaries.'); return }

  console.log(`Backfilling ${recipes.length} recipes${dryRun ? ' (dry run)' : ''}...`)
  let ok = 0, fail = 0
  for (let i = 0; i < recipes.length; i++) {
    const r = recipes[i] as RecipeRow
    process.stdout.write(`[${i + 1}/${recipes.length}] ${r.title.slice(0, 50).padEnd(52)} `)
    try {
      const summary = await summarize(r)
      if (!summary) { console.log('(no steps — skipping)'); continue }
      if (dryRun) {
        console.log(`\n  → ${summary}\n`)
      } else {
        const { error: updateErr } = await supabase
          .from('recipes')
          .update({ summary })
          .eq('slug', r.slug)
        if (updateErr) { console.log(`✗ ${updateErr.message}`); fail++; continue }
        console.log('✓')
      }
      ok++
    } catch (e) {
      console.log(`✗ ${(e as Error).message}`)
      fail++
    }
  }
  console.log(`\nDone. ${ok} ok, ${fail} failed.`)
}

main().catch(e => { console.error(e); process.exit(1) })
