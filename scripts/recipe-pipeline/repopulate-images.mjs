/**
 * Repopulate Images — Wipe and re-fetch all recipe images from Unsplash
 *
 * Re-fetches Unsplash images for published recipes with full metadata
 * (image_url, photo_credit, photographer_url, unsplash_photo_url, unsplash_id)
 * to ensure Unsplash API compliance.
 *
 * Usage:
 *   node scripts/recipe-pipeline/repopulate-images.mjs --dry-run --limit 5
 *   node scripts/recipe-pipeline/repopulate-images.mjs --skip-existing --batch-size 10
 *   node scripts/recipe-pipeline/repopulate-images.mjs                # Full repopulate
 *
 * Flags:
 *   --dry-run         Preview changes without writing to DB
 *   --limit N         Only process N recipes
 *   --skip-existing   Skip recipes that already have all 5 image fields populated
 *   --batch-size N    Recipes per rate-limit cycle (default: 12)
 */

import {
  supabase, UNSPLASH_ACCESS_KEY, UNSPLASH_MIN_LIKES, UNSPLASH_MIN_WIDTH,
  UNSPLASH_RATE_LIMIT_MS, sleep, parseArgs
} from './config.mjs'

const UNSPLASH_API = 'https://api.unsplash.com'
const IMAGE_FIELDS = ['image_url', 'photo_credit', 'photographer_url', 'unsplash_photo_url', 'unsplash_id']

// Track used photo IDs to prevent duplicates within a single run
const usedPhotoIds = new Set()

// Track remaining API requests from Unsplash headers
let rateLimitRemaining = 50

// --- Search strategy generation ---

function generateSearchStrategies(recipe) {
  const title = (recipe.title || '').replace(/[^\w\s]/g, '').trim()
  const cuisine = recipe.cuisine || ''
  const ingredients = recipe.ingredients || []
  const keyIngredient = ingredients[0]?.name || ''

  const strategies = [
    { query: `${title} food photography`, label: 'title+photo' },
    { query: `${title} ${cuisine} dish`, label: 'title+cuisine' },
  ]

  if (keyIngredient && cuisine) {
    strategies.push({ query: `${keyIngredient} ${cuisine} food`, label: 'ingredient+cuisine' })
  }

  strategies.push({ query: `${title} recipe`, label: 'title+recipe' })

  // Deduplicate
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

  // Track rate limit from headers
  const remaining = res.headers.get('x-ratelimit-remaining')
  if (remaining !== null) {
    rateLimitRemaining = parseInt(remaining, 10)
  }

  if (res.status === 403 || res.status === 429) {
    console.log(`  ⚠ Rate limited (${res.status}). Remaining: ${remaining}`)
    return 'RATE_LIMITED'
  }

  if (!res.ok) {
    console.log(`  ✗ Unsplash search error: ${res.status} ${res.statusText}`)
    return null
  }

  const data = await res.json()
  return data.results || []
}

async function triggerDownload(downloadLocation) {
  try {
    const res = await fetch(downloadLocation, {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
    })
    const remaining = res.headers.get('x-ratelimit-remaining')
    if (remaining !== null) {
      rateLimitRemaining = parseInt(remaining, 10)
    }
    if (!res.ok) {
      console.log(`  ⚠ Download trigger failed for ${downloadLocation}: ${res.status}`)
    }
  } catch (err) {
    console.log(`  ⚠ Download trigger error: ${err.message}`)
  }
}

// --- Photo quality scoring ---

function scorePhoto(photo) {
  let score = 0

  if (usedPhotoIds.has(photo.id)) return -1
  if (photo.width < UNSPLASH_MIN_WIDTH) return -1
  if (photo.likes < UNSPLASH_MIN_LIKES) return -1

  // Likes (logarithmic scale, up to 60pts)
  score += Math.min(Math.log10(photo.likes + 1) * 20, 60)

  // Resolution bonus (up to 20pts)
  score += Math.min((photo.width / 4000) * 20, 20)

  // Landscape aspect ratio bonus
  const aspect = photo.width / photo.height
  if (aspect >= 1.3 && aspect <= 1.8) score += 10
  else if (aspect >= 1.0 && aspect <= 2.0) score += 5

  // Warm color tone bonus
  if (photo.color) {
    const hex = photo.color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    if (r > g && r > b && r > 100) score += 5
    const brightness = (r + g + b) / 3
    if (brightness < 40 || brightness > 240) score -= 10
  }

  return score
}

function pickBestPhoto(allResults) {
  const scored = allResults
    .map(photo => ({ photo, score: scorePhoto(photo) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) return null

  const best = scored[0]
  usedPhotoIds.add(best.photo.id)

  return {
    image_url: best.photo.urls.regular,
    photo_credit: best.photo.user.name,
    photographer_url: best.photo.user.links?.html || null,
    unsplash_photo_url: best.photo.links.html,
    unsplash_id: best.photo.id,
    download_location: best.photo.links.download_location,
    _meta: {
      likes: best.photo.likes,
      width: best.photo.width,
      height: best.photo.height,
      qualityScore: Math.round(best.score),
    },
  }
}

// --- Process one recipe ---

async function fetchImageForRecipe(recipe) {
  const strategies = generateSearchStrategies(recipe)
  const allResults = []
  let matchedStrategy = null

  for (const strategy of strategies) {
    console.log(`    Strategy "${strategy.label}": "${strategy.query}"`)

    const results = await searchUnsplash(strategy.query)
    if (results === 'RATE_LIMITED') return 'RATE_LIMITED'
    if (results) allResults.push(...results)

    await sleep(UNSPLASH_RATE_LIMIT_MS)

    // Early exit if we have enough good candidates
    const candidateCount = allResults.filter(p =>
      p.likes >= UNSPLASH_MIN_LIKES && p.width >= UNSPLASH_MIN_WIDTH && !usedPhotoIds.has(p.id)
    ).length
    if (candidateCount >= 5) {
      matchedStrategy = strategy.label
      console.log(`    (${candidateCount} good candidates, skipping remaining strategies)`)
      break
    }

    if (!matchedStrategy && allResults.length > 0) {
      matchedStrategy = strategy.label
    }
  }

  // Deduplicate by photo ID
  const unique = [...new Map(allResults.map(p => [p.id, p])).values()]
  console.log(`    ${unique.length} unique photos found across strategies`)

  const result = pickBestPhoto(unique)
  if (result) {
    result._meta.strategy = matchedStrategy || 'combined'
  }
  return result
}

// --- Helpers ---

function hasAllImageFields(recipe) {
  return IMAGE_FIELDS.every(f => recipe[f] != null && recipe[f] !== '')
}

function formatDuration(ms) {
  const mins = Math.floor(ms / 60000)
  const secs = Math.floor((ms % 60000) / 1000)
  if (mins > 0) return `${mins}m ${secs}s`
  return `${secs}s`
}

// --- Main ---

async function main() {
  const flags = parseArgs(process.argv)
  const dryRun = flags['dry-run'] || false
  const limit = flags.limit ? parseInt(flags.limit, 10) : null
  const skipExisting = flags['skip-existing'] || false
  const batchSize = flags['batch-size'] ? parseInt(flags['batch-size'], 10) : 12

  console.log(`🔄 Repopulate Images`)
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE — will update database'}`)
  console.log(`   Skip existing: ${skipExisting}`)
  console.log(`   Batch size: ${batchSize}`)
  console.log(`   Limit: ${limit || 'none'}`)
  console.log(`   Quality: ${UNSPLASH_MIN_LIKES}+ likes, ${UNSPLASH_MIN_WIDTH}px+ width`)
  console.log()

  // Fetch all published recipes
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, title, cuisine, ingredients, image_url, photo_credit, photographer_url, unsplash_photo_url, unsplash_id')
    .eq('status', 'published')
    .order('title')

  if (error) {
    console.error('Failed to fetch recipes:', error.message)
    process.exit(1)
  }

  // Filter based on --skip-existing
  let toProcess = skipExisting
    ? recipes.filter(r => !hasAllImageFields(r))
    : recipes

  // Apply --limit
  if (limit) {
    toProcess = toProcess.slice(0, limit)
  }

  const skipped = recipes.length - toProcess.length
  console.log(`Found ${recipes.length} published recipes`)
  if (skipExisting && skipped > 0) {
    console.log(`Skipping ${skipped} recipes with complete image metadata`)
  }
  console.log(`Processing ${toProcess.length} recipes in batches of ${batchSize}\n`)

  let processed = 0
  let found = 0
  let notFound = 0
  let errors = 0
  let rateLimitPauses = 0
  const startTime = Date.now()

  for (let i = 0; i < toProcess.length; i++) {
    const recipe = toProcess[i]
    console.log(`[${i + 1}/${toProcess.length}] "${recipe.title}"`)
    processed++

    try {
      const result = await fetchImageForRecipe(recipe)

      if (result === 'RATE_LIMITED') {
        // Back off for 60 minutes and retry this recipe
        console.log(`\n⏳ Rate limited. Pausing for 60 minutes...`)
        console.log(`   Progress so far: ${found} found, ${notFound} not found, ${errors} errors`)
        rateLimitPauses++
        await sleep(60 * 60 * 1000)
        // Retry this recipe
        i--
        processed--
        continue
      }

      if (result) {
        const m = result._meta
        console.log(`  ✓ ${m.likes} likes, ${m.width}px, score ${m.qualityScore} — ${result.photo_credit} [${m.strategy}]`)

        if (!dryRun) {
          // Trigger Unsplash download endpoint (API compliance)
          await triggerDownload(result.download_location)
          await sleep(UNSPLASH_RATE_LIMIT_MS)

          // Update all 5 image fields in Supabase
          const { error: updateErr } = await supabase
            .from('recipes')
            .update({
              image_url: result.image_url,
              photo_credit: result.photo_credit,
              photographer_url: result.photographer_url,
              unsplash_photo_url: result.unsplash_photo_url,
              unsplash_id: result.unsplash_id,
              download_location: result.download_location,
            })
            .eq('id', recipe.id)

          if (updateErr) {
            console.log(`  ✗ DB update failed: ${updateErr.message}`)
            errors++
            continue
          }
        }
        found++
      } else {
        console.log(`  — No quality match found`)
        notFound++
      }
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`)
      errors++
    }

    // Check if we should pause for rate limiting
    // Each recipe uses ~3-4 API calls (strategies + download trigger)
    // Pause at end of each batch if rate limit is getting low
    if ((i + 1) % batchSize === 0 && i + 1 < toProcess.length) {
      console.log(`\n--- Batch ${Math.ceil((i + 1) / batchSize)} complete (${rateLimitRemaining} API calls remaining) ---`)

      if (rateLimitRemaining < batchSize * 4) {
        console.log(`⏳ Rate limit low (${rateLimitRemaining} remaining). Pausing for 60 minutes...`)
        rateLimitPauses++
        await sleep(60 * 60 * 1000)
        console.log(`Resuming...\n`)
      } else {
        console.log()
      }
    }
  }

  // Summary
  const elapsed = Date.now() - startTime
  console.log(`\n${'='.repeat(50)}`)
  console.log(`Repopulate Images — Summary`)
  console.log(`${'='.repeat(50)}`)
  console.log(`Total processed:    ${processed}`)
  console.log(`Images found:       ${found}`)
  console.log(`No match:           ${notFound}`)
  console.log(`Errors:             ${errors}`)
  console.log(`Rate limit pauses:  ${rateLimitPauses}`)
  console.log(`Elapsed:            ${formatDuration(elapsed)}`)
  if (dryRun) {
    console.log(`\n(DRY RUN — no changes were made to the database)`)
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
