/**
 * Stage 1: Source Recipes
 *
 * Aggregates recipe data from real, verifiable sources to build a factual foundation.
 * Recipes themselves aren't copyrightable — only the specific written expression is.
 * This stage gathers the FACTS (ingredients, ratios, techniques, timings) from multiple
 * independent sources so that Stage 2 can express them in our proprietary voice.
 *
 * Sources:
 *   - Spoonacular API (aggregates 500k+ recipes from food blogs and sites)
 *   - Fallback: generates structured search metadata for manual sourcing
 *
 * Usage:
 *   SPOONACULAR_API_KEY=xxx node 1-source-recipes.mjs "chicken parmesan" "pad thai" "beef bourguignon"
 *   SPOONACULAR_API_KEY=xxx node 1-source-recipes.mjs --from-file recipes-to-source.txt
 *   node 1-source-recipes.mjs --dry-run "tikka masala"
 *
 * Output: JSON files in pipeline-data/sourced/{slug}.json
 */

import { writeFileSync, readFileSync, existsSync } from 'fs'
import {
  SPOONACULAR_API_KEY, SOURCED_DIR, sleep, slugify, parseArgs
} from './config.mjs'

const SPOONACULAR_BASE = 'https://api.spoonacular.com'
const RATE_LIMIT_MS = 1500  // Spoonacular free tier is 1 req/sec

// --- Spoonacular API helpers ---

async function searchRecipes(query, count = 5) {
  const url = `${SPOONACULAR_BASE}/recipes/complexSearch?query=${encodeURIComponent(query)}&number=${count}&addRecipeInformation=true&fillIngredients=true&apiKey=${SPOONACULAR_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) {
    console.log(`  ✗ Spoonacular search failed: ${res.status} ${res.statusText}`)
    return null
  }
  const data = await res.json()
  return data.results || []
}

async function getRecipeDetails(id) {
  const url = `${SPOONACULAR_BASE}/recipes/${id}/information?includeNutrition=true&apiKey=${SPOONACULAR_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) return null
  return res.json()
}

async function getSimilarRecipes(id, count = 3) {
  const url = `${SPOONACULAR_BASE}/recipes/${id}/similar?number=${count}&apiKey=${SPOONACULAR_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) return []
  return res.json()
}

// --- Extract structured data from a Spoonacular recipe ---

function extractIngredients(recipe) {
  if (!recipe.extendedIngredients) return []
  return recipe.extendedIngredients.map(ing => ({
    name: ing.name || ing.originalName,
    amount: String(ing.amount),
    unit: ing.unit || '',
    notes: ing.meta?.join(', ') || undefined,
    original: ing.original,  // Keep raw text for cross-referencing
  }))
}

function extractSteps(recipe) {
  if (!recipe.analyzedInstructions?.length) return []
  const instructions = recipe.analyzedInstructions[0]
  if (!instructions.steps) return []
  return instructions.steps.map(s => ({
    step: s.number,
    text: s.step,
    ingredients_mentioned: s.ingredients?.map(i => i.name) || [],
    equipment_mentioned: s.equipment?.map(e => e.name) || [],
  }))
}

function extractNutrition(recipe) {
  if (!recipe.nutrition?.nutrients) return null
  const nutrients = recipe.nutrition.nutrients
  const find = (name) => nutrients.find(n => n.name === name)
  return {
    calories: find('Calories')?.amount || null,
    protein_g: find('Protein')?.amount || null,
    fat_g: find('Fat')?.amount || null,
    carbs_g: find('Carbohydrates')?.amount || null,
    fiber_g: find('Fiber')?.amount || null,
    sodium_mg: find('Sodium')?.amount || null,
  }
}

function extractMetadata(recipe) {
  return {
    sourceId: recipe.id,
    sourceName: recipe.sourceName || 'Unknown',
    sourceUrl: recipe.sourceUrl || null,
    servings: recipe.servings || null,
    readyInMinutes: recipe.readyInMinutes || null,
    prepMinutes: recipe.preparationMinutes || null,
    cookMinutes: recipe.cookingMinutes || null,
    cuisines: recipe.cuisines || [],
    dishTypes: recipe.dishTypes || [],
    diets: recipe.diets || [],
    veryPopular: recipe.veryPopular || false,
    aggregateLikes: recipe.aggregateLikes || 0,
  }
}

// --- Aggregate multiple sources into a single sourced record ---

function aggregateSources(recipeName, sources) {
  // Collect all unique ingredients across sources
  const ingredientMap = new Map()
  for (const src of sources) {
    for (const ing of src.ingredients) {
      const key = ing.name.toLowerCase().trim()
      if (!ingredientMap.has(key)) {
        ingredientMap.set(key, {
          name: ing.name,
          occurrences: 0,
          amounts: [],
          units: new Set(),
          notes: new Set(),
        })
      }
      const entry = ingredientMap.get(key)
      entry.occurrences++
      if (ing.amount && ing.amount !== '0') entry.amounts.push(parseFloat(ing.amount))
      if (ing.unit) entry.units.add(ing.unit)
      if (ing.notes) entry.notes.add(ing.notes)
    }
  }

  // Convert to array sorted by frequency (most common ingredients first)
  const aggregatedIngredients = [...ingredientMap.values()]
    .sort((a, b) => b.occurrences - a.occurrences)
    .map(entry => ({
      name: entry.name,
      occurrences: entry.occurrences,
      outOf: sources.length,
      consensusPercentage: Math.round((entry.occurrences / sources.length) * 100),
      medianAmount: entry.amounts.length > 0
        ? entry.amounts.sort((a, b) => a - b)[Math.floor(entry.amounts.length / 2)]
        : null,
      units: [...entry.units],
      notes: [...entry.notes],
    }))

  // Aggregate timings
  const timings = sources.filter(s => s.metadata.readyInMinutes)
  const medianTime = timings.length > 0
    ? timings.map(s => s.metadata.readyInMinutes).sort((a, b) => a - b)[Math.floor(timings.length / 2)]
    : null

  // Aggregate servings
  const servingsArr = sources.filter(s => s.metadata.servings).map(s => s.metadata.servings)
  const medianServings = servingsArr.length > 0
    ? servingsArr.sort((a, b) => a - b)[Math.floor(servingsArr.length / 2)]
    : null

  // Detect consensus cuisine
  const cuisineCounts = {}
  for (const src of sources) {
    for (const c of src.metadata.cuisines) {
      cuisineCounts[c] = (cuisineCounts[c] || 0) + 1
    }
  }
  const topCuisine = Object.entries(cuisineCounts).sort((a, b) => b[1] - a[1])[0]

  // Detect difficulty from prep + cook time
  let difficulty = 'medium'
  if (medianTime) {
    if (medianTime <= 30) difficulty = 'easy'
    else if (medianTime <= 60) difficulty = 'medium'
    else difficulty = 'hard'
  }

  return {
    recipeName,
    slug: slugify(recipeName),
    sourcedAt: new Date().toISOString(),
    sourceCount: sources.length,
    sources: sources.map(s => ({
      name: s.metadata.sourceName,
      url: s.metadata.sourceUrl,
      id: s.metadata.sourceId,
      likes: s.metadata.aggregateLikes,
    })),
    consensus: {
      ingredients: aggregatedIngredients,
      medianTotalTime: medianTime,
      medianServings,
      topCuisine: topCuisine ? topCuisine[0] : null,
      difficulty,
      dishTypes: [...new Set(sources.flatMap(s => s.metadata.dishTypes))],
      diets: [...new Set(sources.flatMap(s => s.metadata.diets))],
    },
    // Keep full raw source data for audit trail
    rawSources: sources.map(s => ({
      metadata: s.metadata,
      ingredients: s.ingredients,
      steps: s.steps,
      nutrition: s.nutrition,
    })),
  }
}

// --- Main ---

async function sourceOneRecipe(recipeName) {
  console.log(`\n→ Sourcing: "${recipeName}"`)

  if (!SPOONACULAR_API_KEY) {
    console.log('  ⚠ No SPOONACULAR_API_KEY set. Generating manual-source template.')
    return {
      recipeName,
      slug: slugify(recipeName),
      sourcedAt: new Date().toISOString(),
      sourceCount: 0,
      sources: [],
      consensus: null,
      rawSources: [],
      _needsManualSourcing: true,
      _suggestedSearches: [
        `"${recipeName}" recipe site:seriouseats.com`,
        `"${recipeName}" recipe site:bonappetit.com`,
        `"${recipeName}" recipe site:nytimes.com/cooking`,
        `"${recipeName}" recipe site:food52.com`,
        `"${recipeName}" recipe site:americastestkitchen.com`,
      ],
    }
  }

  // Search for this recipe across multiple sources
  const searchResults = await searchRecipes(recipeName, 5)
  if (!searchResults || searchResults.length === 0) {
    console.log('  ✗ No results found')
    return null
  }

  console.log(`  Found ${searchResults.length} initial results`)

  const sources = []

  for (const result of searchResults) {
    await sleep(RATE_LIMIT_MS)
    console.log(`  Fetching details: "${result.title}" (${result.sourceName || 'unknown'})`)

    const details = await getRecipeDetails(result.id)
    if (!details) continue

    sources.push({
      ingredients: extractIngredients(details),
      steps: extractSteps(details),
      nutrition: extractNutrition(details),
      metadata: extractMetadata(details),
    })
  }

  // Try to find additional similar recipes from the top result
  if (sources.length > 0 && searchResults[0]) {
    await sleep(RATE_LIMIT_MS)
    const similar = await getSimilarRecipes(searchResults[0].id, 3)
    for (const sim of similar) {
      await sleep(RATE_LIMIT_MS)
      const details = await getRecipeDetails(sim.id)
      if (details) {
        sources.push({
          ingredients: extractIngredients(details),
          steps: extractSteps(details),
          nutrition: extractNutrition(details),
          metadata: extractMetadata(details),
        })
      }
    }
  }

  console.log(`  Aggregated ${sources.length} sources`)

  return aggregateSources(recipeName, sources)
}

async function main() {
  const flags = parseArgs(process.argv)
  const dryRun = flags['dry-run'] || false

  // Get recipe names from args or file
  let recipeNames = flags._positional || []
  if (flags['from-file']) {
    const filePath = flags['from-file']
    if (!existsSync(filePath)) {
      console.error(`File not found: ${filePath}`)
      process.exit(1)
    }
    const content = readFileSync(filePath, 'utf-8')
    recipeNames = content.split('\n').map(l => l.trim()).filter(Boolean)
  }

  if (recipeNames.length === 0) {
    console.log('Usage: node 1-source-recipes.mjs "recipe name" "another recipe" ...')
    console.log('       node 1-source-recipes.mjs --from-file recipes.txt')
    console.log('       node 1-source-recipes.mjs --dry-run "recipe name"')
    process.exit(0)
  }

  console.log(`🔍 Stage 1: Source Recipes`)
  console.log(`   Recipes: ${recipeNames.length}`)
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`   API: ${SPOONACULAR_API_KEY ? 'Spoonacular' : 'Manual sourcing (no API key)'}`)

  let sourced = 0, failed = 0

  for (const name of recipeNames) {
    try {
      const result = await sourceOneRecipe(name)
      if (!result) {
        failed++
        continue
      }

      const outPath = `${SOURCED_DIR}${result.slug}.json`
      if (!dryRun) {
        writeFileSync(outPath, JSON.stringify(result, null, 2))
        console.log(`  ✓ Saved: ${outPath}`)
      } else {
        console.log(`  [dry-run] Would save: ${outPath}`)
        console.log(`  Sources: ${result.sourceCount}, Ingredients: ${result.consensus?.ingredients?.length || 0}`)
      }
      sourced++
    } catch (err) {
      console.log(`  ✗ Error sourcing "${name}": ${err.message}`)
      failed++
    }
  }

  console.log(`\n--- Stage 1 Summary ---`)
  console.log(`Sourced: ${sourced}`)
  console.log(`Failed:  ${failed}`)
  console.log(`Total:   ${recipeNames.length}`)
}

main().catch(console.error)
