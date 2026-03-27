/**
 * Image backfill: Fetch Unsplash images for recipes missing image_url
 *
 * Usage:
 *   npx tsx scripts/fetch-images.ts
 *   npx tsx scripts/fetch-images.ts --limit=50
 *   npx tsx scripts/fetch-images.ts --dry-run
 *
 * Requires env vars: SUPABASE_SERVICE_KEY, UNSPLASH_ACCESS_KEY
 *
 * Unsplash free tier: 50 requests/hour
 * Script uses 72s delay between calls to stay within limits.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://zacwsrcdvpglrcvirlng.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || ''
)

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY
const DELAY_MS = 72_000 // 72 seconds = ~50/hour
const args = process.argv.slice(2)
const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '500', 10)
const dryRun = args.includes('--dry-run')

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchUnsplashImage(query: string): Promise<string | null> {
  if (!UNSPLASH_KEY) return null

  try {
    const url = new URL('https://api.unsplash.com/search/photos')
    url.searchParams.set('query', query)
    url.searchParams.set('per_page', '1')
    url.searchParams.set('orientation', 'landscape')

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
    })

    if (!res.ok) {
      console.error(`  Unsplash HTTP ${res.status}`)
      return null
    }

    const data = await res.json()
    return data?.results?.[0]?.urls?.regular || null
  } catch (err) {
    console.error(`  Unsplash error:`, err instanceof Error ? err.message : err)
    return null
  }
}

async function main() {
  if (!process.env.SUPABASE_SERVICE_KEY) {
    console.error('SUPABASE_SERVICE_KEY not set')
    process.exit(1)
  }
  if (!UNSPLASH_KEY) {
    console.error('UNSPLASH_ACCESS_KEY not set')
    process.exit(1)
  }

  // Fetch recipes with no image
  const { data: recipes, error } = await supabaseAdmin
    .from('recipes')
    .select('slug, title')
    .eq('status', 'published')
    .is('image_url', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to query recipes:', error)
    process.exit(1)
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`Image Backfill`)
  console.log(`${'='.repeat(50)}`)
  console.log(`Found ${recipes.length} recipes without images`)
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Delay: ${DELAY_MS / 1000}s between requests (~${Math.round(3600 / (DELAY_MS / 1000))}/hour)`)
  console.log(`Estimated time: ${Math.round(recipes.length * DELAY_MS / 60000)} minutes`)
  console.log(`${'='.repeat(50)}\n`)

  let success = 0
  let failed = 0

  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i]
    console.log(`[${i + 1}/${recipes.length}] "${recipe.title}"`)

    const imageUrl = await fetchUnsplashImage(recipe.title)

    if (!imageUrl) {
      console.log(`  No image found\n`)
      failed++
      await sleep(DELAY_MS)
      continue
    }

    console.log(`  Found: ${imageUrl.slice(0, 80)}...`)

    if (!dryRun) {
      const { error: updateError } = await supabaseAdmin
        .from('recipes')
        .update({ image_url: imageUrl })
        .eq('slug', recipe.slug)

      if (updateError) {
        console.error(`  Update failed:`, updateError.message)
        failed++
      } else {
        console.log(`  Updated!\n`)
        success++
      }
    } else {
      console.log(`  DRY RUN — not updating\n`)
      success++
    }

    if (i < recipes.length - 1) {
      await sleep(DELAY_MS)
    }
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`COMPLETE: ${success} updated, ${failed} failed`)
  console.log(`${'='.repeat(50)}\n`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
