/**
 * Publish a curated recipe batch to Supabase
 *
 * Usage:
 *   node scripts/curated-imports/publish-batch.mjs batch-001-quick-weeknight-meals.json
 *   node scripts/curated-imports/publish-batch.mjs batch-001-quick-weeknight-meals.json --dry-run
 *
 * Requires: SUPABASE_SERVICE_KEY env var (or falls back to anon key)
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zacwsrcdvpglrcvirlng.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphY3dzcmNkdnBnbHJjdmlybG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NzYwNTMsImV4cCI6MjA4NzQ1MjA1M30.ShCsMBs1mvIK-_3r3GhOTkStmUAUagGQvil5q763D9c'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const args = process.argv.slice(2)
const batchFile = args.find(a => !a.startsWith('--'))
const dryRun = args.includes('--dry-run')

if (!batchFile) {
  console.error('Usage: node publish-batch.mjs <batch-file.json> [--dry-run]')
  process.exit(1)
}

async function main() {
  const batchPath = new URL(batchFile, import.meta.url).pathname
  const batch = JSON.parse(readFileSync(batchPath, 'utf-8'))

  console.log(`\n${'='.repeat(60)}`)
  console.log(`RecDex Curated Import: ${batch.genre}`)
  console.log(`${'='.repeat(60)}`)
  console.log(`Batch: ${batch.batch}`)
  console.log(`Recipes: ${batch.recipes.length}`)
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`${'='.repeat(60)}\n`)

  let published = 0, skipped = 0, errors = 0

  for (const recipe of batch.recipes) {
    console.log(`→ "${recipe.title}" (${recipe.slug})`)

    // Check for existing recipe with same slug
    const { data: existing } = await supabase
      .from('recipes')
      .select('slug')
      .eq('slug', recipe.slug)
      .maybeSingle()

    if (existing) {
      console.log(`  SKIPPED: slug already exists\n`)
      skipped++
      continue
    }

    const record = {
      slug: recipe.slug,
      title: recipe.title,
      description: recipe.description,
      cuisine: recipe.cuisine,
      difficulty: recipe.difficulty,
      time_total: recipe.time_total,
      time_active: recipe.time_active,
      time_passive: recipe.time_passive,
      time_passive_label: recipe.time_passive_label,
      servings: recipe.servings,
      servings_label: recipe.servings_label,
      tags: recipe.tags,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      source_url: recipe.source_url,
      source_attribution: recipe.source_attribution,
      creator_name: recipe.creator_name,
      status: 'published',
    }

    if (dryRun) {
      console.log(`  [dry-run] Would publish: ${recipe.slug}`)
      console.log(`  Ingredients: ${recipe.ingredients.length}, Steps: ${recipe.steps.length}\n`)
      published++
      continue
    }

    const { error } = await supabase
      .from('recipes')
      .upsert(record, { onConflict: 'slug' })

    if (error) {
      console.log(`  ERROR: ${error.message}\n`)
      errors++
    } else {
      console.log(`  PUBLISHED: /recipe/${recipe.slug}\n`)
      published++
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log(`IMPORT COMPLETE`)
  console.log(`Published: ${published}`)
  console.log(`Skipped:   ${skipped}`)
  console.log(`Errors:    ${errors}`)
  console.log(`${'='.repeat(60)}\n`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
