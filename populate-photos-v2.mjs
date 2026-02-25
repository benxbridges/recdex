/**
 * populate-photos-v2.mjs
 *
 * Searches Unsplash for each recipe and updates Supabase with quality-filtered images.
 * Quality filters: 10+ likes, 1500px+ width.
 * Clears image_url to null if no quality match found.
 *
 * Usage:
 *   node populate-photos-v2.mjs              # Process all recipes
 *   node populate-photos-v2.mjs --limit 20   # Process first 20 only
 *   node populate-photos-v2.mjs --dry-run    # Preview without updating DB
 *   node populate-photos-v2.mjs --skip-existing  # Only process recipes with no image
 */

import { createClient } from '@supabase/supabase-js'

// --- Config ---
const SUPABASE_URL = 'https://zacwsrcdvpglrcvirlng.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphY3dzcmNkdnBnbHJjdmlybG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NzYwNTMsImV4cCI6MjA4NzQ1MjA1M30.ShCsMBs1mvIK-_3r3GhOTkStmUAUagGQvil5q763D9c'
const UNSPLASH_ACCESS_KEY = 'JAdfIXIUipAqYws7sEKcAlQ1jf3frDUWTOT6ncLRXsQ'

const MIN_LIKES = 10
const MIN_WIDTH = 1500
const RATE_LIMIT_MS = 1200  // ~50 req/hr = 72s between requests; 1.2s is safe for bursts under the per-minute limit

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// --- Parse CLI args ---
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const SKIP_EXISTING = args.includes('--skip-existing')
const limitIdx = args.indexOf('--limit')
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity

// --- Helpers ---
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function searchQuery(recipe) {
  // Use title + cuisine for better results, strip special characters
  const title = recipe.title.replace(/[^\w\s]/g, '').trim()
  const cuisine = recipe.cuisine ? ` ${recipe.cuisine}` : ''
  return `${title}${cuisine} food`
}

async function searchUnsplash(query, retryCount = 0) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` }
  })

  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get('x-ratelimit-remaining')
    if (retryCount >= 1) {
      console.log(`  ✗ Rate limited after retry. Stopping — run again with --skip-existing to continue.`)
      return 'RATE_LIMITED'
    }
    console.log(`  ⚠ Rate limited (${res.status}). Remaining: ${remaining}. Waiting 60s...`)
    await sleep(60000)
    return searchUnsplash(query, retryCount + 1)
  }

  if (!res.ok) {
    console.log(`  ✗ Unsplash error: ${res.status} ${res.statusText}`)
    return null
  }

  const data = await res.json()
  return data.results || []
}

function pickBestPhoto(results) {
  // Filter for quality: 10+ likes, 1500px+ width
  const quality = results.filter(photo =>
    photo.likes >= MIN_LIKES &&
    photo.width >= MIN_WIDTH
  )

  if (quality.length === 0) return null

  // Sort by likes descending, pick the best
  quality.sort((a, b) => b.likes - a.likes)
  const photo = quality[0]

  // Use the "regular" size (1080px wide) for display, with Unsplash UTM params for attribution
  return {
    url: photo.urls.regular,
    photographer: photo.user.name,
    unsplashLink: photo.links.html,
    likes: photo.likes,
    width: photo.width,
  }
}

// --- Main ---
async function main() {
  console.log('🍳 populate-photos-v2')
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`   Skip existing: ${SKIP_EXISTING}`)
  console.log(`   Limit: ${LIMIT === Infinity ? 'all' : LIMIT}`)
  console.log()

  // Fetch all published recipes
  let query = supabase
    .from('recipes')
    .select('id, slug, title, cuisine, image_url')
    .eq('status', 'published')
    .order('title')

  if (SKIP_EXISTING) {
    query = query.is('image_url', null)
  }

  const { data: recipes, error } = await query

  if (error) {
    console.error('Failed to fetch recipes:', error.message)
    process.exit(1)
  }

  const toProcess = recipes.slice(0, LIMIT)
  console.log(`Found ${recipes.length} recipes, processing ${toProcess.length}\n`)

  let updated = 0, cleared = 0, skipped = 0, errors = 0

  for (let i = 0; i < toProcess.length; i++) {
    const recipe = toProcess[i]
    const progress = `[${i + 1}/${toProcess.length}]`

    const query = searchQuery(recipe)
    console.log(`${progress} "${recipe.title}" → searching "${query}"`)

    try {
      const results = await searchUnsplash(query)

      if (results === 'RATE_LIMITED') {
        console.log(`\n⚠ Hit rate limit. Processed ${i} of ${toProcess.length} recipes.`)
        console.log(`  Run again with --skip-existing to continue from where you left off.`)
        break
      }

      if (!results) {
        console.log(`  ✗ Search failed, skipping`)
        errors++
        await sleep(RATE_LIMIT_MS)
        continue
      }

      const photo = pickBestPhoto(results)

      if (photo) {
        console.log(`  ✓ Found: ${photo.likes} likes, ${photo.width}px — ${photo.photographer}`)

        if (!DRY_RUN) {
          const { error: updateErr } = await supabase
            .from('recipes')
            .update({ image_url: photo.url })
            .eq('id', recipe.id)

          if (updateErr) {
            console.log(`  ✗ DB update failed: ${updateErr.message}`)
            errors++
          } else {
            updated++
          }
        } else {
          updated++
        }
      } else {
        console.log(`  — No quality match (need ${MIN_LIKES}+ likes, ${MIN_WIDTH}px+ width)`)

        if (!DRY_RUN && recipe.image_url) {
          const { error: clearErr } = await supabase
            .from('recipes')
            .update({ image_url: null })
            .eq('id', recipe.id)

          if (clearErr) {
            console.log(`  ✗ DB clear failed: ${clearErr.message}`)
            errors++
          } else {
            cleared++
          }
        } else {
          cleared++
        }
      }
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`)
      errors++
    }

    await sleep(RATE_LIMIT_MS)
  }

  console.log('\n--- Summary ---')
  console.log(`Updated:  ${updated}`)
  console.log(`Cleared:  ${cleared}`)
  console.log(`Errors:   ${errors}`)
  console.log(`Total:    ${toProcess.length}`)
  if (DRY_RUN) console.log('\n(Dry run — no changes written)')
}

main().catch(console.error)
