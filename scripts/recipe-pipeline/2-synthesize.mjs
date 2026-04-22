/**
 * Stage 2: Synthesize Recipes
 *
 * Takes sourced recipe data (from Stage 1) and synthesizes it into proprietary
 * recipe content in the Recdex brand voice. Uses Claude to rewrite — but the
 * FACTS (ingredients, ratios, techniques, timings) come from real sources.
 * Only the expression is AI-generated, making the output proprietary.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=xxx node 2-synthesize.mjs                    # Process all sourced recipes
 *   ANTHROPIC_API_KEY=xxx node 2-synthesize.mjs --slug pad-thai    # Process one recipe
 *   ANTHROPIC_API_KEY=xxx node 2-synthesize.mjs --dry-run          # Preview without writing
 *
 * Input:  pipeline-data/sourced/{slug}.json
 * Output: pipeline-data/synthesized/{slug}.json
 */

import { writeFileSync, readFileSync, readdirSync, existsSync, mkdirSync } from 'fs'
import {
  ANTHROPIC_API_KEY, SOURCED_DIR, SYNTHESIZED_DIR, VALIDATED_DIR,
  BRAND_VOICE_SYSTEM, sleep, parseArgs
} from './config.mjs'

const CLAUDE_MODEL = 'claude-sonnet-4-20250514'
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const RATE_LIMIT_MS = 2000  // Be gentle with the API

// --- Claude API call ---

async function callClaude(systemPrompt, userPrompt, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      })

      if (res.status === 429 || res.status >= 500) {
        const wait = Math.pow(2, attempt + 1) * 1000
        console.log(`  ⚠ API error ${res.status}, retrying in ${wait / 1000}s...`)
        await sleep(wait)
        continue
      }

      if (!res.ok) {
        const body = await res.text()
        throw new Error(`Claude API error ${res.status}: ${body}`)
      }

      const data = await res.json()
      return data.content[0].text
    } catch (err) {
      if (attempt === retries) throw err
      await sleep(Math.pow(2, attempt + 1) * 1000)
    }
  }
}

// --- Build the synthesis prompt from sourced data ---

function buildSynthesisPrompt(sourced, corrections = null) {
  const { recipeName, consensus } = sourced

  // Build ingredient consensus summary — handle both Stage 0 and Stage 1 formats
  let ingredientSummary
  if (consensus.ingredients.length === 0) {
    ingredientSummary = '(no existing ingredient data — generate from your knowledge of this dish)'
  } else if (consensus.ingredients[0].consensusPercentage !== undefined) {
    // Stage 1 format: consensusPercentage, medianAmount, units[]
    ingredientSummary = consensus.ingredients
      .filter(ing => ing.consensusPercentage >= 30)
      .map(ing => {
        const amt = ing.medianAmount ? `${ing.medianAmount} ${(ing.units || [])[0] || ''}`.trim() : 'amount varies'
        return `- ${ing.name}: ${amt} (found in ${ing.consensusPercentage}% of ${ing.outOf} sources)`
      })
      .join('\n')
  } else {
    // Stage 0 format: amount, unit, frequency
    ingredientSummary = consensus.ingredients
      .map(ing => {
        const amt = ing.amount ? `${ing.amount} ${ing.unit || ''}`.trim() : 'amount varies'
        const notes = ing.notes ? ` — ${ing.notes}` : ''
        return `- ${ing.name}: ${amt}${notes}`
      })
      .join('\n')
  }

  // Build technique steps — handle both Stage 0 (techniqueSample) and Stage 1 (rawSources) formats
  let allSteps = []
  if (sourced.techniqueSample) {
    // Stage 0 format: techniqueSample is an array of step arrays
    allSteps = (sourced.techniqueSample || []).flat().filter(Boolean)
  } else if (sourced.rawSources) {
    // Stage 1 format: rawSources is an array of source objects
    allSteps = sourced.rawSources.flatMap(s => (s.steps || []).map(st => st.text)).filter(Boolean)
  }
  const techniqueSample = allSteps.length > 0
    ? allSteps.slice(0, 15).map((s, i) => `${i + 1}. ${s}`).join('\n')
    : '(no existing step data — write steps from your knowledge of this dish)'

  // Nutrition reference
  const rawNutrition = sourced.nutritionSamples || []
  const nutritionSamples = rawNutrition.slice(0, 3)

  const correctionsSection = corrections?.length > 0
    ? `\n## ⚠️ CORRECTIONS REQUIRED (from previous failed validation)\nA previous version of this recipe failed quality review. You MUST fix these issues:\n${corrections.map(c => `- [${c.severity.toUpperCase()}] ${c.description}`).join('\n')}\n`
    : ''

  return `Synthesize a recipe for "${recipeName}" based on the following real-world data from ${sourced.sourceCount} independent cooking sources.${correctionsSection}

## Ingredient Consensus (from ${sourced.sourceCount} sources)
${ingredientSummary}

## Technique Samples (from various sources)
${techniqueSample}

## Metadata Consensus
- Cuisine: ${consensus.topCuisine || 'not determined'}
- Typical total time: ${consensus.medianTotalTime || 'varies'} minutes
- Typical servings: ${consensus.medianServings || 'varies'}
- Difficulty: ${consensus.difficulty}
- Dish types: ${consensus.dishTypes.join(', ') || 'main course'}
- Dietary tags: ${consensus.diets.join(', ') || 'none'}

${nutritionSamples.length > 0 ? `## Nutrition Reference (per serving)\n${nutritionSamples.join('\n')}` : ''}

## Your task

Write a complete recipe in the Recdex voice. Return ONLY valid JSON matching this exact structure:

{
  "title": "string — the recipe title, properly capitalized",
  "slug": "string — lowercase-hyphenated URL slug",
  "description": "string — 1-2 sentences: what the dish is and what makes this version good",
  "summary": "string — skeletal cooking arc: 3-5 comma-separated phrases capturing the PHASES of cooking, under 20 words total. Collapse related actions into one phase ('season and sear chicken' not 'pat dry, salt, sear'). Use broad labels ('aromatics' not 'garlic and shallots'; 'the meat' not 'bone-in thighs'). No measurements, temperatures, or times. Examples: 'Season and sear chicken, add lemon and dates, braise until tender.' / 'Bloom aromatics, simmer tomatoes and sauce, add beans, finish with poached eggs.' / 'Whip cream and sugar, fold in yolks, freeze overnight.'",
  "cuisine": "string — primary cuisine (e.g., 'Italian', 'Thai', 'American')",
  "difficulty": "easy | medium | hard",
  "time_total": number — total minutes,
  "time_active": number — hands-on minutes,
  "time_passive": number | null — resting/rising/chilling minutes,
  "time_passive_label": "string | null — e.g., 'chilling', 'rising', 'marinating'",
  "servings": number,
  "servings_label": "string | null — e.g., '4-6 people' or '12 cookies'",
  "tags": ["string array of relevant tags"],
  "ingredients": [
    { "name": "string", "amount": "string", "unit": "string", "notes": "string (optional)" }
  ],
  "steps": [
    { "step": 1, "text": "string — the instruction", "timer_minutes": number | null }
  ]
}

Rules:
- Base ALL ingredients and ratios on the consensus data above — do not invent new ingredients
- Ingredient amounts should be practical for home cooks (use cups/tbsp/tsp, not grams for US audience)
- Every step must be actionable and include sensory cues for doneness
- Include timer_minutes for any step where timing matters (sautéing, baking, resting, etc.)
- Tags should include cuisine, dish type, dietary info, and key techniques
- Return ONLY the JSON object, no markdown fencing or extra text`
}

// --- Parse and validate Claude's output ---

function parseRecipeJSON(text) {
  // Strip markdown code fences if present
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  const recipe = JSON.parse(cleaned)

  // Validate required fields
  const required = ['title', 'slug', 'description', 'summary', 'cuisine', 'difficulty',
    'time_total', 'servings', 'ingredients', 'steps']
  const missing = required.filter(f => recipe[f] === undefined || recipe[f] === null)
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`)
  }

  // Validate ingredients structure
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    throw new Error('Ingredients must be a non-empty array')
  }
  for (const ing of recipe.ingredients) {
    if (!ing.name) {
      throw new Error(`Invalid ingredient (missing name): ${JSON.stringify(ing)}`)
    }
  }

  // Validate steps structure
  if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) {
    throw new Error('Steps must be a non-empty array')
  }
  for (const step of recipe.steps) {
    if (!step.step || !step.text) {
      throw new Error(`Invalid step: ${JSON.stringify(step)}`)
    }
  }

  return recipe
}

// --- Main ---

async function synthesizeOne(sourcedPath, corrections = null) {
  const sourced = JSON.parse(readFileSync(sourcedPath, 'utf-8'))

  if (sourced._needsManualSourcing) {
    console.log(`  ⚠ Skipping "${sourced.recipeName}" — needs manual sourcing first`)
    return null
  }

  if (!sourced.consensus || sourced.sourceCount === 0) {
    console.log(`  ⚠ Skipping "${sourced.recipeName}" — no source data`)
    return null
  }

  const correctionNote = corrections?.length ? ` [${corrections.length} correction(s)]` : ''
  console.log(`\n→ Synthesizing: "${sourced.recipeName}" (${sourced.sourceCount} sources)${correctionNote}`)

  const prompt = buildSynthesisPrompt(sourced, corrections)
  const response = await callClaude(BRAND_VOICE_SYSTEM, prompt)

  try {
    const recipe = parseRecipeJSON(response)

    // Attach pipeline metadata (not part of the recipe itself, used for tracking)
    return {
      ...recipe,
      // Preserve _existing from Stage 0 exports so Stage 5 can restore Supabase fields
      ...(sourced._existing ? { _existing: sourced._existing } : {}),
      _pipeline: {
        synthesizedAt: new Date().toISOString(),
        sourceCount: sourced.sourceCount,
        sources: sourced.sources,
        consensusIngredientCount: sourced.consensus.ingredients.length,
        model: CLAUDE_MODEL,
      },
    }
  } catch (err) {
    console.log(`  ✗ Failed to parse recipe JSON: ${err.message}`)
    console.log(`  Raw response (first 200 chars): ${response.substring(0, 200)}`)
    return null
  }
}

async function main() {
  const flags = parseArgs(process.argv)
  const dryRun = flags['dry-run'] || false
  const targetSlug = flags.slug || null
  const correctMode = flags['correct'] || false  // Re-synthesize only needs-review recipes with corrections

  if (!ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is required')
    console.error('Usage: ANTHROPIC_API_KEY=xxx node 2-synthesize.mjs')
    process.exit(1)
  }

  // Ensure output dir exists
  if (!existsSync(SYNTHESIZED_DIR)) mkdirSync(SYNTHESIZED_DIR, { recursive: true })

  // In --correct mode: build map of existingId → LLM corrections from validated files
  // then find matching sourced files to re-synthesize
  let correctionsBySourcedSlug = new Map()
  let sourcedFiles

  if (correctMode) {
    // Build id → corrections map from validated files
    const idToCorrections = new Map()
    if (existsSync(VALIDATED_DIR)) {
      for (const f of readdirSync(VALIDATED_DIR).filter(f => f.endsWith('.json'))) {
        const v = JSON.parse(readFileSync(`${VALIDATED_DIR}${f}`, 'utf-8'))
        if (v._validation?.status === 'needs-review' && v._existing?.id) {
          const issues = v._validation?.llmReview?.issues?.filter(i => i.severity !== 'suggestion') || []
          idToCorrections.set(v._existing.id, issues)
        }
      }
    }

    // Match to sourced files
    const matched = []
    for (const f of readdirSync(SOURCED_DIR).filter(f => f.endsWith('.json'))) {
      const s = JSON.parse(readFileSync(`${SOURCED_DIR}${f}`, 'utf-8'))
      if (s._existing?.id && idToCorrections.has(s._existing.id)) {
        const slug = f.replace('.json', '')
        correctionsBySourcedSlug.set(slug, idToCorrections.get(s._existing.id))
        matched.push(`${SOURCED_DIR}${f}`)
        idToCorrections.delete(s._existing.id)
      }
    }
    sourcedFiles = matched
    console.log(`✍️  Stage 2: Re-synthesize with corrections`)
    console.log(`   Recipes: ${sourcedFiles.length}`)
  } else if (targetSlug) {
    const path = `${SOURCED_DIR}${targetSlug}.json`
    if (!existsSync(path)) {
      console.error(`Sourced file not found: ${path}`)
      process.exit(1)
    }
    sourcedFiles = [path]
    console.log(`✍️  Stage 2: Synthesize Recipes`)
    console.log(`   Files: 1 (targeted)`)
  } else {
    sourcedFiles = readdirSync(SOURCED_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => `${SOURCED_DIR}${f}`)
    console.log(`✍️  Stage 2: Synthesize Recipes`)
    console.log(`   Files: ${sourcedFiles.length}`)
  }

  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`   Model: ${CLAUDE_MODEL}`)

  let synthesized = 0, skipped = 0, failed = 0

  for (const filePath of sourcedFiles) {
    // In correct mode, always force-overwrite. Otherwise skip already-synthesized.
    const slug = filePath.split('/').pop().replace('.json', '')
    const outPath = `${SYNTHESIZED_DIR}${slug}.json`
    if (!correctMode && !dryRun && existsSync(outPath) && !flags.force) {
      skipped++
      continue
    }

    const corrections = correctionsBySourcedSlug.get(slug) || null

    try {
      const result = await synthesizeOne(filePath, corrections)
      if (!result) {
        skipped++
        continue
      }

      const finalPath = `${SYNTHESIZED_DIR}${result.slug}.json`
      if (!dryRun) {
        writeFileSync(finalPath, JSON.stringify(result, null, 2))
        console.log(`  ✓ Saved: ${finalPath}`)
        console.log(`    ${result.ingredients.length} ingredients, ${result.steps.length} steps`)
      } else {
        console.log(`  [dry-run] "${result.title}" — ${result.ingredients.length} ingredients, ${result.steps.length} steps`)
      }
      synthesized++
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`)
      failed++
    }

    await sleep(RATE_LIMIT_MS)
  }

  console.log(`\n--- Stage 2 Summary ---`)
  console.log(`Synthesized: ${synthesized}`)
  console.log(`Skipped:     ${skipped}`)
  console.log(`Failed:      ${failed}`)
  console.log(`Total:       ${sourcedFiles.length}`)
}

main().catch(console.error)
