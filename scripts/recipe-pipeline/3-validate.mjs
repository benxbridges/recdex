/**
 * Stage 3: Validate & Confidence Score
 *
 * The proofreading agent. Runs every synthesized recipe through a multi-factor
 * validation pipeline and assigns an internal confidence score (0–100).
 * Recipes below the threshold stay in 'draft' status and get flagged for review.
 *
 * Scoring factors:
 *   1. Source Count (25%)     — More independent sources = more reliable
 *   2. Ratio Plausibility (25%) — Ingredient proportions make culinary sense
 *   3. Technique Validity (20%) — Methods match ingredients and cuisine
 *   4. Completeness (15%)     — All fields present, steps sequential, timings consistent
 *   5. Nutritional Sanity (15%) — Caloric/macro estimate is plausible
 *
 * Two modes:
 *   - Rule-based checks (fast, free, always runs)
 *   - LLM-assisted review (optional, for deeper technique/ratio validation)
 *
 * Usage:
 *   node 3-validate.mjs                                    # Rule-based only
 *   ANTHROPIC_API_KEY=xxx node 3-validate.mjs --with-llm   # + LLM proofreading
 *   node 3-validate.mjs --slug chicken-parmesan             # Validate one
 *   node 3-validate.mjs --verbose                           # Show detailed scoring
 *
 * Input:  pipeline-data/synthesized/{slug}.json
 * Output: pipeline-data/validated/{slug}.json
 */

import { writeFileSync, readFileSync, readdirSync, existsSync } from 'fs'
import {
  ANTHROPIC_API_KEY, SYNTHESIZED_DIR, VALIDATED_DIR, SOURCED_DIR,
  CONFIDENCE_WEIGHTS, MIN_CONFIDENCE_TO_PUBLISH, MIN_SOURCES_FOR_HIGH_CONFIDENCE,
  MAX_SOURCES_SCORED, sleep, parseArgs
} from './config.mjs'

const CLAUDE_MODEL = 'claude-sonnet-4-20250514'
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'

// ============================================================
// RULE-BASED VALIDATORS (free, fast, always run)
// ============================================================

/**
 * Factor 1: Source Count Score (0–100)
 * More independent sources = higher confidence the recipe is real and works.
 */
function scoreSourceCount(recipe, sourced) {
  const count = sourced?.sourceCount || recipe._pipeline?.sourceCount || 0
  if (count === 0) return { score: 0, flags: ['no-sources'], detail: 'No source data found' }
  if (count === 1) return { score: 20, flags: ['single-source'], detail: `Only 1 source` }
  if (count === 2) return { score: 45, flags: [], detail: `2 sources` }

  // Scale linearly from 3 sources (60) to MAX_SOURCES_SCORED (100)
  const capped = Math.min(count, MAX_SOURCES_SCORED)
  const score = Math.round(60 + (capped - MIN_SOURCES_FOR_HIGH_CONFIDENCE) / (MAX_SOURCES_SCORED - MIN_SOURCES_FOR_HIGH_CONFIDENCE) * 40)
  return { score: Math.min(score, 100), flags: [], detail: `${count} sources` }
}

/**
 * Factor 2: Ratio Plausibility Score (0–100)
 * Checks ingredient proportions against known culinary rules.
 */
function scoreRatioPlausibility(recipe) {
  let score = 100
  const flags = []
  const details = []

  const ingredients = recipe.ingredients || []
  if (ingredients.length === 0) return { score: 0, flags: ['no-ingredients'], detail: 'No ingredients' }

  // Check: reasonable ingredient count (most recipes have 5-20 ingredients)
  if (ingredients.length < 3) {
    score -= 20
    flags.push('too-few-ingredients')
    details.push(`Only ${ingredients.length} ingredients`)
  }
  if (ingredients.length > 30) {
    score -= 15
    flags.push('too-many-ingredients')
    details.push(`${ingredients.length} ingredients seems excessive`)
  }

  // Check: salt is present in savory recipes
  const hasSalt = ingredients.some(i => /salt/i.test(i.name))
  const isDessert = recipe.tags?.some(t => /dessert|sweet|cake|cookie|baking/i.test(t))
  if (!hasSalt && !isDessert) {
    score -= 10
    flags.push('missing-salt')
    details.push('No salt in a savory recipe')
  }

  // Check: amounts are present and parseable
  const missingAmounts = ingredients.filter(i => !i.amount || i.amount === '0' || i.amount === '')
  if (missingAmounts.length > ingredients.length * 0.3) {
    score -= 20
    flags.push('missing-amounts')
    details.push(`${missingAmounts.length}/${ingredients.length} ingredients missing amounts`)
  }

  // Check: no extremely large single amounts (e.g., "50 cups flour")
  for (const ing of ingredients) {
    const amt = parseFloat(ing.amount)
    if (isNaN(amt)) continue
    const bigUnits = ['cup', 'cups', 'lb', 'lbs', 'pound', 'pounds']
    if (bigUnits.some(u => ing.unit?.toLowerCase().includes(u)) && amt > 10) {
      score -= 15
      flags.push('extreme-amount')
      details.push(`${ing.amount} ${ing.unit} of ${ing.name} seems too much`)
      break
    }
  }

  // Check: baking recipes should have flour/leavening ratios in reasonable range
  const flour = ingredients.find(i => /flour/i.test(i.name))
  const bakingSoda = ingredients.find(i => /baking soda/i.test(i.name))
  const bakingPowder = ingredients.find(i => /baking powder/i.test(i.name))
  if (flour && (bakingSoda || bakingPowder)) {
    const flourAmt = parseFloat(flour.amount)
    const sodaAmt = bakingSoda ? parseFloat(bakingSoda.amount) : 0
    const powderAmt = bakingPowder ? parseFloat(bakingPowder.amount) : 0

    // Rule of thumb: ~1 tsp baking powder per cup flour, ~1/4 tsp soda per cup flour
    if (flourAmt && sodaAmt) {
      const flourUnit = flour.unit?.toLowerCase()
      if (flourUnit?.includes('cup') && sodaAmt > flourAmt * 2) {
        score -= 15
        flags.push('leavening-ratio')
        details.push('Baking soda to flour ratio is unusually high')
      }
    }
  }

  return {
    score: Math.max(score, 0),
    flags,
    detail: details.length > 0 ? details.join('; ') : 'Ratios look reasonable',
  }
}

/**
 * Factor 3: Technique Validity Score (0–100)
 * Checks that cooking methods make sense for the ingredients and context.
 */
function scoreTechniqueValidity(recipe) {
  let score = 100
  const flags = []
  const details = []

  const steps = recipe.steps || []
  if (steps.length === 0) return { score: 0, flags: ['no-steps'], detail: 'No steps' }

  // Check: steps are sequential (step numbers increment)
  for (let i = 1; i < steps.length; i++) {
    if (steps[i].step <= steps[i - 1].step) {
      score -= 10
      flags.push('step-ordering')
      details.push('Step numbers are not sequential')
      break
    }
  }

  // Check: steps reference ingredients that actually exist
  const ingredientNames = (recipe.ingredients || []).map(i => i.name.toLowerCase())
  const stepText = steps.map(s => s.text.toLowerCase()).join(' ')

  // At least some ingredients should appear in the instructions
  const mentionedCount = ingredientNames.filter(name =>
    stepText.includes(name.split(',')[0].trim())  // Match first word of ingredient
  ).length
  const mentionRatio = ingredientNames.length > 0 ? mentionedCount / ingredientNames.length : 0

  if (mentionRatio < 0.3) {
    score -= 20
    flags.push('ingredients-not-in-steps')
    details.push(`Only ${Math.round(mentionRatio * 100)}% of ingredients mentioned in steps`)
  }

  // Check: timers are reasonable (not 0, not >720 min except for slow cooking)
  for (const step of steps) {
    if (step.timer_minutes !== null && step.timer_minutes !== undefined) {
      if (step.timer_minutes <= 0) {
        score -= 5
        flags.push('zero-timer')
        details.push(`Step ${step.step} has a 0 or negative timer`)
      }
      if (step.timer_minutes > 720 && !/slow|overnight|ferment|cure|brine/i.test(step.text)) {
        score -= 10
        flags.push('extreme-timer')
        details.push(`Step ${step.step}: ${step.timer_minutes} min seems too long`)
      }
    }
  }

  // Check: total time roughly matches sum of step timers
  const stepTimeSum = steps.reduce((sum, s) => sum + (s.timer_minutes || 0), 0)
  if (recipe.time_total && stepTimeSum > 0) {
    const ratio = stepTimeSum / recipe.time_total
    if (ratio > 2.0) {
      score -= 10
      flags.push('time-mismatch')
      details.push(`Step timers sum to ${stepTimeSum}min but total time is ${recipe.time_total}min`)
    }
  }

  return {
    score: Math.max(score, 0),
    flags,
    detail: details.length > 0 ? details.join('; ') : 'Techniques look valid',
  }
}

/**
 * Factor 4: Completeness Score (0–100)
 * All schema fields populated, data is well-formed.
 */
function scoreCompleteness(recipe) {
  let score = 100
  const flags = []
  const details = []

  // Required fields check
  const checks = [
    ['title', recipe.title],
    ['slug', recipe.slug],
    ['description', recipe.description],
    ['cuisine', recipe.cuisine],
    ['difficulty', recipe.difficulty],
    ['time_total', recipe.time_total],
    ['servings', recipe.servings],
    ['ingredients', recipe.ingredients?.length > 0],
    ['steps', recipe.steps?.length > 0],
  ]

  for (const [field, value] of checks) {
    if (!value) {
      score -= 12
      flags.push(`missing-${field}`)
      details.push(`Missing: ${field}`)
    }
  }

  // Optional but valuable fields
  const optionalFields = [
    ['time_active', recipe.time_active],
    ['tags', recipe.tags?.length > 0],
    ['servings_label', recipe.servings_label],
  ]

  for (const [field, value] of optionalFields) {
    if (!value) {
      score -= 3
      details.push(`Optional missing: ${field}`)
    }
  }

  // Description quality: should be 1-2 sentences, not too short or too long
  if (recipe.description) {
    if (recipe.description.length < 20) {
      score -= 5
      flags.push('short-description')
      details.push('Description is very short')
    }
    if (recipe.description.length > 300) {
      score -= 5
      flags.push('long-description')
      details.push('Description is too long (should be 1-2 sentences)')
    }
  }

  // Difficulty must be a valid value
  if (recipe.difficulty && !['easy', 'medium', 'hard'].includes(recipe.difficulty)) {
    score -= 5
    flags.push('invalid-difficulty')
    details.push(`Invalid difficulty: "${recipe.difficulty}"`)
  }

  return {
    score: Math.max(score, 0),
    flags,
    detail: details.length > 0 ? details.join('; ') : 'All fields complete',
  }
}

/**
 * Factor 5: Nutritional Sanity Score (0–100)
 * Quick heuristic — does the caloric density make sense for this dish type?
 */
function scoreNutritionalSanity(recipe, sourced) {
  const flags = []
  const details = []

  // Use nutrition from source data if available
  const nutritionSamples = sourced?.rawSources
    ?.filter(s => s.nutrition?.calories)
    ?.map(s => s.nutrition) || []

  if (nutritionSamples.length === 0) {
    // Can't check without data — give a neutral score but flag it
    return { score: 60, flags: ['no-nutrition-data'], detail: 'No nutrition data to verify' }
  }

  let score = 100

  const avgCalories = nutritionSamples.reduce((sum, n) => sum + n.calories, 0) / nutritionSamples.length

  // Sanity checks on caloric content per serving
  if (avgCalories < 50) {
    score -= 25
    flags.push('calories-too-low')
    details.push(`Average ${Math.round(avgCalories)} cal/serving seems too low`)
  }
  if (avgCalories > 1500) {
    score -= 20
    flags.push('calories-very-high')
    details.push(`Average ${Math.round(avgCalories)} cal/serving is very high`)
  }

  // Check protein/fat/carb aren't wildly out of range
  const avgProtein = nutritionSamples.reduce((sum, n) => sum + (n.protein_g || 0), 0) / nutritionSamples.length
  const avgFat = nutritionSamples.reduce((sum, n) => sum + (n.fat_g || 0), 0) / nutritionSamples.length

  if (avgProtein > 100) {
    score -= 10
    flags.push('protein-high')
    details.push(`${Math.round(avgProtein)}g protein per serving is unusually high`)
  }
  if (avgFat > 100) {
    score -= 10
    flags.push('fat-high')
    details.push(`${Math.round(avgFat)}g fat per serving is unusually high`)
  }

  return {
    score: Math.max(score, 0),
    flags,
    detail: details.length > 0 ? details.join('; ') : `~${Math.round(avgCalories)} cal/serving — looks reasonable`,
  }
}

// ============================================================
// LLM-ASSISTED VALIDATION (optional, deeper review)
// ============================================================

async function llmProofread(recipe) {
  if (!ANTHROPIC_API_KEY) return null

  const prompt = `You are a professional recipe editor and culinary fact-checker. Review this recipe for errors, implausibilities, or issues.

Recipe: ${recipe.title}
Cuisine: ${recipe.cuisine}
Difficulty: ${recipe.difficulty}

Ingredients:
${recipe.ingredients.map(i => `- ${i.amount} ${i.unit} ${i.name}${i.notes ? ` (${i.notes})` : ''}`).join('\n')}

Steps:
${recipe.steps.map(s => `${s.step}. ${s.text}${s.timer_minutes ? ` [${s.timer_minutes} min]` : ''}`).join('\n')}

Check for:
1. Ingredient proportions that don't make culinary sense
2. Missing critical ingredients (e.g., no fat for sautéing, no liquid for braising)
3. Steps that are out of order or reference unprepared ingredients
4. Techniques that don't match the cuisine or ingredients
5. Timing issues (too long, too short for the described action)
6. Safety issues (undercooked proteins, improper canning, etc.)

Return ONLY valid JSON:
{
  "issues": [
    { "severity": "critical|warning|suggestion", "category": "ratio|technique|safety|completeness|other", "description": "string" }
  ],
  "overallAssessment": "string — one sentence summary",
  "adjustedScore": number — 0 to 100, your confidence this recipe will work as written
}`

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
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) return null

    const data = await res.json()
    let text = data.content[0].text.trim()
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    return JSON.parse(text)
  } catch {
    return null
  }
}

// ============================================================
// COMPOSITE SCORING
// ============================================================

function computeConfidence(factors) {
  const weights = CONFIDENCE_WEIGHTS
  const weighted =
    factors.sourceCount.score * weights.sourceCount +
    factors.ratioPlausibility.score * weights.ratioPlausibility +
    factors.techniqueValidity.score * weights.techniqueValidity +
    factors.completeness.score * weights.completeness +
    factors.nutritionalSanity.score * weights.nutritionalSanity

  return Math.round(weighted)
}

// ============================================================
// MAIN
// ============================================================

async function validateOne(synthesizedPath, options) {
  const recipe = JSON.parse(readFileSync(synthesizedPath, 'utf-8'))
  console.log(`\n→ Validating: "${recipe.title}"`)

  // Try to load corresponding sourced data for richer validation
  const sourcedPath = `${SOURCED_DIR}${recipe.slug}.json`
  const sourced = existsSync(sourcedPath)
    ? JSON.parse(readFileSync(sourcedPath, 'utf-8'))
    : null

  // Run all rule-based validators
  const factors = {
    sourceCount: scoreSourceCount(recipe, sourced),
    ratioPlausibility: scoreRatioPlausibility(recipe),
    techniqueValidity: scoreTechniqueValidity(recipe),
    completeness: scoreCompleteness(recipe),
    nutritionalSanity: scoreNutritionalSanity(recipe, sourced),
  }

  let confidence = computeConfidence(factors)
  const allFlags = Object.values(factors).flatMap(f => f.flags)

  // LLM proofreading (optional)
  let llmReview = null
  if (options.withLlm) {
    console.log('  Running LLM proofreading...')
    llmReview = await llmProofread(recipe)
    if (llmReview) {
      // Blend LLM score with rule-based score (30% LLM, 70% rules)
      const blended = Math.round(confidence * 0.7 + llmReview.adjustedScore * 0.3)
      console.log(`  LLM score: ${llmReview.adjustedScore}, blended: ${confidence} → ${blended}`)

      // Add critical LLM issues as flags
      const criticalIssues = llmReview.issues?.filter(i => i.severity === 'critical') || []
      if (criticalIssues.length > 0) {
        allFlags.push('llm-critical-issues')
        // Critical issues pull the score down hard
        confidence = Math.min(blended, blended - criticalIssues.length * 10)
      } else {
        confidence = blended
      }
    }
  }

  const status = confidence >= MIN_CONFIDENCE_TO_PUBLISH ? 'ready' : 'needs-review'

  if (options.verbose) {
    console.log(`  Scores:`)
    for (const [name, factor] of Object.entries(factors)) {
      console.log(`    ${name}: ${factor.score}/100 — ${factor.detail}`)
    }
    if (llmReview) {
      console.log(`  LLM Assessment: ${llmReview.overallAssessment}`)
      for (const issue of llmReview.issues || []) {
        console.log(`    [${issue.severity}] ${issue.description}`)
      }
    }
  }

  console.log(`  Confidence: ${confidence}/100 → ${status}`)
  if (allFlags.length > 0) {
    console.log(`  Flags: ${allFlags.join(', ')}`)
  }

  return {
    ...recipe,
    _validation: {
      validatedAt: new Date().toISOString(),
      confidence,
      status,
      flags: allFlags,
      factors: Object.fromEntries(
        Object.entries(factors).map(([k, v]) => [k, { score: v.score, detail: v.detail }])
      ),
      llmReview: llmReview || null,
    },
  }
}

async function main() {
  const flags = parseArgs(process.argv)
  const dryRun = flags['dry-run'] || false
  const verbose = flags.verbose || false
  const withLlm = flags['with-llm'] || false
  const targetSlug = flags.slug || null

  // Find synthesized files to validate
  let files
  if (targetSlug) {
    const path = `${SYNTHESIZED_DIR}${targetSlug}.json`
    if (!existsSync(path)) {
      console.error(`Synthesized file not found: ${path}`)
      process.exit(1)
    }
    files = [path]
  } else {
    files = readdirSync(SYNTHESIZED_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => `${SYNTHESIZED_DIR}${f}`)
  }

  console.log(`🔎 Stage 3: Validate & Score`)
  console.log(`   Files: ${files.length}`)
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`   LLM: ${withLlm ? 'enabled' : 'rule-based only'}`)
  console.log(`   Threshold: ${MIN_CONFIDENCE_TO_PUBLISH}/100`)

  let ready = 0, needsReview = 0, failed = 0

  for (const filePath of files) {
    try {
      const result = await validateOne(filePath, { verbose, withLlm })

      const outPath = `${VALIDATED_DIR}${result.slug}.json`
      if (!dryRun) {
        writeFileSync(outPath, JSON.stringify(result, null, 2))
        console.log(`  ✓ Saved: ${outPath}`)
      }

      if (result._validation.status === 'ready') ready++
      else needsReview++
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`)
      failed++
    }

    if (withLlm) await sleep(2000)
  }

  console.log(`\n--- Stage 3 Summary ---`)
  console.log(`Ready:        ${ready}`)
  console.log(`Needs review: ${needsReview}`)
  console.log(`Failed:       ${failed}`)
  console.log(`Total:        ${files.length}`)
  console.log(`Threshold:    ${MIN_CONFIDENCE_TO_PUBLISH}/100`)
}

main().catch(console.error)
