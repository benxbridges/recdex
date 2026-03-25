/**
 * Data quality checker for RecDex recipes
 *
 * Usage:
 *   npx tsx scripts/check-data-quality.ts
 *
 * Requires: SUPABASE_SERVICE_KEY in ../.env.local (or .env.local at repo root)
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// ── Load env ──────────────────────────────────────────────────────────────────

function loadEnv() {
  const candidates = [
    path.resolve(__dirname, '../.env.local'),
    path.resolve(__dirname, '../../.env.local'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eq = trimmed.indexOf('=')
        if (eq === -1) continue
        const key = trimmed.slice(0, eq)
        const val = trimmed.slice(eq + 1)
        if (!process.env[key]) process.env[key] = val
      }
      return
    }
  }
}

loadEnv()

const SUPABASE_URL = 'https://zacwsrcdvpglrcvirlng.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_KEY not found. Check .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Helpers ───────────────────────────────────────────────────────────────────

function hr(title: string) {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  ${title}`)
  console.log('═'.repeat(60))
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Fetch all recipes
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, slug, title, description, cuisine, time_total, image_url, ingredients, steps, status, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch recipes:', error.message)
    process.exit(1)
  }

  if (!recipes || recipes.length === 0) {
    console.log('No recipes found.')
    return
  }

  console.log(`\nFetched ${recipes.length} recipes. Running checks...\n`)

  // ── 1. Duplicate titles ───────────────────────────────────────────────────

  hr('1. DUPLICATE TITLES (case-insensitive)')

  const titleGroups = new Map<string, typeof recipes>()
  for (const r of recipes) {
    const normalized = (r.title || '').toLowerCase().trim()
    if (!normalized) continue
    const group = titleGroups.get(normalized) || []
    group.push(r)
    titleGroups.set(normalized, group)
  }

  const dupes = [...titleGroups.entries()].filter(([, group]) => group.length > 1)
  if (dupes.length === 0) {
    console.log('  No exact duplicates found.')
  } else {
    console.log(`  Found ${dupes.length} duplicate group(s):\n`)
    for (const [title, group] of dupes) {
      console.log(`  "${title}" (${group.length} copies):`)
      for (const r of group) {
        console.log(`    - slug: ${r.slug}  |  created: ${r.created_at?.slice(0, 10)}`)
      }
    }
  }

  // Also check near-duplicates: strip common suffixes/prefixes and punctuation
  const fuzzyGroups = new Map<string, typeof recipes>()
  for (const r of recipes) {
    const fuzzy = (r.title || '')
      .toLowerCase()
      .replace(/[''"""]/g, '')
      .replace(/\b(recipe|the|a|an)\b/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim()
    if (!fuzzy) continue
    const group = fuzzyGroups.get(fuzzy) || []
    group.push(r)
    fuzzyGroups.set(fuzzy, group)
  }

  const nearDupes = [...fuzzyGroups.entries()]
    .filter(([, group]) => group.length > 1)
    .filter(([key]) => {
      // Exclude exact dupes already reported
      const titles = fuzzyGroups.get(key)!.map(r => (r.title || '').toLowerCase().trim())
      return new Set(titles).size > 1
    })

  if (nearDupes.length > 0) {
    console.log(`\n  Near-duplicates (${nearDupes.length} group(s)):\n`)
    for (const [, group] of nearDupes) {
      console.log(`  Possible dupes:`)
      for (const r of group) {
        console.log(`    - "${r.title}"  (slug: ${r.slug})`)
      }
    }
  }

  // ── 2. Missing images ────────────────────────────────────────────────────

  hr('2. MISSING IMAGES')

  const noImage = recipes.filter(r => !r.image_url || r.image_url.trim() === '')
  console.log(`  ${noImage.length} / ${recipes.length} recipes have no image (${pct(noImage.length, recipes.length)})`)
  if (noImage.length > 0 && noImage.length <= 30) {
    for (const r of noImage) {
      console.log(`    - "${r.title}" (${r.slug})`)
    }
  } else if (noImage.length > 30) {
    console.log(`  (showing first 30)`)
    for (const r of noImage.slice(0, 30)) {
      console.log(`    - "${r.title}" (${r.slug})`)
    }
  }

  // ── 3. Bad titles ────────────────────────────────────────────────────────

  hr('3. BAD TITLES (contain publication names)')

  const badPatterns = [
    /\bBA['']?s\b/i,
    /\bBon App[ée]tit['']?s?\b/i,
    /\bNYT\b/i,
    /\bNew York Times\b/i,
    /\bSerious Eats\b/i,
    /\bFood Network\b/i,
    /\bAllrecipes\b/i,
    /\bEpiCurious\b/i,
    /\bFood52\b/i,
    /\bTasty\b/i,
    /\bDelish\b/i,
    /\bKitchn\b/i,
    /\bThe Kitchn\b/i,
    /\bJ\. Kenji\b/i,
    /\bCook['']?s Illustrated\b/i,
    /\bAmerica['']?s Test Kitchen\b/i,
  ]

  const badTitles = recipes.filter(r => {
    if (!r.title) return false
    return badPatterns.some(pat => pat.test(r.title))
  })

  if (badTitles.length === 0) {
    console.log('  No bad titles found.')
  } else {
    console.log(`  ${badTitles.length} recipe(s) with publication names in title:\n`)
    for (const r of badTitles) {
      const match = badPatterns.find(p => p.test(r.title))
      const matched = r.title.match(match!)?.[0]
      console.log(`    - "${r.title}"  [matched: "${matched}"]  (${r.slug})`)
    }
  }

  // ── 4. Missing fields ────────────────────────────────────────────────────

  hr('4. MISSING FIELDS')

  const fields = ['cuisine', 'time_total', 'description', 'ingredients'] as const
  for (const field of fields) {
    const missing = recipes.filter(r => {
      const val = r[field]
      if (val === null || val === undefined) return true
      if (typeof val === 'string' && val.trim() === '') return true
      if (Array.isArray(val) && val.length === 0) return true
      return false
    })
    console.log(`  ${field}: ${missing.length} missing (${pct(missing.length, recipes.length)})`)
    if (missing.length > 0 && missing.length <= 10) {
      for (const r of missing) {
        console.log(`    - "${r.title}" (${r.slug})`)
      }
    } else if (missing.length > 10) {
      console.log(`    (first 10:)`)
      for (const r of missing.slice(0, 10)) {
        console.log(`    - "${r.title}" (${r.slug})`)
      }
    }
  }

  // ── 5. Summary stats ────────────────────────────────────────────────────

  hr('5. SUMMARY STATS')

  console.log(`  Total recipes: ${recipes.length}`)
  console.log(`  With images: ${recipes.length - noImage.length} (${pct(recipes.length - noImage.length, recipes.length)})`)
  console.log(`  Without images: ${noImage.length} (${pct(noImage.length, recipes.length)})`)

  // Cuisine breakdown
  const cuisineCounts = new Map<string, number>()
  for (const r of recipes) {
    const c = r.cuisine || '(none)'
    cuisineCounts.set(c, (cuisineCounts.get(c) || 0) + 1)
  }
  const sortedCuisines = [...cuisineCounts.entries()].sort((a, b) => b[1] - a[1])

  console.log(`\n  Recipes per cuisine:`)
  for (const [cuisine, count] of sortedCuisines) {
    console.log(`    ${cuisine.padEnd(25)} ${count}`)
  }

  // Steps/ingredients completeness
  const noSteps = recipes.filter(r => !r.steps || (Array.isArray(r.steps) && r.steps.length === 0))
  const noIngredients = recipes.filter(r => !r.ingredients || (Array.isArray(r.ingredients) && r.ingredients.length === 0))
  console.log(`\n  Recipes missing steps: ${noSteps.length}`)
  console.log(`  Recipes missing ingredients: ${noIngredients.length}`)

  console.log('\n' + '═'.repeat(60))
  console.log('  Done.')
  console.log('═'.repeat(60) + '\n')
}

function pct(n: number, total: number): string {
  if (total === 0) return '0%'
  return `${((n / total) * 100).toFixed(1)}%`
}

main().catch(err => {
  console.error('Unhandled error:', err)
  process.exit(1)
})
