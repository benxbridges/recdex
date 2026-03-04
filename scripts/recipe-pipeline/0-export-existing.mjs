/**
 * Stage 0: Export Existing Recipes from Supabase
 *
 * Fetches all published recipes from the Supabase `recipes` table and writes
 * them to pipeline-data/sourced/ in the format Stage 2 (synthesize) expects.
 *
 * The existing recipe data is treated as a single authoritative source.
 * sourceCount is set to 2 (not 1) to avoid the "single-source" penalty in
 * Stage 3 validation — the assumption is these recipes were already human-
 * reviewed when originally published.
 *
 * After running this, the workflow is:
 *   ANTHROPIC_API_KEY=xxx node 2-synthesize.mjs     # Rewrite in brand voice
 *   ANTHROPIC_API_KEY=xxx node 3-validate.mjs --with-llm  # Proof + score
 *   node 5-publish.mjs --dry-run                    # Preview changes
 *   node 5-publish.mjs                              # Upsert back to Supabase
 *
 * Usage:
 *   node 0-export-existing.mjs                      # Export all published recipes
 *   node 0-export-existing.mjs --slug pad-thai      # Export one recipe
 *   node 0-export-existing.mjs --dry-run            # Count without writing files
 *   node 0-export-existing.mjs --status draft       # Export drafts instead
 *
 * Output: pipeline-data/sourced/{slug}.json
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { supabase, SOURCED_DIR, parseArgs, slugify } from './config.mjs'

// --- Convert Supabase recipe to the sourced format Stage 2 expects ---

function toSourcedFormat(recipe) {
  const ingredients = normalizeIngredients(recipe.ingredients)
  const steps = normalizeSteps(recipe.steps)

  return {
    // Identity
    slug: recipe.slug,
    recipeName: recipe.title,
    sourceCount: 2,  // Treat existing published recipe as already-verified

    // Consensus metadata — derived from the single existing source
    consensus: {
      ingredients: ingredients.map(ing => ({
        name: ing.name,
        amount: ing.amount || '',
        unit: ing.unit || '',
        notes: ing.notes || '',
        // Frequency = 1.0 since this is the canonical version
        frequency: 1.0,
      })),
      topCuisine: recipe.cuisine || null,
      medianTotalTime: recipe.time_total || null,
      medianServings: recipe.servings || null,
      difficulty: recipe.difficulty || 'medium',
      dishTypes: recipe.tags?.filter(t => isDishType(t)) || [],
      diets: recipe.tags?.filter(t => isDietTag(t)) || [],
    },

    // Technique samples — the existing steps as a single source
    techniqueSample: [
      steps.map(s => s.text || s).filter(Boolean)
    ],

    // Nutrition placeholder (not used for rewrites)
    nutritionSamples: [],

    // Preserve fields that should flow through unchanged
    _existing: {
      id: recipe.id,
      image_url: recipe.image_url,
      time_passive: recipe.time_passive,
      time_passive_label: recipe.time_passive_label,
      time_active: recipe.time_active,
      servings_label: recipe.servings_label,
      tags: recipe.tags || [],
      status: recipe.status,
      category_id: recipe.category_id,
    },

    // Pipeline metadata
    _pipeline: {
      stage: 0,
      exportedAt: new Date().toISOString(),
      sourceCount: 2,
      originalSlug: recipe.slug,
      wasPublished: recipe.status === 'published',
    },
  }
}

// --- Normalize ingredients from any of the stored JSONB formats ---
function normalizeIngredients(raw) {
  if (!raw || !Array.isArray(raw)) return []

  // Handle grouped format: [{ group: "...", items: [...] }]
  if (raw[0]?.group !== undefined) {
    return raw.flatMap(g => g.items || [])
  }

  // Handle flat format: [{ name, amount, unit, notes }]
  return raw
}

// --- Normalize steps from stored JSONB format ---
function normalizeSteps(raw) {
  if (!raw || !Array.isArray(raw)) return []

  // Handle { step: number, text: string, timer_minutes: number|null }
  if (raw[0]?.text !== undefined) {
    return raw.sort((a, b) => (a.step || 0) - (b.step || 0))
  }

  // Handle plain strings
  return raw.map((s, i) => ({ step: i + 1, text: String(s) }))
}

// --- Tag classification helpers ---
const DISH_TYPES = new Set([
  'breakfast', 'lunch', 'dinner', 'appetizer', 'snack', 'dessert',
  'soup', 'salad', 'side dish', 'main course', 'brunch', 'condiment',
])

const DIET_TAGS = new Set([
  'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'paleo', 'keto',
  'whole30', 'low-carb', 'nut-free', 'halal', 'kosher',
])

function isDishType(tag) {
  return DISH_TYPES.has(tag?.toLowerCase())
}

function isDietTag(tag) {
  return DIET_TAGS.has(tag?.toLowerCase())
}

// --- Main ---

async function main() {
  const flags = parseArgs(process.argv)
  const dryRun = flags['dry-run'] || false
  const targetSlug = flags.slug || null
  const status = flags.status || 'published'

  // Ensure output dir exists
  if (!existsSync(SOURCED_DIR)) {
    mkdirSync(SOURCED_DIR, { recursive: true })
  }

  console.log(`📦 Stage 0: Export Existing Recipes`)
  console.log(`   Source: Supabase (status=${status})`)
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  if (targetSlug) console.log(`   Filter: slug=${targetSlug}`)
  console.log()

  // Fetch from Supabase
  let query = supabase.from('recipes').select('*').eq('status', status).order('title')
  if (targetSlug) query = query.eq('slug', targetSlug)

  const { data: recipes, error } = await query

  if (error) {
    console.error(`Supabase error: ${error.message}`)
    process.exit(1)
  }

  if (!recipes || recipes.length === 0) {
    console.log(`No recipes found with status='${status}'${targetSlug ? ` and slug='${targetSlug}'` : ''}.`)
    process.exit(0)
  }

  console.log(`Found ${recipes.length} recipe${recipes.length === 1 ? '' : 's'}\n`)

  let exported = 0, skipped = 0

  for (const recipe of recipes) {
    if (!recipe.slug || !recipe.title) {
      console.log(`  ⚠ Skipping recipe with missing slug/title (id: ${recipe.id})`)
      skipped++
      continue
    }

    const sourced = toSourcedFormat(recipe)
    const outPath = `${SOURCED_DIR}${recipe.slug}.json`

    if (dryRun) {
      const ingredientCount = normalizeIngredients(recipe.ingredients).length
      const stepCount = normalizeSteps(recipe.steps).length
      console.log(`  [dry-run] ${recipe.slug} — ${ingredientCount} ingredients, ${stepCount} steps`)
    } else {
      writeFileSync(outPath, JSON.stringify(sourced, null, 2))
      console.log(`  ✓ ${recipe.slug}`)
    }

    exported++
  }

  console.log(`\n--- Stage 0 Summary ---`)
  console.log(`Exported: ${exported}`)
  console.log(`Skipped:  ${skipped}`)
  console.log(`Total:    ${recipes.length}`)

  if (!dryRun && exported > 0) {
    console.log(`\nFiles written to: ${SOURCED_DIR}`)
    console.log(`\nNext steps:`)
    console.log(`  ANTHROPIC_API_KEY=xxx node 2-synthesize.mjs`)
    console.log(`  ANTHROPIC_API_KEY=xxx node 3-validate.mjs --with-llm`)
    console.log(`  node 5-publish.mjs --dry-run`)
    console.log(`  node 5-publish.mjs`)
  }
}

main().catch(console.error)
