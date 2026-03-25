/**
 * Backfill photo_credit for existing recipes with Unsplash images.
 *
 * Extracts the Unsplash photo ID from existing image_url, then looks up the
 * photographer name via the Unsplash API.
 *
 * Usage:
 *   npx tsx scripts/backfill-photo-credits.ts
 *   npx tsx scripts/backfill-photo-credits.ts --dry-run
 *
 * Requires env vars: SUPABASE_SERVICE_KEY, UNSPLASH_ACCESS_KEY
 *
 * Unsplash free tier: 50 requests/hour
 * Script uses 2s delay between calls (photo lookups are lightweight).
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// Load .env.local manually
try {
  const envFile = readFileSync('.env.local', 'utf-8')
  for (const line of envFile.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim()
    }
  }
} catch {}

const supabaseAdmin = createClient(
  'https://zacwsrcdvpglrcvirlng.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || ''
)

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY
const dryRun = process.argv.includes('--dry-run')

/**
 * Extract Unsplash photo ID from a URL like:
 * https://images.unsplash.com/photo-1234567890?ixlib=...
 */
function extractPhotoId(url: string): string | null {
  const match = url.match(/unsplash\.com\/photo-([a-zA-Z0-9_-]+)/)
  return match ? `photo-${match[1]}` : null
}

async function lookupPhotographer(photoId: string): Promise<string | null> {
  if (!UNSPLASH_KEY) return null

  try {
    const res = await fetch(`https://api.unsplash.com/photos/${photoId}`, {
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
    })
    if (!res.ok) {
      console.warn(`  ⚠ API ${res.status} for ${photoId}`)
      return null
    }
    const data = await res.json()
    return data?.user?.name || null
  } catch (err) {
    console.warn(`  ⚠ Fetch error for ${photoId}:`, err)
    return null
  }
}

async function main() {
  if (!UNSPLASH_KEY) {
    console.error('Missing UNSPLASH_ACCESS_KEY')
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

  for (const recipe of needsCredit) {
    const photoId = extractPhotoId(recipe.image_url)
    if (!photoId) {
      console.log(`  ✗ ${recipe.title} — can't extract photo ID from URL`)
      failed++
      continue
    }

    const credit = await lookupPhotographer(photoId)
    if (!credit) {
      console.log(`  ✗ ${recipe.title} — photographer not found`)
      failed++
      continue
    }

    if (dryRun) {
      console.log(`  → ${recipe.title} — would set credit to "${credit}"`)
    } else {
      const { error: updateErr } = await supabaseAdmin
        .from('recipes')
        .update({ photo_credit: credit })
        .eq('id', recipe.id)
      if (updateErr) {
        console.log(`  ✗ ${recipe.title} — update failed: ${updateErr.message}`)
        failed++
      } else {
        console.log(`  ✓ ${recipe.title} — ${credit}`)
        updated++
      }
    }

    // Small delay to be nice to Unsplash API
    await new Promise(r => setTimeout(r, 2000))
  }

  console.log(`\nDone! Updated: ${updated}, Failed: ${failed}, Skipped: ${recipes!.length - needsCredit.length}`)
}

main()
