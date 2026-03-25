/**
 * Backfill photo_credit for existing recipes with Unsplash images.
 *
 * Since Unsplash photo IDs cannot be extracted from image URLs (the URL path
 * contains a different identifier than the API photo ID), this script searches
 * Unsplash by recipe title and matches results by URL to find the photographer.
 *
 * Usage:
 *   npx tsx scripts/backfill-photo-credits.ts
 *   npx tsx scripts/backfill-photo-credits.ts --dry-run
 *
 * Requires env vars in .env.local: SUPABASE_SERVICE_KEY, UNSPLASH_ACCESS_KEY
 *
 * Unsplash free tier: 50 requests/hour
 * Script uses 2s delay between calls.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local from project root (not cwd)
const envPath = resolve(__dirname, '..', '.env.local')
try {
  const envFile = readFileSync(envPath, 'utf-8')
  for (const line of envFile.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim()
    }
  }
} catch (err) {
  console.error(`Failed to load ${envPath}:`, err)
  process.exit(1)
}

const supabaseAdmin = createClient(
  'https://zacwsrcdvpglrcvirlng.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || ''
)

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY
const dryRun = process.argv.includes('--dry-run')

/**
 * Extract the unique path segment from an Unsplash image URL for matching.
 * e.g. "https://images.unsplash.com/photo-1574684117906-450bb1498b8a?ixlib=..."
 *   -> "photo-1574684117906-450bb1498b8a"
 */
function extractUrlPath(url: string): string | null {
  try {
    const pathname = new URL(url).pathname // "/photo-1574684117906-450bb1498b8a"
    return pathname.replace(/^\//, '') // strip leading slash
  } catch {
    return null
  }
}

/**
 * Search Unsplash for a query and return all results.
 */
async function searchUnsplash(query: string, perPage = 30): Promise<any[] | 'RATE_LIMITED' | null> {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&content_filter=high`
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
  })

  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get('x-ratelimit-remaining')
    console.warn(`  Rate limited (${res.status}). Remaining: ${remaining}`)
    return 'RATE_LIMITED'
  }

  if (!res.ok) {
    console.warn(`  Unsplash API error: ${res.status} ${res.statusText}`)
    return null
  }

  const data = await res.json()
  return data.results || []
}

/**
 * Find the photographer for a recipe's Unsplash image by searching for the
 * recipe title and matching the result URLs against the stored image_url.
 */
async function findPhotographerBySearch(
  title: string,
  imageUrl: string
): Promise<{ name: string; username: string } | 'RATE_LIMITED' | null> {
  const storedPath = extractUrlPath(imageUrl)
  if (!storedPath) return null

  // Try multiple search strategies
  const queries = [
    `${title} food`,
    title,
  ]

  for (const query of queries) {
    const results = await searchUnsplash(query)
    if (results === 'RATE_LIMITED') return 'RATE_LIMITED'

    if (results && results.length > 0) {
      // Match by comparing the URL path segment
      for (const photo of results) {
        // Check all URL variants (raw, full, regular, small, thumb)
        const urls = photo.urls || {}
        const allUrls = [urls.raw, urls.full, urls.regular, urls.small, urls.thumb].filter(Boolean)

        for (const resultUrl of allUrls) {
          const resultPath = extractUrlPath(resultUrl)
          if (resultPath && resultPath === storedPath) {
            return {
              name: photo.user?.name || photo.user?.username || 'Unknown',
              username: photo.user?.username || '',
            }
          }
        }
      }
    }

    // Delay between search calls
    await new Promise(r => setTimeout(r, 2000))
  }

  return null
}

async function main() {
  if (!UNSPLASH_KEY) {
    console.error('Missing UNSPLASH_ACCESS_KEY in .env.local')
    process.exit(1)
  }

  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`)

  // Get all recipes with Unsplash images but no credit
  const { data: recipes, error } = await supabaseAdmin
    .from('recipes')
    .select('id, title, image_url, photo_credit')
    .eq('status', 'published')
    .not('image_url', 'is', null)
    .ilike('image_url', '%unsplash.com%')

  if (error) {
    console.error('Query error:', error.message)
    process.exit(1)
  }

  const needsCredit = recipes?.filter(r => !r.photo_credit) || []
  console.log(`Found ${needsCredit.length} recipes with Unsplash images missing credits\n`)

  let updated = 0
  let failed = 0
  let rateLimited = false

  for (let i = 0; i < needsCredit.length; i++) {
    const recipe = needsCredit[i]
    console.log(`[${i + 1}/${needsCredit.length}] ${recipe.title}`)

    const result = await findPhotographerBySearch(recipe.title, recipe.image_url)

    if (result === 'RATE_LIMITED') {
      console.log(`\nRate limited after ${i} recipes. Re-run later to continue.`)
      rateLimited = true
      break
    }

    if (!result) {
      console.log(`  x Not found via search`)
      failed++
      continue
    }

    const credit = result.name

    if (dryRun) {
      console.log(`  -> Would set credit to "${credit}" (@${result.username})`)
    } else {
      const { error: updateErr } = await supabaseAdmin
        .from('recipes')
        .update({ photo_credit: credit })
        .eq('id', recipe.id)
      if (updateErr) {
        console.log(`  x Update failed: ${updateErr.message}`)
        failed++
      } else {
        console.log(`  OK ${credit} (@${result.username})`)
        updated++
      }
    }

    // Delay between recipes (already delayed between search calls within findPhotographerBySearch)
    await new Promise(r => setTimeout(r, 1000))
  }

  const skipped = recipes!.length - needsCredit.length
  console.log(`\nDone! Updated: ${updated}, Failed: ${failed}, Already had credit: ${skipped}`)
  if (rateLimited) {
    console.log(`Note: Script was rate-limited. Re-run to process remaining recipes.`)
  }
}

main()
