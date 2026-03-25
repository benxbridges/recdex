/**
 * Stage 4: Fetch Images (Enhanced Unsplash Pipeline)
 *
 * Improved version of populate-photos-v2.mjs with:
 *   - Multiple search strategies per recipe (title, cuisine, key ingredient)
 *   - Stricter quality thresholds (15+ likes, 1800px+ width)
 *   - Color/composition heuristics (landscape, food-appropriate colors)
 *   - Deduplication (don't assign the same photo to multiple recipes)
 *   - Works with pipeline data OR directly with Supabase recipes
 *
 * Usage:
 *   node 4-fetch-images.mjs                           # Process validated pipeline recipes
 *   node 4-fetch-images.mjs --from-db                 # Process all Supabase recipes missing images
 *   node 4-fetch-images.mjs --slug pad-thai           # One recipe
 *   node 4-fetch-images.mjs --dry-run                 # Preview
 *   node 4-fetch-images.mjs --min-likes 20            # Override minimum likes
 *
 * Input:  pipeline-data/validated/{slug}.json  OR  Supabase recipes table
 * Output: Updates validated JSON files with image_url (pipeline mode)
 *         OR updates Supabase directly (--from-db mode)
 */

import { writeFileSync, readFileSync, readdirSync, existsSync } from 'fs'
import {
  supabase, UNSPLASH_ACCESS_KEY, UNSPLASH_MIN_LIKES, UNSPLASH_MIN_WIDTH,
  UNSPLASH_RATE_LIMIT_MS, VALIDATED_DIR, sleep, parseArgs
} from './config.mjs'

const UNSPLASH_API = 'https://api.unsplash.com'

// Track used photo IDs to avoid duplicates across recipes in the same run
const usedPhotoIds = new Set()

// --- Search strategy generation ---

function generateSearchStrategies(recipe) {
  const title = (recipe.title || '').replace(/[^\w\s]/g, '').trim()
  const cuisine = recipe.cuisine || ''
  const ingredients = recipe.ingredients || []

  // Extract the most prominent/unique ingredient
  const keyIngredient = ingredients[0]?.name || ''

  // Generate multiple search angles, ordered by specificity
  const strategies = [
    // Strategy 1: Full title + "food" (most specific)
    { query: `${title} food photography`, label: 'title+photo' },
    // Strategy 2: Title + cuisine
    { query: `${title} ${cuisine} dish`, label: 'title+cuisine' },
    // Strategy 3: Key ingredient + cooking method (more abstract, wider net)
    { query: `${keyIngredient} ${cuisine} food`, label: 'ingredient+cuisine' },
    // Strategy 4: Just the dish name, simple
    { query: `${title} recipe`, label: 'title+recipe' },
  ]

  // Deduplicate and limit
  const seen = new Set()
  return strategies.filter(s => {
    const normalized = s.query.toLowerCase().trim()
    if (seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}

// --- Unsplash API ---

async function searchUnsplash(query, perPage = 15) {
  const url = `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape&content_filter=high`
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
  })

  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get('x-ratelimit-remaining')
    console.log(`  ⚠ Rate limited (${res.status}). Remaining: ${remaining}`)
    return 'RATE_LIMITED'
  }

  if (!res.ok) {
    console.log(`  ✗ Unsplash error: ${res.status} ${res.statusText}`)
    return null
  }

  const data = await res.json()
  return data.results || []
}

// --- Photo quality scoring ---

function scorePhoto(photo, minLikes, minWidth) {
  let score = 0

  // Already used in this run? Skip entirely
  if (usedPhotoIds.has(photo.id)) return -1

  // Hard filters
  if (photo.width < minWidth) return -1
  if (photo.likes < minLikes) return -1

  // Likes (logarithmic — 15 likes vs 150 likes matters more than 1500 vs 15000)
  score += Math.min(Math.log10(photo.likes + 1) * 20, 60)

  // Resolution bonus (wider = better, up to 4000px)
  score += Math.min((photo.width / 4000) * 20, 20)

  // Landscape aspect ratio bonus (food photography favors ~16:10 to ~3:2)
  const aspect = photo.width / photo.height
  if (aspect >= 1.3 && aspect <= 1.8) score += 10
  else if (aspect >= 1.0 && aspect <= 2.0) score += 5

  // Color analysis — warm tones (food-friendly) get a boost
  if (photo.color) {
    const hex = photo.color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    // Warm tones: red/orange/yellow dominant
    if (r > g && r > b && r > 100) score += 5
    // Very dark or very bright = probably not a great food photo
    const brightness = (r + g + b) / 3
    if (brightness < 40 || brightness > 240) score -= 10
  }

  return score
}

function pickBestPhoto(allResults, minLikes, minWidth) {
  const scored = allResults
    .map(photo => ({ photo, score: scorePhoto(photo, minLikes, minWidth) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) return null

  const best = scored[0]
  usedPhotoIds.add(best.photo.id)

  return {
    url: best.photo.urls.regular,
    fullUrl: best.photo.urls.full,
    photographer: best.photo.user.name,
    photographerUrl: best.photo.user.links?.html || null,
    unsplashLink: best.photo.links.html,
    unsplashId: best.photo.id,
    likes: best.photo.likes,
    width: best.photo.width,
    height: best.photo.height,
    qualityScore: Math.round(best.score),
    color: best.photo.color,
  }
}

// --- Process one recipe ---

async function fetchImageForRecipe(recipe, options) {
  const strategies = generateSearchStrategies(recipe)
  const allResults = []

  for (const strategy of strategies) {
    console.log(`    Strategy "${strategy.label}": "${strategy.query}"`)

    const results = await searchUnsplash(strategy.query)
    if (results === 'RATE_LIMITED') return 'RATE_LIMITED'
    if (results) allResults.push(...results)

    await sleep(UNSPLASH_RATE_LIMIT_MS)

    // If we already have good candidates, don't burn more API calls
    const candidateCount = allResults.filter(p =>
      p.likes >= options.minLikes && p.width >= options.minWidth && !usedPhotoIds.has(p.id)
    ).length
    if (candidateCount >= 5) {
      console.log(`    (${candidateCount} good candidates, skipping remaining strategies)`)
      break
    }
  }

  // Deduplicate by photo ID
  const unique = [...new Map(allResults.map(p => [p.id, p])).values()]
  console.log(`    ${unique.length} unique photos found across strategies`)

  return pickBestPhoto(unique, options.minLikes, options.minWidth)
}

// --- Main ---

async function main() {
  const flags = parseArgs(process.argv)
  const dryRun = flags['dry-run'] || false
  const fromDb = flags['from-db'] || false
  const targetSlug = flags.slug || null
  const minLikes = parseInt(flags['min-likes']) || UNSPLASH_MIN_LIKES
  const minWidth = parseInt(flags['min-width']) || UNSPLASH_MIN_WIDTH

  const options = { minLikes, minWidth }

  console.log(`📸 Stage 4: Fetch Images`)
  console.log(`   Source: ${fromDb ? 'Supabase (--from-db)' : 'Pipeline validated files'}`)
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`   Quality: ${minLikes}+ likes, ${minWidth}px+ width`)
  console.log()

  let processed = 0, found = 0, noMatch = 0, errors = 0

  if (fromDb) {
    // --- Database mode: fetch recipes from Supabase ---
    let query = supabase
      .from('recipes')
      .select('id, slug, title, cuisine, image_url, ingredients, tags')
      .eq('status', 'published')
      .is('image_url', null)
      .order('title')

    if (targetSlug) {
      query = supabase
        .from('recipes')
        .select('id, slug, title, cuisine, image_url, ingredients, tags')
        .eq('slug', targetSlug)
    }

    const { data: recipes, error } = await query
    if (error) {
      console.error('Failed to fetch recipes:', error.message)
      process.exit(1)
    }

    console.log(`Found ${recipes.length} recipes to process\n`)

    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i]
      console.log(`[${i + 1}/${recipes.length}] "${recipe.title}"`)
      processed++

      try {
        const result = await fetchImageForRecipe(recipe, options)

        if (result === 'RATE_LIMITED') {
          console.log(`\n⚠ Rate limited. Processed ${i} of ${recipes.length}.`)
          break
        }

        if (result) {
          console.log(`  ✓ ${result.likes} likes, ${result.width}px — ${result.photographer} (score: ${result.qualityScore})`)
          if (!dryRun) {
            const { error: updateErr } = await supabase
              .from('recipes')
              .update({ image_url: result.url, photo_credit: result.photographer })
              .eq('id', recipe.id)
            if (updateErr) {
              console.log(`  ✗ DB update failed: ${updateErr.message}`)
              errors++
            }
          }
          found++
        } else {
          console.log(`  — No quality match`)
          noMatch++
        }
      } catch (err) {
        console.log(`  ✗ Error: ${err.message}`)
        errors++
      }
    }
  } else {
    // --- Pipeline mode: process validated JSON files ---
    let files
    if (targetSlug) {
      const path = `${VALIDATED_DIR}${targetSlug}.json`
      if (!existsSync(path)) {
        console.error(`Validated file not found: ${path}`)
        process.exit(1)
      }
      files = [path]
    } else {
      files = readdirSync(VALIDATED_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => `${VALIDATED_DIR}${f}`)
    }

    console.log(`Found ${files.length} validated recipes to process\n`)

    for (let i = 0; i < files.length; i++) {
      const recipe = JSON.parse(readFileSync(files[i], 'utf-8'))
      console.log(`[${i + 1}/${files.length}] "${recipe.title}"`)
      processed++

      // Skip if already has an image
      if (recipe.image_url && !targetSlug) {
        console.log(`  — Already has image, skipping`)
        continue
      }

      try {
        const result = await fetchImageForRecipe(recipe, options)

        if (result === 'RATE_LIMITED') {
          console.log(`\n⚠ Rate limited. Processed ${i} of ${files.length}.`)
          break
        }

        if (result) {
          console.log(`  ✓ ${result.likes} likes, ${result.width}px — ${result.photographer} (score: ${result.qualityScore})`)
          recipe.image_url = result.url
          recipe._imageMetadata = result
          if (!dryRun) {
            writeFileSync(files[i], JSON.stringify(recipe, null, 2))
          }
          found++
        } else {
          console.log(`  — No quality match`)
          noMatch++
        }
      } catch (err) {
        console.log(`  ✗ Error: ${err.message}`)
        errors++
      }
    }
  }

  console.log(`\n--- Stage 4 Summary ---`)
  console.log(`Processed: ${processed}`)
  console.log(`Found:     ${found}`)
  console.log(`No match:  ${noMatch}`)
  console.log(`Errors:    ${errors}`)
}

main().catch(console.error)
